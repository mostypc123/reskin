[tauri::command]
pub fn bundle_theme(request: BundleRequest) -> Result<String,String> {
    let magic = b"RSKN";
    let manifest_json = serde_json::to_string(&request.manifest)
        .map_err(|e| format!("Failed to serialize manifest: {}", e))?;
    let mut file = File::create(&request.output_path)
        .map_err(|e| format!("Failed to create file: {}", e))?;
    file.write_all(magic).map_err(|e| format!("Write error: {}", e))?;
    let len_bytes = manifest_json.len().to_le_bytes();
    file.write_all(&len_bytes)
        .map_err(|e| format!("Failed to write manifest length: {}", e))?;
    file.write_all(manifest_json.as_bytes())
        .map_err(|e| format!("Failed to write manifest data: {}", e))?;

    // Write assets
    for asset_path in &request.assets {
        let full_path = if let Some(ref base_dir) = request.base_directory {
            // If we have a base directory, the asset_path might be relative
            if Path::new(asset_path).is_absolute() {
                asset_path.clone()
            } else {
                format!("{}/{}", base_dir, asset_path)
            }
        } else {
            asset_path.clone()
        };
        
        let asset_data = std::fs::read(&full_path)
            .map_err(|e| format!("Failed to read asset {}: {}", full_path, e))?;
        let filename = std::path::Path::new(&full_path)
            .file_name()
            .unwrap()
            .to_string_lossy()
            .into_owned();
        let filename_bytes = filename.as_bytes();
        let filename_len = (filename_bytes.len() as u32).to_le_bytes();
        let asset_len = (asset_data.len() as u32).to_le_bytes();

        file.write_all(&filename_len)
            .map_err(|e| format!("Failed to write filename length: {}", e))?;
        file.write_all(filename_bytes)
            .map_err(|e| format!("Failed to write filename: {}", e))?;
        file.write_all(&asset_len)
            .map_err(|e| format!("Failed to write asset length: {}", e))?;
        file.write_all(&asset_data)
            .map_err(|e| format!("Failed to write asset data: {}", e))?;
    }

    Ok("Bundle created successfully".to_string())
}

#[tauri::command]
pub fn bundle_theme_from_directory(manifest: ThemeManifest, theme_directory: String, output_path: String) -> Result<String, String> {
    use std::path::Path;
    
    // Verify theme directory exists
    if !Path::new(&theme_directory).exists() {
        return Err(format!("Theme directory '{}' does not exist", theme_directory));
    }
    
    // Collect all files in the theme directory recursively
    let mut theme_files = Vec::new();
    collect_files_recursive(Path::new(&theme_directory), &mut theme_files);
    
    if theme_files.is_empty() {
        return Err("No files found in theme directory".to_string());
    }
    
    // Create bundle request with collected files
    let request = BundleRequest {
        manifest,
        output_path,
        assets: theme_files,
        base_directory: Some(theme_directory),
    };
    
    bundle_theme(request)
}

// Helper function to collect files recursively from a directory
fn collect_files_recursive(dir: &Path, files: &mut Vec<String>) {
    if let Ok(entries) = fs::read_dir(dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_dir() {
                collect_files_recursive(&path, files);
            } else if let Some(path_str) = path.to_str() {
                files.push(path_str.to_string());
            }
        }
    }
}