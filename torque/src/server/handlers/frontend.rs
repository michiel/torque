use axum::{
    extract::Path,
    http::{StatusCode, header, HeaderValue},
    response::{Html, Response},
    body::Body,
};
use rust_embed::RustEmbed;
use std::path::PathBuf;

#[derive(RustEmbed)]
#[folder = "../frontend/model-editor/dist/"]
struct ModelEditorAssets;

/// Serve the Model Editor frontend - serve the built React app
pub async fn serve_model_editor() -> Result<Response<Body>, StatusCode> {
    tracing::info!("Serving Model Editor index.html from embedded assets");
    serve_embedded_file("index.html").await
}

/// Serve static assets (CSS, JS files) from embedded assets
pub async fn serve_static_assets(Path(path): Path<String>) -> Result<Response<Body>, StatusCode> {
    let file_path = format!("assets/{}", path);
    serve_embedded_file(&file_path).await
}

/// Helper function to serve embedded files with proper MIME types
async fn serve_embedded_file(file_path: &str) -> Result<Response<Body>, StatusCode> {
    tracing::info!("Serving embedded file: {}", file_path);
    
    let content = ModelEditorAssets::get(file_path)
        .ok_or_else(|| {
            tracing::error!("Embedded file not found: {}", file_path);
            StatusCode::NOT_FOUND
        })?;
    
    let content_type = determine_content_type_from_path(file_path);
    
    Response::builder()
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CACHE_CONTROL, "public, max-age=86400") // Longer cache for embedded assets
        .body(Body::from(content.data.as_ref().to_vec()))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

/// Legacy helper function for serving static files (fallback for development)
#[allow(dead_code)]
async fn serve_static_file(file_path: &str) -> Result<Response<Body>, StatusCode> {
    let current_dir = std::env::current_dir()
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)?;
    let full_path = current_dir.join(file_path);
    
    tracing::info!("Attempting to serve static file: {} (resolved to: {})", file_path, full_path.display());
    
    let content = tokio::fs::read(&full_path).await
        .map_err(|e| {
            tracing::error!("Failed to read static file {}: {}", full_path.display(), e);
            StatusCode::NOT_FOUND
        })?;
    
    let content_type = determine_content_type(&full_path);
    
    Response::builder()
        .header(header::CONTENT_TYPE, content_type)
        .header(header::CACHE_CONTROL, "public, max-age=3600")
        .body(Body::from(content))
        .map_err(|_| StatusCode::INTERNAL_SERVER_ERROR)
}

/// Determine MIME type based on file extension
fn determine_content_type(path: &PathBuf) -> HeaderValue {
    match path.extension().and_then(|ext| ext.to_str()) {
        Some("html") => HeaderValue::from_static("text/html; charset=utf-8"),
        Some("js") => HeaderValue::from_static("application/javascript"),
        Some("css") => HeaderValue::from_static("text/css"),
        Some("png") => HeaderValue::from_static("image/png"),
        Some("jpg") | Some("jpeg") => HeaderValue::from_static("image/jpeg"),
        Some("gif") => HeaderValue::from_static("image/gif"),
        Some("svg") => HeaderValue::from_static("image/svg+xml"),
        Some("ico") => HeaderValue::from_static("image/x-icon"),
        Some("json") => HeaderValue::from_static("application/json"),
        _ => HeaderValue::from_static("application/octet-stream"),
    }
}

/// Determine MIME type based on file path string
fn determine_content_type_from_path(file_path: &str) -> HeaderValue {
    let extension = file_path.split('.').last().unwrap_or("");
    match extension {
        "html" => HeaderValue::from_static("text/html; charset=utf-8"),
        "js" => HeaderValue::from_static("application/javascript"),
        "css" => HeaderValue::from_static("text/css"),
        "png" => HeaderValue::from_static("image/png"),
        "jpg" | "jpeg" => HeaderValue::from_static("image/jpeg"),
        "gif" => HeaderValue::from_static("image/gif"),
        "svg" => HeaderValue::from_static("image/svg+xml"),
        "ico" => HeaderValue::from_static("image/x-icon"),
        "json" => HeaderValue::from_static("application/json"),
        "woff" | "woff2" => HeaderValue::from_static("font/woff2"),
        "ttf" => HeaderValue::from_static("font/ttf"),
        _ => HeaderValue::from_static("application/octet-stream"),
    }
}

/// Serve TorqueApp frontend (placeholder for Phase 3)
pub async fn serve_torque_app(Path(path): Path<String>) -> Result<Html<&'static str>, StatusCode> {
    // TODO: In Phase 3, this will serve dynamically generated React applications
    // based on the model definitions
    
    tracing::info!("TorqueApp request for path: {}", path);
    
    Ok(Html(r#"
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Torque App</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f8fafc;
            }
            .container {
                max-width: 600px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2em;
                font-weight: bold;
                color: #1e40af;
                margin-bottom: 10px;
            }
            .status {
                background: #dbeafe;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #3b82f6;
            }
            .timeline {
                list-style: none;
                padding: 0;
                margin: 20px 0;
            }
            .timeline li {
                padding: 10px 0;
                border-left: 2px solid #e5e7eb;
                padding-left: 20px;
                margin-left: 10px;
            }
            .timeline li.active {
                border-left-color: #3b82f6;
                font-weight: 600;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">TorqueApp</div>
                <div>Dynamic Application Runtime</div>
            </div>
            
            <div class="status">
                <strong>Coming in Phase 3 (Weeks 13-18)</strong><br>
                TorqueApp will dynamically generate React frontends from your models
            </div>
            
            <h3>Development Timeline:</h3>
            <ul class="timeline">
                <li class="active">Phase 1: Core Foundation (In Progress)</li>
                <li>Phase 2: Model System (Weeks 7-12)</li>
                <li>Phase 3: TorqueApp Runtime (Weeks 13-18)</li>
                <li>Phase 4: XFlow Engine (Weeks 19-24)</li>
                <li>Phase 5: MCP Integration (Weeks 25-30)</li>
                <li>Phase 6: Production Ready (Weeks 31-36)</li>
            </ul>
            
            <h3>TorqueApp Features (Phase 3):</h3>
            <ul>
                <li>🚀 Dynamic React component generation</li>
                <li>📱 Responsive layouts based on model definitions</li>
                <li>🔄 Real-time data synchronization</li>
                <li>🎨 Customizable themes and styling</li>
                <li>⚡ Optimized for performance</li>
                <li>🔧 Extensible component system</li>
            </ul>
        </div>
    </body>
    </html>
    "#))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_model_editor_serves_html() {
        let response = serve_model_editor().await;
        assert!(response.0.contains("Torque Model Editor"));
        assert!(response.0.contains("Phase 1 Development Active"));
    }

    #[tokio::test]
    async fn test_torque_app_serves_html() {
        let response = serve_torque_app(Path("test/path".to_string())).await;
        assert!(response.is_ok());
        let html = response.unwrap();
        assert!(html.0.contains("TorqueApp"));
        assert!(html.0.contains("Phase 3"));
    }
}