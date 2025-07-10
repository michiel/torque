use crate::{Config, Result};
use sea_orm::DatabaseConnection;
use std::sync::Arc;

pub mod entity;
pub mod cache;
pub mod metrics;
pub mod model;
pub mod broadcast;

/// Core service registry for dependency injection
#[derive(Clone)]
pub struct ServiceRegistry {
    pub db: Arc<DatabaseConnection>,
    pub config: Arc<Config>,
    pub entity_service: Arc<entity::EntityService>,
    pub model_service: Arc<model::ModelService>,
    pub cache: Arc<cache::CacheService>,
    pub metrics: Arc<metrics::MetricsService>,
    pub broadcast: Arc<broadcast::BroadcastService>,
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

        // Initialize broadcast service
        let broadcast = Arc::new(broadcast::BroadcastService::new());

        // Start the broadcast loop in the background
        let broadcast_loop = broadcast.clone();
        tokio::spawn(async move {
            broadcast_loop.start_broadcast_loop().await;
        });

        // Connect model service to broadcast service
        // Create a channel for model events
        let (model_event_sender, mut model_event_receiver) = tokio::sync::broadcast::channel(1000);
        
        // Set the event sender in the model service
        model_service.set_event_sender(model_event_sender).await;

        // Bridge model events to broadcast service
        let broadcast_for_bridge = broadcast.clone();
        tokio::spawn(async move {
            while let Ok(event) = model_event_receiver.recv().await {
                if let Err(e) = broadcast_for_bridge.broadcast_event(event).await {
                    tracing::error!("Failed to bridge model event to broadcast service: {}", e);
                }
            }
        });

        Ok(Self {
            db,
            config,
            entity_service,
            model_service,
            cache,
            metrics,
            broadcast,
        })
    }
}