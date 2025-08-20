use directories::ProjectDirs;
use std::path::PathBuf;
use std::fs;

/// Get the platform-specific data directory for Torque Desktop
pub fn get_data_directory() -> Result<PathBuf, Box<dyn std::error::Error + Send + Sync>> {
    let proj_dirs = ProjectDirs::from("com", "torque", "torque-desktop")
        .ok_or("Failed to determine project directories")?;
    
    let data_dir = proj_dirs.data_dir().to_path_buf();
    
    // Log the computed path for debugging
    log::info!("Computed data directory path: {}", data_dir.display());
    
    // Test if we can create the directory
    if let Err(e) = fs::create_dir_all(&data_dir) {
        log::error!("Failed to create data directory {}: {}", data_dir.display(), e);
        return Err(format!("Cannot create data directory {}: {}", data_dir.display(), e).into());
    }
    
    // Test if we can write to the directory
    let test_file = data_dir.join("test_write.tmp");
    if let Err(e) = fs::write(&test_file, "test") {
        log::error!("Cannot write to data directory {}: {}", data_dir.display(), e);
        return Err(format!("Cannot write to data directory {}: {}", data_dir.display(), e).into());
    }
    
    // Clean up test file
    let _ = fs::remove_file(&test_file);
    
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