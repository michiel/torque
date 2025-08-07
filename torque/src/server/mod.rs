use crate::{Config, Result, services::ServiceRegistry};
use axum::{
    http::Method,
    routing::{get, post},
    Router,
};
use std::sync::Arc;
use tower::ServiceBuilder;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};
use std::time::Duration;

pub mod routes;
pub mod middleware;
pub mod handlers;
pub mod http;
pub mod graphql;
pub mod jsonrpc;
pub mod mcp;

/// HTTP server state containing service registry
#[derive(Clone)]
pub struct AppState {
    pub services: Arc<ServiceRegistry>,
}

/// Create the main Axum router with all routes and middleware
pub fn create_router(services: Arc<ServiceRegistry>) -> Router {
    let state = AppState { services };

    // Health check and status routes
    let health_routes = Router::new()
        .route("/health", get(handlers::health::health_check))
        .route("/metrics", get(handlers::health::metrics))
        .route("/status", get(handlers::health::status));

    // API routes (placeholders for future implementation)
    let api_routes = Router::new()
        .route("/entities", get(handlers::entity::list_entities))
        .route("/entities", post(handlers::entity::create_entity))
        .route("/entities/:id", get(handlers::entity::get_entity))
        .route("/entities/:id", post(handlers::entity::update_entity))
        .route("/entities/:id", axum::routing::delete(handlers::entity::delete_entity));

    // App Database API routes
    let app_database_routes = Router::new()
        .route("/models/:model_id/app-database/status", get(handlers::app_database::get_database_status))
        .route("/models/:model_id/app-database/entities", get(handlers::app_database::get_entities_overview))
        .route("/models/:model_id/app-database/entities/:entity_type", get(handlers::app_database::get_entity_data))
        .route("/models/:model_id/app-database/seed", post(handlers::app_database::seed_database))
        .route("/models/:model_id/app-database", axum::routing::delete(handlers::app_database::empty_database))
        .route("/models/:model_id/app-database/sync", post(handlers::app_database::sync_schema))
        .route("/models/:model_id/app-database/stats", get(handlers::app_database::get_database_stats));

    // GraphQL route (placeholder)
    let graphql_routes = Router::new()
        .route("/graphql", post(handlers::graphql::graphql_handler))
        .route("/graphql/playground", get(handlers::graphql::playground));

    // JSON-RPC route (placeholder) 
    let jsonrpc_routes = Router::new()
        .route("/rpc", post(handlers::jsonrpc::jsonrpc_handler));

    // WebSocket route for real-time synchronization
    let websocket_routes = Router::new()
        .route("/ws", get(handlers::websocket::websocket_handler));

    // Static frontend routes - serve built React applications
    let frontend_routes = Router::new()
        .route("/", get(handlers::frontend::serve_model_editor))
        .route("/models", get(handlers::frontend::serve_model_editor))
        .route("/models/*path", get(handlers::frontend::serve_model_editor))
        .route("/app/*path", get(handlers::frontend::serve_torque_app))
        .route("/assets/*path", get(handlers::frontend::serve_static_assets));

    // Configure CORS
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE])
        .allow_headers(Any)
        .allow_origin(Any)
        .max_age(Duration::from_secs(3600));

    // Build the main router
    Router::new()
        .nest("/health", health_routes)
        .nest("/api/v1", api_routes)
        .nest("/api/v1", app_database_routes)
        .nest("/", graphql_routes)
        .nest("/", jsonrpc_routes)
        .nest("/", websocket_routes)
        .nest("/", frontend_routes)
        .layer(
            ServiceBuilder::new()
                .layer(TraceLayer::new_for_http()
                    .on_request(|request: &axum::extract::Request<_>, _span: &tracing::Span| {
                        tracing::info!("Request: {} {}", request.method(), request.uri());
                    })
                    .on_response(|response: &axum::response::Response, latency: std::time::Duration, _span: &tracing::Span| {
                        tracing::info!("Response: {} in {:?}", response.status(), latency);
                    })
                    .on_failure(|error: tower_http::classify::ServerErrorsFailureClass, latency: std::time::Duration, _span: &tracing::Span| {
                        tracing::error!("Request failed: {:?} after {:?}", error, latency);
                    }))
                .layer(cors)
        )
        .with_state(state)
}

/// Start the HTTP server
pub async fn start_server(config: Config, services: Arc<ServiceRegistry>) -> Result<()> {
    let router = create_router(services.clone());
    
    tracing::info!("Starting HTTP server on {}", config.server.bind);
    
    let listener = tokio::net::TcpListener::bind(&config.server.bind).await
        .map_err(|e| {
            tracing::error!("Failed to bind to {}: {}", config.server.bind, e);
            crate::Error::Io(e)
        })?;
    
    let bound_addr = listener.local_addr().map_err(|e| crate::Error::Io(e))?;
    tracing::info!("Successfully bound to {}", bound_addr);
    
    // Test if we can create a simple connection to verify the bind is working
    tokio::spawn({
        let addr = bound_addr;
        async move {
            tokio::time::sleep(std::time::Duration::from_millis(500)).await;
            match tokio::net::TcpStream::connect(addr).await {
                Ok(_stream) => {
                    tracing::info!("Bind verification: Successfully connected to {}", addr);
                }
                Err(e) => {
                    tracing::error!("Bind verification: Failed to connect to {}: {}", addr, e);
                }
            }
        }
    });
    
    // Start background task for cache cleanup
    let cleanup_services = services.clone();
    let _cleanup_handle = tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(30));
        loop {
            interval.tick().await;
            cleanup_services.cache.cleanup_expired();
        }
    });
    
    tracing::info!("Starting axum server with router...");
    tracing::info!("Server will handle requests on {}", bound_addr);
    
    // Add debug logging to understand exactly what's happening
    tracing::info!("About to call axum::serve() - this should block indefinitely");
    let start_time = std::time::Instant::now();
    
    // Create a manual shutdown signal that never triggers
    // Keep a reference to the sender to ensure it's not dropped
    let (shutdown_tx, shutdown_rx) = tokio::sync::oneshot::channel::<()>();
    
    // Log when the shutdown sender is dropped (which would trigger shutdown)
    let shutdown_guard = shutdown_tx;
    std::mem::forget(shutdown_guard); // Prevent the sender from ever being dropped
    
    // Add periodic heartbeat logging to track server lifecycle
    let heartbeat_addr = bound_addr;
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(10));
        loop {
            interval.tick().await;
            tracing::debug!("Server heartbeat: still serving on {}", heartbeat_addr);
        }
    });
    
    // Start the server with explicit graceful shutdown handling
    let server_result = axum::serve(listener, router)
        .with_graceful_shutdown(async {
            // Wait for shutdown signal (this should never complete)
            tracing::info!("Server graceful shutdown handler started - waiting indefinitely");
            let _ = shutdown_rx.await;
            tracing::warn!("Shutdown signal received - this should never happen in normal operation");
        })
        .await;
    
    // This should NEVER be reached unless there's an error
    let elapsed = start_time.elapsed();
    tracing::error!("axum::serve() returned after {:?} - THIS SHOULD NOT HAPPEN!", elapsed);
    
    match server_result {
        Ok(_) => {
            tracing::warn!("axum::serve() completed normally - this should never happen as server should run indefinitely");
            tracing::warn!("Server shutdown gracefully");
            Ok(())
        }
        Err(e) => {
            tracing::error!("axum::serve() failed: {}", e);
            tracing::error!("Error details: {:?}", e);
            tracing::error!("Error kind: {}", e.kind());
            Err(crate::Error::Io(e))
        }
    }
}

pub use http::TorqueServer;