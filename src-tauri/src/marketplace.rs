use std::fs;
use std::path::Path;
use reqwest::Client;
use dotenv::dotenv;
use std::env;
use serde_json::{json, Value};

#[tauri::command]
#[allow(non_snake_case)]
pub async fn get_theme_info(databaseId: &str, collectionId: &str, documentId: &str) -> Result<Value, String> {
    dotenv().ok();
    let endpoint = env::var("VITE_APPWRITE_ENDPOINT").map_err(|_| "APPWRITE_ENDPOINT not set".to_string())?;
    let projectId = env::var("VITE_APPWRITE_PROJECT_ID").map_err(|_| "APPWRITE_PROJECT_ID not set".to_string())?;
    let apiKey = env::var("VITE_APPWRITE_API_KEY").map_err(|_| "APPWRITE_API_KEY not set".to_string())?;

    let client = Client::new();
    let url = format!("{}/databases/{}/collections/{}/documents/{}", endpoint, databaseId, collectionId, documentId);
    let response = client
        .get(&url)
        .header("X-Appwrite-Project", projectId)
        .header("X-Appwrite-Key", apiKey)
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to get theme info: {}", e))?;
    if response.status().is_success() {
        let theme_data = response.text().await.map_err(|e| format!("Failed to read response: {}", e))?;
        let parsed: serde_json::Value = serde_json::from_str(&theme_data).unwrap_or(json!({}));
        return Ok(parsed);
    } else {
        let status_code = response.status().as_u16();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Failed to get theme info: status {} - {}", status_code, error_text));
    }
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn fetch_marketplace_themes(databaseId: &str, collectionId: &str) -> Result<Value, String> {
    dotenv().ok();
    let endpoint = env::var("VITE_APPWRITE_ENDPOINT").map_err(|_| "APPWRITE_ENDPOINT not set".to_string())?;
    let projectId = env::var("VITE_APPWRITE_PROJECT_ID").map_err(|_| "APPWRITE_PROJECT_ID not set".to_string())?;
    let apiKey = env::var("VITE_APPWRITE_API_KEY").map_err(|_| "APPWRITE_API_KEY not set".to_string())?;
    
    let client = Client::new();
    let url = format!("{}/databases/{}/collections/{}/documents", endpoint, databaseId, collectionId);
    let response = client
        .get(&url)
        .header("X-Appwrite-Project", projectId)
        .header("X-Appwrite-Key", apiKey)
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch themes: {}", e))?;
    if response.status().is_success() {
        let theme_data = response.text().await.map_err(|e| format!("Failed to read response: {}", e))?;
        let parsed: serde_json::Value = serde_json::from_str(&theme_data).unwrap_or(json!({}));
        return Ok(parsed);
    } else {
        let status_code = response.status().as_u16();
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Failed to fetch themes: status {} - {}", status_code, error_text));
    }
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn download_theme(themeFileId: String, themeName: String) -> Result<(), String> {
    dotenv().ok();
    // Import Appwrite credientials from .env
    let endpoint = env::var("VITE_APPWRITE_ENDPOINT").map_err(|_| "APPWRITE_ENDPOINT not set".to_string())?;
    let projectId = env::var("VITE_APPWRITE_PROJECT_ID").map_err(|_| "APPWRITE_PROJECT_ID not set".to_string())?;
    let apiKey = env::var("VITE_APPWRITE_API_KEY").map_err(|_| "APPWRITE_API_KEY not set".to_string())?;

    // Initialize Appwrite
    let client = Client::new();
    let url = format!("{}/storage/buckets/{}/files/{}/download", endpoint, "themes", themeFileId);
    let response = client
        .get(&url)
        .header("X-Appwrite-Project", projectId)
        .header("X-Appwrite-Key", apiKey)
        .header("Content-Type", "application/json")
        .send()
        .await
        .map_err(|e| format!("Failed to download theme: {}", e))?;
    if response.status().is_success() {
        let bytes = response.bytes().await.map_err(|e| format!("Failed to read theme bytes: {}", e))?;
        
        let home_dir = env::home_dir().ok_or("Failed to get home directory".to_string())?;
        let reskin_dir = Path::new(&home_dir).join(".reskin-themes");
        let theme_path = reskin_dir.join(format!("{}.reskin", themeName));

        fs::create_dir_all(&reskin_dir).map_err(|e| format!("Failed to create directory: {}", e))?;

        fs::write(&theme_path, &bytes).map_err(|e| format!("Failed to save theme file: {}", e))?;
        
        Ok(())
    } else {
        let status_code = response.status().as_u16();
        let error_text = response.text().await.unwrap_or_default();
        Err(format!("Failed to download theme: status {} - {}", status_code, error_text))
    }
}