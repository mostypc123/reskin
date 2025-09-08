use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct ThemeManifest {
    pub name: String,
    pub author: String,
    pub description: String,
    pub version: String,
    pub tags: String,
    pub license: String,
}
#[derive(Serialize, Deserialize, Clone)]
pub struct BundleRequest {
    pub manifest: ThemeManifest,
    pub output_path: String,
    pub assets: Vec<String>,
    pub theme_directory: Option<String>, // Directory where theme files are located
}

#[derive(Serialize, Deserialize, Clone)]
pub struct RecentTheme {
    pub name: String,
    pub author: String,
    pub description: String,
    pub installed_at: u64, // Unix timestamp
}