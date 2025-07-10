use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub database: DatabaseConfig,
    pub server: ServerConfig,
    pub performance: PerformanceConfig,
    pub xflow: XFlowConfig,
    pub logging: LoggingConfig,
    pub graphql: GraphQLConfig,
    pub jsonrpc: JsonRpcConfig,
    pub mcp: McpConfig,
    pub frontend: FrontendConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connection_timeout: u64,
    pub idle_timeout: u64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerConfig {
    pub bind: String,
    pub workers: usize,
    pub request_timeout: u64,
    pub max_payload_size: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PerformanceConfig {
    pub enable_simd_json: bool,
    pub enable_mimalloc: bool,
    pub entity_cache_size: usize,
    pub entity_cache_ttl: u64,
    pub js_runtime_pool_size: usize,
    pub connection_pool_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct XFlowConfig {
    pub max_execution_time: u64,
    pub max_parallel_executions: usize,
    pub enable_compilation_cache: bool,
    pub compilation_cache_size: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoggingConfig {
    pub level: String,
    pub format: String,
    pub structured: bool,
    pub performance_logs: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GraphQLConfig {
    pub enable_playground: bool,
    pub enable_introspection: bool,
    pub max_query_complexity: usize,
    pub max_query_depth: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JsonRpcConfig {
    pub enable_batch_requests: bool,
    pub max_batch_size: usize,
    pub enable_compression: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct McpConfig {
    pub enable_tools: bool,
    pub enable_resources: bool,
    pub enable_prompts: bool,
    pub max_concurrent_requests: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FrontendConfig {
    pub enable_hot_reload: bool,
    pub bundle_optimization: bool,
    pub enable_pwa: bool,
}

impl Default for Config {
    fn default() -> Self {
        Self {
            database: DatabaseConfig {
                url: "sqlite://torque.db".to_string(),
                max_connections: 50,
                min_connections: 10,
                connection_timeout: 30,
                idle_timeout: 600,
            },
            server: ServerConfig {
                bind: "127.0.0.1:8080".to_string(),
                workers: 0, // Auto-detect CPU cores
                request_timeout: 30,
                max_payload_size: "10MB".to_string(),
            },
            performance: PerformanceConfig {
                enable_simd_json: true,
                enable_mimalloc: true,
                entity_cache_size: 10000,
                entity_cache_ttl: 300,
                js_runtime_pool_size: 20,
                connection_pool_size: 100,
            },
            xflow: XFlowConfig {
                max_execution_time: 30000,
                max_parallel_executions: 100,
                enable_compilation_cache: true,
                compilation_cache_size: 1000,
            },
            logging: LoggingConfig {
                level: "info".to_string(),
                format: "json".to_string(),
                structured: true,
                performance_logs: true,
            },
            graphql: GraphQLConfig {
                enable_playground: true,
                enable_introspection: true,
                max_query_complexity: 1000,
                max_query_depth: 20,
            },
            jsonrpc: JsonRpcConfig {
                enable_batch_requests: true,
                max_batch_size: 100,
                enable_compression: true,
            },
            mcp: McpConfig {
                enable_tools: true,
                enable_resources: true,
                enable_prompts: true,
                max_concurrent_requests: 50,
            },
            frontend: FrontendConfig {
                enable_hot_reload: false,
                bundle_optimization: true,
                enable_pwa: true,
            },
        }
    }
}

impl Config {
    pub fn load_from_file(path: &PathBuf) -> crate::Result<Self> {
        if path.exists() {
            let content = std::fs::read_to_string(path)?;
            let config: Config = toml::from_str(&content)
                .map_err(|e| crate::Error::Configuration(format!("Failed to parse config: {}", e)))?;
            Ok(config)
        } else {
            // Create default config file if it doesn't exist
            let default_config = Config::default();
            let content = toml::to_string_pretty(&default_config)
                .map_err(|e| crate::Error::Configuration(format!("Failed to serialize default config: {}", e)))?;
            std::fs::write(path, content)?;
            Ok(default_config)
        }
    }
}