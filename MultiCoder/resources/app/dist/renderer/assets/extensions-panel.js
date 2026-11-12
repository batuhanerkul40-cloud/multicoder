/* MultiCoder - extensions panel extras
 * Controls: ON/OFF toggle switch to disable/enable, X button to permanently remove.
 * Includes search button at the bottom for finding more extensions.
 */
(() => {
  "use strict";

  const api = window.polyglot;
  if (!api || !api.extensions) return;
  if (window.__pgExtensionsPanel) return;
  window.__pgExtensionsPanel = true;
  const text = (key) =>
    typeof window.ocText === "function" ? window.ocText(key) : key;

  const X_ICON =
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ' +
    'focusable="false"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';

  let disabled = [];
  let loadSeq = 0;
  let scheduled = false;

  const ensureStyles = () => {
    if (document.getElementById("pg-ext-panel-styles")) return;
    const style = document.createElement("style");
    style.id = "pg-ext-panel-styles";
    style.textContent = `
      .pg-ext-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
      .pg-ext-toggle-btn { display: inline-flex; align-items: center; gap: 5px; background: rgba(255, 255, 255, 0.05);
        border: 1px solid var(--border, #2b2f33); border-radius: var(--radius-lg); padding: 2px 7px; cursor: pointer; user-select: none;
        font-family: inherit; transition: all .2s ease; }
      .pg-ext-toggle-btn:hover { border-color: var(--border-strong, #3e4449); background: var(--accent-soft); }
      .pg-ext-toggle-track { position: relative; width: 24px; height: 13px; border-radius: 999px; background: #3e4449;
        transition: background .2s ease; display: inline-block; }
      .pg-ext-toggle-btn.is-on .pg-ext-toggle-track { background: #93af8a; }
      .pg-ext-toggle-thumb { position: absolute; top: 1.5px; left: 1.5px; width: 10px; height: 10px; border-radius: 50%;
        background: #e9e6de; transition: transform .2s ease; box-shadow: 0 1px 2px rgba(0,0,0,.4); }
      .pg-ext-toggle-btn.is-on .pg-ext-toggle-thumb { transform: translateX(11px); }
      .pg-ext-toggle-label { font-size: var(--oc-text-1); font-weight: 600; letter-spacing: .01em; color: var(--muted, #a2a29c); min-width: 22px; }
      .pg-ext-toggle-btn.is-on .pg-ext-toggle-label { color: #93af8a; }
      .pg-ext-delete-btn { background: none; border: 1px solid transparent; border-radius: var(--radius); color: var(--muted, #a2a29c);
        padding: 3px 5px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all .16s ease; }
      .pg-ext-delete-btn:hover { color: var(--error, #e08a7c); background: rgba(255, 122, 144, 0.14); border-color: rgba(255, 122, 144, 0.35); }
      .pg-ext-search-btn:hover { background: var(--panel-hover, #22262a); border-color: var(--accent, #e9e6de); }
      .pg-ext-search-btn:focus-visible { outline: 2px solid var(--accent, #e9e6de); outline-offset: 2px; }
      .pg-ext-search-box input:focus-visible { outline: 2px solid var(--accent, #e9e6de); outline-offset: 2px; }
      .extension-card header { display: flex; align-items: center; }
    `;
    document.head.appendChild(style);
  };

  const toast = (level, text) => {
    let host = document.querySelector(".toasts");
    if (!host) {
      host = document.createElement("div");
      host.className = "toasts";
      host.setAttribute("aria-live", "polite");
      document.body.appendChild(host);
    }
    const item = document.createElement("button");
    item.type = "button";
    item.className = `toast toast-${level}`;
    item.textContent = text;
    const remove = () => item.remove();
    item.addEventListener("click", remove);
    host.appendChild(item);
    window.setTimeout(remove, 5200);
  };

  const ask = (options) => {
    if (typeof window.pgCloseDialog === "function") return window.pgCloseDialog(options);
    return Promise.resolve(
      window.confirm(options.message) ? options.buttons[0].id : options.cancelId
    );
  };

  const findList = () => document.querySelector(".extensions-view .extension-list");

  const disableExtension = async (id, name) => {
    try {
      const result = await api.extensions.remove(id, { permanent: false });
      if (result && Array.isArray(result.disabled)) disabled = result.disabled;
      decorate();
      toast("info", `"${name}" devre dışı bırakıldı.`);
    } catch (error) {
      toast("error", `Devre dışı bırakılamadı: ${error?.message ?? error}`);
    }
  };

  const enableExtension = async (id, name) => {
    try {
      const result = await api.extensions.restore(id);
      if (result && Array.isArray(result.disabled)) disabled = result.disabled;
      decorate();
      toast("info", `"${name || id}" etkinleştirildi.`);
    } catch (error) {
      toast("error", `Etkinleştirilemedi: ${error?.message ?? error}`);
    }
  };

  const deleteExtension = async (id, name) => {
    const choice = await ask({
      tone: "warn",
      title: "Uzantıyı kaldır",
      message: `"${name}" uzantısı tamamen kaldırılsın mı?`,
      detail: "Uzantı kalıcı olarak silinir ve sistemden kaldırılır.",
      buttons: [
        { id: "remove", label: "Kaldır", variant: "danger" },
        { id: "cancel", label: "Vazgeç" }
      ],
      defaultId: "remove",
      cancelId: "cancel"
    });
    if (choice !== "remove") return;
    try {
      const result = await api.extensions.remove(id, { permanent: true });
      if (result && Array.isArray(result.disabled)) disabled = result.disabled;
      decorate();
      toast("info", `"${name}" uzantısı tamamen kaldırıldı.`);
    } catch (error) {
      toast("error", `Uzantı kaldırılamadı: ${error?.message ?? error}`);
    }
  };

  const renderRestore = (list) => {
    if (!list) return;
    const existing = list.querySelector("[data-pg-ext-restore]");
    if (!disabled.length) {
      if (existing) existing.remove();
      return;
    }
    const key = disabled.map((entry) => `${entry.id}:${entry.name}:${entry.source}`).join("|");
    if (existing && existing.getAttribute("data-pg-key") === key) return;

    const block = existing || document.createElement("section");
    block.className = "pg-ext-restore";
    block.setAttribute("data-pg-ext-restore", "");
    block.setAttribute("data-pg-key", key);
    block.textContent = "";

    const head = document.createElement("div");
    head.className = "pg-ext-restore-head";
    const title = document.createElement("span");
    title.className = "pg-ext-restore-title";
    title.textContent = "Devre Dışı Bırakılan Uzantılar";
    head.appendChild(title);
    block.appendChild(head);

    const note = document.createElement("p");
    note.className = "pg-ext-restore-note";
    note.textContent = "Bu uzantılar kapalı. ON/OFF butonu ile açabilir veya çarpı ile tamamen kaldırabilirsiniz.";
    block.appendChild(note);

    for (const entry of disabled) {
      const row = document.createElement("div");
      row.className = "pg-ext-restore-row";
      row.style.cssText =
        "display: flex; align-items: center; gap: 8px; padding: 6px 8px; border-radius: var(--radius); background: rgba(255,255,255,0.02); border: 1px solid var(--border, #2b2f33); margin-bottom: 5px;";

      const infoWrap = document.createElement("div");
      infoWrap.style.cssText = "display: flex; flex-direction: column; min-width: 0; flex: 1;";

      const name = document.createElement("span");
      name.className = "pg-ext-restore-name";
      name.style.cssText =
        "font-size: 11.5px; font-weight: 600; color: var(--muted, #a2a29c); text-decoration: line-through;";
      name.textContent = entry.name || entry.id;
      name.title = entry.id;

      const sub = document.createElement("span");
      sub.style.cssText = "font-size: 10px; color: var(--muted, #a2a29c);";
      sub.textContent = `${entry.source || "eklenti"} · (Devre dışı)`;

      infoWrap.append(name, sub);

      const actions = document.createElement("div");
      actions.className = "pg-ext-actions";

      // ON/OFF toggle switch (currently OFF)
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "pg-ext-toggle-btn"; // NOT is-on
      toggle.title = "Etkinleştir (Aç)";
      toggle.setAttribute("aria-label", `${entry.name || entry.id} uzantısını aç`);
      toggle.innerHTML =
        '<span class="pg-ext-toggle-track"><span class="pg-ext-toggle-thumb"></span></span>' +
        '<span class="pg-ext-toggle-label">OFF</span>';

      toggle.addEventListener("click", () => {
        void enableExtension(entry.id, entry.name || entry.id);
      });

      // Çarpı (X) button (Permanently delete)
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "pg-ext-delete-btn";
      deleteBtn.title = "Uzantıyı tamamen kaldır";
      deleteBtn.setAttribute("aria-label", `${entry.name || entry.id} uzantısını tamamen kaldır`);
      deleteBtn.innerHTML = X_ICON;

      deleteBtn.addEventListener("click", () => {
        void deleteExtension(entry.id, entry.name || entry.id);
      });

      actions.append(toggle, deleteBtn);
      row.append(infoWrap, actions);
      block.appendChild(row);
    }

    if (!existing) list.appendChild(block);
  };

  const decorate = () => {
    const list = findList();
    if (!list) return;
    ensureStyles();

    for (const card of list.querySelectorAll(".extension-card[data-extension-id]")) {
      const header = card.querySelector("header");
      if (!header) continue;
      const id = card.getAttribute("data-extension-id") || "";
      const name = card.getAttribute("data-extension-name") || id;
      if (!id) continue;

      let actions = header.querySelector(".pg-ext-actions");
      if (actions) actions.remove();

      actions = document.createElement("div");
      actions.className = "pg-ext-actions";

      // 1. ON / OFF Switch (Devre dışı bırak / Aç)
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "pg-ext-toggle-btn is-on";
      toggle.title = "Devre dışı bırak (Kapat)";
      toggle.setAttribute("aria-label", `${name} uzantısını kapat`);
      toggle.innerHTML =
        '<span class="pg-ext-toggle-track"><span class="pg-ext-toggle-thumb"></span></span>' +
        '<span class="pg-ext-toggle-label">ON</span>';

      toggle.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void disableExtension(id, name);
      });

      // 2. Çarpı (X) Button (Kalıcı olarak kaldır)
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "pg-ext-delete-btn";
      deleteBtn.title = "Uzantıyı tamamen kaldır";
      deleteBtn.setAttribute("aria-label", `${name} uzantısını tamamen kaldır`);
      deleteBtn.innerHTML = X_ICON;

      deleteBtn.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        void deleteExtension(id, name);
      });

      actions.append(toggle, deleteBtn);
      header.appendChild(actions);
    }

    renderRestore(list);
    renderSearchMore(list);
  };

  const renderSearchMore = (list) => {
    if (!list) return;
    if (list.querySelector("[data-pg-ext-search-more]")) return;

    const block = document.createElement("div");
    block.className = "pg-ext-search-more";
    block.setAttribute("data-pg-ext-search-more", "");
    block.style.cssText =
      "margin-top: 14px; padding: 10px 4px; display: flex; flex-direction: column; gap: 8px; border-top: 1px solid var(--border, #2b2f33);";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pg-ext-search-btn";
    btn.style.cssText =
      "display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; padding: 8px 12px; background: var(--accent-soft); border: 1px solid var(--border-strong); border-radius: var(--radius-lg); color: var(--text, #e9e6de); font-size: 11.5px; font-weight: 600; cursor: pointer; transition: all .16s ease;";
    btn.innerHTML =
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>';
    const btnLabel = document.createElement("span");
    btnLabel.textContent = text("extensionSearchMore");
    btn.appendChild(btnLabel);

    const box = document.createElement("div");
    box.className = "pg-ext-search-box";
    box.style.cssText = "display: none; flex-direction: column; gap: 6px; margin-top: 4px;";

    const inputRow = document.createElement("div");
    inputRow.style.cssText = "display: flex; gap: 6px;";

    const input = document.createElement("input");
    input.type = "search";
    input.placeholder = text("extensionSearchPlaceholder");
    input.setAttribute("aria-label", text("extensionSearchLabel"));
    input.style.cssText =
      "flex: 1; min-width: 0; background: var(--bg, #0e0f10); border: 1px solid var(--border, #2b2f33); border-radius: var(--radius); color: var(--text, #e9e6de); padding: 5px 8px; font-size: 11px;";

    const inputLabel = document.createElement("label");
    inputLabel.style.cssText =
      "display: flex; flex: 1; min-width: 0; flex-direction: column; gap: 4px; color: var(--muted, #a2a29c); font-size: var(--oc-text-1); line-height: 1.3;";
    inputLabel.append(document.createTextNode(text("extensionSearchLabel")), input);

    const goBtn = document.createElement("button");
    goBtn.type = "button";
    goBtn.textContent = text("search");
    goBtn.style.cssText =
      "padding: 5px 10px; background: var(--accent, #e9e6de); border: none; border-radius: var(--radius); color: #0e0f10; font-weight: 600; font-size: 11px; cursor: pointer;";

    const doSearch = () => {
      const q = input.value.trim();
      const target = q
        ? `https://open-vsx.org/?q=${encodeURIComponent(q)}`
        : "https://open-vsx.org/";
      window.open(target, "_blank");
    };

    goBtn.addEventListener("click", doSearch);
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSearch();
      }
    });

    const info = document.createElement("span");
    info.style.cssText = "font-size: 10px; color: var(--muted, #a2a29c); line-height: 1.3;";
    info.textContent =
      "Open VSX Marketplace kataloğunda arar. İndirilen eklentiler workspace/.polyglot/extensions klasörüne eklenebilir.";

    inputRow.append(inputLabel, goBtn);
    box.append(inputRow, info);

    btn.addEventListener("click", () => {
      const open = box.style.display === "flex";
      box.style.display = open ? "none" : "flex";
      if (!open) input.focus();
    });

    block.append(btn, box);
    list.appendChild(block);
  };

  const loadDisabled = async () => {
    const seq = ++loadSeq;
    try {
      const list = await api.extensions.disabled();
      if (seq !== loadSeq) return;
      disabled = Array.isArray(list) ? list : [];
    } catch {
      return;
    }
    decorate();
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      decorate();
    });
  };

  const boot = () => {
    if (!document.body) return;
    if (typeof MutationObserver === "function") {
      const observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true });
    }
    window.requestAnimationFrame(decorate);
    void loadDisabled();
  };

  api.extensions.onEvent((event) => {
    if (!event || event.type !== "ready") return;
    void loadDisabled();
    schedule();
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
