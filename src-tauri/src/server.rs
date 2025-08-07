use std::path::PathBuf;
use std::net::TcpListener;
use std::sync::Arc;
use log::{info, error};
use torque::{Config, database, services::ServiceRegistry, server};

/// Start the embedded Torque server on a random available port
pub async fn start_embedded_server(data_dir: PathBuf) -> Result<u16, Box<dyn std::error::Error + Send + Sync>> {
    // Find an available port
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let addr = listener.local_addr()?;
    let port = addr.port();
    drop(listener); // Release the port for Torque server to use
    
    info!("Found available port: {}", port);
    
    // Write port to a file for development mode communication
    let port_file = data_dir.join("server_port.txt");
    if let Err(e) = std::fs::write(&port_file, port.to_string()) {
        log::warn!("Failed to write port file: {}", e);
    } else {
        info!("Port written to {}", port_file.display());
    }
    
    // Ensure data directory exists
    std::fs::create_dir_all(&data_dir)?;
    info!("Ensured data directory exists: {}", data_dir.display());
    
    // Configure database URL for SQLite in data directory
    let db_path = data_dir.join("torque.db");
    let database_url = format!("sqlite:{}", db_path.display());
    
    info!("Using database: {}", database_url);
    
    // Start Torque server using the main torque crate with panic handling
    let server_port = port;
    let server_handle = tokio::spawn(async move {
        info!("Server task started for port {}", port);
        
        // Start server directly in the async context - no block_on needed
        let server_result = start_torque_server(database_url, port).await;
        
        match server_result {
            Ok(_) => {
                error!("Torque server task completed unexpectedly - server should run indefinitely on port {}", port);
            }
            Err(e) => {
                error!("Torque server failed on port {}: {}", port, e);
            }
        }
        error!("Server task ending for port {} - this should not happen", port);
    });
    
    // Monitor server health in a separate task
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(10));
        loop {
            interval.tick().await;
            if server_handle.is_finished() {
                error!("Server task has finished unexpectedly!");
                break;
            } else {
                info!("Server task still alive for port {}", server_port);
            }
        }
    });
    
    // Give the server significantly more time to initialize, bind, and start serving
    info!("Waiting for server to initialize and start serving...");
    tokio::time::sleep(tokio::time::Duration::from_millis(5000)).await;
    
    // Wait for server to actually be ready by checking health endpoint
    for attempt in 1..=100 {
        tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
        
        // Try to connect to health endpoint  
        match reqwest::get(&format!("http://127.0.0.1:{}/health/health", server_port)).await {
            Ok(response) => {
                if response.status().is_success() {
                    info!("Server is ready after {} attempts ({}ms)", attempt, attempt * 100);
                    
                    // Give a brief moment for server to be fully ready for concurrent requests
                    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;
                    info!("Server should now be ready for external connections");
                    
                    return Ok(server_port);
                } else {
                    if attempt % 10 == 0 { // Log every second
                        info!("Health check attempt {}: got status {}", attempt, response.status());
                    }
                }
            }
            Err(e) => {
                if attempt % 10 == 0 { // Log every second
                    info!("Health check attempt {}: connection error: {}", attempt, e);
                }
            }
        }
    }
    
    error!("Server failed to become ready within 10 seconds");
    Err("Server startup timeout".into())
}

async fn start_torque_server(database_url: String, port: u16) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    info!("Starting Torque server with database: {}", database_url);
    info!("Server will bind to 127.0.0.1:{}", port);
    
    info!("Step 1: Creating config...");
    
    // Create Torque configuration
    let mut config = Config::default();
    config.database.url = database_url;
    config.server.bind = format!("127.0.0.1:{}", port);
    info!("Step 2: Config created");
    
    // Initialize database connection
    info!("Step 3: Setting up database...");
    let db = database::setup_database(&config).await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    info!("Step 4: Database connection established");
    
    // Initialize service registry
    info!("Step 5: Creating service registry...");
    let services = Arc::new(ServiceRegistry::new(db, config.clone()).await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?);
    info!("Step 6: Service registry initialized");
    
    // Load seed data for desktop development
    info!("Step 7: Loading seed data for desktop development...");
    if let Err(e) = services.model_service.load_seed_data().await {
        log::warn!("Failed to load seed data: {}", e);
    }
    
    // Start the HTTP server - this will run indefinitely
    info!("Step 8: Starting HTTP server...");
    info!("Attempting to bind to: {}", config.server.bind);
    
    // Start the HTTP server - this runs indefinitely
    info!("Calling server::start_server() - server should run indefinitely...");
    
    // Add a small delay to ensure everything is ready
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    let start_result = server::start_server(config, services).await;
    match start_result {
        Ok(_) => {
            error!("Server::start_server() completed normally (this should NEVER happen - server should run indefinitely)");
            error!("This indicates the axum server exited unexpectedly!");
            error!("The server may have shut down due to an internal error or signal");
            Err("Server exited unexpectedly".into())
        }
        Err(e) => {
            error!("Server::start_server() failed with error: {}", e);
            error!("Error details: {:?}", e);
            error!("Error type: {}", std::any::type_name_of_val(&e));
            Err(Box::new(e) as Box<dyn std::error::Error + Send + Sync>)
        }
    }
}