// MCP server implementation for console component
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
    routing::post,
    Router,
};
use serde_json::{json, Value};
use crate::server::AppState;
use crate::jsonrpc::handlers::jsonrpc_handler;

/// Create MCP router that exposes JSON-RPC methods as MCP tools
pub fn create_mcp_router() -> Router<AppState> {
    Router::new()
        .route("/mcp", post(mcp_handler))
        .route("/mcp/capabilities", post(mcp_capabilities))
        .route("/mcp/tools/list", post(list_mcp_tools))
        .route("/mcp/tools/call", post(call_mcp_tool))
}

/// Main MCP handler - delegates to appropriate sub-handlers
async fn mcp_handler(
    State(state): State<AppState>,
    Json(request): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    tracing::debug!("MCP request received: {}", request);
    
    let method = request.get("method")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");
    
    match method {
        "initialize" => initialize_mcp(state, request).await,
        "tools/list" => list_tools_mcp(state, request).await,
        "tools/call" => call_tool_mcp(State(state), request).await,
        _ => {
            let error_response = json!({
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "error": {
                    "code": -32601,
                    "message": format!("Method '{}' not found", method)
                }
            });
            Ok(Json(error_response))
        }
    }
}

/// Initialize MCP server
async fn initialize_mcp(
    _state: AppState,
    request: Value,
) -> Result<Json<Value>, StatusCode> {
    let response = json!({
        "jsonrpc": "2.0", 
        "id": request.get("id"),
        "result": {
            "protocolVersion": "2024-11-05",
            "capabilities": {
                "tools": {},
                "logging": {}
            },
            "serverInfo": {
                "name": "torque-mcp-server",
                "version": env!("CARGO_PKG_VERSION")
            }
        }
    });
    Ok(Json(response))
}

/// List available MCP tools (mapped from JSON-RPC methods)
async fn list_tools_mcp(
    _state: AppState,
    request: Value,
) -> Result<Json<Value>, StatusCode> {
    let tools = vec![
        json!({
            "name": "torque_list_projects",
            "description": "List all available projects/models in the Torque server",
            "inputSchema": {
                "type": "object",
                "properties": {},
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_create_project", 
            "description": "Create a new project/model",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name of the project"
                    },
                    "description": {
                        "type": "string",
                        "description": "Optional project description"
                    }
                },
                "required": ["name"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_delete_project",
            "description": "Delete a project/model by ID",
            "inputSchema": {
                "type": "object", 
                "properties": {
                    "id": {
                        "type": "string",
                        "description": "Project/model ID to delete"
                    }
                },
                "required": ["id"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_get_project_info",
            "description": "Get detailed information about a project/model",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "id": {
                        "type": "string", 
                        "description": "Project/model ID"
                    }
                },
                "required": ["id"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_create_console_session",
            "description": "Create a new console session for interactive use",
            "inputSchema": {
                "type": "object",
                "properties": {},
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_set_project_context",
            "description": "Set the project context for a console session",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "sessionId": {
                        "type": "string",
                        "description": "Console session ID"
                    },
                    "projectId": {
                        "type": "string", 
                        "description": "Project/model ID to set as context"
                    }
                },
                "required": ["sessionId", "projectId"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_get_console_state",
            "description": "Get the current state of a console session",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "sessionId": {
                        "type": "string",
                        "description": "Console session ID"
                    }
                },
                "required": ["sessionId"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_get_server_logs",
            "description": "Get recent server log entries",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "tail": {
                        "type": "number",
                        "description": "Number of recent log lines to retrieve"
                    }
                },
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_get_cache_stats", 
            "description": "Get cache performance statistics",
            "inputSchema": {
                "type": "object",
                "properties": {},
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_load_page",
            "description": "Load page layout and configuration for a TorqueApp",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "modelId": {
                        "type": "string",
                        "description": "Model/project ID"
                    },
                    "pageName": {
                        "type": "string",
                        "description": "Optional specific page name"
                    }
                },
                "required": ["modelId"],
                "additionalProperties": false
            }
        }),
        json!({
            "name": "torque_load_entity_data",
            "description": "Load entity data from a project",
            "inputSchema": {
                "type": "object",
                "properties": {
                    "modelId": {
                        "type": "string", 
                        "description": "Model/project ID"
                    },
                    "entityType": {
                        "type": "string",
                        "description": "Entity type to load"
                    },
                    "offset": {
                        "type": "number",
                        "description": "Pagination offset"
                    },
                    "limit": {
                        "type": "number",
                        "description": "Pagination limit"
                    }
                },
                "required": ["modelId", "entityType"],
                "additionalProperties": false
            }
        })
    ];
    
    let response = json!({
        "jsonrpc": "2.0",
        "id": request.get("id"),
        "result": {
            "tools": tools
        }
    });
    Ok(Json(response))
}

/// Call an MCP tool (delegates to JSON-RPC handlers)
async fn call_tool_mcp(
    State(state): State<AppState>,
    request: Value,
) -> Result<Json<Value>, StatusCode> {
    let params = request.get("params")
        .and_then(|p| p.as_object())
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let tool_name = params.get("name")
        .and_then(|v| v.as_str())
        .ok_or(StatusCode::BAD_REQUEST)?;
    
    let empty_args = json!({});
    let arguments = params.get("arguments")
        .unwrap_or(&empty_args);
    
    // Map MCP tool names to JSON-RPC methods
    let jsonrpc_method = match tool_name {
        "torque_list_projects" => "listProjects",
        "torque_create_project" => "createProject",
        "torque_delete_project" => "deleteProject", 
        "torque_get_project_info" => "getProjectInfo",
        "torque_create_console_session" => "createConsoleSession",
        "torque_set_project_context" => "setProjectContext",
        "torque_get_console_state" => "getConsoleState",
        "torque_get_server_logs" => "getServerLogs",
        "torque_get_cache_stats" => "getCacheStats",
        "torque_load_page" => "loadPage",
        "torque_load_entity_data" => "loadEntityData",
        _ => {
            let error_response = json!({
                "jsonrpc": "2.0",
                "id": request.get("id"),
                "error": {
                    "code": -32601,
                    "message": format!("Unknown MCP tool: {}", tool_name)
                }
            });
            return Ok(Json(error_response));
        }
    };
    
    // Create JSON-RPC request 
    let jsonrpc_request = json!({
        "jsonrpc": "2.0",
        "id": request.get("id").unwrap_or(&json!(1)),
        "method": jsonrpc_method,
        "params": arguments
    });
    
    // Delegate to existing JSON-RPC handler
    match jsonrpc_handler(State(state), Json(jsonrpc_request)).await {
        Ok(Json(jsonrpc_response)) => {
            // Convert JSON-RPC response to MCP tool call response
            if let Some(result) = jsonrpc_response.get("result") {
                let mcp_response = json!({
                    "jsonrpc": "2.0",
                    "id": request.get("id"),
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": serde_json::to_string_pretty(result).unwrap_or_else(|_| result.to_string())
                            }
                        ]
                    }
                });
                Ok(Json(mcp_response))
            } else if let Some(error) = jsonrpc_response.get("error") {
                let mcp_response = json!({
                    "jsonrpc": "2.0", 
                    "id": request.get("id"),
                    "error": error
                });
                Ok(Json(mcp_response))
            } else {
                Err(StatusCode::INTERNAL_SERVER_ERROR)
            }
        },
        Err(status) => Err(status)
    }
}

// Legacy endpoints for backwards compatibility
async fn mcp_capabilities(_state: State<AppState>) -> Result<Json<Value>, StatusCode> {
    let response = json!({
        "tools": {},
        "logging": {}
    });
    Ok(Json(response))
}

async fn list_mcp_tools(
    state: State<AppState>,
) -> Result<Json<Value>, StatusCode> {
    let dummy_request = json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": "tools/list"
    });
    list_tools_mcp(state.0, dummy_request).await
}

async fn call_mcp_tool(
    State(state): State<AppState>,
    Json(request): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    call_tool_mcp(State(state), request).await
}