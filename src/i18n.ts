/**
 * Tiny i18n layer: UI strings for English, Turkish, French and German.
 *
 * Static markup uses `data-i18n="key"` (text) / `data-i18n-title="key"` (tooltip)
 * and is refreshed by `translateDom()`; dynamic strings call `t()` at render time.
 */
export type Locale = "en" | "tr" | "fr" | "de";

export const LOCALES: { code: Locale; name: string }[] = [
  { code: "en", name: "English" },
  { code: "tr", name: "Türkçe" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
];

const en = {
  "app.name": "Free MD Editor",
  "toolbar.new": "New (Ctrl+N)",
  "toolbar.open": "Open… (Ctrl+O)",
  "toolbar.save": "Save (Ctrl+S)",
  "toolbar.saveAs": "Save As… (Ctrl+Shift+S)",
  "toolbar.theme": "Toggle light / dark theme",
  "toolbar.settings": "Settings (Ctrl+,)",
  "mode.visual": "Visual",
  "mode.source": "Source",
  "mode.visual.title": "Visual editing (Ctrl+E toggles)",
  "mode.source.title": "Source editing (Ctrl+E toggles)",
  "empty.subtitle": "Open a Markdown file or start a new one.",
  "empty.new": "New file",
  "empty.open": "Open…",
  "empty.hint": "You can also drop .md files anywhere in this window.",
  "status.unsaved": "Unsaved document",
  "status.stats": "{words} words · {chars} chars · {lines} lines",
  "tab.untitled": "Untitled",
  "tab.close": "Close (Ctrl+W)",
  "tab.closeNamed": "Close {name}",
  "drop.hint": "Drop Markdown files to open them",
  "dialog.openTitle": "Open Markdown file",
  "dialog.saveTitle": "Save Markdown file",
  "dialog.filter.markdown": "Markdown",
  "dialog.filter.text": "Text",
  "dialog.filter.all": "All files",
  "error.open": "Could not open file",
  "error.save": "Could not save file",
  "unsaved.title": "Unsaved changes",
  "unsaved.body": "Do you want to save the changes you made to “{name}”?",
  "unsaved.save": "Save",
  "unsaved.discard": "Don't save",
  "unsaved.cancel": "Cancel",
  "settings.title": "Settings",
  "settings.close": "Close",
  "settings.language": "Language",
  "settings.assoc": "Markdown file association",
  "settings.assoc.help":
    "Registers Free MD Editor for .md, .markdown, .mdown, .mkd and .mdwn files for the current user (no administrator rights needed). Windows lets you choose the default app only in Settings.",
  "settings.assoc.registered": "Registered for this user",
  "settings.assoc.notRegistered": "Not registered",
  "settings.assoc.register": "Register",
  "settings.assoc.unregister": "Unregister",
  "settings.assoc.failed": "Failed: {error}",
  "settings.assoc.openDefaults": "Open Windows “Default apps” settings",
  "settings.shortcuts": "Keyboard shortcuts",
  "shortcut.new": "New file",
  "shortcut.open": "Open…",
  "shortcut.save": "Save",
  "shortcut.saveAs": "Save as…",
  "shortcut.close": "Close tab",
  "shortcut.nextTab": "Next tab",
  "shortcut.toggleMode": "Visual ⇄ Source",
  "shortcut.exportPdf": "Export as PDF",
  "shortcut.prevTab": "Previous tab",
  "shortcut.settings": "Settings",
  "settings.about": "About",
  "settings.about.text":
    "Free MD Editor {version} — free and open source (MIT). Built with Tauri, Milkdown and Monaco.",
  "toolbar.export": "Export…",
  "export.html": "Export as HTML…",
  "export.pdf": "Export as PDF…",
  "dialog.exportHtmlTitle": "Export as HTML",
  "dialog.exportPdfTitle": "Export as PDF",
  "dialog.filter.html": "HTML",
  "dialog.filter.pdf": "PDF",
  "error.export": "Could not export",
  "export.pdfFallback": "Direct PDF export is only available on Windows. In the print dialog that opens next, choose “Save as PDF”.",
  "editor.placeholder": "Start writing…",
};

export type MessageKey = keyof typeof en;
type Messages = Record<MessageKey, string>;

const tr: Messages = {
  "app.name": "Free MD Editor",
  "toolbar.new": "Yeni (Ctrl+N)",
  "toolbar.open": "Aç… (Ctrl+O)",
  "toolbar.save": "Kaydet (Ctrl+S)",
  "toolbar.saveAs": "Farklı Kaydet… (Ctrl+Shift+S)",
  "toolbar.theme": "Açık / koyu temayı değiştir",
  "toolbar.settings": "Ayarlar (Ctrl+,)",
  "mode.visual": "Görsel",
  "mode.source": "Kaynak",
  "mode.visual.title": "Görsel düzenleme (Ctrl+E ile geçiş)",
  "mode.source.title": "Kaynak düzenleme (Ctrl+E ile geçiş)",
  "empty.subtitle": "Bir Markdown dosyası açın veya yeni bir tane oluşturun.",
  "empty.new": "Yeni dosya",
  "empty.open": "Aç…",
  "empty.hint": ".md dosyalarını bu pencereye sürükleyip bırakabilirsiniz.",
  "status.unsaved": "Kaydedilmemiş belge",
  "status.stats": "{words} kelime · {chars} karakter · {lines} satır",
  "tab.untitled": "Adsız",
  "tab.close": "Kapat (Ctrl+W)",
  "tab.closeNamed": "{name} sekmesini kapat",
  "drop.hint": "Açmak için Markdown dosyalarını buraya bırakın",
  "dialog.openTitle": "Markdown dosyası aç",
  "dialog.saveTitle": "Markdown dosyasını kaydet",
  "dialog.filter.markdown": "Markdown",
  "dialog.filter.text": "Metin",
  "dialog.filter.all": "Tüm dosyalar",
  "error.open": "Dosya açılamadı",
  "error.save": "Dosya kaydedilemedi",
  "unsaved.title": "Kaydedilmemiş değişiklikler",
  "unsaved.body": "“{name}” dosyasında yaptığınız değişiklikleri kaydetmek istiyor musunuz?",
  "unsaved.save": "Kaydet",
  "unsaved.discard": "Kaydetme",
  "unsaved.cancel": "İptal",
  "settings.title": "Ayarlar",
  "settings.close": "Kapat",
  "settings.language": "Dil",
  "settings.assoc": "Markdown dosya ilişkilendirmesi",
  "settings.assoc.help":
    "Free MD Editor'ü geçerli kullanıcı için .md, .markdown, .mdown, .mkd ve .mdwn dosyalarına kaydeder (yönetici hakkı gerekmez). Varsayılan uygulamayı yalnızca Windows Ayarlar'dan seçebilirsiniz.",
  "settings.assoc.registered": "Bu kullanıcı için kayıtlı",
  "settings.assoc.notRegistered": "Kayıtlı değil",
  "settings.assoc.register": "Kaydet",
  "settings.assoc.unregister": "Kaydı kaldır",
  "settings.assoc.failed": "Başarısız: {error}",
  "settings.assoc.openDefaults": "Windows “Varsayılan uygulamalar” ayarlarını aç",
  "settings.shortcuts": "Klavye kısayolları",
  "shortcut.new": "Yeni dosya",
  "shortcut.open": "Aç…",
  "shortcut.save": "Kaydet",
  "shortcut.saveAs": "Farklı kaydet…",
  "shortcut.close": "Sekmeyi kapat",
  "shortcut.nextTab": "Sonraki sekme",
  "shortcut.toggleMode": "Görsel ⇄ Kaynak",
  "shortcut.exportPdf": "PDF olarak dışa aktar",
  "shortcut.prevTab": "Önceki sekme",
  "shortcut.settings": "Ayarlar",
  "settings.about": "Hakkında",
  "settings.about.text":
    "Free MD Editor {version} — ücretsiz ve açık kaynak (MIT). Tauri, Milkdown ve Monaco ile geliştirildi.",
  "toolbar.export": "Dışa aktar…",
  "export.html": "HTML olarak dışa aktar…",
  "export.pdf": "PDF olarak dışa aktar…",
  "dialog.exportHtmlTitle": "HTML olarak dışa aktar",
  "dialog.exportPdfTitle": "PDF olarak dışa aktar",
  "dialog.filter.html": "HTML",
  "dialog.filter.pdf": "PDF",
  "error.export": "Dışa aktarılamadı",
  "export.pdfFallback": "Doğrudan PDF dışa aktarma yalnızca Windows’ta kullanılabilir. Açılacak yazdırma penceresinde “PDF olarak kaydet” seçeneğini seçin.",
  "editor.placeholder": "Yazmaya başlayın…",
};

const fr: Messages = {
  "app.name": "Free MD Editor",
  "toolbar.new": "Nouveau (Ctrl+N)",
  "toolbar.open": "Ouvrir… (Ctrl+O)",
  "toolbar.save": "Enregistrer (Ctrl+S)",
  "toolbar.saveAs": "Enregistrer sous… (Ctrl+Maj+S)",
  "toolbar.theme": "Basculer le thème clair / sombre",
  "toolbar.settings": "Paramètres (Ctrl+,)",
  "mode.visual": "Visuel",
  "mode.source": "Source",
  "mode.visual.title": "Édition visuelle (Ctrl+E pour basculer)",
  "mode.source.title": "Édition du code source (Ctrl+E pour basculer)",
  "empty.subtitle": "Ouvrez un fichier Markdown ou créez-en un nouveau.",
  "empty.new": "Nouveau fichier",
  "empty.open": "Ouvrir…",
  "empty.hint": "Vous pouvez aussi déposer des fichiers .md n'importe où dans cette fenêtre.",
  "status.unsaved": "Document non enregistré",
  "status.stats": "{words} mots · {chars} caractères · {lines} lignes",
  "tab.untitled": "Sans titre",
  "tab.close": "Fermer (Ctrl+W)",
  "tab.closeNamed": "Fermer {name}",
  "drop.hint": "Déposez des fichiers Markdown pour les ouvrir",
  "dialog.openTitle": "Ouvrir un fichier Markdown",
  "dialog.saveTitle": "Enregistrer le fichier Markdown",
  "dialog.filter.markdown": "Markdown",
  "dialog.filter.text": "Texte",
  "dialog.filter.all": "Tous les fichiers",
  "error.open": "Impossible d'ouvrir le fichier",
  "error.save": "Impossible d'enregistrer le fichier",
  "unsaved.title": "Modifications non enregistrées",
  "unsaved.body": "Voulez-vous enregistrer les modifications apportées à « {name} » ?",
  "unsaved.save": "Enregistrer",
  "unsaved.discard": "Ne pas enregistrer",
  "unsaved.cancel": "Annuler",
  "settings.title": "Paramètres",
  "settings.close": "Fermer",
  "settings.language": "Langue",
  "settings.assoc": "Association des fichiers Markdown",
  "settings.assoc.help":
    "Enregistre Free MD Editor pour les fichiers .md, .markdown, .mdown, .mkd et .mdwn de l'utilisateur actuel (aucun droit administrateur requis). Windows ne permet de choisir l'application par défaut que dans les Paramètres.",
  "settings.assoc.registered": "Enregistré pour cet utilisateur",
  "settings.assoc.notRegistered": "Non enregistré",
  "settings.assoc.register": "Enregistrer",
  "settings.assoc.unregister": "Supprimer",
  "settings.assoc.failed": "Échec : {error}",
  "settings.assoc.openDefaults": "Ouvrir les paramètres « Applications par défaut » de Windows",
  "settings.shortcuts": "Raccourcis clavier",
  "shortcut.new": "Nouveau fichier",
  "shortcut.open": "Ouvrir…",
  "shortcut.save": "Enregistrer",
  "shortcut.saveAs": "Enregistrer sous…",
  "shortcut.close": "Fermer l'onglet",
  "shortcut.nextTab": "Onglet suivant",
  "shortcut.toggleMode": "Visuel ⇄ Source",
  "shortcut.exportPdf": "Exporter en PDF",
  "shortcut.prevTab": "Onglet précédent",
  "shortcut.settings": "Paramètres",
  "settings.about": "À propos",
  "settings.about.text":
    "Free MD Editor {version} — gratuit et open source (MIT). Construit avec Tauri, Milkdown et Monaco.",
  "toolbar.export": "Exporter…",
  "export.html": "Exporter en HTML…",
  "export.pdf": "Exporter en PDF…",
  "dialog.exportHtmlTitle": "Exporter en HTML",
  "dialog.exportPdfTitle": "Exporter en PDF",
  "dialog.filter.html": "HTML",
  "dialog.filter.pdf": "PDF",
  "error.export": "Échec de l’exportation",
  "export.pdfFallback": "L’exportation PDF directe n’est disponible que sous Windows. Dans la boîte de dialogue d’impression qui va s’ouvrir, choisissez « Enregistrer au format PDF ».",
  "editor.placeholder": "Commencez à écrire…",
};

const de: Messages = {
  "app.name": "Free MD Editor",
  "toolbar.new": "Neu (Strg+N)",
  "toolbar.open": "Öffnen… (Strg+O)",
  "toolbar.save": "Speichern (Strg+S)",
  "toolbar.saveAs": "Speichern unter… (Strg+Umschalt+S)",
  "toolbar.theme": "Helles / dunkles Design umschalten",
  "toolbar.settings": "Einstellungen (Strg+,)",
  "mode.visual": "Visuell",
  "mode.source": "Quelltext",
  "mode.visual.title": "Visuelle Bearbeitung (Strg+E wechselt)",
  "mode.source.title": "Quelltext-Bearbeitung (Strg+E wechselt)",
  "empty.subtitle": "Öffnen Sie eine Markdown-Datei oder erstellen Sie eine neue.",
  "empty.new": "Neue Datei",
  "empty.open": "Öffnen…",
  "empty.hint": "Sie können .md-Dateien auch einfach in dieses Fenster ziehen.",
  "status.unsaved": "Ungespeichertes Dokument",
  "status.stats": "{words} Wörter · {chars} Zeichen · {lines} Zeilen",
  "tab.untitled": "Unbenannt",
  "tab.close": "Schließen (Strg+W)",
  "tab.closeNamed": "{name} schließen",
  "drop.hint": "Markdown-Dateien hier ablegen, um sie zu öffnen",
  "dialog.openTitle": "Markdown-Datei öffnen",
  "dialog.saveTitle": "Markdown-Datei speichern",
  "dialog.filter.markdown": "Markdown",
  "dialog.filter.text": "Text",
  "dialog.filter.all": "Alle Dateien",
  "error.open": "Datei konnte nicht geöffnet werden",
  "error.save": "Datei konnte nicht gespeichert werden",
  "unsaved.title": "Ungespeicherte Änderungen",
  "unsaved.body": "Möchten Sie die Änderungen an „{name}“ speichern?",
  "unsaved.save": "Speichern",
  "unsaved.discard": "Nicht speichern",
  "unsaved.cancel": "Abbrechen",
  "settings.title": "Einstellungen",
  "settings.close": "Schließen",
  "settings.language": "Sprache",
  "settings.assoc": "Markdown-Dateizuordnung",
  "settings.assoc.help":
    "Registriert Free MD Editor für .md-, .markdown-, .mdown-, .mkd- und .mdwn-Dateien des aktuellen Benutzers (keine Administratorrechte nötig). Die Standard-App lässt sich unter Windows nur in den Einstellungen wählen.",
  "settings.assoc.registered": "Für diesen Benutzer registriert",
  "settings.assoc.notRegistered": "Nicht registriert",
  "settings.assoc.register": "Registrieren",
  "settings.assoc.unregister": "Entfernen",
  "settings.assoc.failed": "Fehlgeschlagen: {error}",
  "settings.assoc.openDefaults": "Windows-Einstellungen „Standard-Apps“ öffnen",
  "settings.shortcuts": "Tastenkürzel",
  "shortcut.new": "Neue Datei",
  "shortcut.open": "Öffnen…",
  "shortcut.save": "Speichern",
  "shortcut.saveAs": "Speichern unter…",
  "shortcut.close": "Tab schließen",
  "shortcut.nextTab": "Nächster Tab",
  "shortcut.toggleMode": "Visuell ⇄ Quelltext",
  "shortcut.exportPdf": "Als PDF exportieren",
  "shortcut.prevTab": "Vorheriger Tab",
  "shortcut.settings": "Einstellungen",
  "settings.about": "Info",
  "settings.about.text":
    "Free MD Editor {version} — kostenlos und Open Source (MIT). Entwickelt mit Tauri, Milkdown und Monaco.",
  "toolbar.export": "Exportieren…",
  "export.html": "Als HTML exportieren…",
  "export.pdf": "Als PDF exportieren…",
  "dialog.exportHtmlTitle": "Als HTML exportieren",
  "dialog.exportPdfTitle": "Als PDF exportieren",
  "dialog.filter.html": "HTML",
  "dialog.filter.pdf": "PDF",
  "error.export": "Export fehlgeschlagen",
  "export.pdfFallback": "Der direkte PDF-Export ist nur unter Windows verfügbar. Wählen Sie im folgenden Druckdialog „Als PDF speichern“.",
  "editor.placeholder": "Beginnen Sie zu schreiben…",
};

const MESSAGES: Record<Locale, Messages> = { en, tr, fr, de };
const STORAGE_KEY = "fme.locale";

let current: Locale = detectLocale();
const listeners = new Set<(locale: Locale) => void>();

function isLocale(value: string | null | undefined): value is Locale {
  return value === "en" || value === "tr" || value === "fr" || value === "de";
}

function detectLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) return stored;
  } catch {
    /* storage unavailable */
  }
  for (const lang of navigator.languages ?? [navigator.language]) {
    const short = lang.slice(0, 2).toLowerCase();
    if (isLocale(short)) return short;
  }
  return "en";
}

export function getLocale(): Locale {
  return current;
}

export function setLocale(locale: Locale): void {
  if (locale === current) return;
  current = locale;
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = locale;
  translateDom();
  for (const fn of listeners) fn(locale);
}

/** Subscribe to language changes (for dynamically rendered UI). */
export function onLocaleChange(fn: (locale: Locale) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Translate `key`, substituting `{name}` placeholders from `params`. */
export function t(key: MessageKey, params?: Record<string, string | number>): string {
  let text = MESSAGES[current][key] ?? en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.split(`{${name}}`).join(String(value));
    }
  }
  return text;
}

/** Refresh every element carrying `data-i18n` / `data-i18n-title`. */
export function translateDom(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n]")) {
    el.textContent = t(el.dataset.i18n as MessageKey);
  }
  for (const el of root.querySelectorAll<HTMLElement>("[data-i18n-title]")) {
    const text = t(el.dataset.i18nTitle as MessageKey);
    el.title = text;
    el.setAttribute("aria-label", text);
  }
}

document.documentElement.lang = current;
