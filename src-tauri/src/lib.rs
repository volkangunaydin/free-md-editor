//! Free MD Editor — Tauri backend.
//!
//! Responsibilities of the Rust side are intentionally small:
//! * read / write files anywhere on disk (the webview itself is sandboxed),
//! * tell the frontend which files were passed on the command line
//!   (Explorer "Open with", double-click on a .md file, drag onto the exe),
//! * forward files from a second instance to the already running window,
//! * register / unregister the `.md` file association in the per-user registry.

mod assoc;
mod commands;

use tauri::{Emitter, Manager};

/// Event name used to push file paths into the running window.
pub const OPEN_FILES_EVENT: &str = "open-files";

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    env_logger::Builder::from_env(env_logger::Env::default().default_filter_or("info")).init();

    let builder = tauri::Builder::default();

    // The single-instance plugin must be the first one registered.
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, args, _cwd| {
        let files = commands::file_args(args.into_iter().skip(1));
        log::info!(
            "second instance launched, forwarding {} file(s)",
            files.len()
        );
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
        if !files.is_empty() {
            let _ = app.emit(OPEN_FILES_EVENT, files);
        }
    }));

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .setup(|_app| {
            // Make sure the per-user registry entries point at *this* executable.
            // This is what lets Explorer show "Free MD Editor" under "Open with"
            // even for portable use without the installer.
            #[cfg(windows)]
            match assoc::ensure_registered() {
                Ok(true) => log::info!("file association registered/updated for current user"),
                Ok(false) => log::debug!("file association already up to date"),
                Err(e) => log::warn!("could not register file association: {e}"),
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::read_file,
            commands::write_file,
            commands::file_exists,
            commands::startup_files,
            commands::allow_asset_dir,
            commands::is_file_association_registered,
            commands::register_file_association,
            commands::unregister_file_association,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
