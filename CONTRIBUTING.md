# Contributing

Thanks for your interest in Free MD Editor!

## Development setup

1. Install Rust (stable), the MSVC build tools + Windows 10 SDK, and Node.js 20+.
2. `npm install`
3. `npm run tauri dev`

`npm run typecheck` runs the TypeScript compiler; `cargo clippy` in `src-tauri` lints the Rust side.

## Pull requests

- Keep PRs focused; one feature or fix per PR.
- Run `npm run typecheck` and `cargo fmt` / `cargo clippy` before pushing.
- UI text goes through `src/i18n.ts`; please add strings for all four languages
  (English, Turkish, French, German). If you cannot translate one, copy the English
  text and mention it in the PR so a native speaker can follow up.
- Describe what you tested (visual mode, source mode, opening files from Explorer, …).

## Reporting bugs

Open an issue with:

- Windows version and app version (Settings → About),
- steps to reproduce,
- a minimal Markdown sample if the problem is content-related.
