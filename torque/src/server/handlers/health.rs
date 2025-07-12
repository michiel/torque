use crate::server::AppState;
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::time::Instant;
use crate::common::UtcDateTime;

/// Health check endpoint - returns system health status
pub async fn health_check(State(state): State<AppState>) -> Result<Json<Value>, StatusCode> {
    let start = Instant::now();
    
    // Perform basic health checks
    let health_result = state.services.entity_service.health_check().await;
    
    match health_result {
        Ok(health_data) => {
            let response_time = start.elapsed();
            
            let response = json!({
                "status": "healthy",
                "timestamp": UtcDateTime::now().to_iso8601(),
                "response_time_ms": response_time.as_millis(),
                "services": health_data,
                "version": env!("CARGO_PKG_VERSION")
            });
            
            // Record metrics
            state.services.metrics.record_request_time(response_time);
            state.services.metrics.record_metric(
                "health_check".to_string(), 
                1.0, 
                Some({
                    let mut tags = HashMap::new();
                    tags.insert("status".to_string(), "success".to_string());
                    tags
                })
            );
            
            Ok(Json(response))
        }
        Err(e) => {
            tracing::error!("Health check failed: {}", e);
            
            let _response = json!({
                "status": "unhealthy",
                "timestamp": UtcDateTime::now().to_iso8601(),
                "error": e.to_string(),
                "version": env!("CARGO_PKG_VERSION")
            });
            
            // Record error metrics
            state.services.metrics.record_metric(
                "health_check".to_string(),
                1.0,
                Some({
                    let mut tags = HashMap::new();
                    tags.insert("status".to_string(), "error".to_string());
                    tags
                })
            );
            
            Err(StatusCode::SERVICE_UNAVAILABLE)
        }
    }
}

/// Metrics endpoint - returns performance metrics
pub async fn metrics(State(state): State<AppState>) -> Json<Value> {
    let request_metrics = state.services.metrics.get_request_metrics();
    let db_metrics = state.services.metrics.get_database_metrics();
    let cache_stats = state.services.cache.get_stats();
    let custom_metrics = state.services.metrics.get_custom_metrics(Some(50));
    
    let response = json!({
        "timestamp": UtcDateTime::now().to_iso8601(),
        "requests": {
            "total": request_metrics.total_requests,
            "successful": request_metrics.successful_requests,
            "failed": request_metrics.failed_requests,
            "average_response_time": request_metrics.average_response_time,
            "p95_response_time": request_metrics.p95_response_time,
            "p99_response_time": request_metrics.p99_response_time
        },
        "database": {
            "connections": {
                "total": db_metrics.connection_count,
                "active": db_metrics.active_connections
            },
            "queries": {
                "total": db_metrics.query_count,
                "average_time": db_metrics.average_query_time,
                "slow_queries": db_metrics.slow_queries
            }
        },
        "cache": {
            "hit_rate": cache_stats.hit_rate(),
            "hits": cache_stats.hits,
            "misses": cache_stats.misses,
            "evictions": cache_stats.evictions,
            "size": cache_stats.size
        },
        "custom_metrics_count": custom_metrics.len()
    });
    
    Json(response)
}

/// Status endpoint - returns basic system status
pub async fn status(State(state): State<AppState>) -> Json<Value> {
    let uptime = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default();
    
    let cache_stats = state.services.cache.get_stats();
    let db_metrics = state.services.metrics.get_database_metrics();
    
    let response = json!({
        "status": "running",
        "timestamp": UtcDateTime::now().to_iso8601(),
        "uptime_seconds": uptime.as_secs(),
        "version": env!("CARGO_PKG_VERSION"),
        "memory_usage": get_memory_usage(),
        "quick_stats": {
            "cache_hit_rate": cache_stats.hit_rate(),
            "total_requests": state.services.metrics.get_request_metrics().total_requests,
            "database_connections": db_metrics.connection_count
        }
    });
    
    Json(response)
}

/// Get basic memory usage information
fn get_memory_usage() -> Value {
    // This is a simplified memory usage - in production you might want more detailed metrics
    json!({
        "rss_bytes": "unknown", // Would need platform-specific code
        "heap_bytes": "unknown"
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{Config, services::ServiceRegistry, database};
    use std::sync::Arc;

    // Helper to create test state
    async fn create_test_state() -> AppState {
        let config = Config::default();
        
        // For tests, we'd need a real database connection
        // This is a placeholder that would need proper test setup
        // let db = database::connect(":memory:", false).await.unwrap();
        // let services = ServiceRegistry::new(db, config).await.unwrap();
        
        // For now, create a mock state structure
        todo!("Implement proper test setup with test database")
    }

    #[tokio::test]
    async fn test_health_check_format() {
        // TODO: Implement actual test once we have proper test setup
        // let state = create_test_state().await;
        // let response = health_check(State(state)).await;
        // assert!(response.is_ok());
    }
}