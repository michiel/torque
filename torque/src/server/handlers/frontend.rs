use axum::{
    extract::Path,
    http::StatusCode,
    response::Html,
};

/// Serve the Model Editor frontend (placeholder for Phase 2)
pub async fn serve_model_editor() -> Html<&'static str> {
    Html(r#"
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Torque Model Editor</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f5f5f5;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 40px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo {
                font-size: 2.5em;
                font-weight: bold;
                color: #2563eb;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #6b7280;
                font-size: 1.1em;
            }
            .feature-list {
                list-style: none;
                padding: 0;
            }
            .feature-list li {
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .feature-list li:last-child {
                border-bottom: none;
            }
            .status {
                background: #fef3c7;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                border-left: 4px solid #f59e0b;
            }
            .api-links {
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e5e7eb;
            }
            .api-links a {
                display: inline-block;
                margin: 5px 10px 5px 0;
                padding: 8px 12px;
                background: #e5e7eb;
                text-decoration: none;
                border-radius: 4px;
                color: #374151;
            }
            .api-links a:hover {
                background: #d1d5db;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="logo">Torque</div>
                <div class="subtitle">High-Performance Application Platform</div>
            </div>
            
            <div class="status">
                <strong>Phase 1 Development Active</strong><br>
                The Model Editor frontend will be available in Phase 2 (Weeks 7-12)
            </div>
            
            <h3>Planned Model Editor Features:</h3>
            <ul class="feature-list">
                <li>📊 Visual model designer with drag-and-drop interface</li>
                <li>🔗 Entity relationship modeling</li>
                <li>⚡ Real-time collaboration</li>
                <li>🔍 Model validation and error checking</li>
                <li>📱 Responsive design for all devices</li>
                <li>🎨 Customizable themes and layouts</li>
                <li>📤 Export models to various formats</li>
                <li>🔄 Version control and history</li>
            </ul>
            
            <div class="api-links">
                <strong>Available APIs:</strong><br>
                <a href="/health">Health Check</a>
                <a href="/metrics">Metrics</a>
                <a href="/status">Status</a>
                <a href="/api/v1/entities">Entity API</a>
                <a href="/graphql/playground">GraphQL Playground</a>
            </div>
        </div>
    </body>
    </html>
    "#)
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