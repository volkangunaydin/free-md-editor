//! Direct PDF export through WebView2's `PrintToPdf` (Windows only).
//!
//! The frontend fills a print-only container and hides the rest of the UI with
//! `@media print` rules, so printing the main webview yields just the document.

#![cfg(windows)]

use std::sync::mpsc;
use std::time::Duration;

use tauri::WebviewWindow;
use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2_7;
use webview2_com::PrintToPdfCompletedHandler;
use windows::core::{Interface, HSTRING};

pub async fn print_to_pdf(window: WebviewWindow, path: String) -> Result<(), String> {
    let (tx, rx) = mpsc::channel::<Result<(), String>>();

    window
        .with_webview(move |webview| {
            let result = (|| -> Result<(), String> {
                let core = unsafe { webview.controller().CoreWebView2() }
                    .map_err(|e| format!("CoreWebView2: {e}"))?;
                let core7: ICoreWebView2_7 = core
                    .cast()
                    .map_err(|e| format!("WebView2 runtime too old for PrintToPdf: {e}"))?;
                let done = tx.clone();
                let handler = PrintToPdfCompletedHandler::create(Box::new(move |hr, ok| {
                    let outcome = match (hr, ok) {
                        (Ok(()), true) => Ok(()),
                        (Ok(()), false) => Err("PrintToPdf reported failure".to_string()),
                        (Err(e), _) => Err(format!("PrintToPdf failed: {e}")),
                    };
                    let _ = done.send(outcome);
                    Ok(())
                }));
                unsafe { core7.PrintToPdf(&HSTRING::from(path.as_str()), None, &handler) }
                    .map_err(|e| format!("PrintToPdf: {e}"))
            })();
            if let Err(e) = result {
                let _ = tx.send(Err(e));
            }
        })
        .map_err(|e| e.to_string())?;

    tauri::async_runtime::spawn_blocking(move || {
        rx.recv_timeout(Duration::from_secs(120))
            .map_err(|_| "PDF export timed out".to_string())?
    })
    .await
    .map_err(|e| e.to_string())?
}
