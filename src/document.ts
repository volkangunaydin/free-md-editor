export const MARKDOWN_EXTENSIONS = ["md", "markdown", "mdown", "mkd", "mdwn", "mkdn", "mdtxt", "mdtext", "txt"];

let nextId = 1;

/** One open document (tab). Content is always the Markdown source text. */
export class Doc {
  readonly id = nextId++;
  path: string | null;
  content: string;
  private savedContent: string;

  constructor(path: string | null, content: string) {
    this.path = path;
    this.content = content;
    this.savedContent = content;
  }

  get dirty(): boolean {
    return this.content !== this.savedContent;
  }

  /** File name, or `null` for a document that was never saved. */
  get fileName(): string | null {
    return this.path ? basename(this.path) : null;
  }

  /** True for a brand-new, never-touched tab that can be silently replaced. */
  get isBlank(): boolean {
    return this.path === null && this.content === "" && !this.dirty;
  }

  markSaved(): void {
    this.savedContent = this.content;
  }
}

export function basename(path: string): string {
  const parts = path.split(/[\\/]/);
  return parts[parts.length - 1] || path;
}

export function dirname(path: string): string {
  const idx = Math.max(path.lastIndexOf("\\"), path.lastIndexOf("/"));
  return idx > 0 ? path.slice(0, idx) : path;
}

export function extension(path: string): string {
  const name = basename(path);
  const dot = name.lastIndexOf(".");
  return dot > 0 ? name.slice(dot + 1).toLowerCase() : "";
}

export function isMarkdownPath(path: string): boolean {
  return MARKDOWN_EXTENSIONS.includes(extension(path));
}

/** Join a directory and a relative path using the directory's separator style. */
export function joinPath(dir: string, rel: string): string {
  const sep = dir.includes("\\") ? "\\" : "/";
  const cleaned = rel.replace(/^\.\//, "").replace(/\//g, sep);
  return dir.endsWith(sep) ? dir + cleaned : dir + sep + cleaned;
}

export function samePath(a: string, b: string): boolean {
  const norm = (p: string) => p.replace(/\//g, "\\").toLowerCase();
  return norm(a) === norm(b);
}

export interface TextStats {
  words: number;
  chars: number;
  lines: number;
}

export function textStats(text: string): TextStats {
  const trimmed = text.trim();
  return {
    words: trimmed ? trimmed.split(/\s+/).length : 0,
    chars: text.length,
    lines: text ? text.split(/\r\n|\r|\n/).length : 0,
  };
}
