use std::fs;
use std::process::Command;
use crate::types::{ThemeManifest};
use crate::recent::add_recent_theme;
use crate::check::{has_gtk_or_wm_components, has_icons, has_cursors, has_fonts};
use crate::extract::{extract_theme, extract_theme_info};
use crate::utils::{install_icons, install_cursors, install_fonts, copy_dir_recursive};

#[tauri::command]
pub fn install_theme_from_data(file_data: Vec<u8>, file_name: String) -> Result<String, String> {
    // Create temp directory
    let temp_dir = format!("/tmp/reskin_install_{}", 
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs()
    );
    
    // Save file to temp location
    let temp_file_path = format!("{}/{}", temp_dir, file_name);
    
    if let Err(e) = fs::create_dir_all(&temp_dir) {
        return Err(format!("Failed to create temp directory: {}", e));
    }
    
    if let Err(e) = fs::write(&temp_file_path, file_data) {
        return Err(format!("Failed to write temp file: {}", e));
    }
    
    // First extract the theme to get the theme name
    extract_theme(temp_file_path.clone())?;
    
    // Get theme info to find the theme name
    let theme_info = extract_theme_info(fs::read(&temp_file_path)
        .map_err(|e| format!("Failed to read temp file: {}", e))?)?;
    
    // Now install using the theme name
    let result = install_theme(theme_info.name.clone())?;
    
    // Clean up temp file
    let _ = fs::remove_dir_all(&temp_dir);
    
    Ok(result)
}

#[tauri::command]
pub fn install_theme(theme_name: String) -> Result<String, String> {
    use std::path::Path;
    
    // Source: staging area in /tmp/reskin/
    let staging_dir = format!("/tmp/reskin/{}", theme_name);
    if !Path::new(&staging_dir).exists() {
        return Err(format!("Theme '{}' not found in staging area. Extract it first.", theme_name));
    }
    
    let home_dir = std::env::var("HOME")
        .map_err(|_| "Failed to get HOME directory".to_string())?;
    
    // Scan what components are available in the theme
    let mut installed_components = Vec::new();
    let staging_path = Path::new(&staging_dir);
    
    // Install GTK themes, window manager themes, shell themes to ~/.themes/
    if has_gtk_or_wm_components(&staging_path) {
        let themes_dir = format!("{}/.themes", home_dir);
        let dest_dir = format!("{}/{}", themes_dir, theme_name);
        
        fs::create_dir_all(&themes_dir)
            .map_err(|e| format!("Failed to create ~/.themes directory: {}", e))?;
            
        if Path::new(&dest_dir).exists() {
            fs::remove_dir_all(&dest_dir)
                .map_err(|e| format!("Failed to remove existing theme: {}", e))?;
        }
        
        copy_dir_recursive(&staging_dir, &dest_dir)
            .map_err(|e| format!("Failed to install theme: {}", e))?;
        
        // Copy the .reskin bundle file into the installed theme directory for manifest reading
        let bundle_path = format!("/tmp/reskin/{}.reskin", theme_name);
        let dest_bundle_path = format!("{}/{}.reskin", dest_dir, theme_name);
        if Path::new(&bundle_path).exists() {
            let _ = fs::copy(&bundle_path, &dest_bundle_path);
        }
        installed_components.push("GTK/Window Manager theme");
    }
    
    // Install icons to ~/.local/share/icons/ or ~/.icons/
    if has_icons(&staging_path) {
        install_icons(&staging_dir, &theme_name, &home_dir)?;
        installed_components.push("Icons");
    }
    
    // Install cursors to ~/.local/share/icons/ or ~/.icons/
    if has_cursors(&staging_path) {
        install_cursors(&staging_dir, &theme_name, &home_dir)?;
        installed_components.push("Cursors");
    }
    
    // Install fonts to ~/.local/share/fonts/
    if has_fonts(&staging_path) {
        install_fonts(&staging_dir, &theme_name, &home_dir)?;
        installed_components.push("Fonts");
    }
    
    let components_str = if installed_components.is_empty() {
        "No compatible components found".to_string()
    } else {
        installed_components.join(", ")
    };
    
    // Read manifest to get theme info for recent tracking
    let staging_dir = format!("/tmp/reskin/{}", theme_name);
    let manifest_path = format!("{}/manifest.json", staging_dir);
    
    if let Ok(manifest_content) = fs::read_to_string(&manifest_path) {
        if let Ok(manifest) = serde_json::from_str::<ThemeManifest>(&manifest_content) {
            let _ = add_recent_theme(
                manifest.name.clone(),
                manifest.author.clone(),
                manifest.description.clone()
            );
        }
    }
    
    Ok(format!("Theme '{}' installed successfully!\nComponents: {}", theme_name, components_str))
}