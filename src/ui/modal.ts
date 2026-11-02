export interface ModalButton<T> {
  label: string;
  value: T;
  kind?: "primary" | "danger" | "default";
}

export interface ModalOptions<T> {
  title: string;
  body: string | HTMLElement;
  buttons: ModalButton<T>[];
  /** Value returned on Escape / backdrop click. */
  cancelValue: T;
  /** Wider dialog (settings etc.). */
  wide?: boolean;
}

let openCount = 0;

export function isModalOpen(): boolean {
  return openCount > 0;
}

/** Simple in-app modal returning the chosen button value. */
export function showModal<T>(opts: ModalOptions<T>): Promise<T> {
  const root = document.getElementById("modal-root")!;

  return new Promise<T>((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";

    const dialog = document.createElement("div");
    dialog.className = "modal" + (opts.wide ? " modal-wide" : "");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");

    const title = document.createElement("h2");
    title.className = "modal-title";
    title.textContent = opts.title;

    const body = document.createElement("div");
    body.className = "modal-body";
    if (typeof opts.body === "string") body.textContent = opts.body;
    else body.appendChild(opts.body);

    const footer = document.createElement("div");
    footer.className = "modal-buttons";

    const finish = (value: T) => {
      document.removeEventListener("keydown", onKey, true);
      backdrop.remove();
      openCount--;
      resolve(value);
    };

    let primary: HTMLButtonElement | null = null;
    for (const b of opts.buttons) {
      const btn = document.createElement("button");
      btn.className = "btn" + (b.kind === "primary" ? " btn-primary" : b.kind === "danger" ? " btn-danger" : "");
      btn.textContent = b.label;
      btn.addEventListener("click", () => finish(b.value));
      footer.appendChild(btn);
      if (b.kind === "primary") primary = btn;
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        finish(opts.cancelValue);
      }
    };

    backdrop.addEventListener("mousedown", (e) => {
      if (e.target === backdrop) finish(opts.cancelValue);
    });
    document.addEventListener("keydown", onKey, true);

    dialog.append(title, body, footer);
    backdrop.appendChild(dialog);
    root.appendChild(backdrop);
    openCount++;

    (primary ?? footer.querySelector("button"))?.focus();
  });
}

/** Build a DOM fragment from a trusted template string. */
export function html(markup: string): HTMLElement {
  const tpl = document.createElement("template");
  tpl.innerHTML = markup.trim();
  return tpl.content.firstElementChild as HTMLElement;
}
