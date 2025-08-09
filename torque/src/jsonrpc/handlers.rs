use crate::server::AppState;
// Model types imported as needed in specific handlers
use crate::jsonrpc::direct_mapping::DirectMapping;
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};
use crate::model::types::LayoutType;
use crate::common::{Uuid, UtcDateTime};
use dashmap::DashMap;
use serde::{Serialize, Deserialize};

/// Console session state for tracking project context and command history
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsoleSession {
    pub session_id: String,
    pub project_id: Option<Uuid>,
    pub project_name: Option<String>,
    pub history: Vec<String>,
    pub capabilities: Vec<String>,
    pub created_at: UtcDateTime,
    pub last_active: UtcDateTime,
}

impl ConsoleSession {
    pub fn new() -> Self {
        let session_id = Uuid::new_v4().to_string();
        let now = UtcDateTime::now();
        Self {
            session_id,
            project_id: None,
            project_name: None,
            history: Vec::new(),
            capabilities: vec![
                "listProjects".to_string(),
                "createProject".to_string(),
                "deleteProject".to_string(),
                "getProjectInfo".to_string(),
            ],
            created_at: now,
            last_active: UtcDateTime::now(),
        }
    }
}

/// Global console session storage
static CONSOLE_SESSIONS: once_cell::sync::Lazy<DashMap<String, ConsoleSession>> = 
    once_cell::sync::Lazy::new(|| DashMap::new());

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

/// Non-console JSON-RPC method dispatcher to avoid recursion
async fn dispatch_non_console_method(
    state: &AppState,
    method: &str,
    params: &Value,
) -> Result<Value, (i32, String)> {
    tracing::debug!("Dispatching non-console JSON-RPC method: {} with params: {}", method, params);
    
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
        
        // Console/Project management methods (also exposed as MCP tools)
        "listProjects" => list_projects(state, params).await,
        "createProject" => create_project(state, params).await,
        "deleteProject" => delete_project(state, params).await,
        "getProjectInfo" => get_project_info(state, params).await,
        
        // Console session management
        "createConsoleSession" => create_console_session(state, params).await,
        "setProjectContext" => set_project_context(state, params).await,
        "getConsoleState" => get_console_state(state, params).await,
        
        // Enhanced introspection
        "getServerLogs" => get_server_logs(state, params).await,
        "getCacheStats" => get_cache_stats(state, params).await,
        
        // Explicitly exclude executeConsoleCommand to prevent recursion
        "executeConsoleCommand" => Err((-32603, "Recursive console command execution not allowed".to_string())),
        
        _ => Err((-32601, format!("Method '{}' not found", method)))
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
        
        // Console/Project management methods (also exposed as MCP tools)
        "listProjects" => list_projects(state, params).await,
        "createProject" => create_project(state, params).await,
        "deleteProject" => delete_project(state, params).await,
        "getProjectInfo" => get_project_info(state, params).await,
        
        // Console session management
        "createConsoleSession" => create_console_session(state, params).await,
        "setProjectContext" => set_project_context(state, params).await,
        "getConsoleState" => get_console_state(state, params).await,
        
        // Enhanced introspection
        "getServerLogs" => get_server_logs(state, params).await,
        "getCacheStats" => get_cache_stats(state, params).await,
        
        // Console command execution
        "executeConsoleCommand" => execute_console_command(state, params).await,
        
        _ => Err((-32601, format!("Method '{}' not found", method)))
    }
}

/// Load page layout and configuration for a TorqueApp
async fn load_page(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let model_id = params.get("modelId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: modelId".to_string()))?;
    
    let page_name = params.get("pageName")
        .and_then(|v| v.as_str());
    
    // Parse model ID
    let model_uuid = Uuid::parse(model_id)
        .map_err(|_| (-32602, "Invalid modelId format".to_string()))?;
    
    // Get model from service
    let model = state.services.model_service.get_model(model_uuid).await
        .map_err(|e| (-32603, format!("Failed to load model: {}", e)))?
        .ok_or((-32604, "Model not found".to_string()))?;
    
    // Determine which layout to load
    let layout_id = if let Some(page_name) = page_name {
        // If a specific page is requested, find layout by name
        model.layouts.iter()
            .find(|l| l.name.to_lowercase() == page_name.to_lowercase())
            .map(|l| l.id.clone())
    } else {
        // No page specified, use start page layout if configured
        model.config.custom.get("startPageLayoutId")
            .and_then(|v| v.as_str())
            .and_then(|id| Uuid::parse(id).ok())
    };
    
    // Get the layout or use the first one as fallback
    let layout = if let Some(layout_id) = layout_id {
        model.layouts.iter().find(|l| l.id == layout_id)
    } else {
        model.layouts.first()
    };
    
    let layout_data = if let Some(layout) = layout {
        // Convert the layout to the expected format
        json!({
            "type": match layout.layout_type {
                LayoutType::List => "list",
                LayoutType::Grid => "grid", 
                LayoutType::Dashboard => "dashboard",
                LayoutType::Form => "form",
                LayoutType::Detail => "detail",
                LayoutType::Custom => "custom",
            },
            "responsive": true,
            "components": layout.components.iter().map(|c| json!({
                "id": c.id,
                "type": c.component_type,
                "position": {
                    "row": c.position.row,
                    "col": c.position.column,
                    "span": c.position.width
                },
                "properties": c.properties
            })).collect::<Vec<_>>()
        })
    } else {
        // No layouts defined, return empty layout
        json!({
            "type": "grid",
            "responsive": true,
            "components": []
        })
    };
    
    Ok(json!({
        "modelId": model_id,
        "pageName": page_name.unwrap_or("start"),
        "layout": layout_data,
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
    
    let _filters = params.get("filters").cloned();
    
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
    
    // Note: Filtering will be implemented in a future iteration
    // For now, we return all entities with basic pagination
    
    // Query entities using the app database service (where sample data is stored)
    let offset = (page - 1) * limit;
    
    let entities = state.services.app_database_service
        .get_entities(model_id, entity_name, limit, offset)
        .await
        .map_err(|e| (-32603, format!("Failed to query entities: {}", e)))?;
    
    let total = state.services.app_database_service
        .get_entity_count(model_id, entity_name)
        .await
        .map_err(|e| (-32603, format!("Failed to get entity count: {}", e)))?;
    
    // Format response directly since we already have JSON data
    let response = serde_json::json!({
        "data": entities,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total as f64 / limit as f64).ceil() as u64,
            "hasNextPage": page * limit < total,
            "hasPreviousPage": page > 1
        }
    });
    
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
            "layouts",
            "console-session-management",
            "project-management"
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

// === Project Management Methods (MCP Tools: torque_list_projects, etc.) ===

/// List all projects/models
async fn list_projects(state: &AppState, _params: &Value) -> Result<Value, (i32, String)> {
    let models = state.services.model_service.get_models().await
        .map_err(|e| (-32603, format!("Failed to list projects: {}", e)))?;
    
    let projects: Vec<Value> = models.into_iter().map(|model| json!({
        "id": model.id,
        "name": model.name,
        "description": model.description,
        "version": model.version,
        "createdAt": model.created_at,
        "updatedAt": model.updated_at,
        "entityCount": model.entities.len(),
        "layoutCount": model.layouts.len(),
        "flowCount": model.flows.len()
    })).collect();
    
    Ok(json!({
        "projects": projects,
        "total": projects.len()
    }))
}

/// Create a new project/model
async fn create_project(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let name = params.get("name")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: name".to_string()))?;
    
    let description = params.get("description")
        .and_then(|v| v.as_str());
    
    use crate::services::model::CreateModelInput;
    let input = CreateModelInput {
        name: name.to_string(),
        description: description.map(|s| s.to_string()),
        config: None,
    };
    
    let model = state.services.model_service.create_model(input).await
        .map_err(|e| (-32603, format!("Failed to create project: {}", e)))?;
    
    Ok(json!({
        "id": model.id,
        "name": model.name,
        "description": model.description,
        "version": model.version,
        "createdAt": model.created_at,
        "updatedAt": model.updated_at
    }))
}

/// Delete a project/model
async fn delete_project(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let id_str = params.get("id")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: id".to_string()))?;
    
    let project_id = Uuid::parse(id_str)
        .map_err(|_| (-32602, "Invalid project ID format".to_string()))?;
    
    let deleted = state.services.model_service.delete_model(project_id).await
        .map_err(|e| (-32603, format!("Failed to delete project: {}", e)))?;
    
    Ok(json!({
        "success": deleted,
        "id": id_str
    }))
}

/// Get project/model information
async fn get_project_info(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let id_str = params.get("id")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: id".to_string()))?;
    
    let project_id = Uuid::parse(id_str)
        .map_err(|_| (-32602, "Invalid project ID format".to_string()))?;
    
    let model = state.services.model_service.get_model(project_id).await
        .map_err(|e| (-32603, format!("Failed to get project info: {}", e)))?
        .ok_or((-32604, "Project not found".to_string()))?;
    
    Ok(json!({
        "id": model.id,
        "name": model.name,
        "description": model.description,
        "version": model.version,
        "createdAt": model.created_at,
        "updatedAt": model.updated_at,
        "entities": model.entities.iter().map(|e| json!({
            "id": e.id,
            "name": e.name,
            "displayName": e.display_name,
            "entityType": e.entity_type,
            "fieldCount": e.fields.len()
        })).collect::<Vec<_>>(),
        "layouts": model.layouts.iter().map(|l| json!({
            "id": l.id,
            "name": l.name,
            "layoutType": l.layout_type
        })).collect::<Vec<_>>(),
        "relationships": model.relationships.len(),
        "flows": model.flows.len()
    }))
}

// === Console Session Management Methods ===

/// Create a new console session
async fn create_console_session(_state: &AppState, _params: &Value) -> Result<Value, (i32, String)> {
    let session = ConsoleSession::new();
    let session_id = session.session_id.clone();
    
    CONSOLE_SESSIONS.insert(session_id.clone(), session.clone());
    
    Ok(json!({
        "sessionId": session_id,
        "capabilities": session.capabilities,
        "createdAt": session.created_at,
        "context": {
            "projectId": session.project_id,
            "projectName": session.project_name
        }
    }))
}

/// Set project context for a console session
async fn set_project_context(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let session_id = params.get("sessionId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: sessionId".to_string()))?;
    
    let project_id_str = params.get("projectId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: projectId".to_string()))?;
    
    let project_id = Uuid::parse(project_id_str)
        .map_err(|_| (-32602, "Invalid project ID format".to_string()))?;
    
    // Verify project exists
    let model = state.services.model_service.get_model(project_id.clone()).await
        .map_err(|e| (-32603, format!("Failed to verify project: {}", e)))?
        .ok_or((-32604, "Project not found".to_string()))?;
    
    // Update session
    if let Some(mut session_entry) = CONSOLE_SESSIONS.get_mut(session_id) {
        session_entry.project_id = Some(project_id);
        session_entry.project_name = Some(model.name.clone());
        session_entry.last_active = UtcDateTime::now();
        
        // Add project-scoped capabilities
        let capabilities = vec![
            "listProjects".to_string(),
            "createProject".to_string(),
            "deleteProject".to_string(),
            "getProjectInfo".to_string(),
            "loadPage".to_string(),
            "loadEntityData".to_string(),
            "createEntity".to_string(),
            "updateEntity".to_string(),
            "deleteEntity".to_string(),
            "getModelMetadata".to_string(),
        ];
        session_entry.capabilities = capabilities;
        
        Ok(json!({
            "success": true,
            "sessionId": session_id,
            "context": {
                "projectId": project_id_str,
                "projectName": model.name
            },
            "capabilities": session_entry.capabilities
        }))
    } else {
        Err((-32604, "Console session not found".to_string()))
    }
}

/// Get console session state
async fn get_console_state(_state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let session_id = params.get("sessionId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: sessionId".to_string()))?;
    
    if let Some(session) = CONSOLE_SESSIONS.get(session_id) {
        Ok(json!({
            "sessionId": session.session_id,
            "context": {
                "projectId": session.project_id,
                "projectName": session.project_name
            },
            "capabilities": session.capabilities,
            "historyCount": session.history.len(),
            "createdAt": session.created_at,
            "lastActive": session.last_active
        }))
    } else {
        Err((-32604, "Console session not found".to_string()))
    }
}

// === Enhanced Introspection Methods ===

/// Get server logs (recent entries)
async fn get_server_logs(_state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    let tail = params.get("tail")
        .and_then(|v| v.as_u64())
        .unwrap_or(100) as usize;
    
    // For now, return a placeholder response
    // In a real implementation, you'd integrate with your logging system
    Ok(json!({
        "logs": [],
        "message": "Server logs not yet implemented - requires tracing subscriber integration",
        "requestedLines": tail,
        "timestamp": UtcDateTime::now()
    }))
}

/// Get cache performance statistics
async fn get_cache_stats(_state: &AppState, _params: &Value) -> Result<Value, (i32, String)> {
    // Get basic cache stats from the cache service
    // This is a simplified implementation - you might want more detailed stats
    Ok(json!({
        "cacheService": {
            "status": "active",
            "type": "DashMap-based"
        },
        "modelCache": {
            "entries": CONSOLE_SESSIONS.len(),
            "message": "Console sessions currently tracked"
        },
        "performance": {
            "message": "Detailed performance metrics not yet implemented"
        },
        "timestamp": UtcDateTime::now()
    }))
}

/// Execute a console command and return formatted result
async fn execute_console_command(state: &AppState, params: &Value) -> Result<Value, (i32, String)> {
    use crate::console::{parser, commands, ConsoleContext};
    
    let session_id = params.get("sessionId")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: sessionId".to_string()))?;
    
    let command_text = params.get("command")
        .and_then(|v| v.as_str())
        .ok_or((-32602, "Missing required parameter: command".to_string()))?;
    
    // Get session context
    let session = CONSOLE_SESSIONS.get(session_id)
        .ok_or((-32604, "Console session not found".to_string()))?;
    
    // Create console context
    let mut context = ConsoleContext::new(session_id.to_string());
    if let Some(project_id) = &session.project_id {
        if let Some(project_name) = &session.project_name {
            context = context.with_project(project_id.clone(), project_name.clone());
        }
    }
    
    // Handle special commands that don't map to JSON-RPC
    match command_text.trim() {
        "clear" => {
            return Ok(json!({
                "success": true,
                "output": "",
                "action": "clear"
            }));
        },
        "history" => {
            return Ok(json!({
                "success": true,
                "output": format_command_history(&session.history),
                "data": session.history.clone()
            }));
        },
        "exit" => {
            return Ok(json!({
                "success": true,
                "output": "Console session ended",
                "action": "exit"
            }));
        },
        cmd if cmd.starts_with("help") => {
            let help_parts: Vec<&str> = cmd.split_whitespace().collect();
            let help_command = help_parts.get(1).copied();
            let help_subcommand = help_parts.get(2).copied();
            
            let help_text = crate::console::completion::get_command_help(
                help_command.unwrap_or(""),
                help_subcommand
            );
            
            return Ok(json!({
                "success": true,
                "output": help_text
            }));
        },
        _ => {}
    }
    
    // Parse the command
    let parsed_command = parser::parse_command(command_text)
        .map_err(|e| (-32602, format!("Command parse error: {}", e)))?;
    
    // Validate command
    parser::validate_command(&parsed_command, context.has_project())
        .map_err(|e| (-32602, e))?;
    
    // Update command history
    if let Some(mut session_entry) = CONSOLE_SESSIONS.get_mut(session_id) {
        session_entry.history.push(command_text.to_string());
        session_entry.last_active = UtcDateTime::now();
        
        // Keep only last 100 commands in history
        if session_entry.history.len() > 100 {
            session_entry.history.remove(0);
        }
    }
    
    // Handle "project use" command specially to update session
    if parsed_command.command == "project" && 
       parsed_command.subcommand.as_deref() == Some("use") &&
       !parsed_command.args.is_empty() {
        
        let project_id_str = &parsed_command.args[0];
        let project_id = Uuid::parse(project_id_str)
            .map_err(|_| (-32602, "Invalid project ID format".to_string()))?;
        
        // Verify project exists and update session
        let model = state.services.model_service.get_model(project_id.clone()).await
            .map_err(|e| (-32603, format!("Failed to verify project: {}", e)))?
            .ok_or((-32604, "Project not found".to_string()))?;
        
        // Update session with project context
        if let Some(mut session_entry) = CONSOLE_SESSIONS.get_mut(session_id) {
            session_entry.project_id = Some(project_id);
            session_entry.project_name = Some(model.name.clone());
            session_entry.last_active = UtcDateTime::now();
        }
        
        return Ok(json!({
            "success": true,
            "output": format!("Project context set to: {} ({})", model.name, project_id_str),
            "data": {
                "projectId": project_id_str,
                "projectName": model.name
            }
        }));
    }
    
    // Map command to JSON-RPC and execute
    let jsonrpc_request = commands::map_command_to_jsonrpc(&parsed_command, &context)
        .map_err(|e| (-32602, format!("Command mapping error: {}", e)))?;
    
    // Execute the JSON-RPC request by calling non-recursive dispatch
    let request_method = jsonrpc_request.get("method")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");
    let default_params = json!({});
    let request_params = jsonrpc_request.get("params")
        .unwrap_or(&default_params);
    
    match dispatch_non_console_method(state, request_method, request_params).await {
        Ok(result) => {
            let response = json!({
                "jsonrpc": "2.0",
                "id": jsonrpc_request.get("id"),
                "result": result
            });
            
            let console_result = commands::format_response_for_console(&response);
            
            Ok(json!({
                "success": console_result.success,
                "output": console_result.output,
                "data": console_result.data,
                "error": console_result.error
            }))
        },
        Err((code, message)) => {
            let response = json!({
                "jsonrpc": "2.0",
                "id": jsonrpc_request.get("id"),
                "error": {
                    "code": code,
                    "message": message
                }
            });
            
            let console_result = commands::format_response_for_console(&response);
            
            Ok(json!({
                "success": console_result.success,
                "output": console_result.output,
                "data": console_result.data,
                "error": console_result.error
            }))
        }
    }
}

/// Format command history for display
fn format_command_history(history: &[String]) -> String {
    if history.is_empty() {
        return "No commands in history".to_string();
    }
    
    let mut output = String::from("Command History:\n\n");
    for (i, cmd) in history.iter().enumerate().rev().take(20) {
        output.push_str(&format!("  {}: {}\n", i + 1, cmd));
    }
    
    if history.len() > 20 {
        output.push_str(&format!("\n... and {} more commands\n", history.len() - 20));
    }
    
    output
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