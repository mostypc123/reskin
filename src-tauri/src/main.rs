use tauri::{ Manager };

fn main() {
	tauri::Builder::default()
		.plugin(tauri_plugin_opener::init())
		.invoke_handler(tauri::generate_handler![
			mod install; mod info; mod file; mod extract; mod check; mod bundle; mod apply; mod recent; mod types; mod utils;
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
