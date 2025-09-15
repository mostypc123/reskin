	mod info; mod file; mod extract; mod check; mod bundle; mod apply; mod recent; mod types; mod utils; mod install; mod marketplace; mod window;
	use tauri::{ Manager };

	fn main() {
		tauri::Builder::default()
			.plugin(tauri_plugin_opener::init())
			.invoke_handler(tauri::generate_handler![
				info::get_app_version, info::init,
				file::select_folder, file::select_file,
				extract::extract_theme_info, extract::extract_theme_info_from_file, extract::extract_theme,
				bundle::bundle_theme, bundle::bundle_theme_from_directory,
				apply::apply_theme,
				recent::get_recent_themes, recent::add_recent_theme,
				install::install_theme_from_data, install::install_theme,
				marketplace::fetch_marketplace_themes, marketplace::get_theme_info, marketplace::download_theme,
				window::minimize, window::toggle_maximize, window::close
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
