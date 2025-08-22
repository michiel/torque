use async_graphql::{
    Context, Enum, InputObject, Object, Result, SimpleObject, Subscription,
};
use futures_util::Stream;
use serde_json::Value;
use crate::common::Uuid;

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

    /// Test method to debug GraphQL registration
    async fn test_method(&self, _ctx: &Context<'_>) -> Result<String> {
        Ok("Test method works".to_string())
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

    /// Get a specific layout by ID
    async fn layout(&self, ctx: &Context<'_>, id: String) -> Result<Option<Layout>> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        
        // Search through all models to find the layout
        let models = state.services.model_service.get_models().await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get models: {}", e)))?;
        
        for model in models {
            if let Some(layout) = model.layouts.iter().find(|l| l.id == uuid) {
                return Ok(Some(Layout::from(layout.clone())));
            }
        }
        Ok(None)
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
                    FieldTypeEnum::Reference => crate::model::types::FieldType::Reference { entity_id: Uuid::new_v4() },
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
            fields: None, // TODO: Add field support to standard GraphQL schema
            ui_config: input.ui_config.map(|config| serde_json::from_value(config).unwrap_or_default()),
            behavior: input.behavior.map(|behavior| serde_json::from_value(behavior).unwrap_or_default()),
        };
        
        // Update entity through model service
        let updated_entity = state.services.model_service.update_entity(entity_id, model_input).await?;
        
        // Convert model entity to GraphQL entity using existing From implementation
        Ok(Entity::from(updated_entity))
    }

    /// Delete an entity
    async fn delete_entity(&self, ctx: &Context<'_>, _id: String) -> Result<bool> {
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
    async fn update_relationship(&self, ctx: &Context<'_>, _id: String, _input: UpdateRelationshipInput) -> Result<Relationship> {
        let _state = ctx.data::<AppState>()?;
        // TODO: Implement relationship update
        Err(async_graphql::Error::new(format!("Relationship update is not yet implemented for ID: {}", _id)))
    }

    /// Delete a relationship
    async fn delete_relationship(&self, ctx: &Context<'_>, _id: String) -> Result<bool> {
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
    async fn update_flow(&self, ctx: &Context<'_>, _id: String, _input: UpdateFlowInput) -> Result<Flow> {
        let _state = ctx.data::<AppState>()?;
        // TODO: Implement flow update
        Err(async_graphql::Error::new(format!("Flow update is not yet implemented for ID: {}", _id)))
    }

    /// Delete a flow
    async fn delete_flow(&self, ctx: &Context<'_>, _id: String) -> Result<bool> {
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
                metadata: c.metadata.map(|m| serde_json::from_value(m).unwrap_or_default()),
            }).collect(),
            responsive: input.responsive.map(|r| serde_json::from_value(r).unwrap_or_default()),
        };
        
        let layout = state.services.model_service.create_layout(service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to create layout: {}", e)))?;
            
        Ok(Layout::from(layout))
    }

    /// Update an existing layout
    async fn update_layout(&self, ctx: &Context<'_>, id: String, input: UpdateLayoutInput) -> Result<Layout> {
        let state = ctx.data::<AppState>()?;
        let layout_id = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid layout ID format"))?;
        
        let service_input = crate::services::model::UpdateLayoutInput {
            name: input.name,
            layout_type: input.layout_type.map(|lt| match lt {
                LayoutTypeEnum::List => crate::model::types::LayoutType::List,
                LayoutTypeEnum::Grid => crate::model::types::LayoutType::Grid,
                LayoutTypeEnum::Dashboard => crate::model::types::LayoutType::Dashboard,
                LayoutTypeEnum::Form => crate::model::types::LayoutType::Form,
                LayoutTypeEnum::Detail => crate::model::types::LayoutType::Detail,
                LayoutTypeEnum::Custom => crate::model::types::LayoutType::Custom,
            }),
            target_entities: input.target_entities,
            components: input.components.map(|components| components.into_iter().map(|c| crate::services::model::CreateLayoutComponentInput {
                component_type: c.component_type,
                position: serde_json::from_value(c.position).unwrap_or_default(),
                properties: serde_json::from_value(c.properties).unwrap_or_default(),
                styling: c.styling.map(|s| serde_json::from_value(s).unwrap_or_default()),
                metadata: c.metadata.map(|m| serde_json::from_value(m).unwrap_or_default()),
            }).collect()),
            responsive: input.responsive.map(|r| serde_json::from_value(r).unwrap_or_default()),
        };
        
        let layout = state.services.model_service.update_layout(layout_id, service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to update layout: {}", e)))?;
            
        Ok(Layout::from(layout))
    }

    /// Delete a layout
    async fn delete_layout(&self, ctx: &Context<'_>, _id: String) -> Result<bool> {
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

    /// Load sample data for a model
    async fn load_sample_data(&self, ctx: &Context<'_>, model_id: String) -> Result<u64> {
        let state = ctx.data::<AppState>()?;
        let count = state.services.app_database_service.load_sample_data(&model_id).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to load sample data: {}", e)))?;
        Ok(count)
    }

    /// Get remediation strategies for a specific configuration error
    async fn get_remediation_strategies(&self, ctx: &Context<'_>, error_id: String, model_id: String) -> Result<Vec<RemediationStrategy>> {
        let state = ctx.data::<AppState>()?;
        let error_uuid = error_id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid error ID format"))?;
        let model_uuid = model_id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid model ID format"))?;
        
        let strategies = state.services.model_service.get_remediation_strategies(error_uuid, model_uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get remediation strategies: {}", e)))?;
        
        Ok(strategies.into_iter().map(RemediationStrategy::from).collect())
    }

    /// Execute auto-remediation for a configuration error
    async fn execute_auto_remediation(&self, ctx: &Context<'_>, input: ExecuteRemediationInput) -> Result<RemediationResult> {
        let state = ctx.data::<AppState>()?;
        let model_uuid = input.model_id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid model ID format"))?;
        let strategy_uuid = input.strategy_id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid strategy ID format"))?;
        
        // Convert GraphQL parameters to HashMap
        let parameters: std::collections::HashMap<String, serde_json::Value> = input.parameters
            .into_iter()
            .map(|p| (p.name, p.value))
            .collect();
        
        let result = state.services.model_service.execute_auto_remediation(model_uuid, strategy_uuid, parameters).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to execute auto-remediation: {}", e)))?;
        
        Ok(RemediationResult::from(result))
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
    pub description: Option<String>,
    #[graphql(name = "layoutType")]
    pub layout_type: LayoutTypeEnum,
    #[graphql(name = "targetEntities")]
    pub target_entities: Vec<UuidString>,
    pub components: Vec<LayoutComponent>,
    pub responsive: JSON,
    #[graphql(name = "createdAt")]
    pub created_at: String,
    #[graphql(name = "updatedAt")]
    pub updated_at: String,
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
    pub metadata: Option<JSON>,
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

/// Configuration error report for GraphQL
#[derive(SimpleObject)]
pub struct ConfigurationReport {
    #[graphql(name = "modelId")]
    pub model_id: UuidString,
    #[graphql(name = "modelName")]
    pub model_name: String,
    #[graphql(name = "generatedAt")]
    pub generated_at: DateTimeString,
    #[graphql(name = "totalErrors")]
    pub total_errors: i32,
    #[graphql(name = "errorsBySeverity")]
    pub errors_by_severity: ErrorSeverityCount,
    pub errors: Vec<ConfigurationErrorDetail>,
    pub suggestions: Vec<ErrorSuggestion>,
}

/// Error severity count for GraphQL
#[derive(SimpleObject)]
pub struct ErrorSeverityCount {
    pub critical: i32,
    pub high: i32,
    pub medium: i32,
    pub low: i32,
}

/// Configuration error detail for GraphQL
#[derive(SimpleObject)]
pub struct ConfigurationErrorDetail {
    pub id: UuidString,
    pub error: JSON,
    pub severity: ConfigErrorSeverityEnum,
    pub category: ConfigErrorCategoryEnum,
    pub title: String,
    pub description: String,
    pub impact: JSON,
    pub location: ErrorLocation,
    #[graphql(name = "suggestedFixes")]
    pub suggested_fixes: Vec<String>,
    #[graphql(name = "autoFixable")]
    pub auto_fixable: bool,
}

/// Error location for GraphQL
#[derive(SimpleObject)]
pub struct ErrorLocation {
    #[graphql(name = "componentType")]
    pub component_type: String,
    #[graphql(name = "componentId")]
    pub component_id: UuidString,
    #[graphql(name = "componentName")]
    pub component_name: String,
    pub path: Vec<String>,
    #[graphql(name = "fileReference")]
    pub file_reference: Option<String>,
}

/// Error suggestion for GraphQL
#[derive(SimpleObject)]
pub struct ErrorSuggestion {
    pub title: String,
    pub description: String,
    #[graphql(name = "actionType")]
    pub action_type: SuggestionActionTypeEnum,
    #[graphql(name = "affectedErrors")]
    pub affected_errors: Vec<UuidString>,
    #[graphql(name = "estimatedEffort")]
    pub estimated_effort: EstimatedEffortEnum,
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

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ConfigErrorSeverityEnum {
    Critical,
    High,
    Medium,
    Low,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ConfigErrorCategoryEnum {
    DataModel,
    UserInterface,
    BusinessLogic,
    Integration,
    Performance,
    Security,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum SuggestionActionTypeEnum {
    CreateMissingEntity,
    UpdateEntitySchema,
    FixLayoutConfiguration,
    RemoveInvalidReferences,
    UpdateValidationRules,
    RefactorRelationships,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum EstimatedEffortEnum {
    Low,
    Medium,
    High,
    Complex,
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
    pub components: Option<Vec<CreateLayoutComponentInput>>,
    pub responsive: Option<JSON>,
}

#[derive(InputObject)]
pub struct CreateLayoutComponentInput {
    #[graphql(name = "componentType")]
    pub component_type: String,
    pub position: JSON,
    pub properties: JSON,
    pub styling: Option<JSON>,
    pub metadata: Option<JSON>,
}

// Remediation types

#[derive(SimpleObject)]
pub struct RemediationStrategy {
    pub id: UuidString,
    #[graphql(name = "errorType")]
    pub error_type: String,
    #[graphql(name = "strategyType")]
    pub strategy_type: String,
    pub title: String,
    pub description: String,
    pub parameters: Vec<RemediationParameter>,
    #[graphql(name = "estimatedEffort")]
    pub estimated_effort: EstimatedEffortEnum,
    #[graphql(name = "riskLevel")]
    pub risk_level: RiskLevelEnum,
    pub prerequisites: Vec<String>,
}

#[derive(SimpleObject)]
pub struct RemediationParameter {
    pub name: String,
    pub description: String,
    #[graphql(name = "parameterType")]
    pub parameter_type: String,
    pub required: bool,
    #[graphql(name = "defaultValue")]
    pub default_value: Option<JSON>,
    pub validation: Option<String>,
}

#[derive(SimpleObject)]
pub struct RemediationResult {
    #[graphql(name = "strategyId")]
    pub strategy_id: UuidString,
    pub success: bool,
    #[graphql(name = "changesApplied")]
    pub changes_applied: Vec<ModelChange>,
    pub errors: Vec<String>,
    pub warnings: Vec<String>,
}

#[derive(SimpleObject)]
pub struct ModelChange {
    #[graphql(name = "changeType")]
    pub change_type: ModelChangeTypeEnum,
    #[graphql(name = "componentType")]
    pub component_type: String,
    #[graphql(name = "componentId")]
    pub component_id: UuidString,
    pub description: String,
    pub details: JSON,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum RiskLevelEnum {
    Low,
    Medium,
    High,
}

#[derive(Enum, Copy, Clone, Eq, PartialEq)]
pub enum ModelChangeTypeEnum {
    EntityCreated,
    EntityUpdated,
    FieldAdded,
    FieldUpdated,
    LayoutUpdated,
    ComponentUpdated,
    RelationshipUpdated,
    RelationshipRemoved,
    ReferenceRemoved,
}

#[derive(InputObject)]
pub struct ExecuteRemediationInput {
    #[graphql(name = "modelId")]
    pub model_id: UuidString,
    #[graphql(name = "strategyId")]
    pub strategy_id: UuidString,
    pub parameters: Vec<RemediationParameterInput>,
}

#[derive(InputObject)]
pub struct RemediationParameterInput {
    pub name: String,
    pub value: JSON,
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
            created_at: model.created_at.to_iso8601(),
            updated_at: model.updated_at.to_iso8601(),
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
            description: layout.description,
            layout_type: layout.layout_type.into(),
            target_entities: layout.target_entities.into_iter().map(|id| id.to_string()).collect(),
            components: layout.components.into_iter().map(LayoutComponent::from).collect(),
            responsive: serde_json::to_value(layout.responsive).unwrap_or_default(),
            created_at: layout.created_at.to_iso8601(),
            updated_at: layout.updated_at.to_iso8601(),
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
            metadata: comp.metadata.map(|m| serde_json::to_value(m).unwrap_or_default()),
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

// Convert ConfigurationErrorReport to GraphQL ConfigurationReport
impl From<crate::model::validation::ConfigurationErrorReport> for ConfigurationReport {
    fn from(report: crate::model::validation::ConfigurationErrorReport) -> Self {
        Self {
            model_id: report.model_id.to_string(),
            model_name: report.model_name,
            generated_at: report.generated_at.to_iso8601(),
            total_errors: report.total_errors as i32,
            errors_by_severity: ErrorSeverityCount::from(report.errors_by_severity),
            errors: report.errors.into_iter().map(ConfigurationErrorDetail::from).collect(),
            suggestions: report.suggestions.into_iter().map(ErrorSuggestion::from).collect(),
        }
    }
}

impl From<crate::model::validation::ErrorSeverityCount> for ErrorSeverityCount {
    fn from(count: crate::model::validation::ErrorSeverityCount) -> Self {
        Self {
            critical: count.critical as i32,
            high: count.high as i32,
            medium: count.medium as i32,
            low: count.low as i32,
        }
    }
}

impl From<crate::model::validation::ConfigurationErrorDetails> for ConfigurationErrorDetail {
    fn from(details: crate::model::validation::ConfigurationErrorDetails) -> Self {
        Self {
            id: details.id.to_string(),
            error: serde_json::to_value(details.error).unwrap_or_default(),
            severity: details.severity.into(),
            category: details.category.into(),
            title: details.title,
            description: details.description,
            impact: serde_json::to_value(details.impact).unwrap_or_default(),
            location: ErrorLocation::from(details.location),
            suggested_fixes: details.suggested_fixes,
            auto_fixable: details.auto_fixable,
        }
    }
}

impl From<crate::model::validation::ErrorLocation> for ErrorLocation {
    fn from(location: crate::model::validation::ErrorLocation) -> Self {
        Self {
            component_type: location.component_type,
            component_id: location.component_id.to_string(),
            component_name: location.component_name,
            path: location.path,
            file_reference: location.file_reference,
        }
    }
}

impl From<crate::model::validation::ErrorSuggestion> for ErrorSuggestion {
    fn from(suggestion: crate::model::validation::ErrorSuggestion) -> Self {
        Self {
            title: suggestion.title,
            description: suggestion.description,
            action_type: suggestion.action_type.into(),
            affected_errors: suggestion.affected_errors.into_iter().map(|id| id.to_string()).collect(),
            estimated_effort: suggestion.estimated_effort.into(),
        }
    }
}

// Enum conversions for configuration error types
impl From<crate::model::validation::ErrorSeverity> for ConfigErrorSeverityEnum {
    fn from(severity: crate::model::validation::ErrorSeverity) -> Self {
        match severity {
            crate::model::validation::ErrorSeverity::Critical => ConfigErrorSeverityEnum::Critical,
            crate::model::validation::ErrorSeverity::High => ConfigErrorSeverityEnum::High,
            crate::model::validation::ErrorSeverity::Medium => ConfigErrorSeverityEnum::Medium,
            crate::model::validation::ErrorSeverity::Low => ConfigErrorSeverityEnum::Low,
        }
    }
}

impl From<crate::model::validation::ErrorCategory> for ConfigErrorCategoryEnum {
    fn from(category: crate::model::validation::ErrorCategory) -> Self {
        match category {
            crate::model::validation::ErrorCategory::DataModel => ConfigErrorCategoryEnum::DataModel,
            crate::model::validation::ErrorCategory::UserInterface => ConfigErrorCategoryEnum::UserInterface,
            crate::model::validation::ErrorCategory::BusinessLogic => ConfigErrorCategoryEnum::BusinessLogic,
            crate::model::validation::ErrorCategory::Integration => ConfigErrorCategoryEnum::Integration,
            crate::model::validation::ErrorCategory::Performance => ConfigErrorCategoryEnum::Performance,
            crate::model::validation::ErrorCategory::Security => ConfigErrorCategoryEnum::Security,
        }
    }
}

impl From<crate::model::validation::SuggestionActionType> for SuggestionActionTypeEnum {
    fn from(action_type: crate::model::validation::SuggestionActionType) -> Self {
        match action_type {
            crate::model::validation::SuggestionActionType::CreateMissingEntity => SuggestionActionTypeEnum::CreateMissingEntity,
            crate::model::validation::SuggestionActionType::UpdateEntitySchema => SuggestionActionTypeEnum::UpdateEntitySchema,
            crate::model::validation::SuggestionActionType::FixLayoutConfiguration => SuggestionActionTypeEnum::FixLayoutConfiguration,
            crate::model::validation::SuggestionActionType::RemoveInvalidReferences => SuggestionActionTypeEnum::RemoveInvalidReferences,
            crate::model::validation::SuggestionActionType::UpdateValidationRules => SuggestionActionTypeEnum::UpdateValidationRules,
            crate::model::validation::SuggestionActionType::RefactorRelationships => SuggestionActionTypeEnum::RefactorRelationships,
        }
    }
}

impl From<crate::model::validation::EstimatedEffort> for EstimatedEffortEnum {
    fn from(effort: crate::model::validation::EstimatedEffort) -> Self {
        match effort {
            crate::model::validation::EstimatedEffort::Low => EstimatedEffortEnum::Low,
            crate::model::validation::EstimatedEffort::Medium => EstimatedEffortEnum::Medium,
            crate::model::validation::EstimatedEffort::High => EstimatedEffortEnum::High,
            crate::model::validation::EstimatedEffort::Complex => EstimatedEffortEnum::Complex,
        }
    }
}

// Remediation type conversions

impl From<crate::model::remediation::RemediationStrategy> for RemediationStrategy {
    fn from(strategy: crate::model::remediation::RemediationStrategy) -> Self {
        Self {
            id: strategy.id.to_string(),
            error_type: strategy.error_type,
            strategy_type: format!("{:?}", strategy.strategy_type),
            title: strategy.title,
            description: strategy.description,
            parameters: strategy.parameters.into_iter().map(RemediationParameter::from).collect(),
            estimated_effort: strategy.estimated_effort.into(),
            risk_level: strategy.risk_level.into(),
            prerequisites: strategy.prerequisites,
        }
    }
}

impl From<crate::model::remediation::RemediationParameter> for RemediationParameter {
    fn from(param: crate::model::remediation::RemediationParameter) -> Self {
        Self {
            name: param.name,
            description: param.description,
            parameter_type: format!("{:?}", param.parameter_type),
            required: param.required,
            default_value: param.default_value,
            validation: param.validation,
        }
    }
}

impl From<crate::model::remediation::RemediationResult> for RemediationResult {
    fn from(result: crate::model::remediation::RemediationResult) -> Self {
        Self {
            strategy_id: result.strategy_id.to_string(),
            success: result.success,
            changes_applied: result.changes_applied.into_iter().map(ModelChange::from).collect(),
            errors: result.errors,
            warnings: result.warnings,
        }
    }
}

impl From<crate::model::remediation::ModelChange> for ModelChange {
    fn from(change: crate::model::remediation::ModelChange) -> Self {
        Self {
            change_type: change.change_type.into(),
            component_type: change.component_type,
            component_id: change.component_id.to_string(),
            description: change.description,
            details: change.details,
        }
    }
}

impl From<crate::model::remediation::RiskLevel> for RiskLevelEnum {
    fn from(risk: crate::model::remediation::RiskLevel) -> Self {
        match risk {
            crate::model::remediation::RiskLevel::Low => RiskLevelEnum::Low,
            crate::model::remediation::RiskLevel::Medium => RiskLevelEnum::Medium,
            crate::model::remediation::RiskLevel::High => RiskLevelEnum::High,
        }
    }
}

impl From<crate::model::remediation::ModelChangeType> for ModelChangeTypeEnum {
    fn from(change_type: crate::model::remediation::ModelChangeType) -> Self {
        match change_type {
            crate::model::remediation::ModelChangeType::EntityCreated => ModelChangeTypeEnum::EntityCreated,
            crate::model::remediation::ModelChangeType::EntityUpdated => ModelChangeTypeEnum::EntityUpdated,
            crate::model::remediation::ModelChangeType::FieldAdded => ModelChangeTypeEnum::FieldAdded,
            crate::model::remediation::ModelChangeType::FieldUpdated => ModelChangeTypeEnum::FieldUpdated,
            crate::model::remediation::ModelChangeType::LayoutUpdated => ModelChangeTypeEnum::LayoutUpdated,
            crate::model::remediation::ModelChangeType::ComponentUpdated => ModelChangeTypeEnum::ComponentUpdated,
            crate::model::remediation::ModelChangeType::RelationshipUpdated => ModelChangeTypeEnum::RelationshipUpdated,
            crate::model::remediation::ModelChangeType::RelationshipRemoved => ModelChangeTypeEnum::RelationshipRemoved,
            crate::model::remediation::ModelChangeType::ReferenceRemoved => ModelChangeTypeEnum::ReferenceRemoved,
        }
    }
}