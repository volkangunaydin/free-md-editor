//! Per-user (HKCU) file association for Markdown files on Windows.
//!
//! Everything is written under `HKEY_CURRENT_USER\Software\Classes`, so no
//! administrator rights are required.  The NSIS installer additionally registers
//! the association through Tauri's `bundle.fileAssociations`; this module keeps
//! the entries correct when the app is moved or run portably, and powers the
//! "Register / Unregister" actions in the UI.
//!
//! Since Windows 8 the *default* handler for an extension is protected by the
//! `UserChoice` hash and can only be set by the user through Settings.  We do
//! the next best thing: register a ProgId, add it to `OpenWithProgIds`, and
//! advertise the app under `RegisteredApplications` so it appears in
//! *Settings → Apps → Default apps*.

#![cfg(windows)]

use std::io;

use winreg::enums::*;
use winreg::RegKey;

pub const PROG_ID: &str = "FreeMdEditor.md";
pub const APP_NAME: &str = "Free MD Editor";
pub const EXTENSIONS: &[&str] = &[".md", ".markdown", ".mdown", ".mkd", ".mdwn"];
const CAPABILITIES_KEY: &str = r"Software\FreeMdEditor\Capabilities";

fn exe_path() -> io::Result<String> {
    let exe = std::env::current_exe()?;
    let exe = std::fs::canonicalize(&exe).unwrap_or(exe);
    let s = exe.to_string_lossy().to_string();
    Ok(s.strip_prefix(r"\\?\").map(str::to_owned).unwrap_or(s))
}

fn open_command(exe: &str) -> String {
    format!("\"{exe}\" \"%1\"")
}

fn exe_file_name(exe: &str) -> String {
    std::path::Path::new(exe)
        .file_name()
        .map(|n| n.to_string_lossy().to_string())
        .unwrap_or_else(|| "free-md-editor.exe".into())
}

/// True when the ProgId exists and its open command points at the running exe.
pub fn is_registered() -> io::Result<bool> {
    let exe = exe_path()?;
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let key = match hkcu.open_subkey(format!(r"Software\Classes\{PROG_ID}\shell\open\command")) {
        Ok(k) => k,
        Err(_) => return Ok(false),
    };
    let cmd: String = key.get_value("").unwrap_or_default();
    Ok(cmd.eq_ignore_ascii_case(&open_command(&exe)))
}

/// Register if missing or stale. Returns `true` when something was written.
pub fn ensure_registered() -> io::Result<bool> {
    if is_registered()? {
        return Ok(false);
    }
    register()?;
    Ok(true)
}

pub fn register() -> io::Result<()> {
    let exe = exe_path()?;
    let cmd = open_command(&exe);
    let icon = format!("\"{exe}\",0");
    let exe_name = exe_file_name(&exe);

    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let classes = hkcu.create_subkey(r"Software\Classes")?.0;

    // ProgId
    let prog = classes.create_subkey(PROG_ID)?.0;
    prog.set_value("", &"Markdown Document")?;
    prog.set_value("FriendlyTypeName", &"Markdown Document")?;
    prog.create_subkey("DefaultIcon")?.0.set_value("", &icon)?;
    let open = prog.create_subkey(r"shell\open")?.0;
    open.set_value("", &format!("Open with {APP_NAME}"))?;
    open.set_value("Icon", &icon)?;
    open.create_subkey("command")?.0.set_value("", &cmd)?;
    let edit = prog.create_subkey(r"shell\edit")?.0;
    edit.set_value("", &format!("Edit with {APP_NAME}"))?;
    edit.create_subkey("command")?.0.set_value("", &cmd)?;

    // Extensions -> ProgId
    for ext in EXTENSIONS {
        let ext_key = classes.create_subkey(ext)?.0;
        ext_key
            .create_subkey("OpenWithProgIds")?
            .0
            .set_value(PROG_ID, &"")?;
        // Only claim the default when nobody else owns the extension yet;
        // Windows' UserChoice overrides this anyway once the user picked an app.
        let current: String = ext_key.get_value("").unwrap_or_default();
        if current.is_empty() {
            ext_key.set_value("", &PROG_ID)?;
        }
        if ext_key.get_value::<String, _>("Content Type").is_err() {
            ext_key.set_value("Content Type", &"text/markdown")?;
        }
        if ext_key.get_value::<String, _>("PerceivedType").is_err() {
            ext_key.set_value("PerceivedType", &"text")?;
        }
    }

    // Applications\<exe> so the exe shows up in "Open with → Choose another app"
    let app = classes
        .create_subkey(format!(r"Applications\{exe_name}"))?
        .0;
    app.set_value("FriendlyAppName", &APP_NAME)?;
    app.create_subkey(r"shell\open\command")?
        .0
        .set_value("", &cmd)?;
    let supported = app.create_subkey("SupportedTypes")?.0;
    for ext in EXTENSIONS {
        supported.set_value(ext, &"")?;
    }

    // Default Programs registration (Settings → Default apps)
    let caps = hkcu.create_subkey(CAPABILITIES_KEY)?.0;
    caps.set_value("ApplicationName", &APP_NAME)?;
    caps.set_value(
        "ApplicationDescription",
        &"Free, open-source Markdown editor with WYSIWYG and source modes",
    )?;
    caps.set_value("ApplicationIcon", &icon)?;
    let fa = caps.create_subkey("FileAssociations")?.0;
    for ext in EXTENSIONS {
        fa.set_value(ext, &PROG_ID)?;
    }
    hkcu.create_subkey(r"Software\RegisteredApplications")?
        .0
        .set_value("FreeMdEditor", &CAPABILITIES_KEY)?;

    notify_shell();
    Ok(())
}

pub fn unregister() -> io::Result<()> {
    let exe = exe_path()?;
    let exe_name = exe_file_name(&exe);
    let hkcu = RegKey::predef(HKEY_CURRENT_USER);
    let classes = hkcu.open_subkey_with_flags(r"Software\Classes", KEY_ALL_ACCESS)?;

    let _ = classes.delete_subkey_all(PROG_ID);
    let _ = classes.delete_subkey_all(format!(r"Applications\{exe_name}"));
    for ext in EXTENSIONS {
        if let Ok(ext_key) = classes.open_subkey_with_flags(ext, KEY_ALL_ACCESS) {
            if let Ok(owp) = ext_key.open_subkey_with_flags("OpenWithProgIds", KEY_ALL_ACCESS) {
                let _ = owp.delete_value(PROG_ID);
            }
            let current: String = ext_key.get_value("").unwrap_or_default();
            if current == PROG_ID {
                let _ = ext_key.delete_value("");
            }
        }
    }
    let _ = hkcu.delete_subkey_all(r"Software\FreeMdEditor");
    if let Ok(ra) = hkcu.open_subkey_with_flags(r"Software\RegisteredApplications", KEY_ALL_ACCESS)
    {
        let _ = ra.delete_value("FreeMdEditor");
    }

    notify_shell();
    Ok(())
}

/// Tell Explorer that associations changed so icons / "Open with" refresh.
fn notify_shell() {
    const SHCNE_ASSOCCHANGED: i32 = 0x0800_0000;
    const SHCNF_IDLIST: u32 = 0x0000;
    #[link(name = "shell32")]
    extern "system" {
        fn SHChangeNotify(
            w_event_id: i32,
            u_flags: u32,
            dw_item1: *const std::ffi::c_void,
            dw_item2: *const std::ffi::c_void,
        );
    }
    unsafe {
        SHChangeNotify(
            SHCNE_ASSOCCHANGED,
            SHCNF_IDLIST,
            std::ptr::null(),
            std::ptr::null(),
        );
    }
}
