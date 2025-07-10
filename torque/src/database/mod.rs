use sea_orm::{Database, DatabaseConnection, ConnectOptions};
use std::time::Duration;
use crate::{Config, Result};
use tracing::log::LevelFilter;

pub mod migrations;
pub mod entities;

pub async fn connect(database_url: &str, optimize: bool) -> Result<DatabaseConnection> {
    let mut opt = ConnectOptions::new(database_url);
    
    if optimize {
        // Performance optimizations
        opt.max_connections(100)
            .min_connections(10)
            .connect_timeout(Duration::from_secs(30))
            .idle_timeout(Duration::from_secs(600))
            .max_lifetime(Duration::from_secs(3600))
            .sqlx_logging(false) // Disable for performance
            .sqlx_logging_level(LevelFilter::Error);
    } else {
        // Development settings
        opt.max_connections(10)
            .min_connections(1)
            .connect_timeout(Duration::from_secs(10))
            .idle_timeout(Duration::from_secs(300))
            .sqlx_logging(true)
            .sqlx_logging_level(LevelFilter::Info);
    }
    
    let db = Database::connect(opt).await?;
    
    tracing::info!("Connected to database: {}", database_url);
    
    Ok(db)
}

pub async fn setup_database(config: &Config) -> Result<DatabaseConnection> {
    let db = connect(&config.database.url, config.performance.enable_mimalloc).await?;
    
    // Run migrations if needed
    migrations::run_migrations(&db).await?;
    
    Ok(db)
}