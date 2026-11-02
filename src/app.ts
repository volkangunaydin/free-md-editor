/**
 * Application controller: documents/tabs, the two editors, toolbar, shortcuts,
 * file dialogs, drag & drop, "open with" integration and window close handling.
 */
import { convertFileSrc } from "@tauri-apps/api/core";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { message, open as openDialog, save as saveDialog } from "@tauri-apps/plugin-dialog";
import { openUrl } from "@tauri-apps/plugin-opener";

import { Doc, MARKDOWN_EXTENSIONS, dirname, extension, isMarkdownPath, joinPath, samePath, textStats } from "./document";
import { SourceEditor } from "./editor/source";
import { DOCUMENT_CSS, guessTitle, renderHtmlDocument, renderMarkdown } from "./export";
import { WysiwygEditor } from "./editor/wysiwyg";
import { getLocale, onLocaleChange, t, translateDom } from "./i18n";
import * as api from "./lib/tauri";
import { applyTheme, loadMode, loadTheme, saveMode, saveTheme, type Mode, type Theme } from "./theme";
import { icons } from "./ui/icons";
import { isModalOpen, showModal } from "./ui/modal";
import { showSettings } from "./ui/settings";

const APP_NAME = "Free MD Editor";
const fileFilters = () => [
  { name: t("dialog.filter.markdown"), extensions: MARKDOWN_EXTENSIONS.filter((e) => e !== "txt") },
  { name: t("dialog.filter.text"), extensions: ["txt"] },
  { name: t("dialog.filter.all"), extensions: ["*"] },
];
const docName = (doc: Doc) => doc.fileName ?? t("tab.untitled");

type SaveChoice = "save" | "discard" | "cancel";

export class App {
  private docs: Doc[] = [];
  private active: Doc | null = null;
  private mode: Mode = loadMode();
  private theme: Theme = loadTheme();
  private forceClose = false;
  private readonly allowedAssetDirs = new Set<string>();

  private readonly wysiwyg: WysiwygEditor;
  private readonly source: SourceEditor;
  private readonly window = getCurrentWindow();

  private readonly el = {
    toolbar: byId("toolbar"),
    tabs: byId("tabs"),
    wysiwyg: byId("wysiwyg"),
    source: byId("source"),
    empty: byId("empty"),
    statusPath: byId("status-path"),
    statusStats: byId("status-stats"),
    statusMode: byId("status-mode"),
    dropOverlay: byId("drop-overlay"),
    exportMenu: byId("export-menu"),
    printView: byId("print-view"),
  };

  constructor() {
    applyTheme(this.theme);
    this.wysiwyg = new WysiwygEditor(this.el.wysiwyg, this.theme);
    this.source = new SourceEditor(this.el.source, this.theme);
  }

  async init(): Promise<void> {
    translateDom();
    const printCss = document.createElement("style");
    printCss.textContent = DOCUMENT_CSS;
    document.head.appendChild(printCss);
    onLocaleChange(() => this.onLocaleChanged());
    this.renderToolbarIcons();
    this.bindToolbar();
    this.bindEditors();
    this.bindShortcuts();
    this.bindLinks();
    await this.bindTauriEvents();

    this.applyMode();

    const files = await api.startupFiles().catch(() => [] as string[]);
    if (files.length > 0) await this.openPaths(files);
    else this.newDoc();
  }

  // ---------------------------------------------------------------- documents

  newDoc(): void {
    const doc = new Doc(null, "");
    this.docs.push(doc);
    void this.activate(doc);
  }

  async openPaths(paths: string[]): Promise<void> {
    let last: Doc | null = null;
    for (const path of paths) {
      const existing = this.docs.find((d) => d.path && samePath(d.path, path));
      if (existing) {
        last = existing;
        continue;
      }
      try {
        const file = await api.readFile(path);
        const doc = new Doc(file.path, file.content);
        // Replace a pristine "Untitled" tab instead of leaving it around.
        const blank = this.docs.length === 1 && this.docs[0].isBlank ? this.docs[0] : null;
        if (blank) {
          this.docs = [doc];
          this.source.releaseDoc(blank.id);
        } else {
          this.docs.push(doc);
        }
        last = doc;
      } catch (err) {
        await message(String(err), { title: t("error.open"), kind: "error" });
      }
    }
    if (last) await this.activate(last);
    else this.renderTabs();
  }

  private async activate(doc: Doc): Promise<void> {
    if (this.active === doc) {
      this.renderTabs();
      return;
    }
    this.commitActive();
    this.active = doc;
    await this.renderActive();
  }

  /** Pull the latest text out of the visible editor into the active document. */
  private commitActive(): void {
    if (!this.active) return;
    const text = this.mode === "wysiwyg" ? this.wysiwyg.getMarkdown() : this.source.getValue();
    if (text !== this.active.content) this.active.content = text;
  }

  private async renderActive(): Promise<void> {
    const doc = this.active;
    this.el.empty.classList.toggle("hidden", doc !== null);
    this.el.wysiwyg.classList.toggle("hidden", doc === null || this.mode !== "wysiwyg");
    this.el.source.classList.toggle("hidden", doc === null || this.mode !== "source");

    if (doc) {
      if (this.mode === "wysiwyg") await this.wysiwyg.load(doc.content);
      else this.source.showDoc(doc.id, doc.content);
      // The user may have switched tabs while we were loading.
      if (this.active !== doc) return;
      this.focusEditor();
    }
    this.renderTabs();
    this.refreshStatus();
  }

  async save(doc: Doc | null = this.active): Promise<boolean> {
    if (!doc) return false;
    if (doc === this.active) this.commitActive();
    if (!doc.path) return this.saveAs(doc);
    return this.writeDoc(doc, doc.path);
  }

  async saveAs(doc: Doc | null = this.active): Promise<boolean> {
    if (!doc) return false;
    if (doc === this.active) this.commitActive();
    const chosen = await saveDialog({
      title: t("dialog.saveTitle"),
      defaultPath: doc.path ?? `${t("tab.untitled")}.md`,
      filters: fileFilters(),
    });
    if (!chosen) return false;
    const path = extension(chosen) ? chosen : `${chosen}.md`;
    return this.writeDoc(doc, path);
  }

  private async writeDoc(doc: Doc, path: string): Promise<boolean> {
    try {
      doc.path = await api.writeFile(path, doc.content);
      doc.markSaved();
      this.renderTabs();
      this.refreshStatus();
      return true;
    } catch (err) {
      await message(String(err), { title: t("error.save"), kind: "error" });
      return false;
    }
  }

  async closeDoc(doc: Doc | null = this.active): Promise<boolean> {
    if (!doc) return false;
    if (doc === this.active) this.commitActive();
    if (doc.dirty) {
      if (doc !== this.active) await this.activate(doc);
      const choice = await this.askSave(doc);
      if (choice === "cancel") return false;
      if (choice === "save" && !(await this.save(doc))) return false;
    }
    const idx = this.docs.indexOf(doc);
    this.docs.splice(idx, 1);
    this.source.releaseDoc(doc.id);
    if (this.active === doc) {
      this.active = null;
      const next = this.docs[Math.min(idx, this.docs.length - 1)] ?? null;
      if (next) await this.activate(next);
      else await this.renderActive();
    } else {
      this.renderTabs();
    }
    return true;
  }

  // ------------------------------------------------------------------ export

  private exportBase(doc: Doc, ext: string): string {
    const base = doc.fileName ? doc.fileName.replace(/\.[^.]+$/, "") : t("tab.untitled");
    return doc.path ? joinPath(dirname(doc.path), `${base}.${ext}`) : `${base}.${ext}`;
  }

  async exportHtml(): Promise<boolean> {
    const doc = this.active;
    if (!doc) return false;
    this.commitActive();
    const path = await saveDialog({
      title: t("dialog.exportHtmlTitle"),
      defaultPath: this.exportBase(doc, "html"),
      filters: [{ name: t("dialog.filter.html"), extensions: ["html", "htm"] }],
    });
    if (!path) return false;
    try {
      const html = renderHtmlDocument(doc.content, guessTitle(doc.content, docName(doc)), getLocale());
      await api.writeFile(extension(path) ? path : `${path}.html`, html);
      return true;
    } catch (err) {
      await message(String(err), { title: t("error.export"), kind: "error" });
      return false;
    }
  }

  async exportPdf(): Promise<boolean> {
    const doc = this.active;
    if (!doc) return false;
    this.commitActive();
    const chosen = await saveDialog({
      title: t("dialog.exportPdfTitle"),
      defaultPath: this.exportBase(doc, "pdf"),
      filters: [{ name: t("dialog.filter.pdf"), extensions: ["pdf"] }],
    });
    if (!chosen) return false;
    const path = extension(chosen) ? chosen : `${chosen}.pdf`;

    // Fill the print-only view; everything else is hidden by @media print.
    this.el.printView.innerHTML = renderMarkdown(doc.content);
    await this.resolvePrintImages();
    const previousTitle = document.title;
    document.title = guessTitle(doc.content, docName(doc)); // becomes the PDF's title
    try {
      await api.exportPdf(path);
      return true;
    } catch (err) {
      if (String(err).includes("unsupported")) {
        // macOS / Linux: let the OS print dialog produce the PDF.
        await message(t("export.pdfFallback"), { title: t("dialog.exportPdfTitle"), kind: "info" });
        window.print();
        return true;
      }
      await message(String(err), { title: t("error.export"), kind: "error" });
      return false;
    } finally {
      document.title = previousTitle;
      this.el.printView.replaceChildren();
    }
  }

  /** Relative image paths in the print view must go through the asset protocol. */
  private async resolvePrintImages(): Promise<void> {
    const images = Array.from(this.el.printView.querySelectorAll<HTMLImageElement>("img[src]"));
    await Promise.all(
      images.map(async (img) => {
        const src = img.getAttribute("src") ?? "";
        const resolved = await this.resolveImage(src);
        if (resolved !== src) img.src = resolved;
        if (!img.complete) {
          await new Promise<void>((done) => {
            img.onload = img.onerror = () => done();
          });
        }
      }),
    );
  }

  private askSave(doc: Doc): Promise<SaveChoice> {
    return showModal<SaveChoice>({
      title: t("unsaved.title"),
      body: t("unsaved.body", { name: docName(doc) }),
      buttons: [
        { label: t("unsaved.save"), value: "save", kind: "primary" },
        { label: t("unsaved.discard"), value: "discard", kind: "danger" },
        { label: t("unsaved.cancel"), value: "cancel" },
      ],
      cancelValue: "cancel",
    });
  }

  // ------------------------------------------------------------- mode / theme

  async setMode(mode: Mode): Promise<void> {
    if (mode === this.mode) return;
    this.commitActive();
    this.mode = mode;
    saveMode(mode);
    this.applyMode();
    await this.renderActive();
  }

  private applyMode(): void {
    for (const btn of this.el.toolbar.querySelectorAll<HTMLButtonElement>("[data-mode]")) {
      const on = btn.dataset.mode === this.mode;
      btn.classList.toggle("active", on);
      btn.setAttribute("aria-selected", String(on));
    }
    this.el.statusMode.textContent = this.mode === "wysiwyg" ? t("mode.visual") : t("mode.source");
  }

  /** Re-render everything that holds translated text. */
  private onLocaleChanged(): void {
    this.applyMode();
    this.renderTabs();
    this.refreshStatus();
  }

  toggleTheme(): void {
    this.theme = this.theme === "dark" ? "light" : "dark";
    saveTheme(this.theme);
    applyTheme(this.theme);
    this.wysiwyg.setTheme(this.theme);
    this.source.setTheme(this.theme);
    this.renderToolbarIcons();
  }

  // ------------------------------------------------------------------- UI

  private renderToolbarIcons(): void {
    const map: Record<string, string> = {
      new: icons.filePlus,
      open: icons.folderOpen,
      save: icons.save,
      "save-as": icons.saveAs,
      "export-menu": icons.export,
      theme: this.theme === "dark" ? icons.sun : icons.moon,
      settings: icons.settings,
    };
    for (const btn of this.el.toolbar.querySelectorAll<HTMLButtonElement>(".tb-btn")) {
      btn.innerHTML = map[btn.dataset.action ?? ""] ?? "";
    }
    for (const span of this.el.toolbar.querySelectorAll<HTMLElement>("[data-icon]")) {
      span.innerHTML = icons[span.dataset.icon as keyof typeof icons] ?? "";
    }
  }

  private bindToolbar(): void {
    document.addEventListener("click", (e) => {
      const target = (e.target as HTMLElement).closest<HTMLElement>("[data-action], [data-mode]");
      // Any click outside the export menu closes it.
      if (target?.dataset.action !== "export-menu") this.el.exportMenu.classList.add("hidden");
      if (!target) return;
      if (target.dataset.mode) {
        void this.setMode(target.dataset.mode as Mode);
        return;
      }
      void this.runAction(target.dataset.action!).catch((err) => {
        console.error(`action "${target.dataset.action}" failed`, err);
        void message(String(err?.stack ?? err), { title: "Error", kind: "error" });
      });
    });
  }

  private async runAction(action: string): Promise<void> {
    switch (action) {
      case "new":
        this.newDoc();
        break;
      case "open": {
        const picked = await openDialog({ multiple: true, title: t("dialog.openTitle"), filters: fileFilters() });
        if (picked) await this.openPaths(Array.isArray(picked) ? picked : [picked]);
        break;
      }
      case "save":
        await this.save();
        break;
      case "save-as":
        await this.saveAs();
        break;
      case "export-menu":
        this.el.exportMenu.classList.toggle("hidden");
        (this.el.exportMenu.querySelector("button") as HTMLButtonElement | null)?.focus();
        break;
      case "export-html":
        await this.exportHtml();
        break;
      case "export-pdf":
        await this.exportPdf();
        break;
      case "theme":
        this.toggleTheme();
        break;
      case "settings":
        await showSettings();
        break;
    }
  }

  private renderTabs(): void {
    const frag = document.createDocumentFragment();
    for (const doc of this.docs) {
      const tab = document.createElement("div");
      tab.className = "tab" + (doc === this.active ? " active" : "") + (doc.dirty ? " dirty" : "");
      tab.title = doc.path ?? t("status.unsaved");
      tab.setAttribute("role", "tab");

      const name = document.createElement("span");
      name.className = "tab-name";
      name.textContent = docName(doc);

      const close = document.createElement("button");
      close.className = "tab-close";
      close.title = t("tab.close");
      close.setAttribute("aria-label", t("tab.closeNamed", { name: docName(doc) }));
      close.innerHTML = `<span class="tab-dot"></span>${icons.close}`;
      close.addEventListener("click", (e) => {
        e.stopPropagation();
        void this.closeDoc(doc);
      });

      tab.append(name, close);
      tab.addEventListener("mousedown", (e) => {
        if (e.button === 1) {
          e.preventDefault();
          void this.closeDoc(doc);
        } else if (e.button === 0) {
          void this.activate(doc);
        }
      });
      frag.appendChild(tab);
    }
    this.el.tabs.replaceChildren(frag);
    this.el.tabs.querySelector(".tab.active")?.scrollIntoView({ inline: "nearest", block: "nearest" });
    this.updateTitle();
  }

  private updateTitle(): void {
    const doc = this.active;
    const title = doc ? `${doc.dirty ? "● " : ""}${docName(doc)} — ${APP_NAME}` : APP_NAME;
    void this.window.setTitle(title);
  }

  private refreshStatus(): void {
    const doc = this.active;
    if (!doc) {
      this.el.statusPath.textContent = "";
      this.el.statusPath.title = "";
      this.el.statusStats.textContent = "";
      return;
    }
    this.el.statusPath.textContent = doc.path ?? t("status.unsaved");
    this.el.statusPath.title = doc.path ?? "";
    const s = textStats(doc.content);
    this.el.statusStats.textContent = t("status.stats", { ...s });
  }

  private onContentChanged(text: string): void {
    if (!this.active) return;
    if (this.active.content === text) return;
    const wasDirty = this.active.dirty;
    this.active.content = text;
    if (this.active.dirty !== wasDirty) this.renderTabs();
    this.refreshStatus();
  }

  private focusEditor(): void {
    if (this.mode === "wysiwyg") this.wysiwyg.focus();
    else this.source.focus();
  }

  // ---------------------------------------------------------------- bindings

  private bindEditors(): void {
    this.wysiwyg.onChange = (md) => {
      if (this.mode === "wysiwyg") this.onContentChanged(md);
    };
    this.source.onChange = (text) => {
      if (this.mode === "source") this.onContentChanged(text);
    };
    this.source.onOpenLink = (url) => void this.openExternal(url);
    this.wysiwyg.resolveImage = (url) => this.resolveImage(url);
  }

  private bindShortcuts(): void {
    window.addEventListener(
      "keydown",
      (e) => {
        if (isModalOpen()) return;
        if (e.key === "Escape") this.el.exportMenu.classList.add("hidden");
        const ctrl = e.ctrlKey || e.metaKey;
        if (!ctrl) return;
        const key = e.key.toLowerCase();
        let handled = true;

        if (key === "n" && !e.shiftKey) this.newDoc();
        else if (key === "o" && !e.shiftKey) void this.runAction("open");
        else if (key === "s" && e.shiftKey) void this.saveAs();
        else if (key === "s") void this.save();
        else if (key === "w") void this.closeDoc();
        else if (key === "p") void this.exportPdf();
        else if (key === "e") void this.setMode(this.mode === "wysiwyg" ? "source" : "wysiwyg");
        else if (key === "tab") this.cycleTab(e.shiftKey ? -1 : 1);
        else if (key === "," ) void showSettings();
        else handled = false;

        if (handled) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true,
    );

    // Block the webview's default context menu outside the editors.
    document.addEventListener("contextmenu", (e) => {
      const t = e.target as HTMLElement;
      if (!t.closest(".editor-pane")) e.preventDefault();
    });
  }

  private cycleTab(delta: number): void {
    if (this.docs.length < 2 || !this.active) return;
    const idx = this.docs.indexOf(this.active);
    const next = this.docs[(idx + delta + this.docs.length) % this.docs.length];
    void this.activate(next);
  }

  /** Clicking an external link anywhere in the page opens the system browser. */
  private bindLinks(): void {
    document.addEventListener(
      "click",
      (e) => {
        const a = (e.target as HTMLElement).closest<HTMLAnchorElement>("a[href]");
        if (!a) return;
        const href = a.getAttribute("href") ?? "";
        if (/^(https?:|mailto:)/i.test(href)) {
          e.preventDefault();
          e.stopPropagation();
          void this.openExternal(href);
        } else if (!href.startsWith("#")) {
          // Relative links / files: do not navigate the app away.
          e.preventDefault();
        }
      },
      true,
    );
  }

  private async openExternal(url: string): Promise<void> {
    try {
      await openUrl(url);
    } catch (err) {
      console.warn("openUrl failed", err);
    }
  }

  private async resolveImage(url: string): Promise<string> {
    if (/^[a-z][a-z0-9+.-]*:/i.test(url) || url.startsWith("//")) return url;
    const base = this.active?.path;
    if (!base) return url;
    const dir = dirname(base);
    const abs = /^[a-z]:[\\/]/i.test(url) || url.startsWith("\\") ? url : joinPath(dir, decodeURIComponent(url));
    const assetDir = dirname(abs);
    if (!this.allowedAssetDirs.has(assetDir)) {
      try {
        await api.allowAssetDir(assetDir);
        this.allowedAssetDirs.add(assetDir);
      } catch (err) {
        console.warn("allowAssetDir failed", err);
        return url;
      }
    }
    return convertFileSrc(abs);
  }

  private async bindTauriEvents(): Promise<void> {
    // Files from a second instance (double-click in Explorer while running).
    await api.onOpenFiles((paths) => {
      void this.openPaths(paths);
    });

    // Drag & drop from Explorer.
    await getCurrentWebview().onDragDropEvent((event) => {
      const p = event.payload;
      if (p.type === "enter" || p.type === "over") {
        this.el.dropOverlay.classList.remove("hidden");
      } else if (p.type === "leave") {
        this.el.dropOverlay.classList.add("hidden");
      } else if (p.type === "drop") {
        this.el.dropOverlay.classList.add("hidden");
        const files = p.paths.filter(isMarkdownPath);
        if (files.length) void this.openPaths(files);
      }
    });

    // Ask about unsaved documents before the window closes.
    await this.window.onCloseRequested(async (event) => {
      if (this.forceClose) return;
      this.commitActive();
      const dirty = this.docs.filter((d) => d.dirty);
      if (dirty.length === 0) return;
      event.preventDefault();
      for (const doc of dirty) {
        await this.activate(doc);
        const choice = await this.askSave(doc);
        if (choice === "cancel") return;
        if (choice === "save" && !(await this.save(doc))) return;
      }
      this.forceClose = true;
      await this.window.close();
    });
  }
}

function byId(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Missing element #${id}`);
  return el;
}
