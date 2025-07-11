use async_graphql::{
    Context, Enum, InputObject, Object, Result, SimpleObject, Subscription,
};
use futures_util::Stream;
use serde_json::Value;
use uuid::Uuid;

use crate::model::types::*;
use crate::server::AppState;
use crate::services::model::{CreateModelInput as ServiceCreateModelInput, UpdateModelInput as ServiceUpdateModelInput};
use crate::Error;

// GraphQL scalars for custom types
pub type JSON = Value;

// Use String for UUID and DateTime in GraphQL for simplicity
pub type UuidString = String;
pub type DateTimeString = String;

/// Root Query type for GraphQL API
pub struct Query;

#[Object]
impl Query {
    /// Get all models
    async fn models(&self, ctx: &Context<'_>) -> Result<Vec<Model>> {
        let state = ctx.data::<AppState>()?;
        let models = state.services.model_service.get_models().await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get models: {}", e)))?;
        Ok(models.into_iter().map(Model::from).collect())
    }

    /// Get a specific model by ID
    async fn model(&self, ctx: &Context<'_>, id: String) -> Result<Option<Model>> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let model = state.services.model_service.get_model(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get model: {}", e)))?;
        Ok(model.map(Model::from))
    }

    /// Get entities for a specific model
    async fn entities(&self, ctx: &Context<'_>, model_id: String) -> Result<Vec<Entity>> {
        let state = ctx.data::<AppState>()?;
        let uuid = model_id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let entities = state.services.model_service.get_entities(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get entities: {}", e)))?;
        Ok(entities.into_iter().map(Entity::from).collect())
    }

    /// Get a specific entity by ID
    async fn entity(&self, ctx: &Context<'_>, id: String) -> Result<Option<Entity>> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        // Get entity by searching through all models for now
        let models = state.services.model_service.get_models().await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get models: {}", e)))?;
        
        for model in models {
            if let Some(entity) = model.entities.iter().find(|e| e.id == uuid) {
                return Ok(Some(Entity::from(entity.clone())));
            }
        }
        Ok(None)
    }

    /// Get relationships for a specific model
    async fn relationships(&self, ctx: &Context<'_>, model_id: String) -> Result<Vec<Relationship>> {
        let state = ctx.data::<AppState>()?;
        let uuid = model_id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let relationships = state.services.model_service.get_relationships(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get relationships: {}", e)))?;
        Ok(relationships.into_iter().map(Relationship::from).collect())
    }

    /// Get flows for a specific model
    async fn flows(&self, ctx: &Context<'_>, model_id: String) -> Result<Vec<Flow>> {
        let state = ctx.data::<AppState>()?;
        let uuid = model_id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let flows = state.services.model_service.get_flows(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get flows: {}", e)))?;
        Ok(flows.into_iter().map(Flow::from).collect())
    }

    /// Get layouts for a specific model
    async fn layouts(&self, ctx: &Context<'_>, model_id: String) -> Result<Vec<Layout>> {
        let state = ctx.data::<AppState>()?;
        let uuid = model_id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let layouts = state.services.model_service.get_layouts(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get layouts: {}", e)))?;
        Ok(layouts.into_iter().map(Layout::from).collect())
    }

    /// Search models by name or description
    async fn search_models(&self, ctx: &Context<'_>, query: String) -> Result<Vec<Model>> {
        let state = ctx.data::<AppState>()?;
        let models = state.services.model_service.search_models(query).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to search models: {}", e)))?;
        Ok(models.into_iter().map(Model::from).collect())
    }
}

/// Root Mutation type for GraphQL API
pub struct Mutation;

#[Object]
impl Mutation {
    /// Create a new model
    async fn create_model(&self, ctx: &Context<'_>, input: CreateModelInput) -> Result<Model> {
        let state = ctx.data::<AppState>()?;
        let service_input = ServiceCreateModelInput {
            name: input.name,
            description: input.description,
            config: input.config.map(|c| serde_json::from_value(c).unwrap_or_default()),
        };
        let model = state.services.model_service.create_model(service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to create model: {}", e)))?;
        Ok(Model::from(model))
    }

    /// Update an existing model
    async fn update_model(&self, ctx: &Context<'_>, id: String, input: UpdateModelInput) -> Result<Model> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let service_input = ServiceUpdateModelInput {
            name: input.name,
            description: input.description,
            config: input.config.map(|c| serde_json::from_value(c).unwrap_or_default()),
        };
        let model = state.services.model_service.update_model(uuid, service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to update model: {}", e)))?;
        Ok(Model::from(model))
    }

    /// Delete a model
    async fn delete_model(&self, ctx: &Context<'_>, id: String) -> Result<bool> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        state.services.model_service.delete_model(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to delete model: {}", e)))
    }

    /// Create a new entity
    async fn create_entity(&self, ctx: &Context<'_>, input: CreateEntityInput) -> Result<Entity> {
        let state = ctx.data::<AppState>()?;
        
        let service_input = crate::services::model::CreateEntityInput {
            model_id: input.model_id,
            name: input.name,
            display_name: input.display_name,
            description: input.description,
            entity_type: match input.entity_type {
                EntityTypeEnum::Data => crate::model::types::EntityType::Data,
                EntityTypeEnum::Lookup => crate::model::types::EntityType::Lookup,
                EntityTypeEnum::Audit => crate::model::types::EntityType::Audit,
                EntityTypeEnum::Temporary => crate::model::types::EntityType::Temporary,
                EntityTypeEnum::View => crate::model::types::EntityType::View,
            },
            fields: input.fields.into_iter().map(|f| crate::services::model::CreateFieldInput {
                name: f.name,
                display_name: f.display_name,
                field_type: match f.field_type {
                    FieldTypeEnum::String => crate::model::types::FieldType::String { max_length: None },
                    FieldTypeEnum::Integer => crate::model::types::FieldType::Integer { min: None, max: None },
                    FieldTypeEnum::Float => crate::model::types::FieldType::Float { min: None, max: None },
                    FieldTypeEnum::Boolean => crate::model::types::FieldType::Boolean,
                    FieldTypeEnum::DateTime => crate::model::types::FieldType::DateTime,
                    FieldTypeEnum::Date => crate::model::types::FieldType::Date,
                    FieldTypeEnum::Time => crate::model::types::FieldType::Time,
                    FieldTypeEnum::Json => crate::model::types::FieldType::Json,
                    FieldTypeEnum::Binary => crate::model::types::FieldType::Binary,
                    FieldTypeEnum::Enum => crate::model::types::FieldType::Enum { values: vec![] },
                    FieldTypeEnum::Reference => crate::model::types::FieldType::Reference { entity_id: uuid::Uuid::new_v4() },
                    FieldTypeEnum::Array => crate::model::types::FieldType::Array { element_type: Box::new(crate::model::types::FieldType::String { max_length: None }) },
                },
                required: f.required,
                default_value: f.default_value,
                ui_config: f.ui_config.map(|c| serde_json::from_value(c).unwrap_or_default()),
            }).collect(),
            ui_config: input.ui_config.map(|c| serde_json::from_value(c).unwrap_or_default()),
            behavior: input.behavior.map(|b| serde_json::from_value(b).unwrap_or_default()),
        };
        
        let entity = state.services.model_service.create_entity(service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to create entity: {}", e)))?;
            
        Ok(Entity::from(entity))
    }

    /// Update an existing entity
    async fn update_entity(&self, ctx: &Context<'_>, id: String, input: UpdateEntityInput) -> Result<Entity> {
        let state = ctx.data::<AppState>()?;
        
        // Parse entity ID
        let entity_id = id.parse::<Uuid>()
            .map_err(|_| Error::InvalidInput("Invalid entity ID format".to_string()))?;
        
        // Convert GraphQL input to model service input
        let model_input = crate::services::model::UpdateEntityInput {
            name: input.name,
            display_name: input.display_name,
            description: input.description,
            entity_type: input.entity_type.map(|et| match et {
                EntityTypeEnum::Data => crate::model::types::EntityType::Data,
                EntityTypeEnum::Lookup => crate::model::types::EntityType::Lookup,
                EntityTypeEnum::Audit => crate::model::types::EntityType::Audit,
                EntityTypeEnum::Temporary => crate::model::types::EntityType::Temporary,
                EntityTypeEnum::View => crate::model::types::EntityType::View,
            }),
            ui_config: input.ui_config.map(|config| serde_json::from_value(config).unwrap_or_default()),
            behavior: input.behavior.map(|behavior| serde_json::from_value(behavior).unwrap_or_default()),
        };
        
        // Update entity through model service
        let updated_entity = state.services.model_service.update_entity(entity_id, model_input).await?;
        
        // Convert model entity to GraphQL entity using existing From implementation
        Ok(Entity::from(updated_entity))
    }

    /// Delete an entity
    async fn delete_entity(&self, ctx: &Context<'_>, id: String) -> Result<bool> {
        let _state = ctx.data::<AppState>()?;
        // TODO: Implement entity deletion
        Ok(false)
    }

    /// Create a new relationship
    async fn create_relationship(&self, ctx: &Context<'_>, input: CreateRelationshipInput) -> Result<Relationship> {
        let state = ctx.data::<AppState>()?;
        
        let service_input = crate::services::model::CreateRelationshipInput {
            model_id: input.model_id,
            name: input.name,
            relationship_type: match input.relationship_type {
                RelationshipTypeEnum::OneToOne => crate::model::types::RelationshipType::OneToOne,
                RelationshipTypeEnum::OneToMany => crate::model::types::RelationshipType::OneToMany,
                RelationshipTypeEnum::ManyToOne => crate::model::types::RelationshipType::ManyToOne,
                RelationshipTypeEnum::ManyToMany => crate::model::types::RelationshipType::ManyToMany,
            },
            from_entity: input.from_entity,
            to_entity: input.to_entity,
            from_field: input.from_field,
            to_field: input.to_field,
            cascade: match input.cascade {
                CascadeActionEnum::None => crate::model::types::CascadeAction::None,
                CascadeActionEnum::Delete => crate::model::types::CascadeAction::Delete,
                CascadeActionEnum::SetNull => crate::model::types::CascadeAction::SetNull,
                CascadeActionEnum::Restrict => crate::model::types::CascadeAction::Restrict,
            },
            ui_config: input.ui_config.map(|c| serde_json::from_value(c).unwrap_or_default()),
        };
        
        let relationship = state.services.model_service.create_relationship(service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to create relationship: {}", e)))?;
            
        Ok(Relationship::from(relationship))
    }

    /// Update an existing relationship
    async fn update_relationship(&self, ctx: &Context<'_>, id: String, input: UpdateRelationshipInput) -> Result<Relationship> {
        let _state = ctx.data::<AppState>()?;
        // TODO: Implement relationship update
        unimplemented!("Relationship update not yet implemented")
    }

    /// Delete a relationship
    async fn delete_relationship(&self, ctx: &Context<'_>, id: String) -> Result<bool> {
        let _state = ctx.data::<AppState>()?;
        // TODO: Implement relationship deletion
        Ok(false)
    }

    /// Create a new flow
    async fn create_flow(&self, ctx: &Context<'_>, input: CreateFlowInput) -> Result<Flow> {
        let state = ctx.data::<AppState>()?;
        
        let service_input = crate::services::model::CreateFlowInput {
            model_id: input.model_id,
            name: input.name,
            flow_type: match input.flow_type {
                FlowTypeEnum::Validation => crate::model::types::FlowType::Validation,
                FlowTypeEnum::Automation => crate::model::types::FlowType::Automation,
                FlowTypeEnum::Approval => crate::model::types::FlowType::Approval,
                FlowTypeEnum::Notification => crate::model::types::FlowType::Notification,
                FlowTypeEnum::Custom => crate::model::types::FlowType::Custom,
            },
            trigger: serde_json::from_value(input.trigger).unwrap_or_default(),
            steps: input.steps.into_iter().map(|s| crate::services::model::CreateFlowStepInput {
                name: s.name,
                step_type: match s.step_type {
                    FlowStepTypeEnum::Validation => crate::model::types::FlowStepType::Validation,
                    FlowStepTypeEnum::Transformation => crate::model::types::FlowStepType::Transformation,
                    FlowStepTypeEnum::Notification => crate::model::types::FlowStepType::Notification,
                    FlowStepTypeEnum::Integration => crate::model::types::FlowStepType::Integration,
                    FlowStepTypeEnum::Approval => crate::model::types::FlowStepType::Approval,
                    FlowStepTypeEnum::Custom => crate::model::types::FlowStepType::Custom("".to_string()),
                },
                condition: s.condition,
                configuration: serde_json::from_value(s.configuration).unwrap_or_default(),
            }).collect(),
            error_handling: input.error_handling.map(|e| serde_json::from_value(e).unwrap_or_default()),
        };
        
        let flow = state.services.model_service.create_flow(service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to create flow: {}", e)))?;
            
        Ok(Flow::from(flow))
    }

    /// Update an existing flow
    async fn update_flow(&self, ctx: &Context<'_>, id: String, input: UpdateFlowInput) -> Result<Flow> {
        let _state = ctx.data::<AppState>()?;
        // TODO: Implement flow update
        unimplemented!("Flow update not yet implemented")
    }

    /// Delete a flow
    async fn delete_flow(&self, ctx: &Context<'_>, id: String) -> Result<bool> {
        let _state = ctx.data::<AppState>()?;
        // TODO: Implement flow deletion
        Ok(false)
    }

    /// Create a new layout
    async fn create_layout(&self, ctx: &Context<'_>, input: CreateLayoutInput) -> Result<Layout> {
        let state = ctx.data::<AppState>()?;
        
        let service_input = crate::services::model::CreateLayoutInput {
            model_id: input.model_id,
            name: input.name,
            layout_type: match input.layout_type {
                LayoutTypeEnum::List => crate::model::types::LayoutType::List,
                LayoutTypeEnum::Grid => crate::model::types::LayoutType::Grid,
                LayoutTypeEnum::Dashboard => crate::model::types::LayoutType::Dashboard,
                LayoutTypeEnum::Form => crate::model::types::LayoutType::Form,
                LayoutTypeEnum::Detail => crate::model::types::LayoutType::Detail,
                LayoutTypeEnum::Custom => crate::model::types::LayoutType::Custom,
            },
            target_entities: input.target_entities,
            components: input.components.into_iter().map(|c| crate::services::model::CreateLayoutComponentInput {
                component_type: c.component_type,
                position: serde_json::from_value(c.position).unwrap_or_default(),
                properties: serde_json::from_value(c.properties).unwrap_or_default(),
                styling: c.styling.map(|s| serde_json::from_value(s).unwrap_or_default()),
            }).collect(),
            responsive: input.responsive.map(|r| serde_json::from_value(r).unwrap_or_default()),
        };
        
        let layout = state.services.model_service.create_layout(service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to create layout: {}", e)))?;
            
        Ok(Layout::from(layout))
    }

    /// Update an existing layout
    async fn update_layout(&self, ctx: &Context<'_>, id: String, input: UpdateLayoutInput) -> Result<Layout> {
        let _state = ctx.data::<AppState>()?;
        // TODO: Implement layout update
        unimplemented!("Layout update not yet implemented")
    }

    /// Delete a layout
    async fn delete_layout(&self, ctx: &Context<'_>, id: String) -> Result<bool> {
        let _state = ctx.data::<AppState>()?;
        // TODO: Implement layout deletion
        Ok(false)
    }

    /// Validate a model
    async fn validate_model(&self, ctx: &Context<'_>, id: String) -> Result<ValidationResult> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let result = state.services.model_service.validate_model(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to validate model: {}", e)))?;
        Ok(result.into())
    }

    /// Export a model to JSON
    async fn export_model(&self, ctx: &Context<'_>, id: String) -> Result<String> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        state.services.model_service.export_model(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to export model: {}", e)))
    }

    /// Import a model from JSON
    async fn import_model(&self, ctx: &Context<'_>, data: String) -> Result<Model> {
        let state = ctx.data::<AppState>()?;
        let model = state.services.model_service.import_model(data).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to import model: {}", e)))?;
        Ok(Model::from(model))
    }
}

/// Subscription type for real-time updates (placeholder for now)
pub struct SubscriptionRoot;

#[Subscription]
impl SubscriptionRoot {
    /// Placeholder subscription
    async fn placeholder(&self) -> impl Stream<Item = bool> {
        futures_util::stream::once(async { true })
    }
}

// GraphQL Types based on Rust model types

/// Model representation for GraphQL
#[derive(SimpleObject)]
pub struct Model {
    pub id: String,
    pub name: String,
    pub description: Option<String>,
    pub version: String,
    #[graphql(name = "createdAt")]
    pub created_at: String,
    #[graphql(name = "updatedAt")]
    pub updated_at: String,
    #[graphql(name = "createdBy")]
    pub created_by: String,
    pub config: JSON,
    pub entities: Vec<Entity>,
    pub relationships: Vec<Relationship>,
    pub flows: Vec<Flow>,
    pub layouts: Vec<Layout>,
    pub validations: Vec<Validation>,
}

/// Entity representation for GraphQL
#[derive(SimpleObject)]
pub struct Entity {
    pub id: UuidString,
    pub name: String,
    #[graphql(name = "displayName")]
    pub display_name: String,
    pub description: Option<String>,
    #[graphql(name = "entityType")]
    pub entity_type: EntityTypeEnum,
    pub fields: Vec<Field>,
    pub constraints: Vec<Constraint>,
    pub indexes: Vec<Index>,
    #[graphql(name = "uiConfig")]
    pub ui_config: JSON,
    pub behavior: JSON,
}

/// Field representation for GraphQL
#[derive(SimpleObject)]
pub struct Field {
    pub id: UuidString,
    pub name: String,
    #[graphql(name = "displayName")]
    pub display_name: String,
    #[graphql(name = "fieldType")]
    pub field_type: FieldTypeEnum,
    pub required: bool,
    #[graphql(name = "defaultValue")]
    pub default_value: Option<JSON>,
    pub validation: Vec<FieldValidationRule>,
    #[graphql(name = "uiConfig")]
    pub ui_config: JSON,
}

/// Relationship representation for GraphQL
#[derive(SimpleObject)]
pub struct Relationship {
    pub id: UuidString,
    pub name: String,
    #[graphql(name = "relationshipType")]
    pub relationship_type: RelationshipTypeEnum,
    #[graphql(name = "fromEntity")]
    pub from_entity: UuidString,
    #[graphql(name = "toEntity")]
    pub to_entity: UuidString,
    #[graphql(name = "fromField")]
    pub from_field: String,
    #[graphql(name = "toField")]
    pub to_field: String,
    pub cascade: CascadeActionEnum,
    #[graphql(name = "uiConfig")]
    pub ui_config: JSON,
}

/// Flow representation for GraphQL
#[derive(SimpleObject)]
pub struct Flow {
    pub id: UuidString,
    pub name: String,
    #[graphql(name = "flowType")]
    pub flow_type: FlowTypeEnum,
    pub trigger: JSON,
    pub steps: Vec<FlowStep>,
    #[graphql(name = "errorHandling")]
    pub error_handling: JSON,
}

/// Flow step representation for GraphQL
#[derive(SimpleObject)]
pub struct FlowStep {
    pub id: UuidString,
    pub name: String,
    #[graphql(name = "stepType")]
    pub step_type: FlowStepTypeEnum,
    pub condition: Option<String>,
    pub configuration: JSON,
}

/// Layout representation for GraphQL
#[derive(SimpleObject)]
pub struct Layout {
    pub id: UuidString,
    pub name: String,
    #[graphql(name = "layoutType")]
    pub layout_type: LayoutTypeEnum,
    #[graphql(name = "targetEntities")]
    pub target_entities: Vec<UuidString>,
    pub components: Vec<LayoutComponent>,
    pub responsive: JSON,
}

/// Layout component representation for GraphQL
#[derive(SimpleObject)]
pub struct LayoutComponent {
    pub id: UuidString,
    #[graphql(name = "componentType")]
    pub component_type: String,
    pub position: JSON,
    pub properties: JSON,
    pub styling: JSON,
}

/// Validation representation for GraphQL
#[derive(SimpleObject)]
pub struct Validation {
    pub id: UuidString,
    pub name: String,
    #[graphql(name = "validationType")]
    pub validation_type: ValidationTypeEnum,
    pub scope: JSON,
    pub rule: String,
    pub message: String,
    pub severity: ValidationSeverityEnum,
}

/// Constraint representation for GraphQL
#[derive(SimpleObject)]
pub struct Constraint {
    #[graphql(name = "constraintType")]
    pub constraint_type: ConstraintTypeEnum,
    pub name: String,
    pub fields: Vec<String>,
    pub message: Option<String>,
}

/// Index representation for GraphQL
#[derive(SimpleObject)]
pub struct Index {
    pub name: String,
    pub fields: Vec<String>,
    #[graphql(name = "indexType")]
    pub index_type: IndexTypeEnum,
    pub unique: bool,
}

/// Field validation rule for GraphQL
#[derive(SimpleObject)]
pub struct FieldValidationRule {
    #[graphql(name = "validationType")]
    pub validation_type: JSON,
    pub message: String,
    pub severity: ValidationSeverityEnum,
}

/// Validation result for GraphQL
#[derive(SimpleObject)]
pub struct ValidationResult {
    pub valid: bool,
    pub errors: Vec<ValidationMessage>,
    pub warnings: Vec<ValidationMessage>,
}

/// Validation message for GraphQL
#[derive(SimpleObject)]
pub struct ValidationMessage {
    pub message: String,
    pub field: Option<String>,
    pub code: String,
}

// GraphQL Enums

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum EntityTypeEnum {
    Data,
    Lookup,
    Audit,
    Temporary,
    View,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum FieldTypeEnum {
    String,
    Integer,
    Float,
    Boolean,
    DateTime,
    Date,
    Time,
    Json,
    Binary,
    Enum,
    Reference,
    Array,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum RelationshipTypeEnum {
    OneToOne,
    OneToMany,
    ManyToOne,
    ManyToMany,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum CascadeActionEnum {
    None,
    Delete,
    SetNull,
    Restrict,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum FlowTypeEnum {
    Validation,
    Automation,
    Approval,
    Notification,
    Custom,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum FlowStepTypeEnum {
    Validation,
    Transformation,
    Notification,
    Integration,
    Approval,
    Custom,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum LayoutTypeEnum {
    List,
    Grid,
    Dashboard,
    Form,
    Detail,
    Custom,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ValidationTypeEnum {
    EntityValidation,
    RelationshipValidation,
    BusinessRule,
    DataIntegrity,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ValidationSeverityEnum {
    Error,
    Warning,
    Info,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ConstraintTypeEnum {
    PrimaryKey,
    UniqueKey,
    ForeignKey,
    Check,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum IndexTypeEnum {
    BTree,
    Hash,
    Gin,
    Gist,
}

// Input types for mutations

#[derive(InputObject)]
pub struct CreateModelInput {
    pub name: String,
    pub description: Option<String>,
    pub config: Option<JSON>,
}

#[derive(InputObject)]
pub struct UpdateModelInput {
    pub name: Option<String>,
    pub description: Option<String>,
    pub config: Option<JSON>,
}

#[derive(InputObject)]
pub struct CreateEntityInput {
    #[graphql(name = "modelId")]
    pub model_id: UuidString,
    pub name: String,
    #[graphql(name = "displayName")]
    pub display_name: String,
    pub description: Option<String>,
    #[graphql(name = "entityType")]
    pub entity_type: EntityTypeEnum,
    pub fields: Vec<CreateFieldInput>,
    #[graphql(name = "uiConfig")]
    pub ui_config: Option<JSON>,
    pub behavior: Option<JSON>,
}

#[derive(InputObject)]
pub struct UpdateEntityInput {
    pub name: Option<String>,
    #[graphql(name = "displayName")]
    pub display_name: Option<String>,
    pub description: Option<String>,
    #[graphql(name = "entityType")]
    pub entity_type: Option<EntityTypeEnum>,
    #[graphql(name = "uiConfig")]
    pub ui_config: Option<JSON>,
    pub behavior: Option<JSON>,
}

#[derive(InputObject)]
pub struct CreateFieldInput {
    pub name: String,
    #[graphql(name = "displayName")]
    pub display_name: String,
    #[graphql(name = "fieldType")]
    pub field_type: FieldTypeEnum,
    pub required: bool,
    #[graphql(name = "defaultValue")]
    pub default_value: Option<JSON>,
    #[graphql(name = "uiConfig")]
    pub ui_config: Option<JSON>,
}

#[derive(InputObject)]
pub struct CreateRelationshipInput {
    #[graphql(name = "modelId")]
    pub model_id: UuidString,
    pub name: String,
    #[graphql(name = "relationshipType")]
    pub relationship_type: RelationshipTypeEnum,
    #[graphql(name = "fromEntity")]
    pub from_entity: UuidString,
    #[graphql(name = "toEntity")]
    pub to_entity: UuidString,
    #[graphql(name = "fromField")]
    pub from_field: String,
    #[graphql(name = "toField")]
    pub to_field: String,
    pub cascade: CascadeActionEnum,
    #[graphql(name = "uiConfig")]
    pub ui_config: Option<JSON>,
}

#[derive(InputObject)]
pub struct UpdateRelationshipInput {
    pub name: Option<String>,
    #[graphql(name = "relationshipType")]
    pub relationship_type: Option<RelationshipTypeEnum>,
    #[graphql(name = "fromField")]
    pub from_field: Option<String>,
    #[graphql(name = "toField")]
    pub to_field: Option<String>,
    pub cascade: Option<CascadeActionEnum>,
    #[graphql(name = "uiConfig")]
    pub ui_config: Option<JSON>,
}

#[derive(InputObject)]
pub struct CreateFlowInput {
    #[graphql(name = "modelId")]
    pub model_id: UuidString,
    pub name: String,
    #[graphql(name = "flowType")]
    pub flow_type: FlowTypeEnum,
    pub trigger: JSON,
    pub steps: Vec<CreateFlowStepInput>,
    #[graphql(name = "errorHandling")]
    pub error_handling: Option<JSON>,
}

#[derive(InputObject)]
pub struct UpdateFlowInput {
    pub name: Option<String>,
    #[graphql(name = "flowType")]
    pub flow_type: Option<FlowTypeEnum>,
    pub trigger: Option<JSON>,
    #[graphql(name = "errorHandling")]
    pub error_handling: Option<JSON>,
}

#[derive(InputObject)]
pub struct CreateFlowStepInput {
    pub name: String,
    #[graphql(name = "stepType")]
    pub step_type: FlowStepTypeEnum,
    pub condition: Option<String>,
    pub configuration: JSON,
}

#[derive(InputObject)]
pub struct CreateLayoutInput {
    #[graphql(name = "modelId")]
    pub model_id: UuidString,
    pub name: String,
    #[graphql(name = "layoutType")]
    pub layout_type: LayoutTypeEnum,
    #[graphql(name = "targetEntities")]
    pub target_entities: Vec<UuidString>,
    pub components: Vec<CreateLayoutComponentInput>,
    pub responsive: Option<JSON>,
}

#[derive(InputObject)]
pub struct UpdateLayoutInput {
    pub name: Option<String>,
    #[graphql(name = "layoutType")]
    pub layout_type: Option<LayoutTypeEnum>,
    #[graphql(name = "targetEntities")]
    pub target_entities: Option<Vec<UuidString>>,
    pub responsive: Option<JSON>,
}

#[derive(InputObject)]
pub struct CreateLayoutComponentInput {
    #[graphql(name = "componentType")]
    pub component_type: String,
    pub position: JSON,
    pub properties: JSON,
    pub styling: Option<JSON>,
}

// Event types for subscriptions

#[derive(SimpleObject)]
pub struct ModelEvent {
    pub event_type: ModelEventType,
    pub model_id: UuidString,
    pub data: Option<JSON>,
    pub timestamp: DateTimeString,
}

#[derive(SimpleObject)]
pub struct EntityEvent {
    pub event_type: EntityEventType,
    pub entity_id: UuidString,
    pub data: Option<JSON>,
    pub timestamp: DateTimeString,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ModelEventType {
    Created,
    Updated,
    Deleted,
    EntityAdded,
    EntityRemoved,
    RelationshipAdded,
    RelationshipRemoved,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum EntityEventType {
    Created,
    Updated,
    Deleted,
    FieldAdded,
    FieldRemoved,
    FieldUpdated,
}

// Helper functions for type conversion

impl From<TorqueModel> for Model {
    fn from(model: TorqueModel) -> Self {
        Self {
            id: model.id.to_string(),
            name: model.name,
            description: model.description,
            version: model.version,
            created_at: model.created_at.to_rfc3339(),
            updated_at: model.updated_at.to_rfc3339(),
            created_by: model.created_by,
            config: serde_json::to_value(model.config).unwrap_or_default(),
            entities: model.entities.into_iter().map(Entity::from).collect(),
            relationships: model.relationships.into_iter().map(Relationship::from).collect(),
            flows: model.flows.into_iter().map(Flow::from).collect(),
            layouts: model.layouts.into_iter().map(Layout::from).collect(),
            validations: model.validations.into_iter().map(Validation::from).collect(),
        }
    }
}

impl From<ModelEntity> for Entity {
    fn from(entity: ModelEntity) -> Self {
        Self {
            id: entity.id.to_string(),
            name: entity.name,
            display_name: entity.display_name,
            description: entity.description,
            entity_type: entity.entity_type.into(),
            fields: entity.fields.into_iter().map(Field::from).collect(),
            constraints: entity.constraints.into_iter().map(Constraint::from).collect(),
            indexes: entity.indexes.into_iter().map(Index::from).collect(),
            ui_config: serde_json::to_value(entity.ui_config).unwrap_or_default(),
            behavior: serde_json::to_value(entity.behavior).unwrap_or_default(),
        }
    }
}

impl From<EntityField> for Field {
    fn from(field: EntityField) -> Self {
        Self {
            id: field.id.to_string(),
            name: field.name,
            display_name: field.display_name,
            field_type: field.field_type.into(),
            required: field.required,
            default_value: field.default_value,
            validation: field.validation.into_iter().map(FieldValidationRule::from).collect(),
            ui_config: serde_json::to_value(field.ui_config).unwrap_or_default(),
        }
    }
}

impl From<ModelRelationship> for Relationship {
    fn from(rel: ModelRelationship) -> Self {
        Self {
            id: rel.id.to_string(),
            name: rel.name,
            relationship_type: rel.relationship_type.into(),
            from_entity: rel.from_entity.to_string(),
            to_entity: rel.to_entity.to_string(),
            from_field: rel.from_field,
            to_field: rel.to_field,
            cascade: rel.cascade.into(),
            ui_config: serde_json::to_value(rel.ui_config).unwrap_or_default(),
        }
    }
}

impl From<ModelFlow> for Flow {
    fn from(flow: ModelFlow) -> Self {
        Self {
            id: flow.id.to_string(),
            name: flow.name,
            flow_type: flow.flow_type.into(),
            trigger: serde_json::to_value(flow.trigger).unwrap_or_default(),
            steps: flow.steps.into_iter().map(FlowStep::from).collect(),
            error_handling: serde_json::to_value(flow.error_handling).unwrap_or_default(),
        }
    }
}

impl From<crate::model::types::FlowStep> for FlowStep {
    fn from(step: crate::model::types::FlowStep) -> Self {
        Self {
            id: step.id.to_string(),
            name: step.name,
            step_type: step.step_type.into(),
            condition: step.condition,
            configuration: serde_json::to_value(step.configuration).unwrap_or_default(),
        }
    }
}

impl From<ModelLayout> for Layout {
    fn from(layout: ModelLayout) -> Self {
        Self {
            id: layout.id.to_string(),
            name: layout.name,
            layout_type: layout.layout_type.into(),
            target_entities: layout.target_entities.into_iter().map(|id| id.to_string()).collect(),
            components: layout.components.into_iter().map(LayoutComponent::from).collect(),
            responsive: serde_json::to_value(layout.responsive).unwrap_or_default(),
        }
    }
}

impl From<crate::model::types::LayoutComponent> for LayoutComponent {
    fn from(comp: crate::model::types::LayoutComponent) -> Self {
        Self {
            id: comp.id.to_string(),
            component_type: comp.component_type,
            position: serde_json::to_value(comp.position).unwrap_or_default(),
            properties: serde_json::to_value(comp.properties).unwrap_or_default(),
            styling: serde_json::to_value(comp.styling).unwrap_or_default(),
        }
    }
}

impl From<ModelValidation> for Validation {
    fn from(val: ModelValidation) -> Self {
        Self {
            id: val.id.to_string(),
            name: val.name,
            validation_type: val.validation_type.into(),
            scope: serde_json::to_value(val.scope).unwrap_or_default(),
            rule: val.rule,
            message: val.message,
            severity: val.severity.into(),
        }
    }
}

impl From<EntityConstraint> for Constraint {
    fn from(constraint: EntityConstraint) -> Self {
        Self {
            constraint_type: constraint.constraint_type.into(),
            name: constraint.name,
            fields: constraint.fields,
            message: constraint.message,
        }
    }
}

impl From<EntityIndex> for Index {
    fn from(index: EntityIndex) -> Self {
        Self {
            name: index.name,
            fields: index.fields,
            index_type: index.index_type.into(),
            unique: index.unique,
        }
    }
}

impl From<FieldValidation> for FieldValidationRule {
    fn from(val: FieldValidation) -> Self {
        Self {
            validation_type: serde_json::to_value(val.validation_type).unwrap_or_default(),
            message: val.message,
            severity: val.severity.into(),
        }
    }
}

// Enum conversions
impl From<EntityType> for EntityTypeEnum {
    fn from(et: EntityType) -> Self {
        match et {
            EntityType::Data => EntityTypeEnum::Data,
            EntityType::Lookup => EntityTypeEnum::Lookup,
            EntityType::Audit => EntityTypeEnum::Audit,
            EntityType::Temporary => EntityTypeEnum::Temporary,
            EntityType::View => EntityTypeEnum::View,
        }
    }
}

impl From<FieldType> for FieldTypeEnum {
    fn from(ft: FieldType) -> Self {
        match ft {
            FieldType::String { .. } => FieldTypeEnum::String,
            FieldType::Integer { .. } => FieldTypeEnum::Integer,
            FieldType::Float { .. } => FieldTypeEnum::Float,
            FieldType::Boolean => FieldTypeEnum::Boolean,
            FieldType::DateTime => FieldTypeEnum::DateTime,
            FieldType::Date => FieldTypeEnum::Date,
            FieldType::Time => FieldTypeEnum::Time,
            FieldType::Json => FieldTypeEnum::Json,
            FieldType::Binary => FieldTypeEnum::Binary,
            FieldType::Enum { .. } => FieldTypeEnum::Enum,
            FieldType::Reference { .. } => FieldTypeEnum::Reference,
            FieldType::Array { .. } => FieldTypeEnum::Array,
        }
    }
}

impl From<RelationshipType> for RelationshipTypeEnum {
    fn from(rt: RelationshipType) -> Self {
        match rt {
            RelationshipType::OneToOne => RelationshipTypeEnum::OneToOne,
            RelationshipType::OneToMany => RelationshipTypeEnum::OneToMany,
            RelationshipType::ManyToOne => RelationshipTypeEnum::ManyToOne,
            RelationshipType::ManyToMany => RelationshipTypeEnum::ManyToMany,
        }
    }
}

impl From<CascadeAction> for CascadeActionEnum {
    fn from(ca: CascadeAction) -> Self {
        match ca {
            CascadeAction::None => CascadeActionEnum::None,
            CascadeAction::Delete => CascadeActionEnum::Delete,
            CascadeAction::SetNull => CascadeActionEnum::SetNull,
            CascadeAction::Restrict => CascadeActionEnum::Restrict,
        }
    }
}

impl From<crate::model::types::FlowType> for FlowTypeEnum {
    fn from(ft: crate::model::types::FlowType) -> Self {
        match ft {
            crate::model::types::FlowType::Validation => FlowTypeEnum::Validation,
            crate::model::types::FlowType::Automation => FlowTypeEnum::Automation,
            crate::model::types::FlowType::Approval => FlowTypeEnum::Approval,
            crate::model::types::FlowType::Notification => FlowTypeEnum::Notification,
            crate::model::types::FlowType::Custom => FlowTypeEnum::Custom,
        }
    }
}

impl From<crate::model::types::FlowStepType> for FlowStepTypeEnum {
    fn from(fst: crate::model::types::FlowStepType) -> Self {
        match fst {
            crate::model::types::FlowStepType::Validation => FlowStepTypeEnum::Validation,
            crate::model::types::FlowStepType::Transformation => FlowStepTypeEnum::Transformation,
            crate::model::types::FlowStepType::Notification => FlowStepTypeEnum::Notification,
            crate::model::types::FlowStepType::Integration => FlowStepTypeEnum::Integration,
            crate::model::types::FlowStepType::Approval => FlowStepTypeEnum::Approval,
            crate::model::types::FlowStepType::Custom(_) => FlowStepTypeEnum::Custom,
        }
    }
}

impl From<crate::model::types::LayoutType> for LayoutTypeEnum {
    fn from(lt: crate::model::types::LayoutType) -> Self {
        match lt {
            crate::model::types::LayoutType::List => LayoutTypeEnum::List,
            crate::model::types::LayoutType::Grid => LayoutTypeEnum::Grid,
            crate::model::types::LayoutType::Dashboard => LayoutTypeEnum::Dashboard,
            crate::model::types::LayoutType::Form => LayoutTypeEnum::Form,
            crate::model::types::LayoutType::Detail => LayoutTypeEnum::Detail,
            crate::model::types::LayoutType::Custom => LayoutTypeEnum::Custom,
        }
    }
}

impl From<ModelValidationType> for ValidationTypeEnum {
    fn from(mvt: ModelValidationType) -> Self {
        match mvt {
            ModelValidationType::EntityValidation => ValidationTypeEnum::EntityValidation,
            ModelValidationType::RelationshipValidation => ValidationTypeEnum::RelationshipValidation,
            ModelValidationType::BusinessRule => ValidationTypeEnum::BusinessRule,
            ModelValidationType::DataIntegrity => ValidationTypeEnum::DataIntegrity,
        }
    }
}

impl From<ValidationSeverity> for ValidationSeverityEnum {
    fn from(vs: ValidationSeverity) -> Self {
        match vs {
            ValidationSeverity::Error => ValidationSeverityEnum::Error,
            ValidationSeverity::Warning => ValidationSeverityEnum::Warning,
            ValidationSeverity::Info => ValidationSeverityEnum::Info,
        }
    }
}

impl From<ConstraintType> for ConstraintTypeEnum {
    fn from(ct: ConstraintType) -> Self {
        match ct {
            ConstraintType::PrimaryKey => ConstraintTypeEnum::PrimaryKey,
            ConstraintType::UniqueKey => ConstraintTypeEnum::UniqueKey,
            ConstraintType::ForeignKey { .. } => ConstraintTypeEnum::ForeignKey,
            ConstraintType::Check(_) => ConstraintTypeEnum::Check,
        }
    }
}

impl From<crate::model::types::IndexType> for IndexTypeEnum {
    fn from(it: crate::model::types::IndexType) -> Self {
        match it {
            crate::model::types::IndexType::BTree => IndexTypeEnum::BTree,
            crate::model::types::IndexType::Hash => IndexTypeEnum::Hash,
            crate::model::types::IndexType::Gin => IndexTypeEnum::Gin,
            crate::model::types::IndexType::Gist => IndexTypeEnum::Gist,
        }
    }
}

// Convert service ValidationResult to GraphQL ValidationResult
impl From<crate::services::model::ValidationResult> for ValidationResult {
    fn from(result: crate::services::model::ValidationResult) -> Self {
        Self {
            valid: result.valid,
            errors: result.errors.into_iter().map(|e| ValidationMessage {
                message: e.message,
                field: e.field,
                code: e.code,
            }).collect(),
            warnings: result.warnings.into_iter().map(|w| ValidationMessage {
                message: w.message,
                field: w.field,
                code: w.code,
            }).collect(),
        }
    }
}