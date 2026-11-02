/**
 * Source editor built on Monaco (the editor that powers VS Code).
 *
 * One Monaco text model is kept per open document so that undo history and
 * scroll position survive switching tabs.
 */
import * as monaco from "monaco-editor/editor.js";
import "monaco-editor/features/register.all.js";
import "monaco-editor/languages/definitions/markdown/register.js";
// Languages commonly found in fenced code blocks (used for embedded highlighting).
import "monaco-editor/languages/definitions/javascript/register.js";
import "monaco-editor/languages/definitions/typescript/register.js";
import "monaco-editor/languages/definitions/html/register.js";
import "monaco-editor/languages/definitions/css/register.js";
import "monaco-editor/languages/definitions/powershell/register.js";
import "monaco-editor/languages/definitions/python/register.js";
import "monaco-editor/languages/definitions/rust/register.js";
import "monaco-editor/languages/definitions/shell/register.js";
import "monaco-editor/languages/definitions/yaml/register.js";
import "monaco-editor/languages/definitions/sql/register.js";
import "monaco-editor/languages/definitions/xml/register.js";
import "monaco-editor/languages/definitions/csharp/register.js";
import "monaco-editor/languages/definitions/java/register.js";
import "monaco-editor/languages/definitions/go/register.js";
import EditorWorker from "monaco-editor/editor/editor.worker.js?worker";

import type { Theme } from "../theme";

declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment;
  }
}

self.MonacoEnvironment = {
  getWorker: () => new EditorWorker(),
};

export class SourceEditor {
  private readonly editor: monaco.editor.IStandaloneCodeEditor;
  private readonly models = new Map<number, monaco.editor.ITextModel>();
  private readonly viewStates = new Map<number, monaco.editor.ICodeEditorViewState | null>();
  private currentDocId: number | null = null;
  private suppress = 0;

  onChange: ((text: string) => void) | null = null;
  onOpenLink: ((url: string) => void) | null = null;

  constructor(root: HTMLElement, theme: Theme) {
    this.editor = monaco.editor.create(root, {
      language: "markdown",
      theme: themeName(theme),
      automaticLayout: true,
      wordWrap: "on",
      wrappingIndent: "same",
      minimap: { enabled: false },
      fontSize: 14,
      lineHeight: 22,
      fontFamily: "Cascadia Code, Consolas, 'Courier New', monospace",
      fontLigatures: true,
      lineNumbers: "on",
      renderLineHighlight: "line",
      scrollBeyondLastLine: false,
      smoothScrolling: true,
      padding: { top: 16, bottom: 32 },
      folding: true,
      quickSuggestions: false,
      wordBasedSuggestions: "off",
      occurrencesHighlight: "off",
      unicodeHighlight: { ambiguousCharacters: false, invisibleCharacters: false },
      tabSize: 2,
      insertSpaces: true,
      bracketPairColorization: { enabled: false },
      guides: { indentation: false },
    });

    this.editor.onDidChangeModelContent(() => {
      if (this.suppress === 0) this.onChange?.(this.editor.getValue());
    });

    // Ctrl+click on a link inside Monaco: hand the URL to the OS browser.
    monaco.editor.registerLinkOpener({
      open: (resource) => {
        this.onOpenLink?.(resource.toString(true));
        return true;
      },
    });
  }

  /** Show `docId`, creating its model on first use, and sync the text. */
  showDoc(docId: number, content: string): void {
    if (this.currentDocId !== null && this.currentDocId !== docId) {
      this.viewStates.set(this.currentDocId, this.editor.saveViewState());
    }

    let model = this.models.get(docId);
    if (!model) {
      model = monaco.editor.createModel(content, "markdown");
      this.models.set(docId, model);
    } else if (model.getValue() !== content) {
      this.replaceContent(model, content);
    }

    if (this.editor.getModel() !== model) {
      this.editor.setModel(model);
      const state = this.viewStates.get(docId);
      if (state) this.editor.restoreViewState(state);
    }
    this.currentDocId = docId;
  }

  /** Replace text while keeping the undo stack (unlike `model.setValue`). */
  private replaceContent(model: monaco.editor.ITextModel, content: string): void {
    this.suppress++;
    try {
      model.pushEditOperations(
        [],
        [{ range: model.getFullModelRange(), text: content }],
        () => null,
      );
      model.pushStackElement();
    } finally {
      this.suppress--;
    }
  }

  releaseDoc(docId: number): void {
    const model = this.models.get(docId);
    if (model) {
      if (this.editor.getModel() === model) this.editor.setModel(null);
      model.dispose();
      this.models.delete(docId);
    }
    this.viewStates.delete(docId);
    if (this.currentDocId === docId) this.currentDocId = null;
  }

  getValue(): string {
    return this.editor.getValue();
  }

  setTheme(theme: Theme): void {
    monaco.editor.setTheme(themeName(theme));
  }

  focus(): void {
    this.editor.focus();
  }

  layout(): void {
    this.editor.layout();
  }
}

function themeName(theme: Theme): string {
  return theme === "dark" ? "vs-dark" : "vs";
}
