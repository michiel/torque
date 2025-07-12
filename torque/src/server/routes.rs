// Route definitions and utilities
// This module will contain route helpers and utilities for organizing the API

use axum::Router;
use crate::server::AppState;

/// Create entity-related routes
pub fn entity_routes() -> Router<AppState> {
    Router::new()
    // Routes are defined in the main server module for now
    // This module can be expanded for more complex routing logic
}

/// Create health check routes  
pub fn health_routes() -> Router<AppState> {
    Router::new()
    // Health routes are defined in the main server module
}

/// Route utilities and helpers
pub mod utils {
    use crate::common::Uuid;
    
    /// Validate UUID path parameter
    pub fn validate_uuid(id: &str) -> Result<Uuid, String> {
        Uuid::parse(id).map_err(|_| "Invalid UUID format".to_string())
    }
    
    /// Extract pagination parameters
    pub fn extract_pagination(limit: Option<u64>, offset: Option<u64>) -> (u64, u64) {
        let limit = limit.unwrap_or(50).min(1000); // Max 1000 items per page
        let offset = offset.unwrap_or(0);
        (limit, offset)
    }
}

#[cfg(test)]
mod tests {
    use super::utils::*;
    use crate::common::Uuid;

    #[test]
    fn test_validate_uuid() {
        let valid_uuid = Uuid::new_v4().to_string();
        assert!(validate_uuid(&valid_uuid).is_ok());
        
        assert!(validate_uuid("invalid-uuid").is_err());
        assert!(validate_uuid("").is_err());
    }

    #[test]
    fn test_extract_pagination() {
        // Default values
        assert_eq!(extract_pagination(None, None), (50, 0));
        
        // Custom values
        assert_eq!(extract_pagination(Some(100), Some(10)), (100, 10));
        
        // Limit enforcement
        assert_eq!(extract_pagination(Some(2000), None), (1000, 0));
    }
}