use log::{info, error};
use tokio::runtime::Runtime;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Manager, menu::{Menu, MenuItem, Submenu, PredefinedMenuItem}};

mod server;
mod storage;

use server::start_embedded_server;
use storage::get_data_directory;

// Global state to store server port and control
pub struct AppState {
    pub server_port: Arc<Mutex<Option<u16>>>,
    pub server_shutdown: Arc<Mutex<Option<tokio::sync::oneshot::Sender<()>>>>,
    pub runtime: Arc<Runtime>,
}

// Tauri command to get the server port
#[tauri::command]
fn get_server_port(state: tauri::State<AppState>) -> Option<u16> {
    let port = *state.server_port.lock().unwrap();
    info!("get_server_port called from frontend, returning: {:?}", port);
    port
}

// Tauri command to test if API is working
#[tauri::command]
fn test_tauri_api() -> String {
    info!("test_tauri_api called from frontend - Tauri API is working!");
    "Tauri API is working!".to_string()
}

// Tauri command to restart the backend server
#[tauri::command]
async fn restart_backend(state: tauri::State<'_, AppState>) -> Result<String, String> {
    info!("restart_backend called from menu");
    
    // Clear the current port to signal a restart
    {
        let mut port = state.server_port.lock().unwrap();
        info!("Clearing current server port: {:?}", *port);
        *port = None;
    }
    
    // Start a new server instance
    let data_dir = get_data_directory().map_err(|e| format!("Failed to get data directory: {}", e))?;
    let server_port_ref = state.server_port.clone();
    let runtime = state.runtime.clone();
    
    info!("Starting new server instance...");
    runtime.spawn(async move {
        match start_embedded_server(data_dir).await {
            Ok(port) => {
                info!("🎉 New server started successfully on port {}", port);
                *server_port_ref.lock().unwrap() = Some(port);
            }
            Err(e) => {
                error!("❌ Failed to restart server: {}", e);
            }
        }
    });
    
    info!("Backend restart initiated - new server starting");
    Ok("Backend restart initiated".to_string())
}

// Tauri command to reload the frontend
#[tauri::command]
async fn reload_frontend(app: AppHandle) -> Result<String, String> {
    info!("reload_frontend called from menu");
    
    // Get the main window and reload it
    if let Some(window) = app.get_webview_window("main") {
        match window.eval("window.location.reload()") {
            Ok(_) => {
                info!("Frontend reload initiated");
                Ok("Frontend reloaded".to_string())
            }
            Err(e) => {
                error!("Failed to reload frontend: {}", e);
                Err(format!("Failed to reload frontend: {}", e))
            }
        }
    } else {
        let error_msg = "Main window not found";
        error!("{}", error_msg);
        Err(error_msg.to_string())
    }
}

// Tauri command to quit the application
#[tauri::command]
async fn quit_application(app: AppHandle) -> Result<String, String> {
    info!("quit_application called from menu");
    
    // Gracefully exit the application
    app.exit(0);
    Ok("Application quit initiated".to_string())
}

// Tauri command to check server health
#[tauri::command]
async fn check_server_health(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    let port = *state.server_port.lock().unwrap();
    if let Some(port) = port {
        info!("Tauri command health check for port: {}", port);
        
        // Use the exact same approach as the internal health check
        match reqwest::get(&format!("http://127.0.0.1:{}/health/health", port)).await {
            Ok(response) => {
                let status = response.status();
                info!("Health check response status: {}", status);
                if status.is_success() {
                    info!("Health check successful");
                    Ok(true)
                } else {
                    Err(format!("Health check got HTTP {}", status))
                }
            }
            Err(e) => {
                error!("Health check connection failed: {}", e);
                Err(format!("Health check failed: {}", e))
            }
        }
    } else {
        Err("Server port not available".to_string())
    }
}

// Tauri command to proxy API calls to the embedded server
#[tauri::command]
async fn api_request(
    state: tauri::State<'_, AppState>,
    method: String,
    path: String,
    body: Option<String>,
    headers: Option<std::collections::HashMap<String, String>>,
) -> Result<String, String> {
    let port = *state.server_port.lock().unwrap();
    if let Some(port) = port {
        let url = format!("http://127.0.0.1:{}{}", port, path);
        info!("API request: {} {}", method, url);
        
        let client = reqwest::Client::new();
        let mut request = match method.to_uppercase().as_str() {
            "GET" => client.get(&url),
            "POST" => client.post(&url),
            "PUT" => client.put(&url),
            "DELETE" => client.delete(&url),
            _ => return Err("Unsupported HTTP method".to_string()),
        };
        
        // Add headers if provided
        if let Some(headers) = headers {
            for (key, value) in headers {
                request = request.header(&key, &value);
            }
        }
        
        // Add body if provided
        if let Some(body) = body {
            request = request.body(body);
        }
        
        match request.send().await {
            Ok(response) => {
                match response.text().await {
                    Ok(text) => Ok(text),
                    Err(e) => Err(format!("Failed to read response: {}", e)),
                }
            }
            Err(e) => {
                error!("API request failed: {}", e);
                Err(format!("API request failed: {}", e))
            }
        }
    } else {
        Err("Server not available".to_string())
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Create tokio runtime for async operations
  let rt = Runtime::new().expect("Failed to create tokio runtime");
  
  // Create shared state for server port and control
  let app_state = AppState {
    server_port: Arc::new(Mutex::new(None)),
    server_shutdown: Arc::new(Mutex::new(None)),
    runtime: Arc::new(Runtime::new().expect("Failed to create runtime for AppState")),
  };
  let server_port_ref = app_state.server_port.clone();
  let server_port_ref_for_protocol = server_port_ref.clone();
  
  tauri::Builder::default()
    .manage(app_state)
    .invoke_handler(tauri::generate_handler![
        get_server_port, 
        test_tauri_api, 
        check_server_health, 
        api_request,
        restart_backend,
        reload_frontend,
        quit_application
    ])
    .on_menu_event(|app, event| {
        info!("Menu event received: {:?}", event.id());
        match event.id().as_ref() {
            "restart_backend" => {
                info!("Menu: Restart Backend clicked");
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    let state = app_handle.state::<AppState>();
                    if let Err(e) = restart_backend(state).await {
                        error!("Failed to restart backend: {}", e);
                    }
                });
            }
            "reload_frontend" | "reload" => {
                info!("Menu: Reload Frontend clicked");
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = reload_frontend(app_handle).await {
                        error!("Failed to reload frontend: {}", e);
                    }
                });
            }
            "quit" => {
                info!("Menu: Quit clicked");
                let app_handle = app.clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(e) = quit_application(app_handle).await {
                        error!("Failed to quit application: {}", e);
                    }
                });
            }
            "toggle_devtools" => {
                info!("Menu: Toggle DevTools clicked");
                if let Some(window) = app.get_webview_window("main") {
                    // In Tauri v2, devtools are controlled differently
                    #[cfg(debug_assertions)]
                    {
                        // Try to use eval to open DevTools as a fallback
                        let _ = window.eval("window.__TAURI__ && window.__TAURI__.invoke ? window.__TAURI__.invoke('plugin:devtools|open') : console.log('DevTools not available')");
                        info!("Attempted to toggle DevTools");
                    }
                    #[cfg(not(debug_assertions))]
                    {
                        info!("DevTools only available in debug builds");
                    }
                }
            }
            _ => {
                info!("Unknown menu item clicked: {:?}", event.id());
            }
        }
    })
    .register_asynchronous_uri_scheme_protocol("torque", move |_app, request, responder| {
        let server_port_ref = server_port_ref_for_protocol.clone();
        
        tauri::async_runtime::spawn(async move {
            let port = *server_port_ref.lock().unwrap();
            if let Some(port) = port {
                let uri = request.uri();
                // Convert torque://localhost/path to http://127.0.0.1:port/path
                let path = uri.path();
                let query = uri.query().map(|q| format!("?{}", q)).unwrap_or_default();
                let url = format!("http://127.0.0.1:{}{}{}", port, path, query);
                
                info!("Proxying request: {} -> {}", uri, url);
                
                // First test if port is accessible with a simple socket connection
                use std::net::{TcpStream, SocketAddr};
                let socket_addr = format!("127.0.0.1:{}", port);
                let socket_result = TcpStream::connect_timeout(
                    &socket_addr.parse::<SocketAddr>().unwrap(), 
                    std::time::Duration::from_millis(1000)
                );
                
                match socket_result {
                    Ok(stream) => {
                        info!("TCP socket connection to {} successful", socket_addr);
                        drop(stream);
                    }
                    Err(e) => {
                        error!("TCP socket connection to {} failed: {}", socket_addr, e);
                        return responder.respond(
                            tauri::http::Response::builder()
                                .status(503)
                                .body(format!("Port {} not accessible: {}", port, e).into_bytes())
                                .unwrap()
                        );
                    }
                }
                
                match reqwest::get(&url).await {
                    Ok(response) => {
                        let status_code = response.status().as_u16();
                        let headers = response.headers().clone();
                        match response.bytes().await {
                            Ok(body) => {
                                let mut tauri_response = tauri::http::Response::builder().status(status_code);
                                
                                for (name, value) in headers.iter() {
                                    if let Ok(value_str) = value.to_str() {
                                        tauri_response = tauri_response.header(name.as_str(), value_str);
                                    }
                                }
                                
                                match tauri_response.body(body.to_vec()) {
                                    Ok(response) => responder.respond(response),
                                    Err(e) => {
                                        error!("Failed to build response: {}", e);
                                        responder.respond(
                                            tauri::http::Response::builder()
                                                .status(500)
                                                .body(b"Internal Server Error".to_vec())
                                                .unwrap()
                                        );
                                    }
                                }
                            }
                            Err(e) => {
                                error!("Failed to read response body: {}", e);
                                responder.respond(
                                    tauri::http::Response::builder()
                                        .status(500)
                                        .body(b"Failed to read response".to_vec())
                                        .unwrap()
                                );
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to proxy request: {}", e);
                        responder.respond(
                            tauri::http::Response::builder()
                                .status(503)
                                .body(b"Service Unavailable".to_vec())
                                .unwrap()
                        );
                    }
                }
            } else {
                responder.respond(
                    tauri::http::Response::builder()
                        .status(503)
                        .body(b"Server not available".to_vec())
                        .unwrap()
                );
            }
        });
    })
    .setup(move |app| {
      // Set up logging - always enable for debugging
      app.handle().plugin(
        tauri_plugin_log::Builder::default()
          .level(log::LevelFilter::Debug)
          .build(),
      )?;

      println!("🚀 Starting Torque Desktop Application...");
      info!("🚀 Starting Torque Desktop Application");
      eprintln!("DEBUG: Tauri app setup starting - logging enabled");
      
      // Create native menu
      let restart_backend_item = MenuItem::with_id(app, "restart_backend", "Restart Backend", true, None::<&str>)?;
      let reload_frontend_item = MenuItem::with_id(app, "reload_frontend", "Reload Frontend", true, None::<&str>)?;
      let quit_item = MenuItem::with_id(app, "quit", "Quit", true, Some("CmdOrCtrl+Q"))?;
      
      let torque_menu = Submenu::with_id_and_items(app, "torque", "Torque", true, &[
        &restart_backend_item,
        &reload_frontend_item,
        &PredefinedMenuItem::separator(app)?,
        &quit_item,
      ])?;
      
      let reload_item = MenuItem::with_id(app, "reload", "Reload", true, Some("CmdOrCtrl+R"))?;
      let devtools_item = MenuItem::with_id(app, "toggle_devtools", "Toggle Developer Tools", true, Some("F12"))?;
      
      let view_menu = Submenu::with_id_and_items(app, "view", "View", true, &[
        &reload_item,
        &devtools_item,
      ])?;
      
      let menu = Menu::with_items(app, &[&torque_menu, &view_menu])?;
      app.set_menu(menu)?;
      
      info!("Native menu created successfully");
      
      // Get platform-specific data directory
      let data_dir = get_data_directory().map_err(|e| format!("Failed to get data directory: {}", e))?;
      info!("Using data directory: {}", data_dir.display());

      // Start embedded Torque server
      let _app_handle = app.handle().clone();
      let data_dir_clone = data_dir.clone();
      info!("Creating server thread...");
      
      std::thread::spawn(move || {
        info!("Server thread created, entering tokio runtime...");
        rt.block_on(async move {
          info!("Inside tokio runtime, about to start embedded server...");
          info!("Data directory for server: {}", data_dir_clone.display());
          
          match start_embedded_server(data_dir_clone).await {
            Ok(port) => {
              info!("🎉 Torque server successfully started on port {}", port);
              
              // Store the port in shared state
              info!("Storing port {} in shared state...", port);
              *server_port_ref.lock().unwrap() = Some(port);
              info!("Port stored in shared state successfully");
              
              // Verify we can actually call the port getter
              let stored_port = *server_port_ref.lock().unwrap();
              info!("Verified stored port: {:?}", stored_port);
              
              // Block indefinitely to keep the server thread alive
              // This prevents the thread from exiting and taking the server with it
              info!("Server startup complete. Server thread will now block indefinitely to keep server alive...");
              loop {
                tokio::time::sleep(std::time::Duration::from_secs(3600)).await; // Sleep for 1 hour at a time
              }
            }
            Err(e) => {
              error!("❌ CRITICAL: Failed to start Torque server: {}", e);
              error!("Error details: {:?}", e);
              
              // Log some diagnostic information
              error!("Server startup failed - this means the desktop app will not be able to connect");
              error!("Check if there are any permission issues with the data directory or ports");
              
              // Set error state (port remains None)
              let stored_port = *server_port_ref.lock().unwrap();
              error!("Server port state remains: {:?}", stored_port);
            }
          }
        });
      });
      
      info!("Server thread spawned, setup phase complete");

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
