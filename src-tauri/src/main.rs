use tauri::{ Manager };
mod commands;


#[tauri::command]
fn ensure_reskin_folder() -> Result<(), String> {
	use std::fs;
	use std::env::temp_dir;
	let mut path = temp_dir();
	path.push("reskin");
	fs::create_dir_all(&path).map_err(|e| e.to_string())?;
	Ok(())
}

#[tauri::command]
fn theme_file_exists(theme_name: String) -> bool {
	use std::fs;
	use std::env::temp_dir;
	let mut path = temp_dir();
	path.push("reskin");
	path.push(format!("{}.reskin", theme_name));
	fs::metadata(&path).is_ok()
}

fn main() {
	tauri::Builder::default()
		.plugin(tauri_plugin_opener::init())
		.invoke_handler(tauri::generate_handler![
			ensure_reskin_folder,
			theme_file_exists,
			commands::init, 
			commands::select_folder,
			commands::select_file,
			commands::extract_theme_info,
			commands::extract_theme_info_from_file,
			commands::install_theme_from_data,
			commands::bundle_theme,
			commands::bundle_theme_from_directory,
			commands::extract_theme,
			commands::install_theme,
			commands::get_app_version,
			commands::apply_theme,
			commands::get_recent_themes,
			commands::add_recent_theme,
		])
		.setup(|_app| {
			// Code to run only on debug versions
			#[cfg(debug_assertions)] {
				if let Some(window) = _app.get_webview_window("main") {
					window.open_devtools();
				}
			}
			Ok(())
		})
		.run(tauri::generate_context!())
		.expect("error while running tauri application");
}
