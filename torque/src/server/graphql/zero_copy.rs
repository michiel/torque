use async_graphql::{Context, Object, Result, SimpleObject, InputObject};
use crate::common::Uuid;
use crate::model::types as model;
use crate::server::AppState;

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

    async fn relationships(&self) -> serde_json::Value {
        // Return relationships as JSON to avoid complex conversions
        serde_json::to_value(&self.inner.relationships).unwrap_or_default()
    }

    async fn flows(&self) -> serde_json::Value {
        // Return flows as JSON to avoid complex conversions
        serde_json::to_value(&self.inner.flows).unwrap_or_default()
    }

    async fn layouts(&self) -> serde_json::Value {
        // Return layouts as JSON to avoid complex conversions
        serde_json::to_value(&self.inner.layouts).unwrap_or_default()
    }

    async fn validations(&self) -> serde_json::Value {
        // Return validations as JSON to avoid complex conversions
        serde_json::to_value(&self.inner.validations).unwrap_or_default()
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
            entity_type: model::EntityType::Data,
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
    pub name: String,
    pub display_name: String,
    pub description: Option<String>,
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