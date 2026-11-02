use std::path::{Path, PathBuf};

use serde::Serialize;

#[derive(Serialize)]
pub struct FileContent {
    pub path: String,
    pub content: String,
}

fn canonical_string(path: &Path) -> String {
    let p = std::fs::canonicalize(path).unwrap_or_else(|_| path.to_path_buf());
    let s = p.to_string_lossy().to_string();
    // canonicalize() on Windows yields a verbatim path (\\?\C:\...); strip it for display.
    s.strip_prefix(r"\\?\").map(str::to_owned).unwrap_or(s)
}

/// Keep only arguments that are existing regular files.
/// Flags (e.g. `--something`) and nonexistent paths are ignored.
pub fn file_args<I: IntoIterator<Item = String>>(args: I) -> Vec<String> {
    args.into_iter()
        .filter(|a| !a.starts_with('-'))
        .map(PathBuf::from)
        .filter(|p| p.is_file())
        .map(|p| canonical_string(&p))
        .collect()
}

/// Files passed on the command line when the app was launched
/// (double-click in Explorer, "Open with", drag onto the exe).
#[tauri::command]
pub fn startup_files() -> Vec<String> {
    file_args(std::env::args().skip(1))
}

#[tauri::command]
pub fn file_exists(path: String) -> bool {
    Path::new(&path).is_file()
}

#[tauri::command]
pub fn read_file(path: String) -> Result<FileContent, String> {
    let bytes = std::fs::read(&path).map_err(|e| format!("{path}: {e}"))?;
    // Be lenient with encodings: strip a UTF-8 BOM, replace invalid sequences.
    let bytes = bytes.strip_prefix(&[0xEF, 0xBB, 0xBF]).unwrap_or(&bytes);
    let content = String::from_utf8_lossy(bytes).to_string();
    Ok(FileContent {
        path: canonical_string(Path::new(&path)),
        content,
    })
}

#[tauri::command]
pub fn write_file(path: String, content: String) -> Result<String, String> {
    let target = Path::new(&path);
    if let Some(parent) = target.parent() {
        if !parent.as_os_str().is_empty() && !parent.exists() {
            std::fs::create_dir_all(parent).map_err(|e| format!("{}: {e}", parent.display()))?;
        }
    }
    // Write to a sibling temp file first, then rename, so a crash mid-write
    // never leaves a truncated document behind.
    let mut tmp_name = target
        .file_name()
        .map(|n| n.to_os_string())
        .unwrap_or_default();
    tmp_name.push(".tmp~");
    let tmp = target.with_file_name(tmp_name);
    std::fs::write(&tmp, content.as_bytes()).map_err(|e| format!("{}: {e}", tmp.display()))?;
    std::fs::rename(&tmp, target).map_err(|e| {
        let _ = std::fs::remove_file(&tmp);
        format!("{}: {e}", target.display())
    })?;
    Ok(canonical_string(target))
}

/// Let the webview load local images (relative paths in Markdown) from `path`
/// through the `asset:` protocol. Called lazily by the frontend per directory.
#[tauri::command]
pub fn allow_asset_dir(app: tauri::AppHandle, path: String) -> Result<(), String> {
    use tauri::Manager;
    app.asset_protocol_scope()
        .allow_directory(&path, true)
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn is_file_association_registered() -> bool {
    #[cfg(windows)]
    {
        crate::assoc::is_registered().unwrap_or(false)
    }
    #[cfg(not(windows))]
    {
        false
    }
}

#[tauri::command]
pub fn register_file_association() -> Result<(), String> {
    #[cfg(windows)]
    {
        crate::assoc::register().map_err(|e| e.to_string())
    }
    #[cfg(not(windows))]
    {
        Err("File association registration is only supported on Windows".into())
    }
}

#[tauri::command]
pub fn unregister_file_association() -> Result<(), String> {
    #[cfg(windows)]
    {
        crate::assoc::unregister().map_err(|e| e.to_string())
    }
    #[cfg(not(windows))]
    {
        Err("File association registration is only supported on Windows".into())
    }
}
