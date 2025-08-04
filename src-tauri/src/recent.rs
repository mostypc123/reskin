use std::fs;
use std::time::SystemTime;
use crate::types::RecentTheme;


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
