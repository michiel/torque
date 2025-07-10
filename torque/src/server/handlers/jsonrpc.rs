use crate::server::AppState;
use axum::{
    extract::State,
    http::StatusCode,
    response::Json,
};
use serde_json::{json, Value};

/// JSON-RPC endpoint handler (placeholder for Phase 3)
pub async fn jsonrpc_handler(
    State(_state): State<AppState>,
    Json(request): Json<Value>,
) -> Result<Json<Value>, StatusCode> {
    tracing::info!("JSON-RPC request received: {}", request);
    
    // Extract request ID for proper JSON-RPC response format
    let request_id = request.get("id").cloned().unwrap_or(json!(null));
    
    // TODO: Implement actual JSON-RPC processing in Phase 3
    let response = json!({
        "jsonrpc": "2.0",
        "id": request_id,
        "error": {
            "code": -32601,
            "message": "Method not found - JSON-RPC endpoint not yet implemented",
            "data": "JSON-RPC API will be available in Phase 3 (TorqueApp Runtime)"
        }
    });
    
    Ok(Json(response))
}

/// JSON-RPC method dispatcher (future implementation)
#[allow(dead_code)]
async fn dispatch_method(
    _state: &AppState,
    _method: &str,
    _params: &Value,
) -> Result<Value, (i32, String)> {
    // TODO: Implement in Phase 3
    // This will handle:
    // - Dynamic UI generation methods
    // - Component state management
    // - Layout engine operations
    // - Real-time frontend updates
    
    Err((-32601, "Method not implemented yet".to_string()))
}

/// Validate JSON-RPC request format
#[allow(dead_code)]
fn validate_jsonrpc_request(request: &Value) -> Result<(), (i32, String)> {
    // Check for required fields
    if !request.is_object() {
        return Err((-32600, "Invalid Request - not an object".to_string()));
    }
    
    let obj = request.as_object().unwrap();
    
    if obj.get("jsonrpc") != Some(&json!("2.0")) {
        return Err((-32600, "Invalid Request - missing or invalid jsonrpc field".to_string()));
    }
    
    if !obj.contains_key("method") {
        return Err((-32600, "Invalid Request - missing method field".to_string()));
    }
    
    if !obj.contains_key("id") {
        return Err((-32600, "Invalid Request - missing id field".to_string()));
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn test_validate_jsonrpc_request() {
        // Valid request
        let valid_request = json!({
            "jsonrpc": "2.0",
            "method": "test_method",
            "params": {},
            "id": 1
        });
        assert!(validate_jsonrpc_request(&valid_request).is_ok());
        
        // Invalid request - missing jsonrpc
        let invalid_request = json!({
            "method": "test_method",
            "id": 1
        });
        assert!(validate_jsonrpc_request(&invalid_request).is_err());
        
        // Invalid request - not an object
        let invalid_request = json!("not an object");
        assert!(validate_jsonrpc_request(&invalid_request).is_err());
    }

    #[tokio::test]
    async fn test_jsonrpc_error_response_format() {
        // TODO: Add comprehensive JSON-RPC tests in Phase 3
        let request = json!({
            "jsonrpc": "2.0",
            "method": "nonexistent_method",
            "id": 123
        });
        
        // This would test the actual handler, but since it's a placeholder,
        // we'll just verify the response structure for now
        let expected_id = request.get("id").cloned().unwrap();
        assert_eq!(expected_id, json!(123));
    }
}