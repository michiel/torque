use torque::{Config, database, services::ServiceRegistry, server};
use std::sync::Arc;
use tokio::time::{timeout, Duration};

/// Basic integration test to verify server starts up correctly
#[tokio::test]
async fn test_server_startup() {
    // Use in-memory SQLite for testing
    let mut config = Config::default();
    config.database.url = "sqlite::memory:".to_string();
    config.server.bind = "127.0.0.1:0".to_string(); // Use random port
    
    // Set up database and services
    let db = database::setup_database(&config).await.unwrap();
    let services = Arc::new(ServiceRegistry::new(db, config.clone()).await.unwrap());
    
    // Create router (but don't start server for this test)
    let _router = server::create_router(services);
    
    // If we get here without panicking, the setup worked
    assert!(true);
}

/// Test that configuration loading works with defaults
#[tokio::test]
async fn test_config_defaults() {
    let config = Config::default();
    
    // Verify basic configuration values
    assert!(!config.database.url.is_empty());
    assert!(!config.server.bind.is_empty());
    assert!(config.performance.entity_cache_size > 0);
    assert!(config.performance.entity_cache_ttl > 0);
}

/// Test service registry initialization
#[tokio::test]
async fn test_service_registry() {
    let config = Config::default();
    
    // Use in-memory database for tests
    let db = database::connect("sqlite::memory:", false).await.unwrap();
    
    // Initialize services
    let services = ServiceRegistry::new(db, config).await.unwrap();
    
    // Verify services are properly initialized
    let health = services.entity_service.health_check().await.unwrap();
    assert!(health.contains_key("cache_hit_rate"));
}

/// Test cache functionality
#[tokio::test]
async fn test_cache_operations() {
    let config = Config::default();
    let cache = torque::services::cache::CacheService::new(&config);
    
    let test_id = torque::common::Uuid::new_v4();
    let test_data = serde_json::json!({"test": "data"});
    
    // Test cache miss
    assert!(cache.get_entity(&test_id).is_none());
    
    // Test cache set and hit
    cache.set_entity(test_id.clone(), test_data.clone());
    assert_eq!(cache.get_entity(&test_id), Some(test_data));
    
    // Test cache stats
    let stats = cache.get_stats();
    assert_eq!(stats.hits, 1);
    assert_eq!(stats.misses, 1);
    assert!(stats.hit_rate() > 0.0);
}

/// Test metrics collection
#[tokio::test]
async fn test_metrics_collection() {
    let config = Config::default();
    let metrics = torque::services::metrics::MetricsService::new(&config);
    
    // Record some test metrics
    metrics.record_request_time(Duration::from_millis(10));
    metrics.record_request_time(Duration::from_millis(20));
    metrics.record_request_time(Duration::from_millis(15));
    
    let request_metrics = metrics.get_request_metrics();
    assert_eq!(request_metrics.total_requests, 3);
    assert!(request_metrics.average_response_time > 0.0);
    
    // Test custom metrics
    let mut tags = std::collections::HashMap::new();
    tags.insert("test".to_string(), "value".to_string());
    metrics.record_metric("test_metric".to_string(), 42.0, Some(tags));
    
    let custom_metrics = metrics.get_custom_metrics(Some(10));
    assert_eq!(custom_metrics.len(), 1);
    assert_eq!(custom_metrics[0].value, 42.0);
}

/// Test entity service operations
#[tokio::test]
async fn test_entity_service() {
    let config = Config::default();
    let db = database::connect("sqlite::memory:", false).await.unwrap();
    let services = ServiceRegistry::new(db, config).await.unwrap();
    
    // Test entity creation
    let request = torque::services::entity::CreateEntityRequest {
        application_id: torque::common::Uuid::new_v4(),
        entity_type: "test_entity".to_string(),
        data: serde_json::json!({"name": "test", "value": 123}),
    };
    
    let entity = services.entity_service.create_entity(request).await.unwrap();
    assert_eq!(entity.entity_type, "test_entity");
    
    // Test entity retrieval
    let retrieved = services.entity_service.get_entity(entity.id.clone()).await.unwrap();
    assert!(retrieved.is_some());
    
    // Test entity update
    let update_request = torque::services::entity::UpdateEntityRequest {
        data: serde_json::json!({"name": "updated", "value": 456}),
    };
    
    let updated = services.entity_service.update_entity(entity.id.clone(), update_request).await.unwrap();
    assert!(updated.is_some());
    let updated_entity = updated.unwrap();
    assert_eq!(updated_entity.data["name"], "updated");
    
    // Test entity deletion
    let deleted = services.entity_service.delete_entity(entity.id.clone()).await.unwrap();
    assert!(deleted);
    
    // Verify entity is gone
    let not_found = services.entity_service.get_entity(entity.id).await.unwrap();
    assert!(not_found.is_none());
}

/// Performance test - ensure operations complete within reasonable time
#[tokio::test]
async fn test_performance_requirements() {
    let config = Config::default();
    let db = database::connect("sqlite::memory:", false).await.unwrap();
    let services = Arc::new(ServiceRegistry::new(db, config).await.unwrap());
    
    // Test that entity operations complete quickly
    let start = std::time::Instant::now();
    
    let request = torque::services::entity::CreateEntityRequest {
        application_id: torque::common::Uuid::new_v4(),
        entity_type: "perf_test".to_string(),
        data: serde_json::json!({"test": "performance"}),
    };
    
    let entity = services.entity_service.create_entity(request).await.unwrap();
    let _retrieved = services.entity_service.get_entity(entity.id).await.unwrap();
    
    let duration = start.elapsed();
    
    // Should complete in under 50ms (in-memory database)
    assert!(duration < Duration::from_millis(50), 
           "Entity operations took too long: {:?}", duration);
}