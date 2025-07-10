use crate::{Config, Result};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

pub mod entity;
pub mod cache;
pub mod metrics;
pub mod model;

/// Core service registry for dependency injection
#[derive(Clone)]
pub struct ServiceRegistry {
    pub db: Arc<DatabaseConnection>,
    pub config: Arc<Config>,
    pub entity_service: Arc<entity::EntityService>,
    pub model_service: Arc<model::ModelService>,
    pub cache: Arc<cache::CacheService>,
    pub metrics: Arc<metrics::MetricsService>,
}

impl ServiceRegistry {
    pub async fn new(db: DatabaseConnection, config: Config) -> Result<Self> {
        let db = Arc::new(db);
        let config = Arc::new(config);
        
        // Initialize services with dependency injection
        let cache = Arc::new(cache::CacheService::new(&config));
        let metrics = Arc::new(metrics::MetricsService::new(&config));
        let entity_service = Arc::new(entity::EntityService::new(
            db.clone(),
            cache.clone(),
            metrics.clone(),
        ));
        
        // Initialize model service
        let model_service = Arc::new(model::ModelService::new(
            db.clone(),
            cache.clone(),
        ));

        Ok(Self {
            db,
            config,
            entity_service,
            model_service,
            cache,
            metrics,
        })
    }
}