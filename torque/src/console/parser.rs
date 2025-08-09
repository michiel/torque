// Console command parser
use super::{ConsoleCommand, ConsoleResult};
use std::collections::HashMap;

/// Parse a raw console command into structured ConsoleCommand
pub fn parse_command(input: &str) -> Result<ConsoleCommand, String> {
    let input = input.trim();
    if input.is_empty() {
        return Err("Empty command".to_string());
    }

    let parts: Vec<&str> = input.split_whitespace().collect();
    if parts.is_empty() {
        return Err("No command provided".to_string());
    }

    let mut args = Vec::new();
    let mut flags = HashMap::new();
    let mut i = 0;

    // Parse command and subcommand
    let command = parts[0].to_string();
    let mut subcommand = None;
    
    i += 1;
    
    // Check if second part is a subcommand (not a flag or argument)
    if i < parts.len() && !parts[i].starts_with('-') {
        subcommand = Some(parts[i].to_string());
        i += 1;
    }

    // Parse remaining arguments and flags
    while i < parts.len() {
        let part = parts[i];
        
        if part.starts_with("--") {
            // Long flag
            let flag_name = &part[2..];
            if i + 1 < parts.len() && !parts[i + 1].starts_with('-') {
                // Flag with value
                flags.insert(flag_name.to_string(), parts[i + 1].to_string());
                i += 2;
            } else {
                // Boolean flag
                flags.insert(flag_name.to_string(), "true".to_string());
                i += 1;
            }
        } else if part.starts_with('-') && part.len() > 1 {
            // Short flag(s)
            for ch in part[1..].chars() {
                flags.insert(ch.to_string(), "true".to_string());
            }
            i += 1;
        } else {
            // Regular argument
            args.push(part.to_string());
            i += 1;
        }
    }

    Ok(ConsoleCommand {
        raw: input.to_string(),
        command,
        subcommand,
        args,
        flags,
    })
}

/// Validate command structure and requirements
pub fn validate_command(cmd: &ConsoleCommand, has_project: bool) -> Result<(), String> {
    match cmd.command.as_str() {
        // Global commands (no project required)
        "project" | "server" | "help" | "clear" | "history" | "exit" => Ok(()),
        
        // Project-scoped commands (require project context)
        "entity" | "layout" | "model" | "component" => {
            if has_project {
                Ok(())
            } else {
                Err(format!(
                    "Command '{}' requires a project context. Use 'project use <id>' first.",
                    cmd.command
                ))
            }
        },
        
        // JavaScript evaluation
        "js" => Ok(()),
        
        // Unknown command
        _ => Err(format!("Unknown command: {}", cmd.command)),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_simple_command() {
        let cmd = parse_command("project list").unwrap();
        assert_eq!(cmd.command, "project");
        assert_eq!(cmd.subcommand, Some("list".to_string()));
        assert_eq!(cmd.args.len(), 0);
        assert_eq!(cmd.flags.len(), 0);
    }

    #[test]
    fn test_parse_command_with_args() {
        let cmd = parse_command("entity create todo '{\"title\": \"test\"}'").unwrap();
        assert_eq!(cmd.command, "entity");
        assert_eq!(cmd.subcommand, Some("create".to_string()));
        assert_eq!(cmd.args, vec!["todo", "{\"title\": \"test\"}"]);
    }

    #[test]
    fn test_parse_command_with_flags() {
        let cmd = parse_command("entity list --type todo --limit 10 -v").unwrap();
        assert_eq!(cmd.command, "entity");
        assert_eq!(cmd.subcommand, Some("list".to_string()));
        assert_eq!(cmd.flags.get("type"), Some(&"todo".to_string()));
        assert_eq!(cmd.flags.get("limit"), Some(&"10".to_string()));
        assert_eq!(cmd.flags.get("v"), Some(&"true".to_string()));
    }

    #[test]
    fn test_validate_global_command() {
        let cmd = parse_command("project list").unwrap();
        assert!(validate_command(&cmd, false).is_ok());
    }

    #[test]
    fn test_validate_project_command_without_context() {
        let cmd = parse_command("entity list").unwrap();
        assert!(validate_command(&cmd, false).is_err());
    }

    #[test]
    fn test_validate_project_command_with_context() {
        let cmd = parse_command("entity list").unwrap();
        assert!(validate_command(&cmd, true).is_ok());
    }
}