# Free MD Editor

A free, open-source Markdown editor. Windows is the primary target; macOS and Linux
builds are produced by the same release workflow. Double-click any `.md` file and
edit it either **visually** (WYSIWYG) or as **source** (Monaco, the editor behind
VS Code) — switch between the two at any time with `Ctrl+E`.

Built with [Tauri 2](https://tauri.app) (Rust) + [Milkdown](https://milkdown.dev) +
[Monaco](https://microsoft.github.io/monaco-editor/).

## Features

- **Two editing modes** — visual (WYSIWYG) and source, sharing one document.
- **Opens `.md` files from Explorer** — the installer registers `.md`, `.markdown`,
  `.mdown`, `.mkd`, `.mdwn`; the app also keeps the per-user registration up to date
  on start, so a portable copy works too. Double-clicking a second file opens it as a
  new tab in the running window (single instance).
- **Tabs**, drag & drop from Explorer, unsaved-change protection, atomic saves.
- **Light / dark theme**, remembered window size & position.
- **Languages**: English, Türkçe, Français, Deutsch (auto-detected, switchable in Settings).
- GitHub-flavoured Markdown: tables, task lists, fenced code with syntax highlighting,
  LaTeX math, images (relative paths resolve next to the file).
- Small footprint: uses the WebView2 runtime already present on Windows 10/11.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| `Ctrl+N` / `Ctrl+O` | New / Open |
| `Ctrl+S` / `Ctrl+Shift+S` | Save / Save as |
| `Ctrl+W` | Close tab |
| `Ctrl+Tab` / `Ctrl+Shift+Tab` | Next / previous tab |
| `Ctrl+E` | Toggle Visual ⇄ Source |
| `Ctrl+,` | Settings |

## Install

Download the latest build from the
[Releases](https://github.com/volkangunaydin/free-md-editor/releases) page:

| Platform | File |
| --- | --- |
| Windows 10/11 | `Free MD Editor_x.y.z_x64-setup.exe` (per-user installer, registers the Markdown file types) |
| macOS (Apple Silicon / Intel) | `Free MD Editor_x.y.z_aarch64.dmg` / `_x64.dmg` (unsigned: right-click → Open on first launch) |
| Linux | `.deb` (Debian/Ubuntu) or `.AppImage` |

To make it the *default* app for `.md` files, open **Settings → Apps → Default apps**
(the app's Settings dialog has a shortcut) and pick *Free MD Editor*. Windows only lets
the user make that choice.

## Build from source

Prerequisites:

- [Rust](https://rustup.rs) (stable) and the MSVC build tools
- Windows 10 SDK (provides `rc.exe`, needed to embed the icon/version resource)
- [Node.js](https://nodejs.org) 20+

```powershell
git clone https://github.com/volkangunaydin/free-md-editor.git
cd free-md-editor
npm install
npm run tauri dev      # run in development mode
npm run tauri build    # produce the NSIS installer in src-tauri/target/release/bundle/nsis
```

On Windows you can simply double-click **`create-setup.bat`**: it checks the toolchain,
installs npm dependencies if needed, builds the installer and copies it to `setup\`.

If the build complains that `rc.exe` was not found, add the Windows SDK `bin\<version>\x64`
(or `x86`) directory to your `PATH`, or run the command from a *Developer PowerShell for VS*.

## Project layout

```
src/                 Frontend (TypeScript, no framework)
  app.ts             Documents, tabs, toolbar, shortcuts, dialogs
  editor/wysiwyg.ts  Milkdown Crepe wrapper
  editor/source.ts   Monaco wrapper
  i18n.ts            UI strings (en, tr, fr, de)
src-tauri/           Rust backend (Tauri 2)
  src/commands.rs    read/write files, startup args, asset scope
  src/assoc.rs       Per-user .md file association (HKCU registry)
  tauri.conf.json    Window, CSP, bundle & file-association config
```

## Contributing

Issues and pull requests are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © Volkan Günaydın
