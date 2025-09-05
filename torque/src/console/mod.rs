// Console command parsing and execution module
pub mod parser;
pub mod commands;
pub mod completion;

use serde::{Serialize, Deserialize};
use serde_json::Value;
use crate::common::Uuid;

/// Console command structure
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsoleCommand {
    pub raw: String,
    pub command: String,
    pub subcommand: Option<String>,
    pub args: Vec<String>,
    pub flags: std::collections::HashMap<String, String>,
}

/// Console command result
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ConsoleResult {
    pub success: bool,
    pub output: String,
    pub data: Option<Value>,
    pub error: Option<String>,
}

/// Console execution context
#[derive(Debug, Clone)]
pub struct ConsoleContext {
    pub session_id: String,
    pub project_id: Option<Uuid>,
    pub project_name: Option<String>,
    pub capabilities: Vec<String>,
}

impl ConsoleContext {
    pub fn new(session_id: String) -> Self {
        Self {
            session_id,
            project_id: None,
            project_name: None,
            capabilities: vec![
                "project".to_string(),
                "server".to_string(),
                "help".to_string(),
            ],
        }
    }

    pub fn with_project(mut self, project_id: Uuid, project_name: String) -> Self {
        self.project_id = Some(project_id);
        self.project_name = Some(project_name);
        self.capabilities.extend(vec![
            "entity".to_string(),
            "layout".to_string(),
            "model".to_string(),
            "component".to_string(),
        ]);
        self
    }

    pub fn has_project(&self) -> bool {
        self.project_id.is_some()
    }

    pub fn prompt(&self) -> String {
        match &self.project_name {
            Some(name) => format!("torque:{}> ", name),
            None => "torque> ".to_string(),
        }
    }
}