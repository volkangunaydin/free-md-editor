export type Theme = "light" | "dark";
export type Mode = "wysiwyg" | "source";

const THEME_KEY = "fme.theme";
const MODE_KEY = "fme.mode";

export function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function saveTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function loadMode(): Mode {
  try {
    const stored = localStorage.getItem(MODE_KEY);
    if (stored === "wysiwyg" || stored === "source") return stored;
  } catch {
    /* ignore */
  }
  return "wysiwyg";
}

export function saveMode(mode: Mode): void {
  try {
    localStorage.setItem(MODE_KEY, mode);
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme: Theme): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
