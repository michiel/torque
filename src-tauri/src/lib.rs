use log::{info, error};
use tokio::runtime::Runtime;
use std::sync::{Arc, Mutex};

mod server;
mod storage;

use server::start_embedded_server;
use storage::get_data_directory;

// Global state to store server port
pub struct AppState {
    pub server_port: Arc<Mutex<Option<u16>>>,
}

// Tauri command to get the server port
#[tauri::command]
fn get_server_port(state: tauri::State<AppState>) -> Option<u16> {
    *state.server_port.lock().unwrap()
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
  
  // Create shared state for server port
  let app_state = AppState {
    server_port: Arc::new(Mutex::new(None)),
  };
  let server_port_ref = app_state.server_port.clone();
  let server_port_ref_for_protocol = server_port_ref.clone();
  
  tauri::Builder::default()
    .manage(app_state)
    .invoke_handler(tauri::generate_handler![get_server_port, check_server_health, api_request])
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
      // Set up logging
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      info!("Starting Torque Desktop Application");
      
      // Get platform-specific data directory
      let data_dir = get_data_directory().map_err(|e| format!("Failed to get data directory: {}", e))?;
      info!("Using data directory: {}", data_dir.display());

      // Start embedded Torque server
      let _app_handle = app.handle().clone();
      let data_dir_clone = data_dir.clone();
      std::thread::spawn(move || {
        info!("Starting server thread...");
        rt.block_on(async move {
          info!("Inside async block, starting server...");
          match start_embedded_server(data_dir_clone).await {
            Ok(port) => {
              info!("Torque server started on port {}", port);
              // Store the port in shared state
              *server_port_ref.lock().unwrap() = Some(port);
              
              // Block indefinitely to keep the server thread alive
              // This prevents the thread from exiting and taking the server with it
              info!("Server thread will now block indefinitely to keep server alive...");
              loop {
                tokio::time::sleep(std::time::Duration::from_secs(3600)).await; // Sleep for 1 hour at a time
              }
            }
            Err(e) => {
              error!("Failed to start Torque server: {}", e);
            }
          }
        });
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
