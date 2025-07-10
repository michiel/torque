use crate::Config;
use std::sync::Arc;
use parking_lot::RwLock;
use std::time::{Duration, Instant};
use std::collections::HashMap;
use serde::{Serialize, Deserialize};

#[derive(Debug, Clone)]
pub struct PerformanceMetric {
    pub name: String,
    pub value: f64,
    pub timestamp: Instant,
    pub tags: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RequestMetrics {
    pub total_requests: u64,
    pub successful_requests: u64,
    pub failed_requests: u64,
    pub average_response_time: f64,
    pub p95_response_time: f64,
    pub p99_response_time: f64,
}

#[derive(Debug, Default, Clone, Serialize, Deserialize)]
pub struct DatabaseMetrics {
    pub connection_count: u32,
    pub active_connections: u32,
    pub query_count: u64,
    pub average_query_time: f64,
    pub slow_queries: u64,
}

/// High-performance metrics collection service
pub struct MetricsService {
    // Request timing measurements
    request_times: Arc<RwLock<Vec<Duration>>>,
    // Database performance metrics
    db_metrics: Arc<RwLock<DatabaseMetrics>>,
    // Custom metrics
    custom_metrics: Arc<RwLock<Vec<PerformanceMetric>>>,
    // Configuration
    max_samples: usize,
    slow_query_threshold: Duration,
}

impl MetricsService {
    pub fn new(_config: &Config) -> Self {
        Self {
            request_times: Arc::new(RwLock::new(Vec::new())),
            db_metrics: Arc::new(RwLock::new(DatabaseMetrics::default())),
            custom_metrics: Arc::new(RwLock::new(Vec::new())),
            max_samples: 10000, // Keep last 10k samples
            slow_query_threshold: Duration::from_millis(100),
        }
    }

    /// Record request timing
    pub fn record_request_time(&self, duration: Duration) {
        let mut times = self.request_times.write();
        times.push(duration);
        
        // Keep only recent samples to prevent memory growth
        if times.len() > self.max_samples {
            let excess = times.len() - self.max_samples;
            times.drain(0..excess);
        }
    }

    /// Record database query timing
    pub fn record_query_time(&self, duration: Duration) {
        let mut metrics = self.db_metrics.write();
        metrics.query_count += 1;
        
        // Update average (simple moving average)
        let current_avg = metrics.average_query_time;
        let count = metrics.query_count as f64;
        metrics.average_query_time = (current_avg * (count - 1.0) + duration.as_secs_f64()) / count;
        
        // Track slow queries
        if duration > self.slow_query_threshold {
            metrics.slow_queries += 1;
        }
    }

    /// Record database connection metrics
    pub fn update_connection_metrics(&self, total: u32, active: u32) {
        let mut metrics = self.db_metrics.write();
        metrics.connection_count = total;
        metrics.active_connections = active;
    }

    /// Add custom metric
    pub fn record_metric(&self, name: String, value: f64, tags: Option<HashMap<String, String>>) {
        let metric = PerformanceMetric {
            name,
            value,
            timestamp: Instant::now(),
            tags: tags.unwrap_or_default(),
        };
        
        let mut metrics = self.custom_metrics.write();
        metrics.push(metric);
        
        // Keep only recent metrics
        if metrics.len() > self.max_samples {
            let excess = metrics.len() - self.max_samples;
            metrics.drain(0..excess);
        }
    }

    /// Get request performance metrics
    pub fn get_request_metrics(&self) -> RequestMetrics {
        let times = self.request_times.read();
        
        if times.is_empty() {
            return RequestMetrics {
                total_requests: 0,
                successful_requests: 0,
                failed_requests: 0,
                average_response_time: 0.0,
                p95_response_time: 0.0,
                p99_response_time: 0.0,
            };
        }

        let mut sorted_times: Vec<Duration> = times.clone();
        sorted_times.sort();

        let total = sorted_times.len() as u64;
        let avg = sorted_times.iter().map(|d| d.as_secs_f64()).sum::<f64>() / total as f64;
        
        let p95_idx = (total as f64 * 0.95) as usize;
        let p99_idx = (total as f64 * 0.99) as usize;
        
        let p95 = sorted_times.get(p95_idx).unwrap_or(&Duration::ZERO).as_secs_f64();
        let p99 = sorted_times.get(p99_idx).unwrap_or(&Duration::ZERO).as_secs_f64();

        RequestMetrics {
            total_requests: total,
            successful_requests: total, // TODO: Track failures separately
            failed_requests: 0,
            average_response_time: avg,
            p95_response_time: p95,
            p99_response_time: p99,
        }
    }

    /// Get database metrics
    pub fn get_database_metrics(&self) -> DatabaseMetrics {
        (*self.db_metrics.read()).clone()
    }

    /// Get recent custom metrics
    pub fn get_custom_metrics(&self, limit: Option<usize>) -> Vec<PerformanceMetric> {
        let metrics = self.custom_metrics.read();
        let limit = limit.unwrap_or(100);
        
        if metrics.len() <= limit {
            metrics.clone()
        } else {
            metrics[metrics.len() - limit..].to_vec()
        }
    }

    /// Clear all metrics
    pub fn clear_metrics(&self) {
        self.request_times.write().clear();
        self.custom_metrics.write().clear();
        *self.db_metrics.write() = DatabaseMetrics::default();
    }

    /// Get metrics summary for health checks
    pub fn get_health_summary(&self) -> HashMap<String, serde_json::Value> {
        let mut summary = HashMap::new();
        
        let request_metrics = self.get_request_metrics();
        summary.insert("requests".to_string(), serde_json::to_value(request_metrics).unwrap());
        
        let db_metrics = self.get_database_metrics();
        summary.insert("database".to_string(), serde_json::to_value(db_metrics).unwrap());
        
        let cache_size = self.custom_metrics.read().len();
        summary.insert("metrics_count".to_string(), serde_json::Value::Number(cache_size.into()));
        
        summary
    }
}

/// Timer utility for measuring operation duration
pub struct Timer {
    start: Instant,
    metrics: Arc<MetricsService>,
    operation: String,
}

impl Timer {
    pub fn new(metrics: Arc<MetricsService>, operation: String) -> Self {
        Self {
            start: Instant::now(),
            metrics,
            operation,
        }
    }

    pub fn finish(self) -> Duration {
        let duration = self.start.elapsed();
        let mut tags = HashMap::new();
        tags.insert("operation".to_string(), self.operation);
        self.metrics.record_metric("operation_duration".to_string(), duration.as_secs_f64(), Some(tags));
        duration
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::thread::sleep;

    #[test]
    fn test_metrics_collection() {
        let config = crate::Config::default();
        let metrics = MetricsService::new(&config);
        
        // Record some request times
        metrics.record_request_time(Duration::from_millis(10));
        metrics.record_request_time(Duration::from_millis(20));
        metrics.record_request_time(Duration::from_millis(15));
        
        let request_metrics = metrics.get_request_metrics();
        assert_eq!(request_metrics.total_requests, 3);
        assert!(request_metrics.average_response_time > 0.0);
        
        // Test custom metrics
        let mut tags = HashMap::new();
        tags.insert("endpoint".to_string(), "/api/test".to_string());
        metrics.record_metric("test_metric".to_string(), 42.0, Some(tags));
        
        let custom_metrics = metrics.get_custom_metrics(Some(10));
        assert_eq!(custom_metrics.len(), 1);
        assert_eq!(custom_metrics[0].value, 42.0);
    }

    #[test]
    fn test_timer() {
        let config = crate::Config::default();
        let metrics = Arc::new(MetricsService::new(&config));
        
        let timer = Timer::new(metrics.clone(), "test_operation".to_string());
        sleep(Duration::from_millis(10));
        let duration = timer.finish();
        
        assert!(duration >= Duration::from_millis(10));
        
        let custom_metrics = metrics.get_custom_metrics(Some(10));
        assert_eq!(custom_metrics.len(), 1);
        assert_eq!(custom_metrics[0].name, "operation_duration");
    }
}