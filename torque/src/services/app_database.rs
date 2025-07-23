use crate::{Result, Error};
use sea_orm::{DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, PaginatorTrait, ColumnTrait, Set, QuerySelect};
use std::sync::Arc;
use std::collections::HashMap;
use crate::services::{cache::CacheService, model::ModelService};
use crate::database::entities::app_entities::{self, Entity as AppEntities, Model as AppEntity};
use serde::{Serialize, Deserialize};
use chrono::{DateTime, Utc};
use crate::common::Uuid;

/// Service for managing application data using unified AppEntities table
#[derive(Clone)]
pub struct AppDatabaseService {
    system_db: Arc<DatabaseConnection>,
    cache: Arc<CacheService>,
    model_service: Arc<ModelService>,
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
        }
    }

    /// Get the system database connection (unified database for all models)
    pub fn get_connection(&self) -> &DatabaseConnection {
        &self.system_db
    }

    /// Initialize database for a model (no-op for unified schema)
    pub async fn create_app_database(&self, model_id: &str) -> Result<()> {
        // With unified schema, no need to create separate databases
        // Just validate the model exists
        let model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        let _model = self.model_service.get_model(model_uuid).await
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?
            .ok_or_else(|| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        tracing::info!("Model {} ready for app database operations", model_id);
        Ok(())
    }

    /// Remove all entities for a model (cleanup)
    pub async fn drop_app_database(&self, model_id: &str) -> Result<()> {
        // Validate model_id is a valid UUID format
        let _model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        
        // Delete all entities for this model
        AppEntities::delete_many()
            .filter(app_entities::Column::ModelId.eq(model_id))
            .exec(self.get_connection())
            .await?;

        tracing::info!("Dropped all entities for model: {}", model_id);
        Ok(())
    }

    /// Empty all data for a model (keep schema)
    pub async fn empty_app_database(&self, model_id: &str) -> Result<()> {
        // Validate model_id is a valid UUID format
        let _model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        
        // Delete all entities for this model
        AppEntities::delete_many()
            .filter(app_entities::Column::ModelId.eq(model_id))
            .exec(self.get_connection())
            .await?;

        tracing::info!("Emptied all entities for model: {}", model_id);
        Ok(())
    }

    /// Synchronize database schema with model definition (no-op for unified schema)
    pub async fn sync_schema(&self, model_id: &str) -> Result<()> {
        // With unified schema, no need to sync individual model schemas
        // Just validate the model exists
        let model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        let _model = self.model_service.get_model(model_uuid).await
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?
            .ok_or_else(|| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        tracing::info!("Schema is unified - model {} ready", model_id);
        Ok(())
    }

    /// Create entity instance in the unified AppEntities table
    pub async fn create_entity(
        &self,
        model_id: &str,
        entity_type: &str,
        entity_data: serde_json::Value,
    ) -> Result<AppEntity> {
        // Validate model_id is a valid UUID format
        let _model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        let new_entity = app_entities::ActiveModel {
            id: Set(uuid::Uuid::new_v4().to_string()),
            model_id: Set(model_id.to_string()),
            entity_type: Set(entity_type.to_string()),
            data: Set(entity_data.into()),
            created_at: Set(chrono::Utc::now().naive_utc()),
            updated_at: Set(chrono::Utc::now().naive_utc()),
        };

        let entity = AppEntities::insert(new_entity)
            .exec_with_returning(self.get_connection())
            .await?;

        Ok(entity)
    }

    /// Update entity instance in the unified AppEntities table
    pub async fn update_entity(
        &self,
        model_id: &str,
        entity_id: &str,
        entity_data: serde_json::Value,
    ) -> Result<AppEntity> {
        // Validate model_id is a valid UUID format
        let _model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        let entity = AppEntities::find_by_id(entity_id.to_string())
            .filter(app_entities::Column::ModelId.eq(model_id))
            .one(self.get_connection())
            .await?
            .ok_or_else(|| Error::NotFound("Entity not found".to_string()))?;

        let mut entity: app_entities::ActiveModel = entity.into();
        entity.data = Set(entity_data.into());
        entity.updated_at = Set(chrono::Utc::now().naive_utc());

        let updated_entity = AppEntities::update(entity)
            .exec(self.get_connection())
            .await?;

        Ok(updated_entity)
    }

    /// Delete entity instance from the unified AppEntities table
    pub async fn delete_entity(&self, model_id: &str, entity_id: &str) -> Result<()> {
        // Validate model_id is a valid UUID format
        let _model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        AppEntities::delete_by_id(entity_id.to_string())
            .filter(app_entities::Column::ModelId.eq(model_id))
            .exec(self.get_connection())
            .await?;

        Ok(())
    }

    /// Get entity count for a specific entity type
    pub async fn get_entity_count(&self, model_id: &str, entity_type: &str) -> Result<u64> {
        // Validate model_id is a valid UUID format
        let _model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        let count = AppEntities::find()
            .filter(app_entities::Column::ModelId.eq(model_id))
            .filter(app_entities::Column::EntityType.eq(entity_type))
            .count(self.get_connection())
            .await?;

        Ok(count)
    }

    /// Get entities with pagination
    pub async fn get_entities(
        &self,
        model_id: &str,
        entity_type: &str,
        limit: u64,
        offset: u64,
    ) -> Result<Vec<serde_json::Value>> {
        // Validate model_id is a valid UUID format
        let _model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        let entities = AppEntities::find()
            .filter(app_entities::Column::ModelId.eq(model_id))
            .filter(app_entities::Column::EntityType.eq(entity_type))
            .order_by_desc(app_entities::Column::CreatedAt)
            .limit(limit)
            .offset(offset)
            .all(self.get_connection())
            .await?;

        // Extract the JSON data from each entity
        let results: Vec<serde_json::Value> = entities
            .into_iter()
            .map(|entity| {
                let mut value = entity.data.clone();
                // Add metadata
                if let serde_json::Value::Object(ref mut map) = value {
                    map.insert("_id".to_string(), serde_json::Value::String(entity.id));
                    map.insert("_created_at".to_string(), serde_json::Value::String(entity.created_at.to_string()));
                    map.insert("_updated_at".to_string(), serde_json::Value::String(entity.updated_at.to_string()));
                }
                value
            })
            .collect();

        Ok(results)
    }

    /// Get database status for a model
    pub async fn get_database_status(&self, model_id: &str) -> Result<DatabaseStatus> {
        // With unified schema, database always exists - check if model exists
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
            last_seeded: None, // TODO: track seeding timestamps in unified schema
            schema_version: "unified-1.0".to_string(),
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

    /// Load sample data from model JSON into the database
    pub async fn load_sample_data(&self, model_id: &str) -> Result<u64> {
        // Get model definition
        let model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;
        let model = self.model_service.get_model(model_uuid).await
            .map_err(|_| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?
            .ok_or_else(|| AppDatabaseError::ModelNotFound { model_id: model_id.to_string() })?;

        // For now, we need to read the original JSON file to get sample data
        // This is a temporary approach until we store sample data in the model
        let sample_model_path = std::path::Path::new("sample/models/todo-app.json");
        if !sample_model_path.exists() {
            tracing::warn!("Sample model file not found at {}", sample_model_path.display());
            return Ok(0);
        }

        let json_content = tokio::fs::read_to_string(sample_model_path).await
            .map_err(|e| Error::Io(e))?;
        let data: serde_json::Value = serde_json::from_str(&json_content)
            .map_err(|e| Error::Serialization(e))?;

        let mut total_created = 0u64;

        // Load sample data if it exists
        if let Some(sample_data) = data.get("sample_data") {
            if let Some(sample_data_obj) = sample_data.as_object() {
                for (entity_type, entity_data) in sample_data_obj {
                    if let Some(data_array) = entity_data.as_array() {
                        tracing::info!("Loading {} {} entities from sample data", data_array.len(), entity_type);
                        
                        for entity_instance in data_array {
                            let entity_json = serde_json::to_value(entity_instance)
                                .map_err(|e| Error::Serialization(e))?;
                            
                            match self.create_entity(model_id, entity_type, entity_json).await {
                                Ok(_) => {
                                    total_created += 1;
                                }
                                Err(e) => {
                                    tracing::warn!("Failed to create {} entity: {}", entity_type, e);
                                }
                            }
                        }
                    }
                }
            }
        }

        tracing::info!("Loaded {} sample entities for model {}", total_created, model.name);
        Ok(total_created)
    }
}