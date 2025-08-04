use serde_json::json;
use std::process::Command;
use tauri::AppHandle;

#[tauri::command]
pub fn get_app_version() -> Result<String, String> {
    Ok(env!("CARGO_PKG_VERSION").to_string())
}

#[tauri::command]
pub fn init(app: AppHandle) -> Result<serde_json::Value, String> {
    let de_output = Command::new("sh")
        .arg("-c")
        .arg("echo $XDG_CURRENT_DESKTOP")
        .output()
        .map_err(|e| format!("Failed to get desktop environment: {}", e))?;
    let de = String::from_utf8_lossy(&de_output.stdout).trim().to_string();

    let system_info = json!({
        "de": de,
    });

    Ok(system_info)
}