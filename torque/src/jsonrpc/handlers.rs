use crate::server::AppState;
use crate::model::types::{TorqueModel, ModelEntity, EntityField, FieldType};
use crate::jsonrpc::direct_mapping::DirectMapping;
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};
use crate::common::{Uuid, UtcDateTime};
use crate::services::entity::EntityQuery;
use std::collections::HashMap;

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
        "ping" => Ok(json!({"status": "ok", "timestamp": UtcDateTime::now()})),
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
        .unwrap_or("default");
    
    // Parse model ID
    let model_uuid = Uuid::parse(model_id)
        .map_err(|_| (-32602, "Invalid modelId format".to_string()))?;
    
    // Get model from service
    let model = state.services.model_service.get_model(model_uuid).await
        .map_err(|e| (-32603, format!("Failed to load model: {}", e)))?
        .ok_or((-32604, "Model not found".to_string()))?;
    
    // TODO: Get actual layout from model
    // For now, return a default grid layout
    let layout = json!({
        "type": "grid",
        "responsive": true,
        "components": [
            {
                "id": Uuid::new_v4(),
                "type": "DataGrid",
                "position": {
                    "row": 0,
                    "col": 0,
                    "span": 12
                },
                "properties": {
                    "entityName": model.entities.first().map(|e| &e.name).unwrap_or(&"default".to_string()),
                    "pageSize": 20,
                    "enableSorting": true,
                    "enableFiltering": true
                }
            }
        ]
    });
    
    Ok(json!({
        "modelId": model_id,
        "pageName": page_name,
        "layout": layout,
        "metadata": {
            "modelName": model.name,
            "modelVersion": model.version,
            "loadedAt": UtcDateTime::now()
        }
    }))
}

/// Load entity data with direct JSONB mapping
async fn load_entity_data(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
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
    
    let filters = params.get("filters").cloned();
    
    // Parse model ID
    let model_uuid = Uuid::parse(model_id)
        .map_err(|_| (-32602, "Invalid modelId format".to_string()))?;
    
    // Get model to find entity definition
    let model = state.services.model_service.get_model(model_uuid.clone()).await
        .map_err(|e| (-32603, format!("Failed to load model: {}", e)))?
        .ok_or((-32604, "Model not found".to_string()))?;
    
    // Find entity definition
    let entity_def = model.entities.iter()
        .find(|e| e.name == entity_name)
        .ok_or((-32605, format!("Entity '{}' not found in model", entity_name)))?;
    
    // Create query with filters
    let query_filters = DirectMapping::build_query_filter(filters);
    let mut filter_map = HashMap::new();
    for (k, v) in query_filters {
        filter_map.insert(k, v);
    }
    
    let query = EntityQuery {
        application_id: Some(model_uuid),
        entity_type: Some(entity_name.to_string()),
        limit: Some(limit),
        offset: Some((page - 1) * limit),
        filters: if filter_map.is_empty() { None } else { Some(filter_map) },
    };
    
    // Query entities using the entity service
    let entities = state.services.entity_service.query_entities(query.clone()).await
        .map_err(|e| (-32603, format!("Failed to query entities: {}", e)))?;
    
    // Count total entities
    let total = state.services.entity_service.count_entities(query).await
        .map_err(|e| (-32603, format!("Failed to count entities: {}", e)))?;
    
    // Format response with direct mapping
    let response = DirectMapping::format_entity_list(entities, page, limit, total);
    
    Ok(json!({
        "modelId": model_id,
        "entityName": entity_name,
        "data": response["data"],
        "pagination": response["pagination"],
        "columns": DirectMapping::generate_datagrid_columns(entity_def)
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
    let model_uuid = Uuid::parse(model_id)
        .map_err(|_| (-32602, "Invalid modelId format".to_string()))?;
    
    // Get model from service
    let model = state.services.model_service.get_model(model_uuid).await
        .map_err(|e| (-32603, format!("Failed to load model: {}", e)))?
        .ok_or((-32604, "Model not found".to_string()))?;
    
    // Find entity definition
    let entity_def = model.entities.iter()
        .find(|e| e.name == entity_name)
        .ok_or((-32605, format!("Entity '{}' not found in model", entity_name)))?;
    
    // Generate form fields using direct mapping
    let fields = DirectMapping::generate_form_fields(entity_def);
    
    Ok(json!({
        "modelId": model_id,
        "entityName": entity_name,
        "form": {
            "layout": "vertical",
            "submitText": "Save",
            "cancelText": "Cancel",
            "fields": fields,
            "validation": {
                "validateOnBlur": true,
                "validateOnChange": false
            }
        }
    }))
}

/// Create a new entity instance with direct JSONB mapping
async fn create_entity(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let model_id = params.get("modelId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: modelId".to_string()))?;
    
    let entity_name = params.get("entityName")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: entityName".to_string()))?;
    
    let entity_data = params.get("data")
        .ok_or((-32602, "Missing required parameter: data".to_string()))?
        .clone();
    
    // Parse model ID
    let model_uuid = Uuid::parse(model_id)
        .map_err(|_| (-32602, "Invalid modelId format".to_string()))?;
    
    // Get model to find entity definition
    let model = state.services.model_service.get_model(model_uuid.clone()).await
        .map_err(|e| (-32603, format!("Failed to load model: {}", e)))?
        .ok_or((-32604, "Model not found".to_string()))?;
    
    // Find entity definition
    let entity_def = model.entities.iter()
        .find(|e| e.name == entity_name);
    
    // Create entity with direct mapping
    let request = DirectMapping::create_entity_request(
        model_uuid,
        entity_name.to_string(),
        entity_data,
        entity_def
    );
    
    let entity = state.services.entity_service.create_entity(request).await
        .map_err(|e| (-32603, format!("Failed to create entity: {}", e)))?;
    
    // Return the entity data directly
    Ok(json!({
        "id": entity.id,
        "modelId": model_id,
        "entityName": entity_name,
        "data": DirectMapping::extract_for_frontend(&entity),
        "createdAt": entity.created_at
    }))
}

/// Update an existing entity instance with direct JSONB mapping
async fn update_entity(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let entity_id = params.get("entityId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: entityId".to_string()))?;
    
    let entity_data = params.get("data")
        .ok_or((-32602, "Missing required parameter: data".to_string()))?
        .clone();
    
    // Parse entity ID
    let entity_uuid = Uuid::parse(entity_id)
        .map_err(|_| (-32602, "Invalid entityId format".to_string()))?;
    
    // Create update request with direct mapping
    let request = DirectMapping::update_entity_request(entity_data, false);
    
    let entity = state.services.entity_service.update_entity(entity_uuid, request).await
        .map_err(|e| (-32603, format!("Failed to update entity: {}", e)))?
        .ok_or((-32604, "Entity not found".to_string()))?;
    
    // Return the updated entity data directly
    Ok(json!({
        "id": entity.id,
        "data": DirectMapping::extract_for_frontend(&entity),
        "updatedAt": entity.updated_at
    }))
}

/// Delete an entity instance
async fn delete_entity(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let entity_id = params.get("entityId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: entityId".to_string()))?;
    
    // Parse entity ID
    let entity_uuid = Uuid::parse(entity_id)
        .map_err(|_| (-32602, "Invalid entityId format".to_string()))?;
    
    let deleted = state.services.entity_service.delete_entity(entity_uuid).await
        .map_err(|e| (-32603, format!("Failed to delete entity: {}", e)))?;
    
    Ok(json!({
        "id": entity_id,
        "deleted": deleted,
        "deletedAt": UtcDateTime::now()
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
            "gap": 16,
            "align": "start",
            "justify": "start"
        }),
        "absolute" => json!({
            "type": "absolute",
            "width": 1200,
            "height": 800,
            "snapToGrid": true,
            "gridSize": 10
        }),
        _ => return Err((-32604, format!("Unknown layout type: {}", layout_type)))
    };
    
    Ok(config)
}

/// Get model metadata
async fn get_model_metadata(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let model_id = params.get("modelId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: modelId".to_string()))?;
    
    // Parse model ID
    let model_uuid = Uuid::parse(model_id)
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
        "entities": model.entities.iter().map(|e| json!({
            "name": e.name,
            "displayName": e.display_name,
            "entityType": e.entity_type,
            "fieldCount": e.fields.len()
        })).collect::<Vec<_>>(),
        "relationships": model.relationships.len(),
        "flows": model.flows.len(),
        "layouts": model.layouts.len()
    }))
}

/// Get TorqueApp capabilities
async fn get_capabilities() -> Result<Value, (i32, String)> {
    Ok(json!({
        "version": env!("CARGO_PKG_VERSION"),
        "apiVersion": "1.0",
        "features": [
            "entity-crud",
            "direct-jsonb-mapping",
            "pagination",
            "filtering",
            "sorting",
            "validation",
            "relationships",
            "flows",
            "layouts"
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

/// Validate JSON-RPC request format
fn validate_jsonrpc_request(request: &Value) -> Result<(), (i32, String)> {
    // Check jsonrpc version
    if request.get("jsonrpc").and_then(|v| v.as_str()) != Some("2.0") {
        return Err((-32600, "Invalid Request: missing or invalid jsonrpc field".to_string()));
    }
    
    // Check method
    if !request.get("method").map(|v| v.is_string()).unwrap_or(false) {
        return Err((-32600, "Invalid Request: missing or invalid method field".to_string()));
    }
    
    // Check id (optional but must be string or number if present)
    if let Some(id) = request.get("id") {
        if !id.is_string() && !id.is_number() && !id.is_null() {
            return Err((-32600, "Invalid Request: id must be string, number, or null".to_string()));
        }
    }
    
    Ok(())
}