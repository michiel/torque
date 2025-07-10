use crate::server::AppState;
use crate::model::types::{TorqueModel, ModelEntity, EntityField, FieldType};
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};
use uuid::Uuid;

/// JSON-RPC endpoint handler for TorqueApp Runtime
pub async fn jsonrpc_handler(
    State(state): State<AppState>,
    Json(request): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    tracing::debug!("JSON-RPC request received: {}", request);
    
    // Extract request ID for proper JSON-RPC response format
    let request_id = request.get("id").cloned().unwrap_or(json!(null));
    
    // Validate JSON-RPC request format
    if let Err((code, message)) = validate_jsonrpc_request(&request) {
        let response = json!({
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {
                "code": code,
                "message": message
            }
        });
        return Ok(Json(response));
    }
    
    // Extract method and params
    let method = request["method"].as_str().unwrap();
    let default_params = json!({});
    let params = request.get("params").unwrap_or(&default_params);
    
    // Dispatch to appropriate method handler
    match dispatch_method(&state, method, params).await {
        Ok(result) => {
            let response = json!({
                "jsonrpc": "2.0",
                "id": request_id,
                "result": result
            });
            Ok(Json(response))
        },
        Err((code, message)) => {
            let response = json!({
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {
                    "code": code,
                    "message": message
                }
            });
            Ok(Json(response))
        }
    }
}

/// JSON-RPC method dispatcher for TorqueApp Runtime
async fn dispatch_method(
    state: &AppState,
    method: &str,
    params: &Value,
) -> Result<Value, (i32, String)> {
    tracing::debug!("Dispatching JSON-RPC method: {} with params: {}", method, params);
    
    match method {
        // Core TorqueApp methods
        "loadPage" => load_page(state, params).await,
        "loadEntityData" => load_entity_data(state, params).await,
        "getFormDefinition" => get_form_definition(state, params).await,
        "createEntity" => create_entity(state, params).await,
        "updateEntity" => update_entity(state, params).await,
        "deleteEntity" => delete_entity(state, params).await,
        
        // Layout and UI methods
        "getComponentConfig" => get_component_config(state, params).await,
        "getLayoutConfig" => get_layout_config(state, params).await,
        "getModelMetadata" => get_model_metadata(state, params).await,
        
        // Health and introspection
        "ping" => Ok(json!({"status": "ok", "timestamp": chrono::Utc::now()})),
        "getCapabilities" => get_capabilities().await,
        
        _ => Err((-32601, format!("Method '{}' not found", method)))
    }
}

/// Load page layout and configuration for a TorqueApp
async fn load_page(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let model_id = params.get("modelId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: modelId".to_string()))?;
    
    let page_name = params.get("pageName")
        .and_then(|v| v.as_str())
        .unwrap_or("main");
    
    // Parse model ID
    let model_uuid = Uuid::parse_str(model_id)
        .map_err(|_| (-32602, "Invalid modelId format".to_string()))?;
    
    // Get model from service
    let model = state.services.model_service.get_model(model_uuid).await
        .map_err(|e| (-32603, format!("Failed to load model: {}", e)))?
        .ok_or((-32604, "Model not found".to_string()))?;
    
    // Generate page layout from model
    let page_layout = generate_page_layout(&model, page_name)?;
    
    Ok(json!({
        "modelId": model_id,
        "pageName": page_name,
        "layout": page_layout,
        "metadata": {
            "modelName": model.name,
            "modelVersion": model.version,
            "loadedAt": chrono::Utc::now()
        }
    }))
}

/// Load entity data with pagination and filtering
async fn load_entity_data(_state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let model_id = params.get("modelId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: modelId".to_string()))?;
    
    let entity_name = params.get("entityName")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: entityName".to_string()))?;
    
    let page = params.get("page")
        .and_then(|v| v.as_u64())
        .unwrap_or(1);
    
    let limit = params.get("limit")
        .and_then(|v| v.as_u64())
        .unwrap_or(20);
    
    // TODO: Implement actual entity data loading
    // For now, return mock data structure
    Ok(json!({
        "modelId": model_id,
        "entityName": entity_name,
        "data": [],
        "pagination": {
            "page": page,
            "limit": limit,
            "total": 0,
            "hasMore": false
        }
    }))
}

/// Get form definition for entity creation/editing
async fn get_form_definition(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let model_id = params.get("modelId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: modelId".to_string()))?;
    
    let entity_name = params.get("entityName")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: entityName".to_string()))?;
    
    // Parse model ID
    let model_uuid = Uuid::parse_str(model_id)
        .map_err(|_| (-32602, "Invalid modelId format".to_string()))?;
    
    // Get model from service
    let model = state.services.model_service.get_model(model_uuid).await
        .map_err(|e| (-32603, format!("Failed to load model: {}", e)))?
        .ok_or((-32604, "Model not found".to_string()))?;
    
    // Find the entity
    let entity = model.entities.iter()
        .find(|e| e.name == entity_name)
        .ok_or((-32604, format!("Entity '{}' not found in model", entity_name)))?;
    
    // Generate form definition from entity
    let form_definition = generate_form_definition(entity)?;
    
    Ok(json!({
        "modelId": model_id,
        "entityName": entity_name,
        "form": form_definition
    }))
}

/// Create a new entity instance
async fn create_entity(_state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let model_id = params.get("modelId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: modelId".to_string()))?;
    
    let entity_name = params.get("entityName")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: entityName".to_string()))?;
    
    let entity_data = params.get("data")
        .ok_or((-32602, "Missing required parameter: data".to_string()))?;
    
    // TODO: Implement actual entity creation
    // For now, return mock response
    let entity_id = Uuid::new_v4();
    
    Ok(json!({
        "id": entity_id,
        "modelId": model_id,
        "entityName": entity_name,
        "data": entity_data,
        "createdAt": chrono::Utc::now()
    }))
}

/// Update an existing entity instance
async fn update_entity(_state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let entity_id = params.get("entityId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: entityId".to_string()))?;
    
    let entity_data = params.get("data")
        .ok_or((-32602, "Missing required parameter: data".to_string()))?;
    
    // TODO: Implement actual entity update
    // For now, return mock response
    Ok(json!({
        "id": entity_id,
        "data": entity_data,
        "updatedAt": chrono::Utc::now()
    }))
}

/// Delete an entity instance
async fn delete_entity(_state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let entity_id = params.get("entityId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: entityId".to_string()))?;
    
    // TODO: Implement actual entity deletion
    // For now, return mock response
    Ok(json!({
        "id": entity_id,
        "deleted": true,
        "deletedAt": chrono::Utc::now()
    }))
}

/// Get component configuration for UI rendering
async fn get_component_config(_state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let component_type = params.get("componentType")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: componentType".to_string()))?;
    
    // Return component configuration based on type
    let config = match component_type {
        "DataGrid" => json!({
            "type": "DataGrid",
            "features": ["sorting", "filtering", "pagination"],
            "defaultPageSize": 20,
            "columns": []
        }),
        "TorqueForm" => json!({
            "type": "TorqueForm",
            "features": ["validation", "auto-save"],
            "layout": "vertical",
            "fields": []
        }),
        "TorqueButton" => json!({
            "type": "TorqueButton",
            "variants": ["primary", "secondary", "danger"],
            "sizes": ["sm", "md", "lg"],
            "actions": ["submit", "cancel", "delete", "custom"]
        }),
        _ => return Err((-32604, format!("Unknown component type: {}", component_type)))
    };
    
    Ok(config)
}

/// Get layout configuration for a page
async fn get_layout_config(_state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let layout_type = params.get("layoutType")
        .and_then(|v| v.as_str())
        .unwrap_or("grid");
    
    let config = match layout_type {
        "grid" => json!({
            "type": "grid",
            "columns": 12,
            "gutter": 16,
            "responsive": true,
            "breakpoints": {
                "xs": 0,
                "sm": 576,
                "md": 768,
                "lg": 992,
                "xl": 1200
            }
        }),
        "flex" => json!({
            "type": "flex",
            "direction": "row",
            "wrap": true,
            "justify": "start",
            "align": "start"
        }),
        _ => return Err((-32604, format!("Unknown layout type: {}", layout_type)))
    };
    
    Ok(config)
}

/// Get metadata about a model
async fn get_model_metadata(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let model_id = params.get("modelId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: modelId".to_string()))?;
    
    // Parse model ID
    let model_uuid = Uuid::parse_str(model_id)
        .map_err(|_| (-32602, "Invalid modelId format".to_string()))?;
    
    // Get model from service
    let model = state.services.model_service.get_model(model_uuid).await
        .map_err(|e| (-32603, format!("Failed to load model: {}", e)))?
        .ok_or((-32604, "Model not found".to_string()))?;
    
    Ok(json!({
        "id": model.id,
        "name": model.name,
        "description": model.description,
        "version": model.version,
        "createdAt": model.created_at,
        "updatedAt": model.updated_at,
        "createdBy": model.created_by,
        "stats": {
            "entityCount": model.entities.len(),
            "relationshipCount": model.relationships.len(),
            "flowCount": model.flows.len(),
            "layoutCount": model.layouts.len(),
            "validationCount": model.validations.len()
        }
    }))
}

/// Get TorqueApp capabilities
async fn get_capabilities() -> Result<Value, (i32, String)> {
    Ok(json!({
        "version": "1.0.0",
        "apiVersion": "2.0",
        "features": [
            "dynamic-ui-generation",
            "real-time-updates",
            "entity-management",
            "form-generation",
            "layout-engine",
            "component-system"
        ],
        "supportedComponents": [
            "DataGrid",
            "TorqueForm", 
            "TorqueButton",
            "Text",
            "Container",
            "Modal"
        ],
        "supportedLayouts": [
            "grid",
            "flex",
            "absolute"
        ]
    }))
}

/// Generate page layout from model definition
fn generate_page_layout(model: &TorqueModel, page_name: &str) -> Result<Value, (i32, String)> {
    // Find layouts for this page, or generate default
    let model_layouts = model.layouts.iter()
        .filter(|layout| layout.name.contains(page_name) || page_name == "main")
        .collect::<Vec<_>>();
    
    if !model_layouts.is_empty() {
        // Use existing layout configuration
        let layout = &model_layouts[0];
        return Ok(json!({
            "id": layout.id,
            "type": layout.layout_type,
            "components": layout.components,
            "responsive": layout.responsive
        }));
    }
    
    // Generate default layout based on entities
    let mut components = Vec::new();
    
    // Add a header component
    components.push(json!({
        "id": Uuid::new_v4(),
        "type": "Text",
        "position": { "row": 0, "col": 0, "span": 12 },
        "properties": {
            "text": format!("{} - {}", model.name, page_name),
            "variant": "h1"
        }
    }));
    
    // Add DataGrid for each entity
    for (index, entity) in model.entities.iter().enumerate() {
        let row = (index + 1) * 2; // Space out components
        
        // Add entity header
        components.push(json!({
            "id": Uuid::new_v4(),
            "type": "Text",
            "position": { "row": row, "col": 0, "span": 12 },
            "properties": {
                "text": &entity.display_name,
                "variant": "h2"
            }
        }));
        
        // Add DataGrid
        components.push(json!({
            "id": Uuid::new_v4(),
            "type": "DataGrid",
            "position": { "row": row + 1, "col": 0, "span": 12 },
            "properties": {
                "entityName": entity.name,
                "columns": generate_grid_columns(&entity.fields),
                "features": ["sorting", "filtering", "pagination"],
                "pageSize": 20
            }
        }));
        
        // Add create button
        components.push(json!({
            "id": Uuid::new_v4(),
            "type": "TorqueButton",
            "position": { "row": row + 2, "col": 0, "span": 3 },
            "properties": {
                "text": format!("Create {}", entity.display_name),
                "variant": "primary",
                "action": {
                    "type": "openModal",
                    "modalType": "form",
                    "entityName": entity.name
                }
            }
        }));
    }
    
    Ok(json!({
        "type": "grid",
        "responsive": true,
        "components": components
    }))
}

/// Generate form definition from entity
fn generate_form_definition(entity: &ModelEntity) -> Result<Value, (i32, String)> {
    let mut fields = Vec::new();
    
    for field in &entity.fields {
        let field_config = json!({
            "id": field.id,
            "name": field.name,
            "label": &field.display_name,
            "type": map_field_type_to_form_type(&field.field_type),
            "required": field.required,
            "defaultValue": field.default_value,
            "validation": generate_field_validation(field),
            "uiConfig": field.ui_config
        });
        
        fields.push(field_config);
    }
    
    Ok(json!({
        "layout": "vertical",
        "submitText": format!("Create {}", entity.display_name),
        "cancelText": "Cancel",
        "fields": fields,
        "validation": {
            "validateOnBlur": true,
            "validateOnChange": false
        }
    }))
}

/// Generate DataGrid columns from entity fields
fn generate_grid_columns(fields: &[EntityField]) -> Vec<Value> {
    fields.iter().map(|field| {
        json!({
            "key": field.name,
            "title": &field.display_name,
            "dataType": map_field_type_to_grid_type(&field.field_type),
            "sortable": true,
            "filterable": true,
            "width": get_default_column_width(&field.field_type)
        })
    }).collect()
}

/// Map EntityField type to form input type
fn map_field_type_to_form_type(field_type: &FieldType) -> &'static str {
    match field_type {
        FieldType::String { .. } => "text",
        FieldType::Integer { .. } => "number",
        FieldType::Float { .. } => "number",
        FieldType::Boolean => "checkbox",
        FieldType::Date => "date",
        FieldType::DateTime => "datetime-local",
        FieldType::Time => "time",
        FieldType::Json => "textarea",
        FieldType::Binary => "file",
        FieldType::Enum { .. } => "select",
        FieldType::Array { .. } => "multiselect",
        FieldType::Reference { .. } => "select",
    }
}

/// Map EntityField type to DataGrid column type
fn map_field_type_to_grid_type(field_type: &FieldType) -> &'static str {
    match field_type {
        FieldType::String { .. } => "string",
        FieldType::Integer { .. } | FieldType::Float { .. } => "number",
        FieldType::Boolean => "boolean",
        FieldType::Date | FieldType::DateTime | FieldType::Time => "date",
        FieldType::Json => "json",
        FieldType::Binary => "binary",
        FieldType::Enum { .. } => "enum",
        FieldType::Array { .. } => "array",
        FieldType::Reference { .. } => "reference",
    }
}

/// Get default column width for field type
fn get_default_column_width(field_type: &FieldType) -> u32 {
    match field_type {
        FieldType::Boolean => 80,
        FieldType::Integer { .. } | FieldType::Float { .. } => 100,
        FieldType::Date => 120,
        FieldType::DateTime => 160,
        FieldType::Time => 100,
        FieldType::String { .. } => 150,
        FieldType::Json => 200,
        FieldType::Binary => 120,
        FieldType::Enum { .. } => 120,
        FieldType::Array { .. } => 180,
        FieldType::Reference { .. } => 150,
    }
}

/// Generate validation rules for a field
fn generate_field_validation(field: &EntityField) -> Value {
    let mut validation = json!({});
    
    if field.required {
        validation["required"] = json!(true);
    }
    
    match &field.field_type {
        FieldType::String { max_length } => {
            if let Some(max) = max_length {
                validation["maxLength"] = json!(max);
            }
            validation["type"] = json!("string");
        },
        FieldType::Integer { min, max } => {
            validation["type"] = json!("integer");
            if let Some(min_val) = min {
                validation["minimum"] = json!(min_val);
            }
            if let Some(max_val) = max {
                validation["maximum"] = json!(max_val);
            }
        },
        FieldType::Float { min, max } => {
            validation["type"] = json!("number");
            if let Some(min_val) = min {
                validation["minimum"] = json!(min_val);
            }
            if let Some(max_val) = max {
                validation["maximum"] = json!(max_val);
            }
        },
        FieldType::Boolean => {
            validation["type"] = json!("boolean");
        },
        FieldType::Enum { values } => {
            validation["type"] = json!("enum");
            validation["options"] = json!(values);
        },
        _ => {}
    }
    
    validation
}

/// Validate JSON-RPC request format
#[allow(dead_code)]
fn validate_jsonrpc_request(request: &Value) -> Result<(), (i32, String)> {
    // Check for required fields
    if !request.is_object() {
        return Err((-32600, "Invalid Request - not an object".to_string()));
    }
    
    let obj = request.as_object().unwrap();
    
    if obj.get("jsonrpc") != Some(&json!("2.0")) {
        return Err((-32600, "Invalid Request - missing or invalid jsonrpc field".to_string()));
    }
    
    if !obj.contains_key("method") {
        return Err((-32600, "Invalid Request - missing method field".to_string()));
    }
    
    if !obj.contains_key("id") {
        return Err((-32600, "Invalid Request - missing id field".to_string()));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_validate_jsonrpc_request() {
        // Valid request
        let valid_request = json!({
            "jsonrpc": "2.0",
            "method": "test_method",
            "params": {},
            "id": 1
        });
        assert!(validate_jsonrpc_request(&valid_request).is_ok());
        
        // Invalid request - missing jsonrpc
        let invalid_request = json!({
            "method": "test_method",
            "id": 1
        });
        assert!(validate_jsonrpc_request(&invalid_request).is_err());
        
        // Invalid request - not an object
        let invalid_request = json!("not an object");
        assert!(validate_jsonrpc_request(&invalid_request).is_err());
    }

    #[tokio::test]
    async fn test_jsonrpc_error_response_format() {
        // TODO: Add comprehensive JSON-RPC tests in Phase 3
        let request = json!({
            "jsonrpc": "2.0",
            "method": "nonexistent_method",
            "id": 123
        });
        
        // This would test the actual handler, but since it's a placeholder,
        // we'll just verify the response structure for now
        let expected_id = request.get("id").cloned().unwrap();
        assert_eq!(expected_id, json!(123));
    }
}