use async_graphql::{Context, Object, Result, SimpleObject, InputObject};
use crate::common::Uuid;
use crate::model::types as model;
use crate::server::AppState;

/// Parse field type from string representation
fn parse_field_type(field_type_str: &str) -> model::FieldType {
    match field_type_str {
        "String" => model::FieldType::String { max_length: None },
        "Integer" => model::FieldType::Integer { min: None, max: None },
        "Float" => model::FieldType::Float { min: None, max: None },
        "Boolean" => model::FieldType::Boolean,
        "DateTime" => model::FieldType::DateTime,
        "Date" => model::FieldType::Date,
        "Time" => model::FieldType::Time,
        "Json" => model::FieldType::Json,
        "Binary" => model::FieldType::Binary,
        _ if field_type_str.starts_with("String(") => {
            // Parse String(100) format
            let len_str = field_type_str.trim_start_matches("String(").trim_end_matches(")");
            let max_length = len_str.parse::<usize>().ok();
            model::FieldType::String { max_length }
        },
        _ if field_type_str.starts_with("Reference(") => {
            // Parse Reference(entity_id) format
            let entity_str = field_type_str.trim_start_matches("Reference(").trim_end_matches(")");
            if let Ok(entity_id) = entity_str.parse::<Uuid>() {
                model::FieldType::Reference { entity_id }
            } else {
                model::FieldType::String { max_length: None }
            }
        },
        _ => model::FieldType::String { max_length: None },
    }
}

/// Optimized GraphQL wrappers that minimize conversions
/// Key optimizations:
/// 1. Avoid string conversions where possible
/// 2. Use direct field access instead of cloning
/// 3. Return JSON values directly for complex nested structures

pub struct ModelWrapper {
    pub inner: model::TorqueModel,
}

#[Object]
impl ModelWrapper {
    async fn id(&self) -> String {
        self.inner.id.to_string()
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn description(&self) -> Option<&str> {
        self.inner.description.as_deref()
    }

    async fn version(&self) -> &str {
        &self.inner.version
    }

    async fn created_at(&self) -> String {
        self.inner.created_at.to_iso8601()
    }

    async fn updated_at(&self) -> String {
        self.inner.updated_at.to_iso8601()
    }

    async fn created_by(&self) -> &str {
        &self.inner.created_by
    }

    async fn config(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.config).unwrap_or_default()
    }

    async fn entities(&self) -> Vec<EntityWrapper> {
        self.inner.entities.iter()
            .map(|e| EntityWrapper { inner: e.clone() })
            .collect()
    }

    async fn relationships(&self) -> Vec<RelationshipWrapper> {
        self.inner.relationships.iter()
            .map(|r| RelationshipWrapper { inner: r.clone() })
            .collect()
    }

    async fn flows(&self) -> Vec<FlowWrapper> {
        self.inner.flows.iter()
            .map(|f| FlowWrapper { inner: f.clone() })
            .collect()
    }

    async fn layouts(&self) -> Vec<LayoutWrapper> {
        self.inner.layouts.iter()
            .map(|l| LayoutWrapper { inner: l.clone() })
            .collect()
    }

    async fn validations(&self) -> Vec<ValidationWrapper> {
        self.inner.validations.iter()
            .map(|v| ValidationWrapper { inner: v.clone() })
            .collect()
    }
}

pub struct EntityWrapper {
    pub inner: model::ModelEntity,
}

#[Object]
impl EntityWrapper {
    async fn id(&self) -> String {
        self.inner.id.to_string()
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn display_name(&self) -> &str {
        &self.inner.display_name
    }

    async fn description(&self) -> Option<&str> {
        self.inner.description.as_deref()
    }

    async fn entity_type(&self) -> String {
        format!("{:?}", self.inner.entity_type)
    }

    async fn fields(&self) -> Vec<FieldWrapper> {
        self.inner.fields.iter()
            .map(|f| FieldWrapper { inner: f.clone() })
            .collect()
    }

    async fn constraints(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.constraints).unwrap_or_default()
    }

    async fn indexes(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.indexes).unwrap_or_default()
    }

    async fn ui_config(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.ui_config).unwrap_or_default()
    }

    async fn behavior(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.behavior).unwrap_or_default()
    }
}

pub struct FieldWrapper {
    pub inner: model::EntityField,
}

#[Object]
impl FieldWrapper {
    async fn id(&self) -> String {
        self.inner.id.to_string()
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn display_name(&self) -> &str {
        &self.inner.display_name
    }

    async fn field_type(&self) -> String {
        match &self.inner.field_type {
            model::FieldType::String { max_length } => {
                if let Some(len) = max_length {
                    format!("String({})", len)
                } else {
                    "String".to_string()
                }
            }
            model::FieldType::Integer { .. } => "Integer".to_string(),
            model::FieldType::Float { .. } => "Float".to_string(),
            model::FieldType::Boolean => "Boolean".to_string(),
            model::FieldType::DateTime => "DateTime".to_string(),
            model::FieldType::Date => "Date".to_string(),
            model::FieldType::Time => "Time".to_string(),
            model::FieldType::Json => "Json".to_string(),
            model::FieldType::Binary => "Binary".to_string(),
            model::FieldType::Enum { values } => format!("Enum[{}]", values.join(",")),
            model::FieldType::Reference { entity_id } => format!("Reference({})", entity_id),
            model::FieldType::Array { .. } => "Array".to_string(),
        }
    }

    async fn required(&self) -> bool {
        self.inner.required
    }

    async fn default_value(&self) -> Option<&serde_json::Value> {
        self.inner.default_value.as_ref()
    }

    async fn validation(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.validation).unwrap_or_default()
    }

    async fn ui_config(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.ui_config).unwrap_or_default()
    }
}

pub struct RelationshipWrapper {
    pub inner: model::ModelRelationship,
}

#[Object]
impl RelationshipWrapper {
    async fn id(&self) -> String {
        self.inner.id.to_string()
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn relationship_type(&self) -> String {
        format!("{:?}", self.inner.relationship_type)
    }

    async fn from_entity(&self) -> String {
        self.inner.from_entity.to_string()
    }

    async fn to_entity(&self) -> String {
        self.inner.to_entity.to_string()
    }

    async fn from_field(&self) -> &str {
        &self.inner.from_field
    }

    async fn to_field(&self) -> &str {
        &self.inner.to_field
    }

    async fn cascade(&self) -> String {
        format!("{:?}", self.inner.cascade)
    }

    async fn ui_config(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.ui_config).unwrap_or_default()
    }
}

pub struct FlowStepWrapper {
    pub inner: model::FlowStep,
}

#[Object]
impl FlowStepWrapper {
    async fn id(&self) -> String {
        self.inner.id.to_string()
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn step_type(&self) -> String {
        format!("{:?}", self.inner.step_type)
    }

    async fn condition(&self) -> Option<&str> {
        self.inner.condition.as_deref()
    }

    async fn configuration(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.configuration).unwrap_or_default()
    }
}

pub struct FlowWrapper {
    pub inner: model::ModelFlow,
}

#[Object]
impl FlowWrapper {
    async fn id(&self) -> String {
        self.inner.id.to_string()
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn flow_type(&self) -> String {
        format!("{:?}", self.inner.flow_type)
    }

    async fn trigger(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.trigger).unwrap_or_default()
    }

    async fn steps(&self) -> Vec<FlowStepWrapper> {
        self.inner.steps.iter()
            .map(|s| FlowStepWrapper { inner: s.clone() })
            .collect()
    }

    async fn error_handling(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.error_handling).unwrap_or_default()
    }
}

pub struct LayoutComponentWrapper {
    pub inner: model::LayoutComponent,
}

#[Object]
impl LayoutComponentWrapper {
    async fn id(&self) -> String {
        self.inner.id.to_string()
    }

    async fn component_type(&self) -> &str {
        &self.inner.component_type
    }

    async fn position(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.position).unwrap_or_default()
    }

    async fn properties(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.properties).unwrap_or_default()
    }

    async fn styling(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.styling).unwrap_or_default()
    }
}

pub struct LayoutWrapper {
    pub inner: model::ModelLayout,
}

#[Object]
impl LayoutWrapper {
    async fn id(&self) -> String {
        self.inner.id.to_string()
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn layout_type(&self) -> String {
        format!("{:?}", self.inner.layout_type)
    }

    async fn target_entities(&self) -> Vec<String> {
        self.inner.target_entities.iter()
            .map(|id| id.to_string())
            .collect()
    }

    async fn components(&self) -> Vec<LayoutComponentWrapper> {
        self.inner.components.iter()
            .map(|c| LayoutComponentWrapper { inner: c.clone() })
            .collect()
    }

    async fn responsive(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.responsive).unwrap_or_default()
    }
}

pub struct ValidationWrapper {
    pub inner: model::ModelValidation,
}

#[Object]
impl ValidationWrapper {
    async fn id(&self) -> String {
        self.inner.id.to_string()
    }

    async fn name(&self) -> &str {
        &self.inner.name
    }

    async fn validation_type(&self) -> String {
        format!("{:?}", self.inner.validation_type)
    }

    async fn scope(&self) -> String {
        format!("{:?}", self.inner.scope)
    }

    async fn rule(&self) -> serde_json::Value {
        serde_json::to_value(&self.inner.rule).unwrap_or_default()
    }

    async fn message(&self) -> &str {
        &self.inner.message
    }

    async fn severity(&self) -> String {
        format!("{:?}", self.inner.severity)
    }
}

/// Optimized query root
pub struct OptimizedQuery;

#[Object]
impl OptimizedQuery {
    /// Get all models with minimal conversions
    async fn models(&self, ctx: &Context<'_>) -> Result<Vec<ModelWrapper>> {
        let state = ctx.data::<AppState>()?;
        let models = state.services.model_service.get_models().await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get models: {}", e)))?;
        
        Ok(models.into_iter().map(|m| ModelWrapper { inner: m }).collect())
    }

    /// Get a specific model by ID
    async fn model(&self, ctx: &Context<'_>, id: String) -> Result<Option<ModelWrapper>> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let model = state.services.model_service.get_model(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get model: {}", e)))?;
        Ok(model.map(|m| ModelWrapper { inner: m }))
    }

    /// Get entities for a specific model with optimized loading
    async fn entities(&self, ctx: &Context<'_>, model_id: String) -> Result<Vec<EntityWrapper>> {
        let state = ctx.data::<AppState>()?;
        let uuid = model_id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let entities = state.services.model_service.get_entities(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get entities: {}", e)))?;
        Ok(entities.into_iter().map(|e| EntityWrapper { inner: e }).collect())
    }

    /// Search models with optimized query
    async fn search_models(&self, ctx: &Context<'_>, query: String) -> Result<Vec<ModelWrapper>> {
        let state = ctx.data::<AppState>()?;
        let models = state.services.model_service.search_models(query).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to search models: {}", e)))?;
        Ok(models.into_iter().map(|m| ModelWrapper { inner: m }).collect())
    }

    /// Get model statistics
    async fn model_stats(&self, ctx: &Context<'_>, id: String) -> Result<ModelStats> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let model = state.services.model_service.get_model(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to get model: {}", e)))?
            .ok_or_else(|| async_graphql::Error::new("Model not found"))?;
        
        Ok(ModelStats {
            entity_count: model.entities.len() as i32,
            relationship_count: model.relationships.len() as i32,
            flow_count: model.flows.len() as i32,
            layout_count: model.layouts.len() as i32,
            validation_count: model.validations.len() as i32,
        })
    }
}

/// Optimized mutation root
pub struct OptimizedMutation;

#[Object]
impl OptimizedMutation {
    /// Create a new model
    async fn create_model(
        &self, 
        ctx: &Context<'_>, 
        input: CreateModelInput
    ) -> Result<ModelWrapper> {
        let state = ctx.data::<AppState>()?;
        let service_input = crate::services::model::CreateModelInput {
            name: input.name,
            description: input.description,
            config: None,
        };
        let model = state.services.model_service.create_model(service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to create model: {}", e)))?;
        Ok(ModelWrapper { inner: model })
    }

    /// Update an existing model
    async fn update_model(
        &self, 
        ctx: &Context<'_>, 
        id: String, 
        input: UpdateModelInput
    ) -> Result<ModelWrapper> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let service_input = crate::services::model::UpdateModelInput {
            name: input.name,
            description: input.description,
            config: None,
        };
        let model = state.services.model_service.update_model(uuid, service_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to update model: {}", e)))?;
        Ok(ModelWrapper { inner: model })
    }

    /// Delete a model
    async fn delete_model(&self, ctx: &Context<'_>, id: String) -> Result<bool> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let result = state.services.model_service.delete_model(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to delete model: {}", e)))?;
        Ok(result)
    }

    /// Import a model from JSON
    async fn import_model(&self, ctx: &Context<'_>, data: serde_json::Value) -> Result<ModelWrapper> {
        let state = ctx.data::<AppState>()?;
        let data_string = serde_json::to_string(&data)
            .map_err(|e| async_graphql::Error::new(format!("Failed to serialize data: {}", e)))?;
        let model = state.services.model_service.import_model(data_string).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to import model: {}", e)))?;
        Ok(ModelWrapper { inner: model })
    }

    /// Create a new entity
    async fn create_entity(
        &self,
        ctx: &Context<'_>,
        input: CreateEntityInput
    ) -> Result<EntityWrapper> {
        let state = ctx.data::<AppState>()?;
        let entity_input = crate::services::model::CreateEntityInput {
            model_id: input.model_id,
            name: input.name,
            display_name: input.display_name,
            description: input.description,
            entity_type: model::EntityType::Data, // Always use Data type
            fields: vec![],
            ui_config: None,
            behavior: None,
        };
        
        let entity = state.services.model_service.create_entity(entity_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to create entity: {}", e)))?;
        Ok(EntityWrapper { inner: entity })
    }

    /// Update an existing entity
    async fn update_entity(
        &self,
        ctx: &Context<'_>,
        id: String,
        input: UpdateEntityInput
    ) -> Result<EntityWrapper> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        
        // Convert fields if provided
        let fields = if let Some(input_fields) = input.fields {
            Some(input_fields.into_iter().map(|f| {
                use crate::model::types::EntityField;
                
                EntityField {
                    id: f.id.and_then(|id| id.parse::<Uuid>().ok()).unwrap_or_else(Uuid::new_v4),
                    name: f.name,
                    display_name: f.display_name,
                    field_type: parse_field_type(&f.field_type),
                    required: f.required,
                    default_value: f.default_value,
                    validation: f.validation.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default(),
                    ui_config: f.ui_config.and_then(|v| serde_json::from_value(v).ok()).unwrap_or_default(),
                }
            }).collect())
        } else {
            None
        };
        
        let entity_input = crate::services::model::UpdateEntityInput {
            name: input.name,
            display_name: input.display_name,
            description: input.description,
            entity_type: None,
            fields,
            ui_config: None,
            behavior: None,
        };
        
        let entity = state.services.model_service.update_entity(uuid, entity_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to update entity: {}", e)))?;
        Ok(EntityWrapper { inner: entity })
    }

    /// Delete an entity
    async fn delete_entity(&self, ctx: &Context<'_>, id: String) -> Result<bool> {
        let state = ctx.data::<AppState>()?;
        let uuid = id.parse::<Uuid>()
            .map_err(|_| async_graphql::Error::new("Invalid UUID format"))?;
        let result = state.services.model_service.delete_entity(uuid).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to delete entity: {}", e)))?;
        Ok(result)
    }

    /// Batch operations for performance
    async fn batch_create_entities(
        &self,
        ctx: &Context<'_>,
        model_id: String,
        entities: Vec<CreateEntityInput>
    ) -> Result<BatchResult> {
        let state = ctx.data::<AppState>()?;
        
        let mut created = 0;
        let mut errors = Vec::new();
        
        for (index, input) in entities.into_iter().enumerate() {
            match self.create_entity_internal(&state, model_id.clone(), input).await {
                Ok(_) => created += 1,
                Err(e) => errors.push(BatchError {
                    index: index as i32,
                    message: e.message,
                }),
            }
        }
        
        Ok(BatchResult { 
            success_count: created,
            error_count: errors.len() as i32,
            errors,
        })
    }
}

impl OptimizedMutation {
    /// Internal helper for entity creation
    async fn create_entity_internal(
        &self,
        state: &AppState,
        model_id: String,
        input: CreateEntityInput
    ) -> Result<()> {
        let entity_input = crate::services::model::CreateEntityInput {
            model_id: model_id,
            name: input.name,
            display_name: input.display_name,
            description: input.description,
            entity_type: model::EntityType::Data, // Always use Data type
            fields: vec![],
            ui_config: None,
            behavior: None,
        };
        
        state.services.model_service.create_entity(entity_input).await
            .map_err(|e| async_graphql::Error::new(format!("Failed to create entity: {}", e)))?;
        Ok(())
    }
}

/// Optimized subscription
pub struct OptimizedSubscription;

#[async_graphql::Subscription]
impl OptimizedSubscription {
    /// Placeholder subscription
    async fn placeholder(&self) -> impl futures_util::Stream<Item = bool> {
        futures_util::stream::once(async { true })
    }
}

// Input types for mutations
#[derive(InputObject)]
pub struct CreateModelInput {
    pub name: String,
    pub description: Option<String>,
}

#[derive(InputObject)]
pub struct UpdateModelInput {
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(InputObject)]
pub struct CreateEntityInput {
    pub model_id: String,
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
    pub fields: Vec<CreateFieldInput>,
    pub ui_config: Option<serde_json::Value>,
    pub behavior: Option<serde_json::Value>,
}

#[derive(InputObject)]
pub struct UpdateEntityInput {
    pub name: Option<String>,
    pub display_name: Option<String>,
    pub description: Option<String>,
    pub fields: Option<Vec<UpdateFieldInput>>,
    pub ui_config: Option<serde_json::Value>,
    pub behavior: Option<serde_json::Value>,
}

#[derive(InputObject)]
pub struct CreateFieldInput {
    pub name: String,
    pub display_name: String,
    pub field_type: String,
    pub required: bool,
    pub default_value: Option<serde_json::Value>,
    pub validation: Option<serde_json::Value>,
    pub ui_config: Option<serde_json::Value>,
}

#[derive(InputObject)]
pub struct UpdateFieldInput {
    pub id: Option<String>,
    pub name: String,
    pub display_name: String,
    pub field_type: String,
    pub required: bool,
    pub default_value: Option<serde_json::Value>,
    pub validation: Option<serde_json::Value>,
    pub ui_config: Option<serde_json::Value>,
}

// Output types
#[derive(SimpleObject)]
pub struct ModelStats {
    pub entity_count: i32,
    pub relationship_count: i32,
    pub flow_count: i32,
    pub layout_count: i32,
    pub validation_count: i32,
}

#[derive(SimpleObject)]
pub struct BatchResult {
    pub success_count: i32,
    pub error_count: i32,
    pub errors: Vec<BatchError>,
}

#[derive(SimpleObject)]
pub struct BatchError {
    pub index: i32,
    pub message: String,
}

/// Create optimized GraphQL schema
pub fn create_optimized_schema() -> async_graphql::Schema<OptimizedQuery, OptimizedMutation, OptimizedSubscription> {
    async_graphql::Schema::build(OptimizedQuery, OptimizedMutation, OptimizedSubscription)
        .finish()
}

/// Performance comparison metrics
#[derive(SimpleObject)]
pub struct PerformanceMetrics {
    pub conversion_overhead_ms: f64,
    pub memory_usage_bytes: i64,
    pub graphql_parse_time_ms: f64,
    pub total_request_time_ms: f64,
}