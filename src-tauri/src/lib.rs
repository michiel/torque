use log::{info, error};
use tokio::runtime::Runtime;

mod server;
mod storage;

use server::start_embedded_server;
use storage::get_data_directory;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  // Create tokio runtime for async operations
  let rt = Runtime::new().expect("Failed to create tokio runtime");
  
  tauri::Builder::default()
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
      let app_handle = app.handle().clone();
      rt.spawn(async move {
        match start_embedded_server(data_dir).await {
          Ok(port) => {
            info!("Torque server started on port {}", port);
            // TODO: Pass port to frontend via Tauri commands
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
