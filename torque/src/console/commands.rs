// Console command execution and JSON-RPC mapping
use super::{ConsoleCommand, ConsoleResult, ConsoleContext};
use serde_json::{json, Value};
use crate::common::Uuid;
use std::collections::HashMap;

/// Command mapping to JSON-RPC methods
#[derive(Debug, Clone)]
pub struct CommandMapping {
    pub pattern: &'static str,
    pub method: &'static str,
    pub requires_project: bool,
    pub param_mapping: HashMap<&'static str, &'static str>,
}

/// Get all available command mappings
pub fn get_command_mappings() -> Vec<CommandMapping> {
    vec![
        // Project management commands
        CommandMapping {
            pattern: "project list",
            method: "listProjects",
            requires_project: false,
            param_mapping: HashMap::new(),
        },
        CommandMapping {
            pattern: "project new <name> [description]",
            method: "createProject",
            requires_project: false,
            param_mapping: [("name", "name"), ("description", "description")]
                .iter()
                .cloned()
                .collect(),
        },
        CommandMapping {
            pattern: "project delete <id>",
            method: "deleteProject", 
            requires_project: false,
            param_mapping: [("id", "id")].iter().cloned().collect(),
        },
        CommandMapping {
            pattern: "project info <id>",
            method: "getProjectInfo",
            requires_project: false,
            param_mapping: [("id", "id")].iter().cloned().collect(),
        },
        CommandMapping {
            pattern: "project use <id>",
            method: "setProjectContext",
            requires_project: false,
            param_mapping: [("id", "projectId")].iter().cloned().collect(),
        },
        
        // Entity operations (require project context)
        CommandMapping {
            pattern: "entity list [type]",
            method: "loadEntityData",
            requires_project: true,
            param_mapping: [("type", "entityType")].iter().cloned().collect(),
        },
        CommandMapping {
            pattern: "entity create <type> <data>",
            method: "createEntity",
            requires_project: true,
            param_mapping: [("type", "entityType"), ("data", "data")]
                .iter()
                .cloned()
                .collect(),
        },
        CommandMapping {
            pattern: "entity update <id> <data>",
            method: "updateEntity",
            requires_project: true,
            param_mapping: [("id", "id"), ("data", "data")]
                .iter()
                .cloned()
                .collect(),
        },
        CommandMapping {
            pattern: "entity delete <id>",
            method: "deleteEntity",
            requires_project: true,
            param_mapping: [("id", "id")].iter().cloned().collect(),
        },
        
        // Layout operations (require project context)
        CommandMapping {
            pattern: "layout list",
            method: "getLayoutConfig",
            requires_project: true,
            param_mapping: HashMap::new(),
        },
        CommandMapping {
            pattern: "layout show [name]",
            method: "loadPage",
            requires_project: true,
            param_mapping: [("name", "pageName")].iter().cloned().collect(),
        },
        
        // Model operations (require project context)
        CommandMapping {
            pattern: "model show",
            method: "getModelMetadata",
            requires_project: true,
            param_mapping: HashMap::new(),
        },
        
        // Component operations (require project context)
        CommandMapping {
            pattern: "component list",
            method: "getComponentConfig",
            requires_project: true,
            param_mapping: HashMap::new(),
        },
        
        // Server operations
        CommandMapping {
            pattern: "server status",
            method: "ping",
            requires_project: false,
            param_mapping: HashMap::new(),
        },
        CommandMapping {
            pattern: "server capabilities",
            method: "getCapabilities",
            requires_project: false,
            param_mapping: HashMap::new(),
        },
        CommandMapping {
            pattern: "server logs [tail]",
            method: "getServerLogs",
            requires_project: false,
            param_mapping: [("tail", "tail")].iter().cloned().collect(),
        },
        CommandMapping {
            pattern: "cache stats",
            method: "getCacheStats",
            requires_project: false,
            param_mapping: HashMap::new(),
        },
    ]
}

/// Map a console command to a JSON-RPC request
pub fn map_command_to_jsonrpc(
    cmd: &ConsoleCommand,
    context: &ConsoleContext,
) -> Result<Value, String> {
    let mappings = get_command_mappings();
    
    // Find matching command mapping
    let mapping = find_matching_mapping(cmd, &mappings)?;
    
    // Validate project context if required
    if mapping.requires_project && !context.has_project() {
        return Err(format!(
            "Command requires project context. Use 'project use <id>' first."
        ));
    }
    
    // Build JSON-RPC parameters
    let mut params = json!({});
    
    // Add session ID for console methods
    if is_console_method(mapping.method) {
        params["sessionId"] = json!(context.session_id);
    }
    
    // Add project ID for project-scoped methods
    if mapping.requires_project {
        if let Some(project_id) = &context.project_id {
            params["modelId"] = json!(project_id.to_string());
        }
    }
    
    // Map command arguments to JSON-RPC parameters
    map_arguments(cmd, mapping, &mut params)?;
    
    // Create JSON-RPC request
    Ok(json!({
        "jsonrpc": "2.0",
        "id": 1,
        "method": mapping.method,
        "params": params
    }))
}

/// Find matching command mapping for a given command
fn find_matching_mapping<'a>(
    cmd: &ConsoleCommand,
    mappings: &'a [CommandMapping],
) -> Result<&'a CommandMapping, String> {
    for mapping in mappings {
        if matches_pattern(cmd, mapping.pattern) {
            return Ok(mapping);
        }
    }
    
    Err(format!("No mapping found for command: {} {}", 
        cmd.command, 
        cmd.subcommand.as_deref().unwrap_or("")
    ))
}

/// Check if command matches a pattern
fn matches_pattern(cmd: &ConsoleCommand, pattern: &str) -> bool {
    let pattern_parts: Vec<&str> = pattern.split_whitespace().collect();
    
    if pattern_parts.is_empty() {
        return false;
    }
    
    // Check command matches
    if pattern_parts[0] != cmd.command {
        return false;
    }
    
    // Check subcommand matches if present
    if pattern_parts.len() > 1 {
        let pattern_subcommand = pattern_parts[1];
        
        // Skip parameter placeholders like <name>, [description]
        if !pattern_subcommand.starts_with('<') && !pattern_subcommand.starts_with('[') {
            if cmd.subcommand.as_deref() != Some(pattern_subcommand) {
                return false;
            }
        }
    }
    
    true
}

/// Map command arguments to JSON-RPC parameters
fn map_arguments(
    cmd: &ConsoleCommand,
    mapping: &CommandMapping,
    params: &mut Value,
) -> Result<(), String> {
    // Handle special case for "project use" command
    if mapping.method == "setProjectContext" && !cmd.args.is_empty() {
        params["projectId"] = json!(cmd.args[0]);
        return Ok(());
    }
    
    // Map positional arguments based on pattern
    let pattern_parts: Vec<&str> = mapping.pattern.split_whitespace().collect();
    let mut arg_index = 0;
    
    for (i, part) in pattern_parts.iter().enumerate().skip(1) {
        if part.starts_with('<') && part.ends_with('>') {
            // Required argument
            let param_name = &part[1..part.len()-1];
            if arg_index < cmd.args.len() {
                if let Some(json_param) = mapping.param_mapping.get(param_name) {
                    // Try to parse as JSON if it looks like JSON, otherwise use as string
                    let value = if cmd.args[arg_index].starts_with('{') || cmd.args[arg_index].starts_with('[') {
                        serde_json::from_str(&cmd.args[arg_index])
                            .unwrap_or_else(|_| json!(cmd.args[arg_index]))
                    } else {
                        json!(cmd.args[arg_index])
                    };
                    params[json_param] = value;
                }
                arg_index += 1;
            } else {
                return Err(format!("Missing required argument: {}", param_name));
            }
        } else if part.starts_with('[') && part.ends_with(']') {
            // Optional argument
            let param_name = &part[1..part.len()-1];
            if arg_index < cmd.args.len() {
                if let Some(json_param) = mapping.param_mapping.get(param_name) {
                    params[json_param] = json!(cmd.args[arg_index]);
                }
                arg_index += 1;
            }
        }
    }
    
    // Map flags
    for (flag, value) in &cmd.flags {
        if let Some(json_param) = mapping.param_mapping.get(flag.as_str()) {
            if value == "true" {
                params[json_param] = json!(true);
            } else {
                // Try to parse as number if possible
                if let Ok(num) = value.parse::<i64>() {
                    params[json_param] = json!(num);
                } else {
                    params[json_param] = json!(value);
                }
            }
        }
    }
    
    Ok(())
}

/// Check if a method is a console-specific method that needs session ID
fn is_console_method(method: &str) -> bool {
    matches!(method, 
        "createConsoleSession" | 
        "setProjectContext" | 
        "getConsoleState"
    )
}

/// Format JSON-RPC response for console display
pub fn format_response_for_console(response: &Value) -> ConsoleResult {
    if let Some(error) = response.get("error") {
        return ConsoleResult {
            success: false,
            output: format!("Error: {}", error.get("message").unwrap_or(&json!("Unknown error"))),
            data: None,
            error: Some(error.to_string()),
        };
    }
    
    if let Some(result) = response.get("result") {
        let formatted_output = format_result_for_display(result);
        return ConsoleResult {
            success: true,
            output: formatted_output,
            data: Some(result.clone()),
            error: None,
        };
    }
    
    ConsoleResult {
        success: false,
        output: "Invalid JSON-RPC response".to_string(),
        data: None,
        error: Some("No result or error in response".to_string()),
    }
}

/// Format JSON-RPC result for human-readable display
fn format_result_for_display(result: &Value) -> String {
    match result {
        Value::Object(obj) => {
            // Special formatting for common response types
            if let Some(projects) = obj.get("projects") {
                format_projects_list(projects)
            } else if obj.contains_key("entities") && obj.contains_key("total") {
                format_entity_list(result)
            } else if obj.contains_key("sessionId") {
                format_session_info(result)
            } else if obj.contains_key("status") && obj.get("status").unwrap_or(&json!("")).as_str() == Some("ok") {
                "Server is running".to_string()
            } else {
                serde_json::to_string_pretty(result).unwrap_or_else(|_| result.to_string())
            }
        },
        Value::Array(arr) => {
            if arr.is_empty() {
                "No results found".to_string()
            } else {
                format!("Found {} items:\n{}", arr.len(), 
                    serde_json::to_string_pretty(result).unwrap_or_else(|_| result.to_string()))
            }
        },
        _ => result.to_string(),
    }
}

/// Format projects list for console display
fn format_projects_list(projects: &Value) -> String {
    if let Value::Array(projects_array) = projects {
        if projects_array.is_empty() {
            return "No projects found".to_string();
        }
        
        let mut output = format!("Found {} projects:\n\n", projects_array.len());
        for project in projects_array {
            if let Value::Object(obj) = project {
                let id = obj.get("id").and_then(|v| v.as_str()).unwrap_or("unknown");
                let name = obj.get("name").and_then(|v| v.as_str()).unwrap_or("unnamed");
                let description = obj.get("description")
                    .and_then(|v| v.as_str())
                    .unwrap_or("No description");
                let entities = obj.get("entityCount").and_then(|v| v.as_u64()).unwrap_or(0);
                let layouts = obj.get("layoutCount").and_then(|v| v.as_u64()).unwrap_or(0);
                
                output.push_str(&format!(
                    "  {} - {} ({})\n    Entities: {}, Layouts: {}\n\n",
                    id, name, description, entities, layouts
                ));
            }
        }
        output
    } else {
        "Invalid projects data".to_string()
    }
}

/// Format entity list for console display  
fn format_entity_list(result: &Value) -> String {
    let total = result.get("total").and_then(|v| v.as_u64()).unwrap_or(0);
    if total == 0 {
        return "No entities found".to_string();
    }
    
    format!("Found {} entities:\n{}", total, 
        serde_json::to_string_pretty(result).unwrap_or_else(|_| result.to_string()))
}

/// Format session info for console display
fn format_session_info(result: &Value) -> String {
    let session_id = result.get("sessionId").and_then(|v| v.as_str()).unwrap_or("unknown");
    let context = result.get("context");
    
    if let Some(ctx) = context {
        let project_name = ctx.get("projectName").and_then(|v| v.as_str());
        if let Some(name) = project_name {
            format!("Session {} - Project: {}", session_id, name)
        } else {
            format!("Session {} - No project selected", session_id)
        }
    } else {
        format!("Session {}", session_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_matches_pattern() {
        let cmd = super::super::parser::parse_command("project list").unwrap();
        assert!(matches_pattern(&cmd, "project list"));
        assert!(!matches_pattern(&cmd, "entity list"));
    }

    #[test]
    fn test_matches_pattern_with_args() {
        let cmd = super::super::parser::parse_command("project new myproject").unwrap();
        assert!(matches_pattern(&cmd, "project new <name>"));
        assert!(matches_pattern(&cmd, "project new <name> [description]"));
    }

    #[test]
    fn test_find_matching_mapping() {
        let cmd = super::super::parser::parse_command("project list").unwrap();
        let mappings = get_command_mappings();
        let mapping = find_matching_mapping(&cmd, &mappings).unwrap();
        assert_eq!(mapping.method, "listProjects");
    }
}