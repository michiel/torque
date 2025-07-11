use std::sync::Arc;
use tokio::sync::{broadcast, RwLock};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use dashmap::DashMap;
use serde_json::Value;
use tracing;

use sea_orm::DatabaseConnection;
use crate::services::cache::CacheService;
use crate::model::types::*;
use crate::model::events::ModelChangeEvent;
use crate::error::Error;

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
    pub created_at: DateTime<Utc>,
    pub ttl_seconds: u64,
}

impl<T> CacheEntry<T> {
    pub fn new(data: T, ttl_seconds: u64) -> Self {
        Self {
            data,
            created_at: Utc::now(),
            ttl_seconds,
        }
    }

    pub fn is_expired(&self) -> bool {
        let elapsed = Utc::now()
            .signed_duration_since(self.created_at)
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
        // For now, return models from cache - will implement database queries later
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

    /// Create a new model
    pub async fn create_model(&self, input: CreateModelInput) -> Result<TorqueModel, Error> {
        let now = Utc::now();
        let model = TorqueModel {
            id: Uuid::new_v4(),
            name: input.name,
            description: input.description,
            version: "1.0.0".to_string(),
            created_at: now,
            updated_at: now,
            created_by: "system".to_string(), // TODO: Get from auth context
            config: input.config.unwrap_or_default(),
            entities: vec![],
            relationships: vec![],
            flows: vec![],
            layouts: vec![],
            validations: vec![],
        };

        // TODO: Persist to database

        // Cache the model
        self.model_cache.insert(
            model.id,
            CacheEntry::new(model.clone(), 3600), // 1 hour TTL
        );

        // Emit model created event
        self.emit_event(ModelChangeEvent::model_created(model.clone()));

        Ok(model)
    }

    /// Update an existing model
    pub async fn update_model(&self, id: Uuid, input: UpdateModelInput) -> Result<TorqueModel, Error> {
        // Get existing model
        let mut model = self.get_model(id).await?
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
        model.updated_at = Utc::now();

        // TODO: Persist to database

        // Update cache
        self.model_cache.insert(
            model.id,
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
        let mut model = self.get_model(model_id).await?
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
        model.updated_at = chrono::Utc::now();

        // Update cache with modified model
        self.model_cache.insert(
            model_id,
            CacheEntry::new(model.clone(), 3600), // 1 hour TTL
        );

        // Emit entity added event
        self.emit_event(ModelChangeEvent::entity_added(model_id, entity.id));

        // TODO: Persist to database

        Ok(entity)
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
        let mut model = self.get_model(model_id).await?
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
        model.updated_at = chrono::Utc::now();

        // Update cache with modified model
        self.model_cache.insert(
            model_id,
            CacheEntry::new(model.clone(), 3600),
        );

        // Emit relationship added event
        self.emit_event(ModelChangeEvent::relationship_added(model_id, relationship.id));

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
        let mut model = self.get_model(model_id).await?
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
        model.updated_at = chrono::Utc::now();

        // Update cache with modified model
        self.model_cache.insert(
            model_id,
            CacheEntry::new(model.clone(), 3600),
        );

        // Emit flow added event
        self.emit_event(ModelChangeEvent::flow_added(model_id, flow.id));

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
        let mut model = self.get_model(model_id).await?
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
        model.updated_at = chrono::Utc::now();

        // Update cache with modified model
        self.model_cache.insert(
            model_id,
            CacheEntry::new(model.clone(), 3600),
        );

        // Emit layout added event
        self.emit_event(ModelChangeEvent::layout_added(model_id, layout.id));

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
        let _model = self.get_model(id).await?
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
        let model = self.get_model(id).await?
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
        let now = Utc::now();
        model.created_at = now;
        model.updated_at = now;

        // TODO: Persist to database

        // Cache the model
        self.model_cache.insert(
            model.id,
            CacheEntry::new(model.clone(), 3600),
        );

        Ok(model)
    }

    /// Clean up expired cache entries
    pub fn cleanup_cache(&self) {
        self.model_cache.retain(|_, entry| !entry.is_expired());
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