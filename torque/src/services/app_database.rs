use crate::{Result, Error};
use sea_orm::{DatabaseConnection, Database, ConnectOptions, Statement, DbBackend, ConnectionTrait};
use std::sync::Arc;
use std::collections::HashMap;
use crate::services::{cache::CacheService, model::ModelService};
use crate::model::types::ModelEntity;
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use crate::common::Uuid;

/// Service for managing application databases (separate database per model)
#[derive(Clone)]
pub struct AppDatabaseService {
    system_db: Arc<DatabaseConnection>,
    cache: Arc<CacheService>,
    model_service: Arc<ModelService>,
    app_connections: Arc<dashmap::DashMap<String, Arc<DatabaseConnection>>>,
}

#[derive(Debug, Serialize)]
pub struct DatabaseStatus {
    pub exists: bool,
    pub total_entities: u64,
    pub entity_counts: HashMap<String, u64>,
    pub last_seeded: Option<DateTime<Utc>>,
    pub schema_version: String,
}

#[derive(Debug, Serialize)]
pub struct EntityOverview {
    pub entity_type: String,
    pub display_name: String,
    pub record_count: u64,
    pub last_updated: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct EntityDataResponse {
    pub entities: Vec<serde_json::Value>,
    pub total_count: u64,
    pub page: u64,
    pub per_page: u64,
}

#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    pub page: Option<u64>,
    pub per_page: Option<u64>,
}

impl Default for PaginationParams {
    fn default() -> Self {
        Self {
            page: Some(1),
            per_page: Some(50),
        }
    }
}

#[derive(Debug, thiserror::Error)]
pub enum AppDatabaseError {
    #[error("App database not found for model: {model_id}")]
    DatabaseNotFound { model_id: String },
    
    #[error("Schema sync failed: {reason}")]
    SchemaSyncFailed { reason: String },
    
    #[error("Database operation failed: {0}")]
    DatabaseError(#[from] sea_orm::DbErr),
    
    #[error("Model not found: {model_id}")]
    ModelNotFound { model_id: String },
}

impl From<AppDatabaseError> for Error {
    fn from(err: AppDatabaseError) -> Self {
        Error::Internal(err.to_string())
    }
}

impl AppDatabaseService {
    pub fn new(
        system_db: Arc<DatabaseConnection>,
        cache: Arc<CacheService>,
        model_service: Arc<ModelService>,
    ) -> Self {
        Self {
            system_db,
            cache,
            model_service,
            app_connections: Arc::new(dashmap::DashMap::new()),
        }
    }

    /// Get or create connection to app database for a specific model
    pub async fn get_app_connection(&self, model_id: &str) -> Result<Arc<DatabaseConnection>> {
        // Check cache first
        if let Some(conn) = self.app_connections.get(model_id) {
            return Ok(conn.clone());
        }

        // Create new connection
        let database_url = self.get_app_database_url(model_id);
        let mut opt = ConnectOptions::new(&database_url);
        opt.max_connections(10)
            .min_connections(1)
            .connect_timeout(std::time::Duration::from_secs(10))
            .idle_timeout(std::time::Duration::from_secs(300));

        let db = Database::connect(opt).await?;
        let connection = Arc::new(db);
        
        // Cache the connection
        self.app_connections.insert(model_id.to_string(), connection.clone());
        
        Ok(connection)
    }

    /// Generate database URL for app database
    fn get_app_database_url(&self, model_id: &str) -> String {
        // For SQLite: each model gets its own database file
        // For PostgreSQL: each model gets its own schema
        format!("sqlite:./data/app_db_{}.sqlite?mode=rwc", model_id)
    }

    /// Create app database and initialize schema
    pub async fn create_app_database(&self, model_id: &str) -> Result<()> {
        let _conn = self.get_app_connection(model_id).await?;
        
        // Get model definition
        let model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        let _model = self.model_service.get_model(model_uuid).await
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?
            .ok_or_else(|| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        // Create tables for all entities
        self.sync_schema(model_id).await?;

        tracing::info!("Created app database for model: {}", model_id);
        Ok(())
    }

    /// Drop app database (for cleanup)
    pub async fn drop_app_database(&self, model_id: &str) -> Result<()> {
        // Remove from connection cache
        self.app_connections.remove(model_id);
        
        // Delete database file (for SQLite)
        let db_path = format!("./data/app_db_{}.sqlite", model_id);
        if std::path::Path::new(&db_path).exists() {
            std::fs::remove_file(db_path)?;
        }

        tracing::info!("Dropped app database for model: {}", model_id);
        Ok(())
    }

    /// Empty all data from app database (keep schema)
    pub async fn empty_app_database(&self, model_id: &str) -> Result<()> {
        let conn = self.get_app_connection(model_id).await?;
        
        // Get model to find all entity types
        let model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        let model = self.model_service.get_model(model_uuid).await
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?
            .ok_or_else(|| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        // Truncate all entity tables
        for entity in &model.entities {
            let table_name = format!("app_{}_{}", model_id.replace('-', "_"), entity.name.to_lowercase());
            let sql = format!("DELETE FROM {}", table_name);
            
            conn.execute(Statement::from_string(DbBackend::Sqlite, sql)).await?;
        }

        tracing::info!("Emptied app database for model: {}", model_id);
        Ok(())
    }

    /// Synchronize database schema with model definition
    pub async fn sync_schema(&self, model_id: &str) -> Result<()> {
        let conn = self.get_app_connection(model_id).await?;
        
        // Get model definition
        let model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        let model = self.model_service.get_model(model_uuid).await
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?
            .ok_or_else(|| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        // Create table for each entity
        for entity in &model.entities {
            self.create_entity_table(model_id, entity, &conn).await?;
        }

        // Create indexes for performance
        for entity in &model.entities {
            self.create_entity_indexes(model_id, entity, &conn).await?;
        }

        tracing::info!("Synchronized schema for model: {}", model_id);
        Ok(())
    }

    /// Create table for a specific entity
    async fn create_entity_table(
        &self,
        model_id: &str,
        entity: &ModelEntity,
        conn: &DatabaseConnection,
    ) -> Result<()> {
        let table_name = format!("app_{}_{}", model_id.replace('-', "_"), entity.name.to_lowercase());
        
        let mut sql = format!(
            "CREATE TABLE IF NOT EXISTS {} (
                id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('ab89',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))),
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                _entity_type TEXT DEFAULT '{}',
                _model_id TEXT DEFAULT '{}'",
            table_name, entity.name, model_id
        );

        // Add dynamic fields based on entity definition
        for field in &entity.fields {
            let field_type_str = self.map_field_type(&field.field_type);
            let nullable = if field.required { "NOT NULL" } else { "" };
            sql.push_str(&format!(", {} {} {}", field.name, field_type_str, nullable));
        }

        sql.push_str(")");

        conn.execute(Statement::from_string(DbBackend::Sqlite, sql)).await?;

        tracing::debug!("Created table for entity: {} in model: {}", entity.name, model_id);
        Ok(())
    }

    /// Create indexes for entity table
    async fn create_entity_indexes(
        &self,
        model_id: &str,
        entity: &ModelEntity,
        conn: &DatabaseConnection,
    ) -> Result<()> {
        let table_name = format!("app_{}_{}", model_id.replace('-', "_"), entity.name.to_lowercase());
        
        // Create index on created_at for common queries
        let index_sql = format!(
            "CREATE INDEX IF NOT EXISTS idx_{}_created_at ON {} (created_at)",
            table_name, table_name
        );
        conn.execute(Statement::from_string(DbBackend::Sqlite, index_sql)).await?;

        // Create indexes on searchable fields
        for field in &entity.fields {
            if matches!(field.field_type, crate::model::types::FieldType::String { .. }) && field.name.to_lowercase().contains("email") {
                let index_sql = format!(
                    "CREATE INDEX IF NOT EXISTS idx_{}_{} ON {} ({})",
                    table_name, field.name, table_name, field.name
                );
                conn.execute(Statement::from_string(DbBackend::Sqlite, index_sql)).await?;
            }
        }

        Ok(())
    }

    /// Map Torque field types to SQLite types
    fn map_field_type(&self, field_type: &crate::model::types::FieldType) -> &'static str {
        use crate::model::types::FieldType;
        match field_type {
            FieldType::String { .. } => "TEXT",
            FieldType::Integer { .. } => "INTEGER",
            FieldType::Float { .. } => "REAL",
            FieldType::Boolean => "BOOLEAN",
            FieldType::DateTime => "DATETIME",
            FieldType::Date => "DATE",
            FieldType::Time => "TIME",
            FieldType::Json => "TEXT", // Store JSON as text
            FieldType::Binary => "BLOB",
            FieldType::Enum { .. } => "TEXT",
            FieldType::Reference { .. } => "TEXT", // Store UUID as text
            FieldType::Array { .. } => "TEXT", // Store JSON as text
        }
    }

    /// Get entity count for a specific entity type
    pub async fn get_entity_count(&self, model_id: &str, entity_type: &str) -> Result<u64> {
        let _conn = self.get_app_connection(model_id).await?;
        let table_name = format!("app_{}_{}", model_id.replace('-', "_"), entity_type.to_lowercase());
        
        let _sql = format!("SELECT COUNT(*) as count FROM {}", table_name);
        // TODO: Implement proper count query once we have proper table structure
        // For now, return 0
        tracing::debug!("Would count entities in table: {}", table_name);
        Ok(0)
    }

    /// Get entities with pagination
    pub async fn get_entities(
        &self,
        model_id: &str,
        entity_type: &str,
        limit: u64,
        offset: u64,
    ) -> Result<Vec<serde_json::Value>> {
        let _conn = self.get_app_connection(model_id).await?;
        let table_name = format!("app_{}_{}", model_id.replace('-', "_"), entity_type.to_lowercase());
        
        let _sql = format!(
            "SELECT * FROM {} ORDER BY created_at DESC LIMIT {} OFFSET {}",
            table_name, limit, offset
        );
        
        // TODO: Implement proper entity querying once we have proper SeaORM entity models
        // For now, return empty results
        // let _results = conn.query_all(Statement::from_string(DbBackend::Sqlite, sql)).await?;
        
        tracing::debug!("Would return {} entities for {}", limit, entity_type);
        Ok(vec![])
    }

    /// Get database status for a model
    pub async fn get_database_status(&self, model_id: &str) -> Result<DatabaseStatus> {
        // Check if database exists
        let db_path = format!("./data/app_db_{}.sqlite", model_id);
        let exists = std::path::Path::new(&db_path).exists();
        
        if !exists {
            return Ok(DatabaseStatus {
                exists: false,
                total_entities: 0,
                entity_counts: HashMap::new(),
                last_seeded: None,
                schema_version: "none".to_string(),
            });
        }

        // Get model to find entity types
        let model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        let model = self.model_service.get_model(model_uuid).await
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?
            .ok_or_else(|| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        let mut entity_counts = HashMap::new();
        let mut total_entities = 0;

        for entity in &model.entities {
            let count = self.get_entity_count(model_id, &entity.name).await.unwrap_or(0);
            entity_counts.insert(entity.name.clone(), count);
            total_entities += count;
        }

        Ok(DatabaseStatus {
            exists: true,
            total_entities,
            entity_counts,
            last_seeded: None, // TODO: track seeding timestamps
            schema_version: "1.0".to_string(),
        })
    }

    /// Get overview of all entities in the database
    pub async fn get_entities_overview(&self, model_id: &str) -> Result<Vec<EntityOverview>> {
        // Get model definition
        let model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        let model = self.model_service.get_model(model_uuid).await
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?
            .ok_or_else(|| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        let mut overview = Vec::new();
        
        for entity in &model.entities {
            let count = self.get_entity_count(model_id, &entity.name).await.unwrap_or(0);
            
            overview.push(EntityOverview {
                entity_type: entity.name.clone(),
                display_name: entity.name.clone(), // TODO: use display_name field if available
                record_count: count,
                last_updated: None, // TODO: track last update timestamps
            });
        }

        Ok(overview)
    }
}