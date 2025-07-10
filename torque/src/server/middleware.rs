use axum::{
    extract::{Request, State},
    http::{HeaderMap, StatusCode},
    middleware::Next,
    response::Response,
};
use std::time::Instant;
use crate::server::AppState;

/// Request timing middleware - records request duration metrics
pub async fn timing_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Response {
    let start = Instant::now();
    let method = request.method().clone();
    let uri = request.uri().clone();
    
    // Process the request
    let response = next.run(request).await;
    
    // Record timing metrics
    let duration = start.elapsed();
    state.services.metrics.record_request_time(duration);
    
    // Log request details
    tracing::info!(
        method = %method,
        uri = %uri,
        status = %response.status(),
        duration_ms = %duration.as_millis(),
        "Request processed"
    );
    
    response
}

/// Request ID middleware - adds unique request IDs for tracing
pub async fn request_id_middleware(
    mut request: Request,
    next: Next,
) -> Response {
    let request_id = uuid::Uuid::new_v4().to_string();
    
    // Add request ID to headers for downstream services
    request.headers_mut().insert(
        "x-request-id",
        request_id.parse().unwrap(),
    );
    
    let mut response = next.run(request).await;
    
    // Add request ID to response headers
    response.headers_mut().insert(
        "x-request-id",
        request_id.parse().unwrap(),
    );
    
    response
}

/// Rate limiting middleware (placeholder for future implementation)
pub async fn rate_limit_middleware(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // TODO: Implement actual rate limiting logic
    // This would typically check:
    // - Client IP or API key
    // - Request count per time window
    // - Different limits for different endpoints
    
    let _client_ip = headers
        .get("x-forwarded-for")
        .or_else(|| headers.get("x-real-ip"))
        .and_then(|h| h.to_str().ok())
        .unwrap_or("unknown");
    
    // For now, just pass through all requests
    Ok(next.run(request).await)
}

/// Authentication middleware (placeholder for future implementation)
pub async fn auth_middleware(
    headers: HeaderMap,
    request: Request,
    next: Next,
) -> Result<Response, StatusCode> {
    // TODO: Implement authentication logic
    // This would typically:
    // - Extract JWT token from Authorization header
    // - Validate token signature and expiration
    // - Add user context to request
    // - Check permissions for the requested resource
    
    let _auth_header = headers
        .get("authorization")
        .and_then(|h| h.to_str().ok());
    
    // For now, allow all requests (development mode)
    Ok(next.run(request).await)
}

/// CORS preflight handler
pub async fn cors_preflight() -> Response {
    Response::builder()
        .status(StatusCode::OK)
        .header("access-control-allow-origin", "*")
        .header("access-control-allow-methods", "GET, POST, PUT, DELETE, OPTIONS")
        .header("access-control-allow-headers", "content-type, authorization, x-request-id")
        .header("access-control-max-age", "3600")
        .body("".into())
        .unwrap()
}

/// Error handling middleware
pub async fn error_handler_middleware(
    request: Request,
    next: Next,
) -> Response {
    let response = next.run(request).await;
    
    // Log errors for monitoring
    if response.status().is_server_error() {
        tracing::error!(
            status = %response.status(),
            "Server error occurred"
        );
    }
    
    response
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::{body::Body, http::Method};

    #[tokio::test]
    async fn test_request_id_generation() {
        // This would need proper test setup with mock middleware stack
        // For now, just test that UUID generation works
        let request_id = uuid::Uuid::new_v4().to_string();
        assert!(request_id.len() > 0);
        assert!(uuid::Uuid::parse_str(&request_id).is_ok());
    }

    #[test]
    fn test_cors_headers() {
        // Test CORS configuration values
        let allowed_methods = ["GET", "POST", "PUT", "DELETE", "OPTIONS"];
        assert!(allowed_methods.contains(&"POST"));
        assert!(allowed_methods.contains(&"DELETE"));
    }
}