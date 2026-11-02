/**
 * Thin typed wrappers around the Rust commands and events exposed by src-tauri.
 */
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface FileContent {
  path: string;
  content: string;
}

/** Event emitted by the Rust side when a second instance passes files to us. */
export const OPEN_FILES_EVENT = "open-files";

export const readFile = (path: string) => invoke<FileContent>("read_file", { path });

/** Returns the canonical path that was written. */
export const writeFile = (path: string, content: string) =>
  invoke<string>("write_file", { path, content });

export const fileExists = (path: string) => invoke<boolean>("file_exists", { path });

/** Files passed on the command line when the process started. */
export const startupFiles = () => invoke<string[]>("startup_files");

/** Allow the webview to load images from this directory through the asset protocol. */
export const allowAssetDir = (path: string) => invoke<void>("allow_asset_dir", { path });

export const isAssociationRegistered = () => invoke<boolean>("is_file_association_registered");
export const registerAssociation = () => invoke<void>("register_file_association");
export const unregisterAssociation = () => invoke<void>("unregister_file_association");

export const onOpenFiles = (cb: (paths: string[]) => void): Promise<UnlistenFn> =>
  listen<string[]>(OPEN_FILES_EVENT, (event) => cb(event.payload));
