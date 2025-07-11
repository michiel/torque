use clap::{Parser, Subcommand};
use std::path::PathBuf;
use anyhow::Result;
use torque::{Config, database, services::ServiceRegistry, server};
use std::sync::Arc;

#[derive(Parser)]
#[clap(author, version, about = "High-performance platform for designing, running and presenting applications")]
struct Cli {
    #[clap(subcommand)]
    command: Commands,
    
    /// Database URL (sqlite:// or postgresql://)
    #[clap(long, value_name = "URL")]
    database_url: Option<String>,
    
    /// Configuration file path
    #[clap(long, short, default_value = "torque.toml")]
    config: PathBuf,
    
    /// Log level
    #[clap(long, default_value = "info")]
    log_level: String,
    
    /// Enable performance optimizations
    #[clap(long)]
    optimize: bool,
}

#[derive(Subcommand)]
enum Commands {
    /// Start the Torque server
    Server {
        /// HTTP server bind address
        #[clap(long, default_value = "127.0.0.1:8080")]
        bind: String,
        
        /// GraphQL endpoint path
        #[clap(long, default_value = "/graphql")]
        graphql_path: String,
        
        /// JSON-RPC endpoint path
        #[clap(long, default_value = "/jsonrpc")]
        jsonrpc_path: String,
        
        /// MCP endpoint path
        #[clap(long, default_value = "/mcp")]
        mcp_path: String,
        
        /// Enable hot reload for development
        #[clap(long)]
        hot_reload: bool,
    },
    
    /// Initialize a new Torque project
    Init {
        /// Project directory
        path: PathBuf,
        
        /// Project name
        #[clap(long)]
        name: Option<String>,
        
        /// Database type (sqlite or postgres)
        #[clap(long, default_value = "sqlite")]
        database: String,
    },
    
    /// Database migrations
    Migrate {
        /// Run pending migrations
        #[clap(long)]
        up: bool,
        
        /// Rollback last migration
        #[clap(long)]
        down: bool,
        
        /// Show migration status
        #[clap(long)]
        status: bool,
    },
    
    /// Model operations
    Model {
        #[clap(subcommand)]
        command: ModelCommands,
    },
    
    /// XFlow operations
    XFlow {
        #[clap(subcommand)]
        command: XFlowCommands,
    },
}

#[derive(Subcommand)]
enum ModelCommands {
    /// List all models
    List,
    
    /// Create a new model
    Create {
        name: String,
        #[clap(long)]
        description: Option<String>,
    },
    
    /// Export model to JSON
    Export {
        #[clap(long)]
        model_id: String,
        
        #[clap(long)]
        output: PathBuf,
    },
    
    /// Import model from JSON
    Import {
        #[clap(long)]
        input: PathBuf,
        
        #[clap(long)]
        name: Option<String>,
    },
    
    /// Delete a model
    Delete {
        model_id: String,
    },
}

#[derive(Subcommand)]
enum XFlowCommands {
    /// List all XFlows
    List,
    
    /// Execute an XFlow
    Execute {
        xflow_id: String,
        
        #[clap(long)]
        input: Option<String>,
        
        #[clap(long)]
        timeout: Option<u64>,
    },
    
    /// Validate an XFlow
    Validate {
        xflow_id: String,
    },
    
    /// Test an XFlow with sample data
    Test {
        xflow_id: String,
        
        #[clap(long)]
        test_data: PathBuf,
    },
}

#[tokio::main]
async fn main() -> Result<()> {
    let cli = Cli::parse();
    
    // Initialize logging with performance optimizations
    init_logging(&cli.log_level)?;
    
    // Load configuration
    let mut config = load_config(&cli.config).await?;
    
    // Override config with CLI parameters
    if let Some(database_url) = cli.database_url {
        config.database.url = database_url;
    }
    
    tracing::info!("Starting Torque - High-performance application platform");
    
    match cli.command {
        Commands::Server { 
            bind, 
            graphql_path: _,
            jsonrpc_path: _,
            mcp_path: _,
            hot_reload: _,
        } => {
            // Override server bind address
            config.server.bind = bind;
            
            tracing::info!("Starting Torque server on {}", config.server.bind);
            
            // Initialize database connection
            let db = database::setup_database(&config).await?;
            tracing::info!("Database connection established");
            
            // Initialize service registry
            let services = Arc::new(ServiceRegistry::new(db, config.clone()).await?);
            tracing::info!("Service registry initialized");
            
            // Load seed data for development
            if let Err(e) = services.model_service.load_seed_data().await {
                tracing::warn!("Failed to load seed data: {}", e);
            }
            
            // Start the HTTP server
            server::start_server(config, services).await?;
        }
        
        Commands::Init { path, name, database } => {
            tracing::info!("Initializing new Torque project at {:?}", path);
            // TODO: Implement project initialization
            println!("Project init not yet implemented - path: {:?}, name: {:?}, database: {}", path, name, database);
        }
        
        Commands::Migrate { up, down, status } => {
            if status {
                println!("Migration status not yet implemented");
            } else if up {
                println!("Migration up not yet implemented");
            } else if down {
                println!("Migration down not yet implemented");
            }
        }
        
        Commands::Model { command } => {
            handle_model_command(command, &config).await?;
        }
        
        Commands::XFlow { command } => {
            handle_xflow_command(command).await?;
        }
    }
    
    Ok(())
}

fn init_logging(log_level: &str) -> Result<()> {
    use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};
    
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| {
                    format!("torque={},tower_http=debug,axum::routing=trace", log_level).into()
                }),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();
    
    Ok(())
}

async fn load_config(path: &PathBuf) -> Result<Config> {
    // Try to load from file, fallback to defaults
    if path.exists() {
        let contents = tokio::fs::read_to_string(path).await?;
        let config: Config = toml::from_str(&contents)?;
        tracing::info!("Loaded configuration from {:?}", path);
        Ok(config)
    } else {
        tracing::info!("Configuration file not found, using defaults");
        Ok(Config::default())
    }
}

async fn handle_model_command(command: ModelCommands, config: &Config) -> Result<()> {
    match command {
        ModelCommands::List => {
            handle_model_list(config).await?;
        }
        ModelCommands::Create { name, description } => {
            handle_model_create(config, name, description).await?;
        }
        ModelCommands::Export { model_id, output } => {
            handle_model_export(config, model_id, output).await?;
        }
        ModelCommands::Import { input, name } => {
            handle_model_import(config, input, name).await?;
        }
        ModelCommands::Delete { model_id } => {
            handle_model_delete(config, model_id).await?;
        }
    }
    Ok(())
}

async fn handle_model_list(config: &Config) -> Result<()> {
    let db = database::setup_database(config).await?;
    let services = Arc::new(ServiceRegistry::new(db, config.clone()).await?);
    
    let models = services.model_service.get_models().await?;
    
    if models.is_empty() {
        println!("No models found.");
        return Ok(());
    }
    
    println!("Found {} model(s):", models.len());
    println!();
    
    for model in models {
        println!("ID: {}", model.id);
        println!("Name: {}", model.name);
        if let Some(description) = &model.description {
            println!("Description: {}", description);
        }
        println!("Version: {}", model.version);
        println!("Created: {}", model.created_at.format("%Y-%m-%d %H:%M:%S"));
        println!("Updated: {}", model.updated_at.format("%Y-%m-%d %H:%M:%S"));
        println!("Entities: {}", model.entities.len());
        println!("Relationships: {}", model.relationships.len());
        println!("Flows: {}", model.flows.len());
        println!("Layouts: {}", model.layouts.len());
        println!();
    }
    
    Ok(())
}

async fn handle_model_create(config: &Config, name: String, description: Option<String>) -> Result<()> {
    use torque::services::model::CreateModelInput;
    
    let db = database::setup_database(config).await?;
    let services = Arc::new(ServiceRegistry::new(db, config.clone()).await?);
    
    let input = CreateModelInput {
        name: name.clone(),
        description,
        config: None,
    };
    
    let model = services.model_service.create_model(input).await?;
    
    println!("Created model: {}", model.name);
    println!("ID: {}", model.id);
    println!("Version: {}", model.version);
    
    Ok(())
}

async fn handle_model_export(config: &Config, model_id: String, output: PathBuf) -> Result<()> {
    use uuid::Uuid;
    use std::io::Write;
    
    let db = database::setup_database(config).await?;
    let services = Arc::new(ServiceRegistry::new(db, config.clone()).await?);
    
    let uuid = model_id.parse::<Uuid>()
        .map_err(|_| anyhow::anyhow!("Invalid model ID format"))?;
    
    let model = services.model_service.get_model(uuid).await?
        .ok_or_else(|| anyhow::anyhow!("Model not found"))?;
    
    // Create export format
    let export_data = create_export_format(&model)?;
    
    // Write to file
    let json = serde_json::to_string_pretty(&export_data)?;
    let mut file = std::fs::File::create(&output)?;
    file.write_all(json.as_bytes())?;
    
    println!("Exported model '{}' to {:?}", model.name, output);
    println!("Model ID: {}", model.id);
    println!("Entities: {}", model.entities.len());
    println!("Relationships: {}", model.relationships.len());
    println!("Flows: {}", model.flows.len());
    println!("Layouts: {}", model.layouts.len());
    
    Ok(())
}

async fn handle_model_import(config: &Config, input: PathBuf, name_override: Option<String>) -> Result<()> {
    use std::fs;
    use serde_json::Value;
    
    let db = database::setup_database(config).await?;
    let services = Arc::new(ServiceRegistry::new(db, config.clone()).await?);
    
    // Read and parse JSON file
    let json_content = fs::read_to_string(&input)?;
    let import_data: Value = serde_json::from_str(&json_content)?;
    
    // Validate against schema (basic validation)
    validate_import_data(&import_data)?;
    
    // Convert to model and import
    let model = services.model_service.import_model(json_content).await?;
    
    // Override name if provided
    if let Some(new_name) = name_override {
        use torque::services::model::UpdateModelInput;
        let update_input = UpdateModelInput {
            name: Some(new_name.clone()),
            description: None,
            config: None,
        };
        let updated_model = services.model_service.update_model(model.id, update_input).await?;
        println!("Imported model as: {}", updated_model.name);
    } else {
        println!("Imported model: {}", model.name);
    }
    
    println!("Model ID: {}", model.id);
    println!("Entities: {}", model.entities.len());
    println!("Relationships: {}", model.relationships.len());
    println!("Flows: {}", model.flows.len());
    println!("Layouts: {}", model.layouts.len());
    
    Ok(())
}

async fn handle_model_delete(config: &Config, model_id: String) -> Result<()> {
    use uuid::Uuid;
    
    let db = database::setup_database(config).await?;
    let services = Arc::new(ServiceRegistry::new(db, config.clone()).await?);
    
    let uuid = model_id.parse::<Uuid>()
        .map_err(|_| anyhow::anyhow!("Invalid model ID format"))?;
    
    // Get model info before deletion
    let model = services.model_service.get_model(uuid).await?
        .ok_or_else(|| anyhow::anyhow!("Model not found"))?;
    
    let deleted = services.model_service.delete_model(uuid).await?;
    
    if deleted {
        println!("Deleted model: {}", model.name);
        println!("Model ID: {}", model.id);
    } else {
        println!("Failed to delete model");
    }
    
    Ok(())
}

fn create_export_format(model: &torque::model::types::TorqueModel) -> Result<serde_json::Value> {
    use serde_json::json;
    
    let mut export_data = json!({
        "name": model.name,
        "description": model.description,
        "version": model.version,
        "created_by": model.created_by,
        "config": model.config,
        "entities": [],
        "relationships": [],
        "flows": [],
        "layouts": []
    });
    
    // Convert entities
    for entity in &model.entities {
        let entity_data = json!({
            "name": entity.name,
            "display_name": entity.display_name,
            "description": entity.description,
            "entity_type": format!("{:?}", entity.entity_type),
            "fields": entity.fields.iter().map(|f| json!({
                "name": f.name,
                "display_name": f.display_name,
                "field_type": convert_field_type(&f.field_type),
                "required": f.required,
                "default_value": f.default_value,
                "validation": f.validation.iter().map(|v| json!({
                    "type": format!("{:?}", v.validation_type),
                    "message": v.message,
                    "severity": format!("{:?}", v.severity)
                })).collect::<Vec<_>>(),
                "ui_config": f.ui_config
            })).collect::<Vec<_>>(),
            "constraints": entity.constraints.iter().map(|c| json!({
                "type": format!("{:?}", c.constraint_type),
                "name": c.name,
                "fields": c.fields,
                "message": c.message
            })).collect::<Vec<_>>(),
            "indexes": entity.indexes.iter().map(|i| json!({
                "name": i.name,
                "fields": i.fields,
                "type": format!("{:?}", i.index_type),
                "unique": i.unique
            })).collect::<Vec<_>>(),
            "ui_config": entity.ui_config,
            "behavior": entity.behavior
        });
        export_data["entities"].as_array_mut().unwrap().push(entity_data);
    }
    
    // Convert relationships
    for relationship in &model.relationships {
        let relationship_data = json!({
            "name": relationship.name,
            "type": format!("{:?}", relationship.relationship_type),
            "from_entity": relationship.from_entity,
            "to_entity": relationship.to_entity,
            "from_field": relationship.from_field,
            "to_field": relationship.to_field,
            "cascade": format!("{:?}", relationship.cascade),
            "ui_config": relationship.ui_config
        });
        export_data["relationships"].as_array_mut().unwrap().push(relationship_data);
    }
    
    // Convert flows
    for flow in &model.flows {
        let flow_data = json!({
            "name": flow.name,
            "type": format!("{:?}", flow.flow_type),
            "trigger": {
                "type": format!("{:?}", flow.trigger),
                "config": {}
            },
            "steps": flow.steps.iter().map(|s| json!({
                "name": s.name,
                "type": format!("{:?}", s.step_type),
                "condition": s.condition,
                "configuration": s.configuration
            })).collect::<Vec<_>>(),
            "error_handling": flow.error_handling
        });
        export_data["flows"].as_array_mut().unwrap().push(flow_data);
    }
    
    // Convert layouts
    for layout in &model.layouts {
        let layout_data = json!({
            "name": layout.name,
            "type": format!("{:?}", layout.layout_type),
            "target_entities": layout.target_entities,
            "components": layout.components.iter().map(|c| json!({
                "type": c.component_type,
                "position": c.position,
                "properties": c.properties,
                "styling": c.styling
            })).collect::<Vec<_>>(),
            "responsive": layout.responsive
        });
        export_data["layouts"].as_array_mut().unwrap().push(layout_data);
    }
    
    Ok(export_data)
}

fn convert_field_type(field_type: &torque::model::types::FieldType) -> serde_json::Value {
    use serde_json::json;
    use torque::model::types::FieldType;
    
    match field_type {
        FieldType::String { max_length } => json!({
            "type": "String",
            "max_length": max_length
        }),
        FieldType::Integer { min, max } => json!({
            "type": "Integer",
            "min": min,
            "max": max
        }),
        FieldType::Float { min, max } => json!({
            "type": "Float",
            "min": min,
            "max": max
        }),
        FieldType::Boolean => json!({
            "type": "Boolean"
        }),
        FieldType::DateTime => json!({
            "type": "DateTime"
        }),
        FieldType::Date => json!({
            "type": "Date"
        }),
        FieldType::Time => json!({
            "type": "Time"
        }),
        FieldType::Json => json!({
            "type": "Json"
        }),
        FieldType::Binary => json!({
            "type": "Binary"
        }),
        FieldType::Enum { values } => json!({
            "type": "Enum",
            "values": values
        }),
        FieldType::Reference { entity_id } => json!({
            "type": "Reference",
            "entity": entity_id.to_string()
        }),
        FieldType::Array { element_type } => json!({
            "type": "Array",
            "element_type": convert_field_type(element_type)
        }),
    }
}

fn validate_import_data(data: &serde_json::Value) -> Result<()> {
    // Basic validation - check required fields
    if !data.is_object() {
        return Err(anyhow::anyhow!("Import data must be an object"));
    }
    
    let obj = data.as_object().unwrap();
    
    if !obj.contains_key("name") {
        return Err(anyhow::anyhow!("Missing required field: name"));
    }
    
    if !obj.contains_key("version") {
        return Err(anyhow::anyhow!("Missing required field: version"));
    }
    
    if !obj.contains_key("entities") {
        return Err(anyhow::anyhow!("Missing required field: entities"));
    }
    
    // TODO: Add more comprehensive validation against JSON schema
    
    Ok(())
}

async fn handle_xflow_command(command: XFlowCommands) -> Result<()> {
    match command {
        XFlowCommands::List => {
            println!("XFlow list not yet implemented");
        }
        XFlowCommands::Execute { xflow_id, input, timeout } => {
            println!("XFlow execute not yet implemented - id: {}, input: {:?}, timeout: {:?}", xflow_id, input, timeout);
        }
        XFlowCommands::Validate { xflow_id } => {
            println!("XFlow validate not yet implemented - id: {}", xflow_id);
        }
        XFlowCommands::Test { xflow_id, test_data } => {
            println!("XFlow test not yet implemented - id: {}, test_data: {:?}", xflow_id, test_data);
        }
    }
    Ok(())
}