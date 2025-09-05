// Console tab completion system
use super::{ConsoleCommand, ConsoleContext};
use super::commands::get_command_mappings;

/// Completion suggestion
#[derive(Debug, Clone)]
pub struct CompletionSuggestion {
    pub text: String,
    pub description: String,
    pub category: CompletionCategory,
}

#[derive(Debug, Clone, PartialEq)]
pub enum CompletionCategory {
    Command,
    Subcommand,
    Argument,
    Flag,
    ProjectId,
    EntityType,
}

/// Generate completion suggestions for a partial command
pub fn get_completions(input: &str, context: &ConsoleContext) -> Vec<CompletionSuggestion> {
    let input = input.trim();
    
    if input.is_empty() {
        return get_root_commands(context);
    }
    
    let parts: Vec<&str> = input.split_whitespace().collect();
    
    match parts.len() {
        1 => {
            // Completing command
            let prefix = parts[0];
            get_matching_commands(prefix, context)
        },
        2 => {
            // Completing subcommand
            let command = parts[0];
            let prefix = parts[1];
            get_matching_subcommands(command, prefix, context)
        },
        _ => {
            // Completing arguments or flags
            get_argument_completions(input, context)
        }
    }
}

/// Get all available root commands for the current context
fn get_root_commands(context: &ConsoleContext) -> Vec<CompletionSuggestion> {
    let mut suggestions = vec![
        CompletionSuggestion {
            text: "project".to_string(),
            description: "Project management commands".to_string(),
            category: CompletionCategory::Command,
        },
        CompletionSuggestion {
            text: "server".to_string(), 
            description: "Server status and management".to_string(),
            category: CompletionCategory::Command,
        },
        CompletionSuggestion {
            text: "help".to_string(),
            description: "Show help information".to_string(),
            category: CompletionCategory::Command,
        },
        CompletionSuggestion {
            text: "clear".to_string(),
            description: "Clear console output".to_string(),
            category: CompletionCategory::Command,
        },
        CompletionSuggestion {
            text: "history".to_string(),
            description: "Show command history".to_string(),
            category: CompletionCategory::Command,
        },
        CompletionSuggestion {
            text: "js".to_string(),
            description: "Execute JavaScript code".to_string(),
            category: CompletionCategory::Command,
        },
    ];
    
    // Add project-scoped commands if project is selected
    if context.has_project() {
        suggestions.extend(vec![
            CompletionSuggestion {
                text: "entity".to_string(),
                description: "Entity CRUD operations".to_string(),
                category: CompletionCategory::Command,
            },
            CompletionSuggestion {
                text: "layout".to_string(),
                description: "Layout management".to_string(),
                category: CompletionCategory::Command,
            },
            CompletionSuggestion {
                text: "model".to_string(),
                description: "Model inspection".to_string(),
                category: CompletionCategory::Command,
            },
            CompletionSuggestion {
                text: "component".to_string(),
                description: "Component information".to_string(),
                category: CompletionCategory::Command,
            },
        ]);
    }
    
    suggestions
}

/// Get commands matching a prefix
fn get_matching_commands(prefix: &str, context: &ConsoleContext) -> Vec<CompletionSuggestion> {
    get_root_commands(context)
        .into_iter()
        .filter(|s| s.text.starts_with(prefix))
        .collect()
}

/// Get subcommands for a given command
fn get_matching_subcommands(
    command: &str, 
    prefix: &str, 
    context: &ConsoleContext
) -> Vec<CompletionSuggestion> {
    let mut suggestions = Vec::new();
    
    match command {
        "project" => {
            suggestions.extend(vec![
                CompletionSuggestion {
                    text: "list".to_string(),
                    description: "List all projects".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "new".to_string(),
                    description: "Create a new project".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "delete".to_string(),
                    description: "Delete a project".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "info".to_string(),
                    description: "Show project information".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "use".to_string(),
                    description: "Select project context".to_string(),
                    category: CompletionCategory::Subcommand,
                },
            ]);
        },
        "server" => {
            suggestions.extend(vec![
                CompletionSuggestion {
                    text: "status".to_string(),
                    description: "Show server status".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "capabilities".to_string(),
                    description: "List server capabilities".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "logs".to_string(),
                    description: "Show server logs".to_string(),
                    category: CompletionCategory::Subcommand,
                },
            ]);
        },
        "entity" if context.has_project() => {
            suggestions.extend(vec![
                CompletionSuggestion {
                    text: "list".to_string(),
                    description: "List entities".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "create".to_string(),
                    description: "Create new entity".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "update".to_string(),
                    description: "Update existing entity".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "delete".to_string(),
                    description: "Delete entity".to_string(),
                    category: CompletionCategory::Subcommand,
                },
            ]);
        },
        "layout" if context.has_project() => {
            suggestions.extend(vec![
                CompletionSuggestion {
                    text: "list".to_string(),
                    description: "List layouts".to_string(),
                    category: CompletionCategory::Subcommand,
                },
                CompletionSuggestion {
                    text: "show".to_string(),
                    description: "Show layout details".to_string(),
                    category: CompletionCategory::Subcommand,
                },
            ]);
        },
        "model" if context.has_project() => {
            suggestions.extend(vec![
                CompletionSuggestion {
                    text: "show".to_string(),
                    description: "Show model information".to_string(),
                    category: CompletionCategory::Subcommand,
                },
            ]);
        },
        "component" if context.has_project() => {
            suggestions.extend(vec![
                CompletionSuggestion {
                    text: "list".to_string(),
                    description: "List available components".to_string(),
                    category: CompletionCategory::Subcommand,
                },
            ]);
        },
        "cache" => {
            suggestions.extend(vec![
                CompletionSuggestion {
                    text: "stats".to_string(),
                    description: "Show cache statistics".to_string(),
                    category: CompletionCategory::Subcommand,
                },
            ]);
        },
        _ => {},
    }
    
    // Filter by prefix
    suggestions.into_iter()
        .filter(|s| s.text.starts_with(prefix))
        .collect()
}

/// Get argument completions for complex commands
fn get_argument_completions(input: &str, context: &ConsoleContext) -> Vec<CompletionSuggestion> {
    // Parse the partial command to understand what we're completing
    if let Ok(partial_cmd) = super::parser::parse_command(input) {
        match (partial_cmd.command.as_str(), partial_cmd.subcommand.as_deref()) {
            ("project", Some("use")) | ("project", Some("info")) | ("project", Some("delete")) => {
                // Complete with project IDs - in a real implementation, 
                // this would query available projects
                vec![
                    CompletionSuggestion {
                        text: "<project-id>".to_string(),
                        description: "Enter project ID or use 'project list' to see available projects".to_string(),
                        category: CompletionCategory::ProjectId,
                    }
                ]
            },
            ("entity", Some("list")) => {
                // Complete with entity types - in a real implementation,
                // this would query the current project's entity types
                get_entity_type_completions(context)
            },
            ("entity", Some("create")) => {
                if partial_cmd.args.is_empty() {
                    get_entity_type_completions(context)
                } else {
                    vec![
                        CompletionSuggestion {
                            text: "'{}'".to_string(),
                            description: "Enter JSON data for the new entity".to_string(),
                            category: CompletionCategory::Argument,
                        }
                    ]
                }
            },
            _ => {
                // Check for common flags
                get_common_flag_completions(input)
            }
        }
    } else {
        Vec::new()
    }
}

/// Get entity type completions for the current project
fn get_entity_type_completions(context: &ConsoleContext) -> Vec<CompletionSuggestion> {
    // In a real implementation, this would query the current project's model
    // For now, return common entity types as examples
    if context.has_project() {
        vec![
            CompletionSuggestion {
                text: "user".to_string(),
                description: "User entity".to_string(),
                category: CompletionCategory::EntityType,
            },
            CompletionSuggestion {
                text: "todo".to_string(),
                description: "Todo item entity".to_string(),
                category: CompletionCategory::EntityType,
            },
            CompletionSuggestion {
                text: "post".to_string(),
                description: "Post entity".to_string(),
                category: CompletionCategory::EntityType,
            },
        ]
    } else {
        Vec::new()
    }
}

/// Get common flag completions
fn get_common_flag_completions(input: &str) -> Vec<CompletionSuggestion> {
    let mut suggestions = Vec::new();
    
    // Add common flags if not already present
    if !input.contains("--limit") {
        suggestions.push(CompletionSuggestion {
            text: "--limit".to_string(),
            description: "Limit number of results".to_string(),
            category: CompletionCategory::Flag,
        });
    }
    
    if !input.contains("--offset") {
        suggestions.push(CompletionSuggestion {
            text: "--offset".to_string(),
            description: "Skip number of results".to_string(),
            category: CompletionCategory::Flag,
        });
    }
    
    if !input.contains("--type") {
        suggestions.push(CompletionSuggestion {
            text: "--type".to_string(),
            description: "Filter by type".to_string(),
            category: CompletionCategory::Flag,
        });
    }
    
    suggestions
}

/// Generate help text for a command
pub fn get_command_help(command: &str, subcommand: Option<&str>) -> String {
    let mappings = get_command_mappings();
    
    match (command, subcommand) {
        ("help", None) | ("", None) => {
            let mut help = String::from("Torque Interactive Console\n\n");
            help.push_str("Available commands:\n\n");
            
            help.push_str("Global Commands (available without project context):\n");
            help.push_str("  project list                    - List all projects\n");
            help.push_str("  project new <name> [desc]       - Create new project\n");
            help.push_str("  project use <id>                - Select project context\n");
            help.push_str("  project info <id>               - Show project details\n");
            help.push_str("  project delete <id>             - Delete project\n");
            help.push_str("  server status                   - Show server status\n");
            help.push_str("  server capabilities             - List server capabilities\n");
            help.push_str("  server logs [--tail <n>]        - Show server logs\n");
            help.push_str("  cache stats                     - Show cache statistics\n");
            help.push_str("  help [command]                  - Show help\n");
            help.push_str("  clear                           - Clear console\n");
            help.push_str("  history                         - Show command history\n");
            help.push_str("  exit                            - Close console\n\n");
            
            help.push_str("Project-Scoped Commands (require 'project use <id>' first):\n");
            help.push_str("  entity list [type]              - List entities\n");
            help.push_str("  entity create <type> <json>     - Create entity\n");
            help.push_str("  entity update <id> <json>       - Update entity\n");
            help.push_str("  entity delete <id>              - Delete entity\n");
            help.push_str("  layout list                     - List layouts\n");
            help.push_str("  layout show [name]              - Show layout details\n");
            help.push_str("  model show                      - Show model information\n");
            help.push_str("  component list                  - List components\n\n");
            
            help.push_str("Special Commands:\n");
            help.push_str("  js> <code>                      - Execute JavaScript\n\n");
            
            help.push_str("Use Ctrl+~ to toggle console visibility\n");
            help.push_str("Use Tab for auto-completion\n");
            
            help
        },
        (cmd, subcmd) => {
            // Find specific command help
            let pattern = match subcmd {
                Some(sub) => format!("{} {}", cmd, sub),
                None => cmd.to_string(),
            };
            
            for mapping in mappings {
                if mapping.pattern.starts_with(&pattern) {
                    return format!(
                        "Command: {}\nPattern: {}\nDescription: Maps to JSON-RPC method '{}'\nRequires project: {}\n",
                        pattern,
                        mapping.pattern,
                        mapping.method,
                        mapping.requires_project
                    );
                }
            }
            
            format!("No help available for command: {}", pattern)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::common::Uuid;

    #[test]
    fn test_get_root_commands_no_project() {
        let context = ConsoleContext::new("test-session".to_string());
        let suggestions = get_root_commands(&context);
        
        assert!(suggestions.iter().any(|s| s.text == "project"));
        assert!(suggestions.iter().any(|s| s.text == "server"));
        assert!(!suggestions.iter().any(|s| s.text == "entity"));
    }

    #[test]
    fn test_get_root_commands_with_project() {
        let context = ConsoleContext::new("test-session".to_string())
            .with_project(Uuid::new_v4(), "test-project".to_string());
        let suggestions = get_root_commands(&context);
        
        assert!(suggestions.iter().any(|s| s.text == "project"));
        assert!(suggestions.iter().any(|s| s.text == "entity"));
        assert!(suggestions.iter().any(|s| s.text == "layout"));
    }

    #[test]
    fn test_command_matching() {
        let context = ConsoleContext::new("test-session".to_string());
        let suggestions = get_matching_commands("pr", &context);
        
        assert!(suggestions.iter().any(|s| s.text == "project"));
        assert!(!suggestions.iter().any(|s| s.text == "server"));
    }

    #[test]
    fn test_subcommand_completion() {
        let context = ConsoleContext::new("test-session".to_string());
        let suggestions = get_matching_subcommands("project", "l", &context);
        
        assert!(suggestions.iter().any(|s| s.text == "list"));
        assert!(!suggestions.iter().any(|s| s.text == "new"));
    }

    #[test]
    fn test_help_generation() {
        let help = get_command_help("help", None);
        assert!(help.contains("Torque Interactive Console"));
        assert!(help.contains("project list"));
        assert!(help.contains("entity create"));
    }
}