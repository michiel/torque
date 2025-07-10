use crate::Config;
use dashmap::DashMap;
use std::sync::Arc;
use std::time::{Duration, Instant};
use uuid::Uuid;
use parking_lot::RwLock;

#[derive(Debug, Clone)]
pub struct CacheEntry<T> {
    pub data: T,
    pub created_at: Instant,
    pub ttl: Duration,
}

impl<T> CacheEntry<T> {
    pub fn new(data: T, ttl: Duration) -> Self {
        Self {
            data,
            created_at: Instant::now(),
            ttl,
        }
    }

    pub fn is_expired(&self) -> bool {
        self.created_at.elapsed() > self.ttl
    }
}

/// High-performance cache service using DashMap for concurrent access
pub struct CacheService {
    // Entity cache with TTL
    entity_cache: DashMap<Uuid, CacheEntry<serde_json::Value>>,
    // Query result cache
    query_cache: DashMap<String, CacheEntry<serde_json::Value>>,
    // Configuration cache
    config_cache: DashMap<String, CacheEntry<serde_json::Value>>,
    // Cache settings
    default_ttl: Duration,
    max_entries: usize,
    // Cache statistics
    stats: Arc<RwLock<CacheStats>>,
}

#[derive(Debug, Default, Clone)]
pub struct CacheStats {
    pub hits: u64,
    pub misses: u64,
    pub evictions: u64,
    pub size: usize,
}

impl CacheStats {
    pub fn hit_rate(&self) -> f64 {
        if self.hits + self.misses == 0 {
            0.0
        } else {
            self.hits as f64 / (self.hits + self.misses) as f64
        }
    }
}

impl CacheService {
    pub fn new(config: &Config) -> Self {
        Self {
            entity_cache: DashMap::new(),
            query_cache: DashMap::new(),
            config_cache: DashMap::new(),
            default_ttl: Duration::from_secs(config.performance.entity_cache_ttl),
            max_entries: config.performance.entity_cache_size,
            stats: Arc::new(RwLock::new(CacheStats::default())),
        }
    }

    /// Get entity from cache
    pub fn get_entity(&self, id: &Uuid) -> Option<serde_json::Value> {
        self.get_from_cache(&self.entity_cache, id)
    }

    /// Set entity in cache
    pub fn set_entity(&self, id: Uuid, data: serde_json::Value) {
        self.set_in_cache(&self.entity_cache, id, data, None);
    }

    /// Get query result from cache
    pub fn get_query(&self, query_key: &str) -> Option<serde_json::Value> {
        self.get_from_cache(&self.query_cache, &query_key.to_string())
    }

    /// Set query result in cache
    pub fn set_query(&self, query_key: String, data: serde_json::Value, ttl: Option<Duration>) {
        self.set_in_cache(&self.query_cache, query_key, data, ttl);
    }

    /// Get configuration from cache
    pub fn get_config(&self, key: &str) -> Option<serde_json::Value> {
        self.get_from_cache(&self.config_cache, &key.to_string())
    }

    /// Set configuration in cache
    pub fn set_config(&self, key: String, data: serde_json::Value) {
        self.set_in_cache(&self.config_cache, key, data, Some(Duration::from_secs(3600)));
    }

    /// Invalidate entity cache entry
    pub fn invalidate_entity(&self, id: &Uuid) {
        self.entity_cache.remove(id);
    }

    /// Clear all caches
    pub fn clear_all(&self) {
        self.entity_cache.clear();
        self.query_cache.clear();
        self.config_cache.clear();
        let mut stats = self.stats.write();
        *stats = CacheStats::default();
    }

    /// Get cache statistics
    pub fn get_stats(&self) -> CacheStats {
        (*self.stats.read()).clone()
    }

    /// Clean expired entries from all caches
    pub fn cleanup_expired(&self) {
        self.cleanup_cache(&self.entity_cache);
        self.cleanup_cache(&self.query_cache);
        self.cleanup_cache(&self.config_cache);
    }

    // Generic cache operations
    fn get_from_cache<K, T>(&self, cache: &DashMap<K, CacheEntry<T>>, key: &K) -> Option<T>
    where
        K: std::hash::Hash + Eq,
        T: Clone,
    {
        if let Some(entry) = cache.get(key) {
            if entry.is_expired() {
                cache.remove(key);
                self.record_miss();
                None
            } else {
                self.record_hit();
                Some(entry.data.clone())
            }
        } else {
            self.record_miss();
            None
        }
    }

    fn set_in_cache<K, T>(&self, cache: &DashMap<K, CacheEntry<T>>, key: K, data: T, ttl: Option<Duration>)
    where
        K: std::hash::Hash + Eq,
    {
        let ttl = ttl.unwrap_or(self.default_ttl);
        let entry = CacheEntry::new(data, ttl);
        
        // Enforce max entries limit
        if cache.len() >= self.max_entries {
            // Remove oldest entry (simple eviction strategy)
            if let Some(entry) = cache.iter().next() {
                let key_to_remove = entry.key().clone();
                cache.remove(&key_to_remove);
                self.record_eviction();
            }
        }
        
        cache.insert(key, entry);
        self.update_size(cache.len());
    }

    fn cleanup_cache<K, T>(&self, cache: &DashMap<K, CacheEntry<T>>)
    where
        K: std::hash::Hash + Eq,
    {
        cache.retain(|_, entry| !entry.is_expired());
    }

    fn record_hit(&self) {
        self.stats.write().hits += 1;
    }

    fn record_miss(&self) {
        self.stats.write().misses += 1;
    }

    fn record_eviction(&self) {
        self.stats.write().evictions += 1;
    }

    fn update_size(&self, size: usize) {
        self.stats.write().size = size;
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::Config;

    #[test]
    fn test_cache_operations() {
        let config = Config::default();
        let cache = CacheService::new(&config);
        
        let id = Uuid::new_v4();
        let data = serde_json::json!({"test": "value"});
        
        // Test miss
        assert!(cache.get_entity(&id).is_none());
        
        // Test set and hit
        cache.set_entity(id, data.clone());
        assert_eq!(cache.get_entity(&id), Some(data));
        
        // Test stats
        let stats = cache.get_stats();
        assert_eq!(stats.hits, 1);
        assert_eq!(stats.misses, 1);
        assert!(stats.hit_rate() > 0.0);
    }
}