use directories::ProjectDirs;
use std::path::PathBuf;
use std::fs;

/// Get the platform-specific data directory for Torque Desktop
pub fn get_data_directory() -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>> {
    println!("DEBUG: Starting get_data_directory()");
    
    // Try ProjectDirs first
    if let Some(proj_dirs) = ProjectDirs::from("com", "torque", "torque-desktop") {
        let data_dir = proj_dirs.data_dir().to_path_buf();
        println!("DEBUG: ProjectDirs computed path: {}", data_dir.display());
        
        // Test if we can create and write to this directory
        if fs::create_dir_all(&data_dir).is_ok() {
            let test_file = data_dir.join("test_write.tmp");
            if fs::write(&test_file, "test").is_ok() {
                let _ = fs::remove_file(&test_file);
                println!("DEBUG: ProjectDirs path works: {}", data_dir.display());
                log::info!("Using ProjectDirs data directory: {}", data_dir.display());
                return Ok(data_dir);
            }
        }
        println!("DEBUG: ProjectDirs path failed, trying fallback");
    }
    
    // Fallback to simpler platform-specific paths
    use std::env;
    let data_dir = if cfg!(target_os = "macos") {
        // macOS: Use a simpler path that should always work
        let home = env::var("HOME").map_err(|_| "Cannot get HOME directory")?;
        PathBuf::from(home).join("Library").join("Application Support").join("torque-desktop")
    } else if cfg!(target_os = "windows") {
        // Windows: Use APPDATA
        let appdata = env::var("APPDATA").map_err(|_| "Cannot get APPDATA directory")?;
        PathBuf::from(appdata).join("torque-desktop")
    } else {
        // Linux: Use XDG or fallback to .local/share
        if let Ok(xdg_data) = env::var("XDG_DATA_HOME") {
            PathBuf::from(xdg_data).join("torque-desktop")
        } else {
            let home = env::var("HOME").map_err(|_| "Cannot get HOME directory")?;
            PathBuf::from(home).join(".local").join("share").join("torque-desktop")
        }
    };
    
    println!("DEBUG: Fallback data directory path: {}", data_dir.display());
    log::info!("Using fallback data directory: {}", data_dir.display());
    
    // Check if the parent directory exists and is writable
    if let Some(parent) = data_dir.parent() {
        println!("DEBUG: Parent directory: {}", parent.display());
        if !parent.exists() {
            println!("DEBUG: Parent directory does not exist");
            log::error!("Parent directory does not exist: {}", parent.display());
        } else {
            println!("DEBUG: Parent directory exists");
        }
    }
    
    // Test if we can create the directory
    println!("DEBUG: Attempting to create directory...");
    if let Err(e) = fs::create_dir_all(&data_dir) {
        println!("DEBUG: Failed to create data directory: {}", e);
        log::error!("Failed to create data directory {}: {}", data_dir.display(), e);
        return Err(format!("Cannot create data directory {}: {}", data_dir.display(), e).into());
    }
    println!("DEBUG: Directory created successfully");
    
    // Test if we can write to the directory
    let test_file = data_dir.join("test_write.tmp");
    println!("DEBUG: Testing write to: {}", test_file.display());
    if let Err(e) = fs::write(&test_file, "test") {
        println!("DEBUG: Failed to write test file: {}", e);
        log::error!("Cannot write to data directory {}: {}", data_dir.display(), e);
        return Err(format!("Cannot write to data directory {}: {}", data_dir.display(), e).into());
    }
    println!("DEBUG: Write test successful");
    
    // Clean up test file
    let _ = fs::remove_file(&test_file);
    
    println!("DEBUG: Data directory verified: {}", data_dir.display());
    log::info!("Data directory verified: {}", data_dir.display());
    Ok(data_dir)
}

/// Get the platform-specific config directory for Torque Desktop
pub fn get_config_directory() -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>> {
    let proj_dirs = ProjectDirs::from("com", "torque", "torque-desktop")
        .ok_or("Failed to determine project directories")?;
    
    let config_dir = proj_dirs.config_dir().to_path_buf();
    
    // Ensure the directory exists
    fs::create_dir_all(&config_dir)?;
    
    Ok(config_dir)
}

/// Get the platform-specific cache directory for Torque Desktop
pub fn get_cache_directory() -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>> {
    let proj_dirs = ProjectDirs::from("com", "torque", "torque-desktop")
        .ok_or("Failed to determine project directories")?;
    
    let cache_dir = proj_dirs.cache_dir().to_path_buf();
    
    // Ensure the directory exists
    fs::create_dir_all(&cache_dir)?;
    
    Ok(cache_dir)
}