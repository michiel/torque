use sea_orm::{Database, DatabaseConnection, ConnectOptions};
use std::time::Duration;
use std::path::Path;
use crate::{Config, Result};
use tracing::log::LevelFilter;

pub mod migrations;
pub mod entities;

pub use entities::*;

pub async fn connect(database_url: &str, optimize: bool) -> Result<DatabaseConnection> {
    let mut opt = ConnectOptions::new(database_url);
    
    // Check if this is a SQLite database
    let is_sqlite = database_url.starts_with("sqlite:");
    
    if optimize {
        // Performance optimizations
        opt.max_connections(if is_sqlite { 1 } else { 100 }) // SQLite should use single connection
            .min_connections(1)
            .connect_timeout(Duration::from_secs(30))
            .idle_timeout(Duration::from_secs(600))
            .max_lifetime(Duration::from_secs(3600))
            .sqlx_logging(false) // Disable for performance
            .sqlx_logging_level(LevelFilter::Error);
    } else {
        // Development settings
        opt.max_connections(if is_sqlite { 1 } else { 10 }) // SQLite should use single connection
            .min_connections(1)
            .connect_timeout(Duration::from_secs(10))
            .idle_timeout(Duration::from_secs(300))
            .sqlx_logging(true)
            .sqlx_logging_level(LevelFilter::Info);
    }
    
    // Add SQLite-specific connection options
    if is_sqlite {
        // Extract file path from SQLite URL for permission checks
        if let Some(file_path) = database_url.strip_prefix("sqlite:") {
            let path = Path::new(file_path);
            
            // Ensure the database file exists and has proper permissions
            if path.exists() {
                // Set proper file permissions (readable and writable by owner)
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    let mut perms = std::fs::metadata(path)?.permissions();
                    perms.set_mode(0o644); // rw-r--r--
                    std::fs::set_permissions(path, perms)?;
                    tracing::info!("Set database file permissions: {}", path.display());
                }
                
                tracing::info!("Database file exists and permissions set: {}", path.display());
            } else {
                tracing::warn!("Database file does not exist: {}", path.display());
            }
        }
        
        // Keep the original database URL - we'll set pragmas after connection
        tracing::info!("Using SQLite database: {}", database_url);
    }
    
    tracing::info!("Attempting to connect to database: {}", database_url);
    let db = Database::connect(opt).await?;
    
    // For SQLite, run additional setup queries
    if is_sqlite {
        use sea_orm::ConnectionTrait;
        
        // Enable WAL mode and other SQLite optimizations
        let setup_queries = vec![
            "PRAGMA journal_mode = WAL;",
            "PRAGMA synchronous = NORMAL;", 
            "PRAGMA foreign_keys = ON;",
            "PRAGMA temp_store = MEMORY;",
            "PRAGMA mmap_size = 268435456;", // 256MB
            "PRAGMA cache_size = 10000;",
        ];
        
        for query in setup_queries {
            match db.execute_unprepared(query).await {
                Ok(_) => tracing::debug!("Executed SQLite pragma: {}", query),
                Err(e) => tracing::warn!("Failed to execute SQLite pragma '{}': {}", query, e),
            }
        }
        
        tracing::info!("SQLite database setup completed");
    }
    
    tracing::info!("Successfully connected to database: {}", database_url);
    
    Ok(db)
}

pub async fn setup_database(config: &Config) -> Result<DatabaseConnection> {
    let db = connect(&config.database.url, config.performance.enable_mimalloc).await?;
    
    // Run migrations if needed
    migrations::run_migrations(&db).await?;
    
    Ok(db)
}
