use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use crate::common::Uuid;
use crate::common::UtcDateTime;
use chrono::Utc;
use dashmap::DashMap;
use serde_json::Value;
use tracing;

use sea_orm::DatabaseConnection;
use crate::services::cache::CacheService;
use crate::model::types::*;
use crate::model::events::ModelChangeEvent;
use crate::error::Error;
use crate::database::entities::torque_models;

/// Model service for managing TorqueModels with high-performance caching
pub struct ModelService {
    database: Arc<DatabaseConnection>,
    cache: Arc<CacheService>,
    model_cache: DashMap<Uuid, CacheEntry<TorqueModel>>,
    event_sender: Arc<RwLock<Option<broadcast::Sender<ModelChangeEvent>>>>,
}

#[derive(Clone)]
pub struct CacheEntry<T> {
    pub data: T,
    pub created_at: UtcDateTime,
    pub ttl_seconds: u64,
}

impl<T> CacheEntry<T> {
    pub fn new(data: T, ttl_seconds: u64) -> Self {
        Self {
            data,
            created_at: UtcDateTime::now(),
            ttl_seconds,
        }
    }

    pub fn is_expired(&self) -> bool {
        let elapsed = Utc::now()
            .signed_duration_since(*self.created_at.as_chrono())
            .num_seconds() as u64;
        elapsed > self.ttl_seconds
    }
}

impl ModelService {
    pub fn new(database: Arc<DatabaseConnection>, cache: Arc<CacheService>) -> Self {
        Self {
            database,
            cache,
            model_cache: DashMap::new(),
            event_sender: Arc::new(RwLock::new(None)),
        }
    }

    /// Set the event sender for broadcasting model changes
    pub async fn set_event_sender(&self, sender: broadcast::Sender<ModelChangeEvent>) {
        *self.event_sender.write().await = Some(sender);
    }

    /// Emit a model change event
    fn emit_event(&self, event: ModelChangeEvent) {
        let event_sender = self.event_sender.clone();
        tokio::spawn(async move {
            let sender_guard = event_sender.read().await;
            if let Some(ref sender) = *sender_guard {
                if let Err(e) = sender.send(event) {
                    tracing::warn!("Failed to send model change event: {}", e);
                }
            }
        });
    }

    /// Get all models with caching
    pub async fn get_models(&self) -> Result<Vec<TorqueModel>, Error> {
        use sea_orm::{EntityTrait, DbErr};
        
        // Try to get from database first
        match self.get_models_from_db().await {
            Ok(models) => {
                // Cache the models we retrieved from database
                for model in &models {
                    self.model_cache.insert(
                        model.id.clone(),
                        CacheEntry::new(model.clone(), 3600),
                    );
                }
                Ok(models)
            }
            Err(Error::Database(DbErr::RecordNotFound(_))) => {
                // Database might not have any models, return empty list
                Ok(vec![])
            }
            Err(_) => {
                // Database error, fallback to cache
                tracing::warn!("Database error, falling back to cache");
                let mut models = Vec::new();
                
                // Collect non-expired models from cache
                for entry in self.model_cache.iter() {
                    if !entry.value().is_expired() {
                        models.push(entry.value().data.clone());
                    }
                }
                
                // Sort by creation date (newest first)
                models.sort_by(|a, b| b.created_at.cmp(&a.created_at));
                
                Ok(models)
            }
        }
    }
    
    /// Get models from database (internal helper)
    async fn get_models_from_db(&self) -> Result<Vec<TorqueModel>, Error> {
        use sea_orm::{EntityTrait, QueryOrder};
        use crate::database::entities::torque_models;
        
        let models = torque_models::Entity::find()
            .order_by_desc(torque_models::Column::CreatedAt)
            .all(self.database.as_ref())
            .await?;
            
        let mut result = Vec::new();
        for model in models {
            match serde_json::from_value::<TorqueModel>(model.model_json) {
                Ok(torque_model) => {
                    tracing::debug!("Loaded model '{}' with {} entities from database", torque_model.name, torque_model.entities.len());
                    result.push(torque_model);
                }
                Err(e) => {
                    tracing::warn!("Failed to deserialize model {}: {}", model.name, e);
                }
            }
        }
        
        Ok(result)
    }
    
    /// Save model to database (internal helper)
    async fn save_model_to_db(&self, model: &TorqueModel) -> Result<(), Error> {
        use sea_orm::{EntityTrait, Set};
        
        let model_json = serde_json::to_value(model)?;
        let schema_json = serde_json::json!({
            "version": "1.0.0",
            "entities": model.entities.len(),
            "relationships": model.relationships.len(),
            "flows": model.flows.len(),
            "layouts": model.layouts.len()
        });
        
        let active_model = torque_models::ActiveModel {
            id: Set(model.id.to_string()),
            name: Set(model.name.clone()),
            description: Set(model.description.clone()),
            version: Set(model.version.clone()),
            model_json: Set(model_json),
            schema_json: Set(schema_json),
            created_at: Set(model.created_at.as_chrono().naive_utc()),
            updated_at: Set(model.updated_at.as_chrono().naive_utc()),
        };
        
        torque_models::Entity::insert(active_model)
            .exec(self.database.as_ref())
            .await?;
            
        Ok(())
    }

    /// Get a specific model by ID with caching
    pub async fn get_model(&self, id: Uuid) -> Result<Option<TorqueModel>, Error> {
        // Check cache first
        if let Some(entry) = self.model_cache.get(&id) {
            if !entry.is_expired() {
                return Ok(Some(entry.data.clone()));
            } else {
                // Remove expired entry
                self.model_cache.remove(&id);
            }
        }

        // TODO: Query from database
        // For now, return None
        Ok(None)
    }

    /// Get a model by name and version
    pub async fn get_model_by_name_and_version(&self, name: &str, version: &str) -> Result<TorqueModel, Error> {
        use sea_orm::{EntityTrait, ColumnTrait, QueryFilter};
        
        let model_record = torque_models::Entity::find()
            .filter(torque_models::Column::Name.eq(name))
            .filter(torque_models::Column::Version.eq(version))
            .one(self.database.as_ref())
            .await?;

        if let Some(record) = model_record {
            // Convert the database record to TorqueModel
            match serde_json::from_value::<TorqueModel>(record.model_json.clone()) {
                Ok(model) => {
                    tracing::debug!("Retrieved model '{}' with {} entities from database", model.name, model.entities.len());
                    Ok(model)
                }
                Err(e) => {
                    tracing::warn!("Failed to deserialize model {} v{}: {}", name, version, e);
                    Err(Error::Serialization(e))
                }
            }
        } else {
            Err(Error::NotFound(format!("Model {} v{} not found", name, version)))
        }
    }

    /// Create a new model
    pub async fn create_model(&self, input: CreateModelInput) -> Result<TorqueModel, Error> {
        let now = UtcDateTime::from_chrono(Utc::now());
        let model = TorqueModel {
            id: Uuid::new_v4(),
            name: input.name,
            description: input.description,
            version: "1.0.0".to_string(),
            created_at: now.clone(),
            updated_at: now,
            created_by: "system".to_string(), // TODO: Get from auth context
            config: input.config.unwrap_or_default(),
            entities: vec![],
            relationships: vec![],
            flows: vec![],
            layouts: vec![],
            validations: vec![],
        };

        // Persist to database
        if let Err(e) = self.save_model_to_db(&model).await {
            tracing::error!("Failed to save model to database: {}", e);
        }

        // Cache the model
        self.model_cache.insert(
            model.id.clone(),
            CacheEntry::new(model.clone(), 3600), // 1 hour TTL
        );

        // Emit model created event
        self.emit_event(ModelChangeEvent::model_created(model.clone()));

        Ok(model)
    }

    /// Update an existing model
    pub async fn update_model(&self, id: Uuid, input: UpdateModelInput) -> Result<TorqueModel, Error> {
        // Get existing model
        let mut model = self.get_model(id.clone()).await?
            .ok_or_else(|| Error::NotFound(format!("Model with id {} not found", id)))?;

        // Update fields
        if let Some(name) = input.name {
            model.name = name;
        }
        if let Some(description) = input.description {
            model.description = Some(description);
        }
        if let Some(config) = input.config {
            model.config = config;
        }
        model.updated_at = UtcDateTime::from_chrono(Utc::now());

        // TODO: Persist to database

        // Update cache
        self.model_cache.insert(
            model.id.clone(),
            CacheEntry::new(model.clone(), 3600),
        );

        // Emit model updated event
        self.emit_event(ModelChangeEvent::model_updated(model.clone()));

        Ok(model)
    }

    /// Delete a model
    pub async fn delete_model(&self, id: Uuid) -> Result<bool, Error> {
        // TODO: Delete from database
        
        // Remove from cache
        self.model_cache.remove(&id);
        
        // Emit model deleted event
        self.emit_event(ModelChangeEvent::model_deleted(id));
        
        Ok(true)
    }

    /// Get entities for a specific model
    pub async fn get_entities(&self, model_id: Uuid) -> Result<Vec<ModelEntity>, Error> {
        if let Some(model) = self.get_model(model_id).await? {
            Ok(model.entities)
        } else {
            Ok(vec![])
        }
    }

    /// Create a new entity in a model
    pub async fn create_entity(&self, input: CreateEntityInput) -> Result<ModelEntity, Error> {
        let model_id = input.model_id.parse::<Uuid>()
            .map_err(|_| Error::InvalidInput("Invalid model ID format".to_string()))?;

        // Get the existing model
        let mut model = self.get_model(model_id.clone()).await?
            .ok_or_else(|| Error::NotFound(format!("Model with id {} not found", model_id)))?;

        let entity = ModelEntity {
            id: Uuid::new_v4(),
            name: input.name.clone(),
            display_name: input.display_name.clone(),
            description: input.description.clone(),
            entity_type: input.entity_type,
            fields: input.fields.into_iter().map(|f| EntityField {
                id: Uuid::new_v4(),
                name: f.name,
                display_name: f.display_name,
                field_type: f.field_type,
                required: f.required,
                default_value: f.default_value,
                validation: vec![], // TODO: Convert from input
                ui_config: f.ui_config.unwrap_or_default(),
            }).collect(),
            constraints: vec![],
            indexes: vec![],
            ui_config: input.ui_config.unwrap_or_default(),
            behavior: input.behavior.unwrap_or_default(),
        };

        // Add entity to model
        model.entities.push(entity.clone());
        model.updated_at = UtcDateTime::now();

        // Update cache with modified model
        self.model_cache.insert(
            model_id.clone(),
            CacheEntry::new(model.clone(), 3600), // 1 hour TTL
        );

        // Emit entity added event
        self.emit_event(ModelChangeEvent::entity_added(model_id, entity.id.clone()));

        // TODO: Persist to database

        Ok(entity)
    }

    /// Update an existing entity in a model
    pub async fn update_entity(&self, entity_id: Uuid, input: UpdateEntityInput) -> Result<ModelEntity, Error> {
        // Find the model containing this entity
        let mut model_with_entity = None;
        for entry in self.model_cache.iter() {
            let model = &entry.value().data;
            if model.entities.iter().any(|e| e.id == entity_id) {
                model_with_entity = Some(model.clone());
                break;
            }
        }

        let mut model = model_with_entity
            .ok_or_else(|| Error::NotFound(format!("Entity with id {} not found", entity_id)))?;

        // Find and update the entity
        let entity_index = model.entities.iter().position(|e| e.id == entity_id)
            .ok_or_else(|| Error::NotFound(format!("Entity with id {} not found", entity_id)))?;

        {
            let entity = &mut model.entities[entity_index];

            // Update entity fields based on input
            if let Some(name) = input.name {
                entity.name = name;
            }
            if let Some(display_name) = input.display_name {
                entity.display_name = display_name;
            }
            if let Some(description) = input.description {
                entity.description = Some(description);
            }
            if let Some(entity_type) = input.entity_type {
                entity.entity_type = entity_type;
            }
            if let Some(ui_config) = input.ui_config {
                entity.ui_config = ui_config;
            }
            if let Some(behavior) = input.behavior {
                entity.behavior = behavior;
            }
        }

        // Update model timestamp
        model.updated_at = UtcDateTime::now();

        // Get the updated entity for returning
        let updated_entity = model.entities[entity_index].clone();

        // Update cache with modified model
        self.model_cache.insert(
            model.id.clone(),
            CacheEntry::new(model.clone(), 3600), // 1 hour TTL
        );

        // Emit entity updated event
        self.emit_event(ModelChangeEvent::entity_updated(model.id.clone(), entity_id));

        // TODO: Persist to database

        Ok(updated_entity)
    }

    /// Get relationships for a specific model
    pub async fn get_relationships(&self, model_id: Uuid) -> Result<Vec<ModelRelationship>, Error> {
        if let Some(model) = self.get_model(model_id).await? {
            Ok(model.relationships)
        } else {
            Ok(vec![])
        }
    }

    /// Create a new relationship in a model
    pub async fn create_relationship(&self, input: CreateRelationshipInput) -> Result<ModelRelationship, Error> {
        let model_id = input.model_id.parse::<Uuid>()
            .map_err(|_| Error::InvalidInput("Invalid model ID format".to_string()))?;

        // Get the existing model
        let mut model = self.get_model(model_id.clone()).await?
            .ok_or_else(|| Error::NotFound(format!("Model with id {} not found", model_id)))?;

        let from_entity = input.from_entity.parse::<Uuid>()
            .map_err(|_| Error::InvalidInput("Invalid from_entity ID format".to_string()))?;
        let to_entity = input.to_entity.parse::<Uuid>()
            .map_err(|_| Error::InvalidInput("Invalid to_entity ID format".to_string()))?;

        let relationship = ModelRelationship {
            id: Uuid::new_v4(),
            name: input.name.clone(),
            relationship_type: input.relationship_type,
            from_entity,
            to_entity,
            from_field: input.from_field,
            to_field: input.to_field,
            cascade: input.cascade,
            ui_config: input.ui_config.unwrap_or_default(),
        };

        // Add relationship to model
        model.relationships.push(relationship.clone());
        model.updated_at = UtcDateTime::now();

        // Update cache with modified model
        self.model_cache.insert(
            model_id.clone(),
            CacheEntry::new(model.clone(), 3600),
        );

        // Emit relationship added event
        self.emit_event(ModelChangeEvent::relationship_added(model_id.clone(), relationship.id.clone()));

        Ok(relationship)
    }

    /// Get flows for a specific model
    pub async fn get_flows(&self, model_id: Uuid) -> Result<Vec<ModelFlow>, Error> {
        if let Some(model) = self.get_model(model_id).await? {
            Ok(model.flows)
        } else {
            Ok(vec![])
        }
    }

    /// Create a new flow in a model
    pub async fn create_flow(&self, input: CreateFlowInput) -> Result<ModelFlow, Error> {
        let model_id = input.model_id.parse::<Uuid>()
            .map_err(|_| Error::InvalidInput("Invalid model ID format".to_string()))?;

        // Get the existing model
        let mut model = self.get_model(model_id.clone()).await?
            .ok_or_else(|| Error::NotFound(format!("Model with id {} not found", model_id)))?;

        let flow = ModelFlow {
            id: Uuid::new_v4(),
            name: input.name.clone(),
            flow_type: input.flow_type,
            trigger: input.trigger,
            steps: input.steps.into_iter().map(|s| crate::model::types::FlowStep {
                id: Uuid::new_v4(),
                name: s.name,
                step_type: s.step_type,
                condition: s.condition,
                configuration: serde_json::from_value(s.configuration).unwrap_or_default(),
            }).collect(),
            error_handling: input.error_handling.unwrap_or_default(),
        };

        // Add flow to model
        model.flows.push(flow.clone());
        model.updated_at = UtcDateTime::now();

        // Update cache with modified model
        self.model_cache.insert(
            model_id.clone(),
            CacheEntry::new(model.clone(), 3600),
        );

        // Emit flow added event
        self.emit_event(ModelChangeEvent::flow_added(model_id.clone(), flow.id.clone()));

        Ok(flow)
    }

    /// Get layouts for a specific model
    pub async fn get_layouts(&self, model_id: Uuid) -> Result<Vec<ModelLayout>, Error> {
        if let Some(model) = self.get_model(model_id).await? {
            Ok(model.layouts)
        } else {
            Ok(vec![])
        }
    }

    /// Create a new layout in a model
    pub async fn create_layout(&self, input: CreateLayoutInput) -> Result<ModelLayout, Error> {
        let model_id = input.model_id.parse::<Uuid>()
            .map_err(|_| Error::InvalidInput("Invalid model ID format".to_string()))?;

        // Get the existing model
        let mut model = self.get_model(model_id.clone()).await?
            .ok_or_else(|| Error::NotFound(format!("Model with id {} not found", model_id)))?;

        let target_entities: Result<Vec<Uuid>, _> = input.target_entities.into_iter()
            .map(|id| id.parse::<Uuid>())
            .collect();
        let target_entities = target_entities
            .map_err(|_| Error::InvalidInput("Invalid target entity ID format".to_string()))?;

        let layout = ModelLayout {
            id: Uuid::new_v4(),
            name: input.name.clone(),
            layout_type: input.layout_type,
            target_entities,
            components: input.components.into_iter().map(|c| crate::model::types::LayoutComponent {
                id: Uuid::new_v4(),
                component_type: c.component_type,
                position: c.position,
                properties: serde_json::from_value(c.properties).unwrap_or_default(),
                styling: serde_json::from_value(c.styling.unwrap_or_default()).unwrap_or_default(),
            }).collect(),
            responsive: serde_json::from_value(input.responsive.unwrap_or_default()).unwrap_or_default(),
        };

        // Add layout to model
        model.layouts.push(layout.clone());
        model.updated_at = UtcDateTime::now();

        // Update cache with modified model
        self.model_cache.insert(
            model_id.clone(),
            CacheEntry::new(model.clone(), 3600),
        );

        // Emit layout added event
        self.emit_event(ModelChangeEvent::layout_added(model_id.clone(), layout.id.clone()));

        Ok(layout)
    }

    /// Search models by name or description
    pub async fn search_models(&self, _query: String) -> Result<Vec<TorqueModel>, Error> {
        // TODO: Implement full-text search
        // For now, return empty results
        Ok(vec![])
    }

    /// Validate a model
    pub async fn validate_model(&self, id: Uuid) -> Result<ValidationResult, Error> {
        let _model = self.get_model(id.clone()).await?
            .ok_or_else(|| Error::NotFound(format!("Model with id {} not found", id)))?;

        // TODO: Implement comprehensive model validation
        Ok(ValidationResult {
            valid: true,
            errors: vec![],
            warnings: vec![],
        })
    }

    /// Export a model to JSON
    pub async fn export_model(&self, id: Uuid) -> Result<String, Error> {
        let model = self.get_model(id.clone()).await?
            .ok_or_else(|| Error::NotFound(format!("Model with id {} not found", id)))?;

        serde_json::to_string_pretty(&model)
            .map_err(|e| Error::Serialization(e))
    }

    /// Import a model from JSON
    pub async fn import_model(&self, data: String) -> Result<TorqueModel, Error> {
        let mut model: TorqueModel = serde_json::from_str(&data)
            .map_err(|e| Error::Serialization(e))?;

        // Generate new ID and update timestamps
        model.id = Uuid::new_v4();
        let now = UtcDateTime::from_chrono(Utc::now());
        model.created_at = now.clone();
        model.updated_at = now;

        // TODO: Persist to database

        // Cache the model
        self.model_cache.insert(
            model.id.clone(),
            CacheEntry::new(model.clone(), 3600),
        );

        Ok(model)
    }

    /// Clean up expired cache entries
    pub fn cleanup_cache(&self) {
        self.model_cache.retain(|_, entry| !entry.is_expired());
    }
    
    /// Load seed data for development
    pub async fn load_seed_data(&self) -> Result<(), Error> {
        // Check if we already have models
        let existing_models = self.get_models().await?;
        if !existing_models.is_empty() {
            tracing::info!("Models already exist, clearing to reload with proper parsing");
            // Clear existing models to reload with proper parsing
            for model in existing_models {
                self.delete_model(model.id).await?;
            }
        }
        
        // Load the customer-order model
        let sample_model_path = std::path::Path::new("sample/models/customer-order.json");
        if sample_model_path.exists() {
            tracing::info!("Loading customer-order sample model");
            let json_content = tokio::fs::read_to_string(sample_model_path).await?;
            
            // Parse the JSON as a simplified format and convert to TorqueModel
            match self.parse_sample_model(&json_content).await {
                Ok(model) => {
                    tracing::info!("Successfully loaded customer-order model: {} with {} entities", model.name, model.entities.len());
                }
                Err(e) => {
                    tracing::warn!("Failed to parse customer-order model: {}", e);
                }
            }
        } else {
            tracing::info!("No sample model found at {}", sample_model_path.display());
        }
        
        Ok(())
    }
    
    /// Parse sample model from JSON (simplified format)
    async fn parse_sample_model(&self, json_content: &str) -> Result<TorqueModel, Error> {
        use serde_json::Value;
        
        // Parse as generic JSON first
        let data: Value = serde_json::from_str(json_content)?;
        
        // Extract basic information
        let name = data["name"].as_str().unwrap_or("Sample Model").to_string();
        let description = data["description"].as_str().map(|s| s.to_string());
        let version = data["version"].as_str().unwrap_or("1.0.0").to_string();
        let created_by = data["created_by"].as_str().unwrap_or("system").to_string();
        
        // Check if a model with the same name and version already exists
        if let Ok(existing_model) = self.get_model_by_name_and_version(&name, &version).await {
            tracing::info!("Model {} v{} already exists, returning existing model with {} entities", name, version, existing_model.entities.len());
            return Ok(existing_model);
        }
        
        // Parse config
        let config = if let Some(config_data) = data.get("config") {
            serde_json::from_value(config_data.clone()).unwrap_or_default()
        } else {
            ModelConfig::default()
        };
        
        // Parse entities
        let entities = if let Some(entities_array) = data["entities"].as_array() {
            entities_array.iter()
                .filter_map(|entity_data| self.parse_entity_from_json(entity_data).ok())
                .collect()
        } else {
            vec![]
        };
        
        // Parse relationships
        let relationships = if let Some(relationships_array) = data["relationships"].as_array() {
            relationships_array.iter()
                .filter_map(|rel_data| self.parse_relationship_from_json(rel_data, &entities).ok())
                .collect()
        } else {
            vec![]
        };
        
        // Parse flows
        let flows = if let Some(flows_array) = data["flows"].as_array() {
            flows_array.iter()
                .filter_map(|flow_data| self.parse_flow_from_json(flow_data).ok())
                .collect()
        } else {
            vec![]
        };
        
        // Parse layouts
        let layouts = if let Some(layouts_array) = data["layouts"].as_array() {
            layouts_array.iter()
                .filter_map(|layout_data| self.parse_layout_from_json(layout_data).ok())
                .collect()
        } else {
            vec![]
        };
        
        // Create a basic model structure
        let now = UtcDateTime::now();
        let model = TorqueModel {
            id: Uuid::new_v4(),
            name,
            description,
            version,
            created_at: now.clone(),
            updated_at: now,
            created_by,
            config,
            entities,
            relationships,
            flows,
            layouts,
            validations: vec![], // TODO: Parse validations from JSON
        };
        
        // Save to database and cache
        self.save_model_to_db(&model).await?;
        self.model_cache.insert(
            model.id.clone(),
            CacheEntry::new(model.clone(), 3600),
        );
        
        // Emit model created event
        self.emit_event(ModelChangeEvent::model_created(model.clone()));
        
        Ok(model)
    }
    
    /// Parse entity from JSON
    fn parse_entity_from_json(&self, entity_data: &serde_json::Value) -> Result<ModelEntity, Error> {
        
        
        let name = entity_data["name"].as_str().unwrap_or("").to_string();
        let display_name = entity_data["display_name"].as_str().unwrap_or(&name).to_string();
        let description = entity_data["description"].as_str().map(|s| s.to_string());
        
        // Parse entity type
        let entity_type = match entity_data["entity_type"].as_str().unwrap_or("Data") {
            "Data" => EntityType::Data,
            "Lookup" => EntityType::Lookup,
            "Audit" => EntityType::Audit,
            "Temporary" => EntityType::Temporary,
            "View" => EntityType::View,
            _ => EntityType::Data,
        };
        
        // Parse fields
        let fields = if let Some(fields_array) = entity_data["fields"].as_array() {
            fields_array.iter()
                .filter_map(|field_data| self.parse_field_from_json(field_data).ok())
                .collect()
        } else {
            vec![]
        };
        
        // Parse constraints
        let constraints = if let Some(constraints_array) = entity_data["constraints"].as_array() {
            constraints_array.iter()
                .filter_map(|constraint_data| self.parse_constraint_from_json(constraint_data).ok())
                .collect()
        } else {
            vec![]
        };
        
        // Parse indexes
        let indexes = if let Some(indexes_array) = entity_data["indexes"].as_array() {
            indexes_array.iter()
                .filter_map(|index_data| self.parse_index_from_json(index_data).ok())
                .collect()
        } else {
            vec![]
        };
        
        // Parse UI config
        let ui_config = if let Some(ui_config_data) = entity_data.get("ui_config") {
            serde_json::from_value(ui_config_data.clone()).unwrap_or_default()
        } else {
            EntityUiConfig::default()
        };
        
        // Parse behavior
        let behavior = if let Some(behavior_data) = entity_data.get("behavior") {
            serde_json::from_value(behavior_data.clone()).unwrap_or_default()
        } else {
            EntityBehavior::default()
        };
        
        Ok(ModelEntity {
            id: Uuid::new_v4(),
            name,
            display_name,
            description,
            entity_type,
            fields,
            constraints,
            indexes,
            ui_config,
            behavior,
        })
    }
    
    /// Parse field from JSON
    fn parse_field_from_json(&self, field_data: &serde_json::Value) -> Result<EntityField, Error> {
        
        
        let name = field_data["name"].as_str().unwrap_or("").to_string();
        let display_name = field_data["display_name"].as_str().unwrap_or(&name).to_string();
        let required = field_data["required"].as_bool().unwrap_or(false);
        let default_value = field_data.get("default_value").cloned();
        
        // Parse field type
        let field_type = self.parse_field_type_from_json(&field_data["field_type"])?;
        
        // Parse validation rules
        let validation = if let Some(validation_array) = field_data["validation"].as_array() {
            validation_array.iter()
                .filter_map(|val_data| self.parse_field_validation_from_json(val_data).ok())
                .collect()
        } else {
            vec![]
        };
        
        // Parse UI config
        let _ui_config = if let Some(ui_config_data) = field_data.get("ui_config") {
            ui_config_data.clone()
        } else {
            serde_json::Value::Object(serde_json::Map::new())
        };
        
        Ok(EntityField {
            id: Uuid::new_v4(),
            name,
            display_name,
            field_type,
            required,
            default_value,
            validation,
            ui_config: FieldUiConfig::default(),
        })
    }
    
    /// Parse field type from JSON
    fn parse_field_type_from_json(&self, field_type_data: &serde_json::Value) -> Result<FieldType, Error> {
        
        
        let type_str = if let Some(type_obj) = field_type_data.as_object() {
            type_obj.get("type").and_then(|v| v.as_str()).unwrap_or("String")
        } else {
            field_type_data.as_str().unwrap_or("String")
        };
        
        match type_str {
            "String" => {
                let max_length = field_type_data.get("max_length").and_then(|v| v.as_u64()).map(|v| v as usize);
                Ok(FieldType::String { max_length })
            }
            "Integer" => {
                let min = field_type_data.get("min").and_then(|v| v.as_i64());
                let max = field_type_data.get("max").and_then(|v| v.as_i64());
                Ok(FieldType::Integer { min, max })
            }
            "Float" => {
                let min = field_type_data.get("min").and_then(|v| v.as_f64());
                let max = field_type_data.get("max").and_then(|v| v.as_f64());
                Ok(FieldType::Float { min, max })
            }
            "Boolean" => Ok(FieldType::Boolean),
            "DateTime" => Ok(FieldType::DateTime),
            "Date" => Ok(FieldType::Date),
            "Time" => Ok(FieldType::Time),
            "Json" => Ok(FieldType::Json),
            "Binary" => Ok(FieldType::Binary),
            "Enum" => {
                let values = field_type_data.get("values")
                    .and_then(|v| v.as_array())
                    .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
                    .unwrap_or_default();
                Ok(FieldType::Enum { values })
            }
            "Reference" => {
                let _entity_name = field_type_data.get("entity").and_then(|v| v.as_str()).unwrap_or("");
                // For now, use a dummy UUID - in a real implementation, we'd need to resolve entity names to IDs
                Ok(FieldType::Reference { entity_id: Uuid::new_v4() })
            }
            "Array" => {
                let element_type = field_type_data.get("element_type")
                    .map(|et| self.parse_field_type_from_json(et))
                    .transpose()?
                    .unwrap_or(FieldType::String { max_length: None });
                Ok(FieldType::Array { element_type: Box::new(element_type) })
            }
            _ => Ok(FieldType::String { max_length: None }),
        }
    }
    
    /// Parse field validation from JSON
    fn parse_field_validation_from_json(&self, validation_data: &serde_json::Value) -> Result<FieldValidation, Error> {
        let validation_type = match validation_data.get("type").and_then(|v| v.as_str()).unwrap_or("Required") {
            "Required" => ValidationType::Required,
            "MinLength" => ValidationType::MinLength(2),
            "MaxLength" => ValidationType::MaxLength(255),
            "Pattern" => ValidationType::Pattern(".*".to_string()),
            "Range" => ValidationType::Range { min: serde_json::Value::Number(serde_json::Number::from_f64(0.0).unwrap()), max: serde_json::Value::Number(serde_json::Number::from_f64(100.0).unwrap()) },
            "Custom" => ValidationType::Custom(validation_data.get("rule").and_then(|r| r.as_str()).unwrap_or("").to_string()),
            _ => ValidationType::Required,
        };
        let message = validation_data["message"].as_str().unwrap_or("Validation failed").to_string();
        let severity = match validation_data["severity"].as_str().unwrap_or("Error") {
            "Error" => ValidationSeverity::Error,
            "Warning" => ValidationSeverity::Warning,
            "Info" => ValidationSeverity::Info,
            _ => ValidationSeverity::Error,
        };
        
        Ok(FieldValidation {
            validation_type,
            message,
            severity,
        })
    }
    
    /// Parse constraint from JSON
    fn parse_constraint_from_json(&self, constraint_data: &serde_json::Value) -> Result<EntityConstraint, Error> {
        let constraint_type = match constraint_data["type"].as_str().unwrap_or("UniqueKey") {
            "PrimaryKey" => ConstraintType::PrimaryKey,
            "UniqueKey" => ConstraintType::UniqueKey,
            "ForeignKey" => ConstraintType::ForeignKey { 
                reference_entity: Uuid::new_v4(),
                reference_field: "id".to_string(),
            },
            "Check" => ConstraintType::Check("".to_string()),
            _ => ConstraintType::UniqueKey,
        };
        
        let name = constraint_data["name"].as_str().unwrap_or("").to_string();
        let fields = constraint_data["fields"].as_array()
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
            .unwrap_or_default();
        let message = constraint_data["message"].as_str().map(|s| s.to_string());
        
        Ok(EntityConstraint {
            constraint_type,
            name,
            fields,
            message,
        })
    }
    
    /// Parse index from JSON
    fn parse_index_from_json(&self, index_data: &serde_json::Value) -> Result<EntityIndex, Error> {
        let name = index_data["name"].as_str().unwrap_or("").to_string();
        let fields = index_data["fields"].as_array()
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|s| s.to_string())).collect())
            .unwrap_or_default();
        let index_type = match index_data["type"].as_str().unwrap_or("BTree") {
            "BTree" => IndexType::BTree,
            "Hash" => IndexType::Hash,
            "Gin" => IndexType::Gin,
            "Gist" => IndexType::Gist,
            _ => IndexType::BTree,
        };
        let unique = index_data["unique"].as_bool().unwrap_or(false);
        
        Ok(EntityIndex {
            name,
            fields,
            index_type,
            unique,
        })
    }
    
    /// Parse relationship from JSON
    fn parse_relationship_from_json(&self, rel_data: &serde_json::Value, entities: &[ModelEntity]) -> Result<ModelRelationship, Error> {
        let name = rel_data["name"].as_str().unwrap_or("").to_string();
        let relationship_type = match rel_data["type"].as_str().unwrap_or("OneToMany") {
            "OneToOne" => RelationshipType::OneToOne,
            "OneToMany" => RelationshipType::OneToMany,
            "ManyToOne" => RelationshipType::ManyToOne,
            "ManyToMany" => RelationshipType::ManyToMany,
            _ => RelationshipType::OneToMany,
        };
        
        let from_entity_name = rel_data["from_entity"].as_str().unwrap_or("");
        let to_entity_name = rel_data["to_entity"].as_str().unwrap_or("");
        
        // Find entity IDs by name
        let from_entity = entities.iter().find(|e| e.name == from_entity_name)
            .map(|e| e.id.clone()).unwrap_or_else(|| Uuid::new_v4());
        let to_entity = entities.iter().find(|e| e.name == to_entity_name)
            .map(|e| e.id.clone()).unwrap_or_else(|| Uuid::new_v4());
        
        let from_field = rel_data["from_field"].as_str().unwrap_or("").to_string();
        let to_field = rel_data["to_field"].as_str().unwrap_or("").to_string();
        
        let cascade = match rel_data["cascade"].as_str().unwrap_or("None") {
            "None" => CascadeAction::None,
            "Delete" => CascadeAction::Delete,
            "SetNull" => CascadeAction::SetNull,
            "Restrict" => CascadeAction::Restrict,
            _ => CascadeAction::None,
        };
        
        let ui_config = if let Some(ui_config_data) = rel_data.get("ui_config") {
            serde_json::from_value(ui_config_data.clone()).unwrap_or_default()
        } else {
            RelationshipUiConfig::default()
        };
        
        Ok(ModelRelationship {
            id: Uuid::new_v4(),
            name,
            relationship_type,
            from_entity,
            to_entity,
            from_field,
            to_field,
            cascade,
            ui_config,
        })
    }
    
    /// Parse flow from JSON
    fn parse_flow_from_json(&self, flow_data: &serde_json::Value) -> Result<ModelFlow, Error> {
        let name = flow_data["name"].as_str().unwrap_or("").to_string();
        let flow_type = match flow_data["type"].as_str().unwrap_or("Validation") {
            "Validation" => FlowType::Validation,
            "Automation" => FlowType::Automation,
            "Approval" => FlowType::Approval,
            "Notification" => FlowType::Notification,
            "Custom" => FlowType::Custom,
            _ => FlowType::Validation,
        };
        
        let trigger = FlowTrigger::EntityEvent {
            entity_id: Uuid::new_v4(),
            event: LifecycleEvent::AfterUpdate,
        };
        let error_handling = ErrorHandling {
            retry_attempts: 0,
            retry_delay_seconds: 0,
            on_error: ErrorAction::Stop,
        };
        
        // Parse steps
        let steps = if let Some(steps_array) = flow_data["steps"].as_array() {
            steps_array.iter()
                .filter_map(|step_data| self.parse_flow_step_from_json(step_data).ok())
                .collect()
        } else {
            vec![]
        };
        
        Ok(ModelFlow {
            id: Uuid::new_v4(),
            name,
            flow_type,
            trigger,
            steps,
            error_handling,
        })
    }
    
    /// Parse flow step from JSON
    fn parse_flow_step_from_json(&self, step_data: &serde_json::Value) -> Result<FlowStep, Error> {
        let name = step_data["name"].as_str().unwrap_or("").to_string();
        let step_type = match step_data["type"].as_str().unwrap_or("Validation") {
            "Validation" => FlowStepType::Validation,
            "Transformation" => FlowStepType::Transformation,
            "Notification" => FlowStepType::Notification,
            "Integration" => FlowStepType::Integration,
            "Approval" => FlowStepType::Approval,
            "Custom" => FlowStepType::Custom("".to_string()),
            _ => FlowStepType::Validation,
        };
        let condition = step_data["condition"].as_str().map(|s| s.to_string());
        let configuration = if let Some(config_data) = step_data.get("configuration") {
            if let Some(config_obj) = config_data.as_object() {
                config_obj.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
            } else {
                std::collections::HashMap::new()
            }
        } else {
            std::collections::HashMap::new()
        };
        
        Ok(FlowStep {
            id: Uuid::new_v4(),
            name,
            step_type,
            condition,
            configuration,
        })
    }
    
    /// Parse layout from JSON
    fn parse_layout_from_json(&self, layout_data: &serde_json::Value) -> Result<ModelLayout, Error> {
        let name = layout_data["name"].as_str().unwrap_or("").to_string();
        let layout_type = match layout_data["type"].as_str().unwrap_or("Dashboard") {
            "List" => LayoutType::List,
            "Grid" => LayoutType::Grid,
            "Dashboard" => LayoutType::Dashboard,
            "Form" => LayoutType::Form,
            "Detail" => LayoutType::Detail,
            "Custom" => LayoutType::Custom,
            _ => LayoutType::Dashboard,
        };
        
        let target_entities = layout_data["target_entities"].as_array()
            .map(|arr| arr.iter().filter_map(|v| v.as_str().map(|_s| Uuid::new_v4())).collect())
            .unwrap_or_default();
        
        let responsive = ResponsiveLayout {
            breakpoints: vec![],
            adaptive_components: vec![],
        };
        
        // Parse components
        let components = if let Some(components_array) = layout_data["components"].as_array() {
            components_array.iter()
                .filter_map(|comp_data| self.parse_layout_component_from_json(comp_data).ok())
                .collect()
        } else {
            vec![]
        };
        
        Ok(ModelLayout {
            id: Uuid::new_v4(),
            name,
            layout_type,
            target_entities,
            components,
            responsive,
        })
    }
    
    /// Parse layout component from JSON
    fn parse_layout_component_from_json(&self, comp_data: &serde_json::Value) -> Result<LayoutComponent, Error> {
        let component_type = comp_data["type"].as_str().unwrap_or("").to_string();
        let position = ComponentPosition {
            row: comp_data["position"]["row"].as_u64().unwrap_or(0) as u32,
            column: comp_data["position"]["column"].as_u64().unwrap_or(0) as u32,
            width: comp_data["position"]["width"].as_u64().unwrap_or(1) as u32,
            height: comp_data["position"]["height"].as_u64().unwrap_or(1) as u32,
        };
        let properties = if let Some(props) = comp_data.get("properties").and_then(|p| p.as_object()) {
            props.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
        } else {
            std::collections::HashMap::new()
        };
        let styling = if let Some(style) = comp_data.get("styling").and_then(|s| s.as_object()) {
            style.iter().map(|(k, v)| (k.clone(), v.clone())).collect()
        } else {
            std::collections::HashMap::new()
        };
        
        Ok(LayoutComponent {
            id: Uuid::new_v4(),
            component_type,
            position,
            properties,
            styling,
        })
    }
}

// Input types for the service layer
#[derive(Debug, Clone)]
pub struct CreateModelInput {
    pub name: String,
    pub description: Option<String>,
    pub config: Option<ModelConfig>,
}

#[derive(Debug, Clone)]
pub struct UpdateModelInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub config: Option<ModelConfig>,
}

#[derive(Debug, Clone)]
pub struct CreateEntityInput {
    pub model_id: String,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub entity_type: EntityType,
    pub fields: Vec<CreateFieldInput>,
    pub ui_config: Option<EntityUiConfig>,
    pub behavior: Option<EntityBehavior>,
}

#[derive(Debug, Clone)]
pub struct UpdateEntityInput {
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub entity_type: Option<EntityType>,
    pub ui_config: Option<EntityUiConfig>,
    pub behavior: Option<EntityBehavior>,
}

#[derive(Debug, Clone)]
pub struct CreateFieldInput {
    pub name: String,
    pub display_name: String,
    pub field_type: FieldType,
    pub required: bool,
    pub default_value: Option<Value>,
    pub ui_config: Option<FieldUiConfig>,
}

#[derive(Debug, Clone)]
pub struct CreateRelationshipInput {
    pub model_id: String,
    pub name: String,
    pub relationship_type: RelationshipType,
    pub from_entity: String,
    pub to_entity: String,
    pub from_field: String,
    pub to_field: String,
    pub cascade: CascadeAction,
    pub ui_config: Option<RelationshipUiConfig>,
}

#[derive(Debug, Clone)]
pub struct CreateFlowInput {
    pub model_id: String,
    pub name: String,
    pub flow_type: FlowType,
    pub trigger: FlowTrigger,
    pub steps: Vec<CreateFlowStepInput>,
    pub error_handling: Option<ErrorHandling>,
}

#[derive(Debug, Clone)]
pub struct CreateFlowStepInput {
    pub name: String,
    pub step_type: FlowStepType,
    pub condition: Option<String>,
    pub configuration: serde_json::Value,
}

#[derive(Debug, Clone)]
pub struct CreateLayoutInput {
    pub model_id: String,
    pub name: String,
    pub layout_type: LayoutType,
    pub target_entities: Vec<String>,
    pub components: Vec<CreateLayoutComponentInput>,
    pub responsive: Option<serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct CreateLayoutComponentInput {
    pub component_type: String,
    pub position: ComponentPosition,
    pub properties: serde_json::Value,
    pub styling: Option<serde_json::Value>,
}

#[derive(Debug, Clone)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationMessage>,
    pub warnings: Vec<ValidationMessage>,
}

#[derive(Debug, Clone)]
pub struct ValidationMessage {
    pub message: String,
    pub field: Option<String>,
    pub code: String,
}

// Default implementations
impl Default for EntityUiConfig {
    fn default() -> Self {
        Self {
            icon: None,
            color: None,
            list_view: ListView {
                columns: vec![],
                default_sort: None,
                pagination: PaginationConfig {
                    page_size: 25,
                    show_page_size_options: true,
                    page_size_options: vec![10, 25, 50, 100],
                },
                filters: vec![],
            },
            detail_view: DetailView {
                layout: DetailLayout::Single,
                sections: vec![],
                actions: vec![],
            },
            form_view: FormView {
                layout: FormLayout::Single,
                validation: FormValidation {
                    client_side: true,
                    server_side: true,
                    real_time: true,
                },
                submission: FormSubmission {
                    auto_save: false,
                    confirmation: false,
                    redirect_after_save: None,
                },
            },
        }
    }
}

impl Default for EntityBehavior {
    fn default() -> Self {
        Self {
            auditing: AuditConfig {
                enabled: false,
                track_changes: false,
                track_access: false,
                retention_days: None,
            },
            caching: CacheConfig {
                enabled: true,
                ttl_seconds: 3600,
                invalidation_strategy: CacheInvalidationStrategy::OnUpdate,
            },
            lifecycle: LifecycleConfig {
                hooks: vec![],
                workflows: vec![],
            },
        }
    }
}

impl Default for FieldUiConfig {
    fn default() -> Self {
        Self {
            component_type: "input".to_string(),
            label: None,
            placeholder: None,
            help_text: None,
            visibility: FieldVisibility::Visible,
            edit_mode: FieldEditMode::Editable,
            custom_props: std::collections::HashMap::new(),
        }
    }
}