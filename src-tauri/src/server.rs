use std::path::PathBuf;
use std::net::TcpListener;
use log::{info, error};

/// Start the embedded Torque server on a random available port
pub async fn start_embedded_server(data_dir: PathBuf) -> Result<u16, Box<dyn std::error::Error + Send + Sync>> {
    // Find an available port
    let listener = TcpListener::bind("127.0.0.1:0")?;
    let addr = listener.local_addr()?;
    let port = addr.port();
    
    info!("Found available port: {}", port);
    
    // Configure database URL for SQLite in data directory
    let db_path = data_dir.join("torque.db");
    let database_url = format!("sqlite://{}", db_path.display());
    
    info!("Using database: {}", database_url);
    
    // Start Torque server using the main torque crate
    // This will use the existing server implementation
    tokio::spawn(async move {
        match start_torque_server(database_url, port).await {
            Ok(_) => info!("Torque server running successfully on port {}", port),
            Err(e) => error!("Torque server failed: {}", e),
        }
    });
    
    // Give the server a moment to start
    tokio::time::sleep(tokio::time::Duration::from_millis(100)).await;
    
    Ok(port)
}

async fn start_torque_server(database_url: String, port: u16) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
    // Use the torque crate's server functionality
    // This is a simplified version - we'll need to adapt based on the actual torque server API
    
    info!("Starting Torque server with database: {}", database_url);
    info!("Server will bind to 127.0.0.1:{}", port);
    
    // For now, we'll create a placeholder that uses the torque crate
    // This will need to be implemented based on the actual server structure
    
    // Example of how this might work:
    // let server = torque::server::TorqueServer::new()
    //     .database_url(&database_url)
    //     .bind(format!("127.0.0.1:{}", port))
    //     .build()
    //     .await?;
    // 
    // server.run().await?;
    
    // For now, just keep the task alive
    loop {
        tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
    }
}