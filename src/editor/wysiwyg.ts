/**
 * WYSIWYG editor built on Milkdown Crepe (ProseMirror underneath).
 *
 * Milkdown normalises Markdown when it serialises (e.g. `*` bullets become `-`).
 * To keep an *unedited* document byte-identical on save, we remember both the
 * text we loaded and how Milkdown serialises it; while they match we hand back
 * the original text.
 */
import { Crepe } from "@milkdown/crepe";
import { editorViewCtx } from "@milkdown/kit/core";
import { replaceAll } from "@milkdown/kit/utils";
import commonCss from "@milkdown/crepe/theme/common/style.css?inline";
import lightCss from "@milkdown/crepe/theme/frame.css?inline";
import darkCss from "@milkdown/crepe/theme/frame-dark.css?inline";

import { t } from "../i18n";
import type { Theme } from "../theme";

function ensureStyle(id: string, css: string): HTMLStyleElement {
  let el = document.getElementById(id) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement("style");
    el.id = id;
    document.head.appendChild(el);
  }
  el.textContent = css;
  return el;
}

export class WysiwygEditor {
  private readonly crepe: Crepe;
  private readonly ready: Promise<unknown>;
  private readonly themeStyle: HTMLStyleElement;
  /** Markdown exactly as loaded. */
  private loaded = "";
  /** How Milkdown serialises `loaded`. */
  private baseline = "";
  /** Timestamp until which change events are treated as stale (see constructor). */
  private ignoreUntil = 0;

  /** Fired (debounced by Milkdown) whenever the user changes the document. */
  onChange: ((markdown: string) => void) | null = null;
  /** Turns a (possibly relative) image URL into something the webview can load. */
  resolveImage: ((url: string) => string | Promise<string>) | null = null;

  constructor(root: HTMLElement, theme: Theme) {
    ensureStyle("crepe-common-css", commonCss);
    this.themeStyle = ensureStyle("crepe-theme-css", theme === "dark" ? darkCss : lightCss);

    this.crepe = new Crepe({
      root,
      defaultValue: "",
      features: {
        [Crepe.Feature.AI]: false,
        [Crepe.Feature.TopBar]: true,
      },
      featureConfigs: {
        [Crepe.Feature.Placeholder]: { text: t("editor.placeholder"), mode: "doc" },
        [Crepe.Feature.ImageBlock]: {
          proxyDomURL: (url: string) => (this.resolveImage ? this.resolveImage(url) : url),
        },
      },
    });

    this.crepe.on((api) => {
      api.markdownUpdated((_ctx, markdown) => {
        // Milkdown debounces this by 200 ms, so an edit made just before a
        // programmatic load() can surface afterwards; drop those stragglers.
        if (performance.now() < this.ignoreUntil) return;
        this.onChange?.(this.denormalise(markdown));
      });
    });

    this.ready = this.crepe.create();
  }

  /** Map Milkdown's serialisation back to the user's text when nothing changed. */
  private denormalise(markdown: string): string {
    return markdown === this.baseline ? this.loaded : markdown;
  }

  /** Replace the whole document (resets undo history). */
  async load(markdown: string): Promise<void> {
    await this.ready;
    this.loaded = markdown;
    this.ignoreUntil = performance.now() + 300;
    this.crepe.editor.action(replaceAll(markdown, true));
    this.baseline = this.crepe.getMarkdown();
  }

  /** Current Markdown; an unedited document round-trips unchanged. */
  getMarkdown(): string {
    return this.denormalise(this.crepe.getMarkdown());
  }

  setTheme(theme: Theme): void {
    this.themeStyle.textContent = theme === "dark" ? darkCss : lightCss;
  }

  focus(): void {
    try {
      this.crepe.editor.ctx.get(editorViewCtx).focus();
    } catch {
      /* editor not ready yet */
    }
  }

  whenReady(): Promise<unknown> {
    return this.ready;
  }
}
