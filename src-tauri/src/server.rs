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
    
    // Configure database URL for SQLite in data directory
    let db_path = data_dir.join("torque.db");
    let database_url = format!("sqlite://{}", db_path.display());
    
    info!("Using database: {}", database_url);
    
    // Start Torque server using the main torque crate
    tokio::spawn(async move {
        match start_torque_server(database_url, port).await {
            Ok(_) => info!("Torque server running successfully on port {}", port),
            Err(e) => error!("Torque server failed: {}", e),
        }
    });
    
    // Give the server a moment to start
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;
    
    Ok(port)
}

async fn start_torque_server(database_url: String, port: u16) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    info!("Starting Torque server with database: {}", database_url);
    info!("Server will bind to 127.0.0.1:{}", port);
    
    // Create Torque configuration
    let mut config = Config::default();
    config.database.url = database_url;
    config.server.bind = format!("127.0.0.1:{}", port);
    
    // Initialize database connection
    let db = database::setup_database(&config).await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    info!("Database connection established");
    
    // Initialize service registry
    let services = Arc::new(ServiceRegistry::new(db, config.clone()).await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?);
    info!("Service registry initialized");
    
    // Load seed data for development
    if let Err(e) = services.model_service.load_seed_data().await {
        log::warn!("Failed to load seed data: {}", e);
    }
    
    // Start the HTTP server - this will run indefinitely
    server::start_server(config, services).await
        .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
    
    Ok(())
}