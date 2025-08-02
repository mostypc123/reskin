#[tauri::command]
pub fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}
use tauri::AppHandle;
use std::process::Command;
use serde_json::json;
use serde::{Deserialize,Serialize};
use std::fs::File;
use std::io::{Write, Read};
use std::fs;
use std::path::Path;
use std::time::SystemTime;

#[tauri::command]
pub fn init(app: AppHandle) -> Result<serde_json::Value, String> {
    let username_output = Command::new("sh")
        .arg("-c")
        .arg("whoami")
        .output()
        .map_err(|e| format!("Failed to execute whoami: {}", e))?;
    let username = String::from_utf8_lossy(&username_output.stdout).trim().to_string();

    let de_output = Command::new("sh")
        .arg("-c")
        .arg("echo $XDG_CURRENT_DESKTOP")
        .output()
        .map_err(|e| format!("Failed to get desktop environment: {}", e))?;
    let de = String::from_utf8_lossy(&de_output.stdout).trim().to_string();

    let distro_output = Command::new("sh")
        .arg("-c")
        .arg(". /etc/os-release && echo $PRETTY_NAME")
        .output()
        .map_err(|e| format!("Failed to get distro: {}", e))?;
    let distro = String::from_utf8_lossy(&distro_output.stdout).trim().to_string();

    let system_info = json!({
        "username": username,
        "de": de,
        "distro": distro
    });

    // Return the data instead of printing it
    Ok(system_info)
}

#[tauri::command]
pub fn select_folder() -> Result<String, String> {
    let output = Command::new("zenity")
        .arg("--file-selection")
        .arg("--directory")
        .arg("--title=Select Theme Folder")
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                let path = String::from_utf8_lossy(&result.stdout).trim().to_string();
                if !path.is_empty() {
                    Ok(path)
                } else {
                    Err("No folder selected".to_string())
                }
            } else {
                Err("Failed to open folder dialog".to_string())
            }
        }
        Err(_) => {
            // Fallback to using nautilus or other file manager
            let output = Command::new("sh")
                .arg("-c")
                .arg("nautilus --select ~/")
                .output();
            
            match output {
                Ok(_) => Err("Please manually drag and drop a folder".to_string()),
                Err(_) => Err("No folder dialog available. Please use drag and drop.".to_string())
            }
        }
    }
}

#[tauri::command]
pub fn select_file(title: String, filters: Vec<serde_json::Value>) -> Result<String, String> {
    let output = Command::new("zenity")
        .arg("--file-selection")
        .arg(&format!("--title={}", title))
        .arg("--file-filter=Reskin Files (*.reskin) | *.reskin")
        .output();

    match output {
        Ok(result) => {
            if result.status.success() {
                let path = String::from_utf8_lossy(&result.stdout).trim().to_string();
                if !path.is_empty() {
                    Ok(path)
                } else {
                    Err("No file selected".to_string())
                }
            } else {
                Err("Failed to open file dialog".to_string())
            }
        }
        Err(_) => {
            Err("No file dialog available. Please use drag and drop.".to_string())
        }
    }
}

#[tauri::command]
pub fn extract_theme_info(file_data: Vec<u8>) -> Result<ThemeManifest, String> {
    // Read the RSKN header and extract manifest
    if file_data.len() < 12 {
        return Err("Invalid .reskin file: too small".to_string());
    }

    // Check RSKN magic header
    let magic = &file_data[0..4];
    if magic != b"RSKN" {
        return Err("Invalid .reskin file: missing RSKN header".to_string());
    }

    // Read manifest size (8 bytes after magic, as usize)
    let manifest_size = usize::from_le_bytes([
        file_data[4], file_data[5], file_data[6], file_data[7],
        file_data[8], file_data[9], file_data[10], file_data[11]
    ]);

    if file_data.len() < 12 + manifest_size {
        return Err("Invalid .reskin file: manifest size mismatch".to_string());
    }

    // Extract manifest JSON
    let manifest_bytes = &file_data[12..12 + manifest_size];
    let manifest_str = String::from_utf8_lossy(manifest_bytes);
    
    match serde_json::from_str::<ThemeManifest>(&manifest_str) {
        Ok(manifest) => Ok(manifest),
        Err(e) => Err(format!("Failed to parse manifest: {}", e))
    }
}

#[tauri::command]
pub fn extract_theme_info_from_file(file_path: String) -> Result<ThemeManifest, String> {
    match fs::read(file_path) {
        Ok(file_data) => extract_theme_info(file_data),
        Err(e) => Err(format!("Failed to read file: {}", e))
    }
}

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

#[derive(Serialize, Deserialize, Clone)]
pub struct ThemeManifest {
    name: String,
    author: String,
    description: String,
    version: String,
    preview: String,
}

#[derive(Deserialize)]
pub struct BundleRequest {
    manifest: ThemeManifest,
    output_path: String,
    assets: Vec<String>,
    base_directory: Option<String>, // Directory where theme files are located
}

#[tauri::command]
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
pub fn extract_theme(bundle_path: String) -> Result<String, String> {
    use std::path::Path;

    let mut file = File::open(&bundle_path)
        .map_err(|e| format!("Failed to open bundle: {}", e))?;

    let mut magic = [0u8; 4];
    file.read_exact(&mut magic)
        .map_err(|e| format!("Failed to read magic: {}", e))?;
    if &magic != b"RSKN" {
        return Err("Invalid bundle format".to_string());
    }

    let mut len_bytes = [0u8; 8];
    file.read_exact(&mut len_bytes)
        .map_err(|e| format!("Failed to reach manifest length: {}", e))?;
    let manifest_len = usize::from_le_bytes(len_bytes);

    let mut manifest_json = vec![0u8; manifest_len];
    file.read_exact(&mut manifest_json)
        .map_err(|e| format!("Failed to read manifest data: {}", e))?;

    let manifest: ThemeManifest = serde_json::from_slice(&manifest_json)
        .map_err(|e| format!("Failed to parse manifest: {}", e))?;
    
    // Create base tmp directory first
    fs::create_dir_all("/tmp/reskin")
        .map_err(|e| format!("Failed to create /tmp/reskin directory: {}", e))?;
    
    let output_dir = format!("/tmp/reskin/{}", manifest.name);
    fs::create_dir_all(&output_dir)
        .map_err(|e| format!("Failed to create output dir: {}", e))?;
    fs::write(Path::new(&output_dir).join("manifest.json"), &manifest_json)
        .map_err(|e| format!("Failed to write manifest.json: {}", e))?;

    // Extract assets from the bundle file
    loop {
        let mut filename_len_bytes = [0u8; 4];
        if file.read_exact(&mut filename_len_bytes).is_err() {
            break; // End of file
        }
        let filename_len = u32::from_le_bytes(filename_len_bytes) as usize;
        let mut filename_bytes = vec![0u8; filename_len];
        file.read_exact(&mut filename_bytes)
            .map_err(|e| format!("Failed to read filename: {}", e))?;
        let filename = String::from_utf8_lossy(&filename_bytes).to_string();

        let mut asset_len_bytes = [0u8; 4];
        file.read_exact(&mut asset_len_bytes)
            .map_err(|e| format!("Failed to read asset length: {}", e))?;
        let asset_len = u32::from_le_bytes(asset_len_bytes) as usize;
        let mut asset_data = vec![0u8; asset_len];
        file.read_exact(&mut asset_data)
            .map_err(|e| format!("Failed to read asset data: {}", e))?;

        let out_path = Path::new(&output_dir).join(&filename);
        fs::write(out_path, &asset_data)
            .map_err(|e| format!("Failed to write asset {}: {}", filename, e))?;
    }

    Ok(format!("Theme extracted to {}", output_dir))
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


// Helper function to recursively copy directories
fn copy_dir_recursive(src: &str, dst: &str) -> Result<(), std::io::Error> {
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

// Check if theme has GTK or window manager components
fn has_gtk_or_wm_components(theme_path: &std::path::Path) -> bool {
    let gtk_wm_dirs = ["gtk-2.0", "gtk-3.0", "gtk-4.0", "xfwm4", "gnome-shell", 
                       "cinnamon", "metacity-1", "openbox-3", "plank"];
    
    gtk_wm_dirs.iter().any(|dir| theme_path.join(dir).exists())
}

// Check if theme has icons
fn has_icons(theme_path: &std::path::Path) -> bool {
    // Look for common icon directories or files
    let icon_indicators = ["icons", "scalable", "16x16", "22x22", "24x24", "32x32", 
                          "48x48", "64x64", "128x128", "256x256", "apps", "places", 
                          "devices", "mimetypes", "actions"];
    
    icon_indicators.iter().any(|dir| theme_path.join(dir).exists()) ||
    theme_path.join("index.theme").exists()
}

// Check if theme has cursors
fn has_cursors(theme_path: &std::path::Path) -> bool {
    theme_path.join("cursors").exists() ||
    theme_path.join("cursor.theme").exists()
}

// Check if theme has fonts
fn has_fonts(theme_path: &std::path::Path) -> bool {
    if let Ok(entries) = fs::read_dir(theme_path) {
        for entry in entries.flatten() {
            if let Some(ext) = entry.path().extension() {
                if ["ttf", "otf", "woff", "woff2", "eot"].contains(&ext.to_str().unwrap_or("")) {
                    return true;
                }
            }
        }
    }
    false
}

// Install icons to appropriate directory
fn install_icons(staging_dir: &str, theme_name: &str, home_dir: &str) -> Result<(), String> {
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
fn install_cursors(staging_dir: &str, theme_name: &str, home_dir: &str) -> Result<(), String> {
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
fn install_fonts(staging_dir: &str, theme_name: &str, home_dir: &str) -> Result<(), String> {
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

#[tauri::command]
pub fn apply_theme(theme_name: String) -> Result<String, String> {
    let mut results = Vec::new();
    let mut warnings = Vec::new();
    
    // Apply GTK theme using gsettings (like GNOME Tweaks Appearance > Applications)
    let gtk_output = Command::new("gsettings")
        .arg("set")
        .arg("org.gnome.desktop.interface")
        .arg("gtk-theme")
        .arg(&theme_name)
        .output()
        .map_err(|e| format!("Failed to execute gsettings for GTK theme: {}", e))?;
    
    if gtk_output.status.success() {
        results.push("GTK theme".to_string());
    } else {
        let error = String::from_utf8_lossy(&gtk_output.stderr);
        warnings.push(format!("GTK theme failed: {}", error));
    }
    
    // Check if user-theme extension schema exists first
    let schema_check = Command::new("gsettings")
        .arg("list-schemas")
        .output()
        .map_err(|e| format!("Failed to check schemas: {}", e))?;
    
    let schemas = String::from_utf8_lossy(&schema_check.stdout);
    
    if schemas.contains("org.gnome.shell.extensions.user-theme") {
        // Apply Shell theme using gsettings (like GNOME Tweaks Appearance > Shell)
        let shell_output = Command::new("gsettings")
            .arg("set")
            .arg("org.gnome.shell.extensions.user-theme")
            .arg("name")
            .arg(&theme_name)
            .output()
            .map_err(|e| format!("Failed to execute gsettings for Shell theme: {}", e))?;
        
        if shell_output.status.success() {
            results.push("Shell theme".to_string());
        } else {
            let shell_error = String::from_utf8_lossy(&shell_output.stderr);
            warnings.push(format!("Shell theme failed: {}", shell_error));
        }
    } else {
        // Try alternative methods to apply shell theme
        let alt_result = try_alternative_shell_theme_methods(&theme_name);
        match alt_result {
            Ok(method) => results.push(format!("Shell theme (via {})", method)),
            Err(e) => warnings.push(format!("Shell theme not applied: user-theme extension not found. Install it with: `gnome-extensions install user-theme@gnome-shell-extensions.gcampax.github.com` or via GNOME Extensions app. Error: {}", e))
        }
    }
    
    // Apply window manager theme (for other DEs)
    let wm_result = apply_window_manager_theme(&theme_name);
    match wm_result {
        Ok(wm) => results.push(wm),
        Err(_) => {} // Silently ignore WM theme failures as not all DEs support this
    }
    
    let mut message = String::new();
    
    if !results.is_empty() {
        message.push_str(&format!("✅ Applied: {}\n", results.join(", ")));
    }
    
    if !warnings.is_empty() {
        message.push_str(&format!("⚠️  Warnings:\n{}", warnings.join("\n")));
    }
    
    if results.is_empty() {
        Err("Failed to apply any theme components".to_string())
    } else {
        Ok(message)
    }
}

// Try alternative methods to apply shell theme when user-theme extension isn't available
fn try_alternative_shell_theme_methods(theme_name: &str) -> Result<String, String> {
    let home_dir = std::env::var("HOME")
        .map_err(|_| "Failed to get HOME directory".to_string())?;
    
    // Method 1: Try to enable user-theme extension first
    let enable_output = Command::new("gnome-extensions")
        .arg("enable")
        .arg("user-theme@gnome-shell-extensions.gcampax.github.com")
        .output();
    
    if let Ok(output) = enable_output {
        if output.status.success() {
            // Wait a moment for the extension to load
            std::thread::sleep(std::time::Duration::from_millis(500));
            
            // Try applying the theme again
            let shell_output = Command::new("gsettings")
                .arg("set")
                .arg("org.gnome.shell.extensions.user-theme")
                .arg("name")
                .arg(theme_name)
                .output();
                
            if let Ok(result) = shell_output {
                if result.status.success() {
                    return Ok("auto-enabled user-theme extension".to_string());
                }
            }
        }
    }
    
    // Method 2: Try direct file manipulation (less reliable)
    let dconf_path = format!("{}/.config/dconf/user", home_dir);
    if std::path::Path::new(&dconf_path).exists() {
        // This is more complex and risky, so we'll skip it for now
    }
    
    Err("user-theme extension not available and auto-enable failed".to_string())
}

// Apply window manager themes for non-GNOME desktop environments
fn apply_window_manager_theme(theme_name: &str) -> Result<String, String> {
    // Try XFCE
    let xfce_output = Command::new("xfconf-query")
        .arg("-c")
        .arg("xfwm4")
        .arg("-p")
        .arg("/general/theme")
        .arg("-s")
        .arg(theme_name)
        .output();
    
    if let Ok(output) = xfce_output {
        if output.status.success() {
            return Ok("XFCE window manager theme".to_string());
        }
    }
    
    // Try KDE
    let kde_output = Command::new("kwriteconfig5")
        .arg("--file")
        .arg("kwinrc")
        .arg("--group")
        .arg("org.kde.kdecoration2")
        .arg("--key")
        .arg("theme")
        .arg(theme_name)
        .output();
    
    if let Ok(output) = kde_output {
        if output.status.success() {
            return Ok("KDE window manager theme".to_string());
        }
    }
    
    Err("No compatible window manager found".to_string())
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

#[derive(Serialize, Deserialize, Clone)]
pub struct RecentTheme {
    name: String,
    author: String,
    description: String,
    installed_at: u64, // Unix timestamp
}

#[tauri::command]
pub fn get_recent_themes() -> Result<Vec<RecentTheme>, String> {
    let home_dir = std::env::var("HOME")
        .map_err(|_| "Failed to get HOME directory".to_string())?;
    
    let recent_file = format!("{}/.config/reskin/recent.json", home_dir);
    
    if !std::path::Path::new(&recent_file).exists() {
        return Ok(Vec::new());
    }
    
    let content = fs::read_to_string(&recent_file)
        .map_err(|e| format!("Failed to read recent themes: {}", e))?;
    
    let themes: Vec<RecentTheme> = serde_json::from_str(&content)
        .unwrap_or_else(|_| Vec::new());
    
    Ok(themes)
}

#[tauri::command]
pub fn add_recent_theme(theme_name: String, author: String, description: String) -> Result<(), String> {
    let home_dir = std::env::var("HOME")
        .map_err(|_| "Failed to get HOME directory".to_string())?;
    
    let config_dir = format!("{}/.config/reskin", home_dir);
    fs::create_dir_all(&config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;
    
    let recent_file = format!("{}/recent.json", config_dir);
    
    // Load existing themes
    let mut themes: Vec<RecentTheme> = if std::path::Path::new(&recent_file).exists() {
        let content = fs::read_to_string(&recent_file).unwrap_or_default();
        serde_json::from_str(&content).unwrap_or_else(|_| Vec::new())
    } else {
        Vec::new()
    };
    
    // Remove if already exists (to avoid duplicates)
    themes.retain(|t| t.name != theme_name);
    
    // Add new theme at the beginning
    let new_theme = RecentTheme {
        name: theme_name,
        author,
        description,
        installed_at: SystemTime::now()
            .duration_since(SystemTime::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
    };
    themes.insert(0, new_theme);
    
    // Keep only the 4 most recent
    themes.truncate(4);
    
    // Save back to file
    let json = serde_json::to_string_pretty(&themes)
        .map_err(|e| format!("Failed to serialize themes: {}", e))?;
    
    fs::write(&recent_file, json)
        .map_err(|e| format!("Failed to write recent themes: {}", e))?;
    
    Ok(())
}
