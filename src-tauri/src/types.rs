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

#[derive(Serialize, Deserialize, Clone)]
pub struct RecentTheme {
    name: String,
    author: String,
    description: String,
    installed_at: u64, // Unix timestamp
}