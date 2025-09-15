use tauri::{Window};

#[tauri::command]
pub fn minimize(window: Window) {
    window.minimize().unwrap();
}

#[tauri::command]
pub fn toggle_maximize(window: Window) {
    if window.is_maximized().unwrap() {
        window.unmaximize().unwrap();
    } else {
        window.maximize().unwrap();
    }
}

#[tauri::command]
pub fn close(window: Window) {
    window.close().unwrap();
}