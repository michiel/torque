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

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Create tokio runtime for async operations
  let rt = Runtime::new().expect("Failed to create tokio runtime");
  
  // Create shared state for server port
  let app_state = AppState {
    server_port: Arc::new(Mutex::new(None)),
  };
  let server_port_ref = app_state.server_port.clone();
  
  tauri::Builder::default()
    .manage(app_state)
    .invoke_handler(tauri::generate_handler![get_server_port])
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
      rt.spawn(async move {
        match start_embedded_server(data_dir).await {
          Ok(port) => {
            info!("Torque server started on port {}", port);
            // Store the port in shared state
            *server_port_ref.lock().unwrap() = Some(port);
          }
          Err(e) => {
            error!("Failed to start Torque server: {}", e);
          }
        }
      });

      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
