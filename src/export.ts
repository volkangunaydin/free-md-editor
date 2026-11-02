/**
 * Markdown → standalone HTML (used for "Export as HTML" and as the print view
 * for "Export as PDF").
 */
import hljs from "highlight.js/lib/core";
import bash from "highlight.js/lib/languages/bash";
import csharp from "highlight.js/lib/languages/csharp";
import css from "highlight.js/lib/languages/css";
import go from "highlight.js/lib/languages/go";
import java from "highlight.js/lib/languages/java";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import markdown from "highlight.js/lib/languages/markdown";
import powershell from "highlight.js/lib/languages/powershell";
import python from "highlight.js/lib/languages/python";
import rust from "highlight.js/lib/languages/rust";
import sql from "highlight.js/lib/languages/sql";
import typescript from "highlight.js/lib/languages/typescript";
import xml from "highlight.js/lib/languages/xml";
import yaml from "highlight.js/lib/languages/yaml";
import hljsCss from "highlight.js/styles/github.css?inline";
import { Marked } from "marked";

const languages: Record<string, Parameters<typeof hljs.registerLanguage>[1]> = {
  bash, sh: bash, shell: bash, zsh: bash,
  csharp, cs: csharp,
  css,
  go, golang: go,
  java,
  javascript, js: javascript, jsx: javascript,
  json,
  markdown, md: markdown,
  powershell, ps1: powershell,
  python, py: python,
  rust, rs: rust,
  sql,
  typescript, ts: typescript, tsx: typescript,
  xml, html: xml, svg: xml,
  yaml, yml: yaml,
};
for (const [name, def] of Object.entries(languages)) hljs.registerLanguage(name, def);

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const marked = new Marked({
  gfm: true,
  breaks: false,
  renderer: {
    code({ text, lang }) {
      const language = (lang ?? "").trim().split(/\s+/)[0].toLowerCase();
      const body = language && hljs.getLanguage(language)
        ? hljs.highlight(text, { language }).value
        : escapeHtml(text);
      const cls = language ? ` class="language-${escapeHtml(language)}"` : "";
      return `<pre><code${cls}>${body}\n</code></pre>\n`;
    },
  },
});

/** Render Markdown to an HTML fragment (no <html> wrapper). */
export function renderMarkdown(markdown: string): string {
  return marked.parse(markdown, { async: false }) as string;
}

/** Best-effort document title: first H1, otherwise the given fallback. */
export function guessTitle(markdown: string, fallback: string): string {
  const m = markdown.match(/^\s*#\s+(.+?)\s*#*\s*$/m);
  return m ? m[1].replace(/[*_`]/g, "") : fallback;
}

/** Document CSS shared by the HTML file and the PDF print view. */
export const DOCUMENT_CSS = `
.md-doc {
  --fg: #1f2328; --muted: #656d76; --border: #d0d7de; --code-bg: #f6f8fa; --link: #0969da;
  font-family: -apple-system, "Segoe UI", system-ui, Roboto, "Helvetica Neue", Arial, sans-serif;
  font-size: 16px; line-height: 1.6; color: var(--fg);
  max-width: 860px; margin: 0 auto; padding: 40px 32px; word-wrap: break-word;
}
.md-doc > :first-child { margin-top: 0; }
.md-doc h1, .md-doc h2, .md-doc h3, .md-doc h4, .md-doc h5, .md-doc h6 {
  margin: 1.6em 0 0.6em; font-weight: 600; line-height: 1.25;
}
.md-doc h1 { font-size: 2em; padding-bottom: .3em; border-bottom: 1px solid var(--border); }
.md-doc h2 { font-size: 1.5em; padding-bottom: .3em; border-bottom: 1px solid var(--border); }
.md-doc h3 { font-size: 1.25em; }
.md-doc h4 { font-size: 1em; }
.md-doc p, .md-doc ul, .md-doc ol, .md-doc blockquote, .md-doc pre, .md-doc table { margin: 0 0 1em; }
.md-doc a { color: var(--link); text-decoration: none; }
.md-doc a:hover { text-decoration: underline; }
.md-doc code { font-family: ui-monospace, "Cascadia Code", Consolas, "Liberation Mono", monospace;
  font-size: 85%; background: var(--code-bg); padding: .2em .4em; border-radius: 6px; }
.md-doc pre { background: var(--code-bg); padding: 16px; border-radius: 6px; overflow: auto; line-height: 1.45; }
.md-doc pre code { background: none; padding: 0; font-size: 85%; }
.md-doc blockquote { margin-left: 0; padding: 0 1em; color: var(--muted); border-left: .25em solid var(--border); }
.md-doc table { border-collapse: collapse; border-spacing: 0; display: block; overflow: auto; max-width: 100%; }
.md-doc th, .md-doc td { padding: 6px 13px; border: 1px solid var(--border); }
.md-doc th { font-weight: 600; background: var(--code-bg); }
.md-doc tr:nth-child(2n) td { background: #f6f8fa80; }
.md-doc img { max-width: 100%; box-sizing: border-box; }
.md-doc hr { height: .25em; border: 0; background: var(--border); margin: 24px 0; }
.md-doc ul, .md-doc ol { padding-left: 2em; }
.md-doc li + li { margin-top: .25em; }
.md-doc li > input[type=checkbox] { margin: 0 .4em .25em -1.4em; vertical-align: middle; }
.md-doc li:has(> input[type=checkbox]) { list-style: none; }
.md-doc del { color: var(--muted); }
@media print {
  .md-doc { max-width: none; padding: 0; font-size: 12pt; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .md-doc pre, .md-doc blockquote, .md-doc table, .md-doc img { break-inside: avoid; }
  .md-doc h1, .md-doc h2, .md-doc h3 { break-after: avoid; }
  .md-doc a { color: inherit; }
}
${hljsCss}
`;

/** A complete, self-contained HTML document. */
export function renderHtmlDocument(markdown: string, title: string, lang = "en"): string {
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="generator" content="Free MD Editor">
<title>${escapeHtml(title)}</title>
<style>
body { margin: 0; background: #fff; }
${DOCUMENT_CSS}
</style>
</head>
<body>
<article class="md-doc">
${renderMarkdown(markdown)}
</article>
</body>
</html>
`;
}
