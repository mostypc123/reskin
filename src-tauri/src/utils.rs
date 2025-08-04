use std::fs;

// Install icons to appropriate directory
pub fn install_icons(staging_dir: &str, theme_name: &str, home_dir: &str) -> Result<(), String> {
    let icons_dir = format!("{}/.local/share/icons", home_dir);
    let dest_dir = format!("{}/{}", icons_dir, theme_name);
    
    fs::create_dir_all(&icons_dir)
        .map_err(|e| format!("Failed to create icons directory: {}", e))?;
        
    if std::path::Path::new(&dest_dir).exists() {
        fs::remove_dir_all(&dest_dir)
            .map_err(|e| format!("Failed to remove existing icons: {}", e))?;
    }
    
    copy_dir_recursive(staging_dir, &dest_dir)
        .map_err(|e| format!("Failed to install icons: {}", e))?;
        
    Ok(())
}

// Install cursors to appropriate directory  
pub fn install_cursors(staging_dir: &str, theme_name: &str, home_dir: &str) -> Result<(), String> {
    let cursors_dir = format!("{}/.local/share/icons", home_dir);
    let dest_dir = format!("{}/{}", cursors_dir, theme_name);
    
    fs::create_dir_all(&cursors_dir)
        .map_err(|e| format!("Failed to create cursors directory: {}", e))?;
        
    if std::path::Path::new(&dest_dir).exists() {
        fs::remove_dir_all(&dest_dir)
            .map_err(|e| format!("Failed to remove existing cursors: {}", e))?;
    }
    
    copy_dir_recursive(staging_dir, &dest_dir)
        .map_err(|e| format!("Failed to install cursors: {}", e))?;
        
    Ok(())
}

// Install fonts to appropriate directory
pub fn install_fonts(staging_dir: &str, theme_name: &str, home_dir: &str) -> Result<(), String> {
    let fonts_dir = format!("{}/.local/share/fonts/{}", home_dir, theme_name);
    
    fs::create_dir_all(&fonts_dir)
        .map_err(|e| format!("Failed to create fonts directory: {}", e))?;
        
    // Copy only font files
    if let Ok(entries) = fs::read_dir(staging_dir) {
        for entry in entries.flatten() {
            if let Some(ext) = entry.path().extension() {
                if ["ttf", "otf", "woff", "woff2", "eot"].contains(&ext.to_str().unwrap_or("")) {
                    let dest_path = std::path::Path::new(&fonts_dir).join(entry.file_name());
                    fs::copy(entry.path(), dest_path)
                        .map_err(|e| format!("Failed to copy font: {}", e))?;
                }
            }
        }
    }
    
    Ok(())
}

/// Helper function to recursively copy directories
pub fn copy_dir_recursive(src: &str, dst: &str) -> Result<(), std::io::Error> {
    use std::path::Path;
    
    fs::create_dir_all(dst)?;
    
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let src_path = entry.path();
        let dst_path = Path::new(dst).join(entry.file_name());
        
        if src_path.is_dir() {
            copy_dir_recursive(
                &src_path.to_string_lossy(),
                &dst_path.to_string_lossy()
            )?;
        } else {
            fs::copy(&src_path, &dst_path)?;
        }
    }
    
    Ok(())
}