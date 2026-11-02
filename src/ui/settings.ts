import { getVersion } from "@tauri-apps/api/app";
import { openUrl } from "@tauri-apps/plugin-opener";

import { LOCALES, getLocale, setLocale, t, type Locale } from "../i18n";
import * as api from "../lib/tauri";
import { icons } from "./icons";
import { html, showModal } from "./modal";

const REPO_URL = "https://github.com/volkangunaydin/free-md-editor";

export async function showSettings(): Promise<void> {
  const [registered, version] = await Promise.all([
    api.isAssociationRegistered().catch(() => false),
    getVersion().catch(() => "dev"),
  ]);

  const languageOptions = LOCALES.map(
    (l) => `<option value="${l.code}"${l.code === getLocale() ? " selected" : ""}>${l.name}</option>`,
  ).join("");

  const body = html(`
    <div class="settings">
      <section class="settings-section">
        <h3>${t("settings.language")}</h3>
        <div class="settings-row">
          <select class="select" data-role="language">${languageOptions}</select>
        </div>
      </section>

      <section class="settings-section">
        <h3>${t("settings.assoc")}</h3>
        <p class="settings-help">${t("settings.assoc.help")}</p>
        <div class="settings-row">
          <span class="settings-status" data-role="status"></span>
          <span class="settings-grow"></span>
          <button class="btn" data-role="register">${t("settings.assoc.register")}</button>
          <button class="btn" data-role="unregister">${t("settings.assoc.unregister")}</button>
        </div>
        <div class="settings-row">
          <button class="btn btn-link" data-role="defaults">
            ${t("settings.assoc.openDefaults")} ${icons.external}
          </button>
        </div>
      </section>

      <section class="settings-section">
        <h3>${t("settings.shortcuts")}</h3>
        <table class="shortcuts">
          <tr><td><kbd>Ctrl</kbd>+<kbd>N</kbd></td><td>${t("shortcut.new")}</td><td><kbd>Ctrl</kbd>+<kbd>O</kbd></td><td>${t("shortcut.open")}</td></tr>
          <tr><td><kbd>Ctrl</kbd>+<kbd>S</kbd></td><td>${t("shortcut.save")}</td><td><kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd></td><td>${t("shortcut.saveAs")}</td></tr>
          <tr><td><kbd>Ctrl</kbd>+<kbd>W</kbd></td><td>${t("shortcut.close")}</td><td><kbd>Ctrl</kbd>+<kbd>Tab</kbd></td><td>${t("shortcut.nextTab")}</td></tr>
          <tr><td><kbd>Ctrl</kbd>+<kbd>E</kbd></td><td>${t("shortcut.toggleMode")}</td><td><kbd>Ctrl</kbd>+<kbd>,</kbd></td><td>${t("shortcut.settings")}</td></tr>
        </table>
      </section>

      <section class="settings-section settings-about">
        <h3>${t("settings.about")}</h3>
        <p>${t("settings.about.text", { version })}</p>
        <button class="btn btn-link" data-role="repo">${REPO_URL.replace("https://", "")} ${icons.external}</button>
      </section>
    </div>
  `);

  const status = body.querySelector<HTMLElement>('[data-role="status"]')!;
  const registerBtn = body.querySelector<HTMLButtonElement>('[data-role="register"]')!;
  const unregisterBtn = body.querySelector<HTMLButtonElement>('[data-role="unregister"]')!;
  const languageSelect = body.querySelector<HTMLSelectElement>('[data-role="language"]')!;

  const render = (isRegistered: boolean) => {
    status.innerHTML = isRegistered
      ? `<span class="status-ok">${icons.check}</span> ${t("settings.assoc.registered")}`
      : t("settings.assoc.notRegistered");
    registerBtn.disabled = isRegistered;
    unregisterBtn.disabled = !isRegistered;
  };
  render(registered);

  const run = async (fn: () => Promise<void>) => {
    registerBtn.disabled = unregisterBtn.disabled = true;
    try {
      await fn();
    } catch (err) {
      status.textContent = t("settings.assoc.failed", { error: String(err) });
    }
    render(await api.isAssociationRegistered().catch(() => false));
  };

  registerBtn.addEventListener("click", () => void run(api.registerAssociation));
  unregisterBtn.addEventListener("click", () => void run(api.unregisterAssociation));
  body.querySelector('[data-role="defaults"]')!.addEventListener("click", () => {
    void openUrl("ms-settings:defaultapps");
  });
  body.querySelector('[data-role="repo"]')!.addEventListener("click", () => {
    void openUrl(REPO_URL);
  });

  let reopen = false;
  languageSelect.addEventListener("change", () => {
    setLocale(languageSelect.value as Locale);
    reopen = true;
    // Close and reopen so the dialog itself is re-rendered in the new language.
    (body.closest(".modal")?.querySelector(".modal-buttons button") as HTMLButtonElement | null)?.click();
  });

  await showModal({
    title: t("settings.title"),
    body,
    buttons: [{ label: t("settings.close"), value: "close", kind: "primary" }],
    cancelValue: "close",
    wide: true,
  });

  if (reopen) await showSettings();
}
