/* MultiCoder patch - model discovery dropdown.
 * Clicking a provider's Model field opens a live list of the models that the
 * provider itself reports (GET {baseUrl}/models). Lists refresh automatically
 * after the settings dialog saves, so a freshly pasted API key is picked up.
 */
(() => {
  "use strict";
  const bridge = window.polyglot;
  if (!bridge || !bridge.settings || typeof bridge.settings.listModels !== "function") {
    console.warn("[model-discovery] preload API is missing listModels(); patch not active");
    return;
  }

  const states = new WeakMap();
  const attached = new WeakSet();
  const text = (key, values) =>
    typeof window.ocText === "function" ? window.ocText(key, values) : key;

  const styles = `
.pd-model-field { position: relative; }
.pd-caret { position: absolute; right: 10px; bottom: 9px; font-size: 9px; color: var(--muted, #a2a29c); pointer-events: none; }
.pd-caret.pd-hidden { display: none; }
.pd-model-input { padding-right: 24px !important; }
.pd-model-panel { position: fixed; z-index: var(--oc-z-popover, 80); display: none; flex-direction: column; background: var(--panel, #16181a); border: 1px solid var(--border-strong, #3e4449); border-radius: var(--radius-lg, 4px); box-shadow: var(--shadow, 4px 4px 0 rgba(0, 0, 0, .5)); overflow: hidden; color: var(--text, #e9e6de); }
.pd-model-panel.pd-open { display: flex; }
.pd-model-panel-head { display: flex; align-items: center; gap: 8px; padding: 7px 9px; border-bottom: 1px solid var(--border, #2b2f33); font-size: 11.5px; color: var(--muted, #a2a29c); }
.pd-model-panel-title { color: var(--text, #e9e6de); font-weight: 600; }
.pd-model-panel-count { flex: 1; text-align: right; white-space: nowrap; }
.pd-model-panel-refresh { background: none; border: 1px solid var(--border-strong, #3e4449); color: var(--text, #e9e6de); border-radius: var(--radius, 2px); font-size: 11px; padding: 2px 7px; cursor: pointer; font-family: inherit; }
.pd-model-panel-refresh:hover { background: var(--panel-hover, #22262a); }
.pd-model-panel-list { overflow: auto; padding: 4px; display: flex; flex-direction: column; gap: 1px; }
.pd-model-search-wrap { padding: 6px 8px; border-bottom: 1px solid var(--border, #2b2f33); background: var(--panel-alt, #1b1e20); }
.pd-model-search-label { display: flex; flex-direction: column; gap: 4px; color: var(--muted, #a2a29c); font-size: 10.5px; line-height: 1.3; }
.pd-model-search { width: 100%; box-sizing: border-box; background: var(--bg, #0e0f10); border: 1px solid var(--border-strong, #3e4449); color: var(--text, #e9e6de); border-radius: var(--radius, 2px); padding: 6px 8px; font: inherit; font-size: 12px; outline: none; }
.pd-model-search:focus { border-color: var(--accent, #e9e6de); }
.pd-paid-toggle { display: flex; align-items: center; gap: 6px; padding: 5px 9px; cursor: pointer; user-select: none; font-size: 10.5px; color: var(--muted, #a2a29c); border-bottom: 1px solid var(--border, #2b2f33); background: var(--panel-alt, #1b1e20); }
.pd-paid-toggle:hover { color: var(--text, #e9e6de); }
.pd-paid-tick { width: 12px; height: 12px; margin: 0; accent-color: var(--accent, #e9e6de); cursor: pointer; }
.pd-model-paid { flex: 0 0 auto; color: var(--warn, #d2a75c); border: 1px solid rgba(255, 212, 121, .35); border-radius: 999px; font-size: 9px; line-height: 13px; padding: 0 5px; }
.pd-model-item { flex: 0 0 auto; display: flex; align-items: baseline; gap: 7px; width: 100%; text-align: left; background: none; border: 0; color: var(--text, #e9e6de); font: inherit; font-size: 13px; padding: 7px 9px; border-radius: var(--radius, 2px); cursor: pointer; white-space: nowrap; overflow: hidden; }
.pd-model-name { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; min-width: 0; }
.pd-model-label { color: var(--muted, #a2a29c); font-size: 11px; overflow: hidden; text-overflow: ellipsis; }
.pd-model-item:hover, .pd-model-item.pd-active { background: var(--panel-hover, #22262a); }
.pd-model-item.pd-current { color: var(--accent, #e9e6de); }
.pd-model-item:focus-visible { outline: 1px solid var(--accent, #e9e6de); outline-offset: -1px; }
.pd-model-empty { padding: 12px 10px; font-size: 11.5px; color: var(--muted, #a2a29c); line-height: 1.45; }
.pd-model-empty.pd-error { color: var(--warn, #d2a75c); }
.pd-model-note { padding: 6px 9px; font-size: 11px; color: var(--warn, #d2a75c); border-bottom: 1px solid var(--border, #2b2f33); }
.pd-model-retry { margin-top: 6px; background: none; border: 1px solid var(--border-strong, #3e4449); color: var(--text, #e9e6de); border-radius: var(--radius, 2px); font-size: 11px; padding: 3px 8px; cursor: pointer; font-family: inherit; }
.pd-model-retry:hover { background: var(--panel-hover, #22262a); }
.pd-toast { position: fixed; right: 18px; bottom: 18px; z-index: var(--oc-z-toast, 100); background: var(--panel-alt, #1b1e20); border: 1px solid var(--border-strong, #3e4449); color: var(--text, #e9e6de); border-radius: var(--radius-lg, 4px); padding: 9px 13px; font-size: 12px; box-shadow: var(--shadow, 4px 4px 0 rgba(0, 0, 0, .5)); opacity: 0; transform: translateY(6px); transition: opacity .16s ease, transform .16s ease; pointer-events: none; }
.pd-toast.pd-show { opacity: 1; transform: none; }
`;

  function ensureStyles() {
    if (document.getElementById("pd-model-style")) return;
    const tag = document.createElement("style");
    tag.id = "pd-model-style";
    tag.textContent = styles;
    document.head.appendChild(tag);
  }

  function setReactInputValue(input, value) {
    const descriptor = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value");
    if (!descriptor || !descriptor.set) input.value = value;
    else descriptor.set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function kindOf(card) {
    const select = card.querySelector('select[aria-label="Provider type"]');
    return select ? select.value : "";
  }

  function modelInputOf(card) {
    return card.querySelector("[data-polyglot-model]");
  }

  function baseInputOf(card) {
    return card.querySelector("[data-polyglot-base-url]");
  }

  function isEnabled(kind) {
    return kind !== "mock" && kind !== "cli";
  }

  /* free / paid model filter (shared with the provider panel)          */

  const SHOW_PAID_KEY = "pg.showPaidModels";
  const SHOW_PAID_EVENT = "pg-show-paid-change";

  function readShowPaid() {
    try {
      return window.localStorage.getItem(SHOW_PAID_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  function setShowPaid(value) {
    const next = Boolean(value);
    try {
      window.localStorage.setItem(SHOW_PAID_KEY, next ? "1" : "0");
    } catch (error) {
      /* storage can be unavailable */
    }
    document.querySelectorAll("input[data-pd-paid]").forEach((tick) => {
      tick.checked = next;
    });
    window.dispatchEvent(new CustomEvent(SHOW_PAID_EVENT, { detail: next }));
  }

  const LOCAL_HOST_RE =
    /localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|::1|192\.168\.|10\.\d|172\.(1[6-9]|2\d|3[01])\./i;

  function isFreeModel(kind, baseUrl, model) {
    if (!model) return false;
    if (model.free === true) return true;
    const pricing = model.pricing || model.price || null;
    if (pricing && typeof pricing === "object") {
      const prompt = Number(pricing.prompt ?? pricing.input ?? NaN);
      const completion = Number(pricing.completion ?? pricing.output ?? NaN);
      if (Number.isFinite(prompt) && Number.isFinite(completion) && prompt === 0 && completion === 0) {
        return true;
      }
    }
    if (kind === "mock" || kind === "cli") return true;
    const url = String(baseUrl || "").trim();
    if (url && LOCAL_HOST_RE.test(url)) return true;
    if (kind === "custom") {
      if (!url) return true;
    }
    const id = String(model.id || "").toLowerCase();
    if (!id) return false;
    if (id.endsWith(":free")) return true;
    if (/(^|[\/:_-])free([\/:_-]|$)/.test(id)) return true;
    return false;
  }

  function modelsForState(state) {
    const models = state.models || [];
    if (readShowPaid()) return models;
    const kind = kindOf(state.card);
    const baseUrl = baseInputOf(state.card)?.value || "";
    return models.filter((model) => isFreeModel(kind, baseUrl, model));
  }

  function pickDefault(models, kind) {
    const ids = models.map((model) => model.id);
    const preferences =
      kind === "openrouter"
        ? [/^anthropic\/claude/i, /^openai\/gpt-4o/i, /^openai\/gpt-4/i, /^google\/gemini/i]
        : [/^gpt-4o-mini$/i, /^gpt-4o$/i, /^gpt-4/i, /^o[0-9]/i];
    for (const pattern of preferences) {
      const hit = ids.find((id) => pattern.test(id));
      if (hit) return hit;
    }
    return ids[0];
  }

  function friendlyError(raw) {
    const message = String(raw || text("modelListError"));
    if (/fetch failed|failed to fetch|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|socket hang up|network/i.test(message)) {
      return text("modelNetworkError");
    }
    if (/401|403|rejected|api key|unauthor/i.test(message)) {
      return text("modelApiKeyError");
    }
    if (/timed out|timeout|ETIMEDOUT/i.test(message)) return text("modelTimeoutError");
    if (/429|rate limit|quota/i.test(message)) return text("modelRateLimitError");
    return message;
  }

  function emptyNode(text, extraClass) {
    const node = document.createElement("div");
    node.className = "pd-model-empty" + (extraClass ? ` ${extraClass}` : "");
    node.textContent = text;
    return node;
  }

  function visibleModels(state) {
    const panelQuery = (state.panelQuery || "").trim().toLowerCase();
    const query = panelQuery || (state.filtering ? state.input.value.trim().toLowerCase() : "");
    const source = modelsForState(state);
    if (!query) return source;
    return source.filter(
      (model) =>
        model.id.toLowerCase().includes(query) ||
        (model.label && model.label.toLowerCase().includes(query))
    );
  }

  function ensurePanel(state) {
    if (state.panel) return state.panel;
    const panel = document.createElement("div");
    panel.className = "pd-model-panel";
    panel.innerHTML = [
      '<div class="pd-model-panel-head">',
      '<span class="pd-model-panel-title">Modeller</span>',
      '<span class="pd-model-panel-count"></span>',
      '<button type="button" class="pd-model-panel-refresh">Yenile</button>',
      "</div>",
      '<div class="pd-model-search-wrap">',
      '<label class="pd-model-search-label"><span></span><input type="search" class="pd-model-search" /></label>',
      "</div>",
      '<label class="pd-paid-toggle">',
      '<input type="checkbox" class="pd-paid-tick" data-pd-paid="1" />',
      "<span></span>",
      "</label>",
      '<div class="pd-model-panel-list" role="listbox" aria-label="Sağlayıcı model listesi"></div>'
    ].join("");
    panel.querySelector(".pd-model-panel-title").textContent = text("models");
    panel.querySelector(".pd-model-panel-refresh").textContent = text("refresh");
    panel.querySelector(".pd-model-search-label span").textContent = text("searchModels");
    panel.querySelector(".pd-model-search").placeholder = text("modelSearchPlaceholder");
    panel.querySelector(".pd-model-search").setAttribute("aria-label", text("searchModels"));
    panel.querySelector(".pd-paid-toggle span").textContent = text("showPaidModels");
    panel.querySelector(".pd-model-panel-list").setAttribute("aria-label", text("modelListLabel"));
    panel.__pdState = state;
    panel.addEventListener("mousedown", (event) => {
      if (event.target.closest("button")) event.preventDefault();
    });
    const paid = panel.querySelector(".pd-paid-toggle");
    const paidTick = panel.querySelector(".pd-paid-tick");
    paidTick.checked = readShowPaid();
    paidTick.addEventListener("click", (event) => event.stopPropagation());
    paidTick.addEventListener("change", () => setShowPaid(paidTick.checked));
    paid.addEventListener("mousedown", (event) => event.stopPropagation());
    const search = panel.querySelector(".pd-model-search");
    search.addEventListener("click", (event) => event.stopPropagation());
    search.addEventListener("mousedown", (event) => event.stopPropagation());
    search.addEventListener("input", () => {
      state.panelQuery = search.value;
      renderList(state);
    });
    search.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && state.activeIndex < 0) {
        const first = panel.querySelector(".pd-model-item");
        if (first) {
          event.preventDefault();
          choose(state, first.dataset.id);
          return;
        }
      }
      onKeyDown(state, event);
    });
    panel.querySelector(".pd-model-panel-refresh").addEventListener("click", () => {
      load(state, { refresh: true });
    });
    document.body.appendChild(panel);
    state.panel = panel;
    return panel;
  }

  function closePanel(state) {
    if (!state.open) return;
    state.open = false;
    state.activeIndex = -1;
    state.panelQuery = "";
    if (state.panel) {
      state.panel.classList.remove("pd-open");
      const search = state.panel.querySelector(".pd-model-search");
      if (search) search.value = "";
    }
    state.input.setAttribute("aria-expanded", "false");
  }

  function positionPanel(state) {
    const panel = state.panel;
    if (!panel || !state.open) return;
    const rect = state.input.getBoundingClientRect();
    const width = Math.max(300, rect.width);
    panel.style.width = `${width}px`;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 240 && spaceAbove > spaceBelow;
    const list = panel.querySelector(".pd-model-panel-list");
    if (list) list.style.maxHeight = `${Math.max(120, Math.min(320, (openUp ? spaceAbove : spaceBelow) - 96))}px`;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    panel.style.left = `${left}px`;
    panel.style.top = "0px";
    const height = panel.offsetHeight;
    const top = openUp ? rect.top - height - 6 : rect.bottom + 4;
    panel.style.top = `${Math.max(8, Math.min(top, window.innerHeight - height - 8))}px`;
  }

  function renderList(state) {
    const panel = state.panel;
    if (!panel || !state.open) return;
    const list = panel.querySelector(".pd-model-panel-list");
    const count = panel.querySelector(".pd-model-panel-count");
    panel.querySelectorAll(".pd-model-note").forEach((node) => node.remove());
    list.replaceChildren();
    state.activeIndex = -1;

    if (state.loading) {
      count.textContent = "";
      list.appendChild(emptyNode(text("modelsLoading")));
      return;
    }
    if (state.error) {
      count.textContent = "";
      const node = emptyNode(state.error, "pd-error");
      const retry = document.createElement("button");
      retry.type = "button";
      retry.className = "pd-model-retry";
      retry.textContent = text("retry");
      retry.addEventListener("click", () => load(state, { refresh: true }));
      node.appendChild(document.createElement("br"));
      node.appendChild(retry);
      list.appendChild(node);
      return;
    }

    const models = visibleModels(state);
    const filteringNow = Boolean((state.panelQuery || "").trim()) || state.filtering;
    const freeSource = modelsForState(state);
    const showPaid = readShowPaid();
    if (!state.models.length) {
      count.textContent = "";
    } else if (filteringNow) {
      count.textContent = showPaid
        ? text("modelFilteredCount", { count: models.length, total: state.models.length })
        : text("modelResultCount", { count: models.length, free: freeSource.length });
    } else {
      count.textContent = showPaid
        ? text("modelTotalCount", { count: state.models.length })
        : text("modelFreeCount", { free: freeSource.length, total: state.models.length });
    }
    const current = state.input.value.trim();
    const notes = [];
    if (state.warning) notes.push(state.warning);
    const visibleIds = new Set((showPaid ? state.models : freeSource).map((model) => model.id));
    if (!filteringNow && current && state.models.length && !visibleIds.has(current)) {
      notes.push(
        text("savedModelMissing", {
          model: current,
          list: showPaid ? "model" : text("free")
        })
      );
    }
    for (const text of notes) {
      const note = document.createElement("div");
      note.className = "pd-model-note";
      note.textContent = text;
      panel.insertBefore(note, list);
    }
    if (!models.length) {
      if (!showPaid && !filteringNow && freeSource.length === 0 && state.models.length > 0) {
        list.appendChild(
          emptyNode(text("providerFreeModelsEmpty"))
        );
      } else {
        list.appendChild(
          emptyNode(state.models.length ? text("modelNoMatch") : text("modelProviderEmpty"))
        );
      }
      return;
    }
    const kind = kindOf(state.card);
    const baseUrl = baseInputOf(state.card)?.value || "";
    for (const model of models) {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "pd-model-item";
      item.dataset.id = model.id;
      item.title = model.id;
      item.setAttribute("role", "option");
      if (model.id === current) {
        item.classList.add("pd-current");
        item.setAttribute("aria-selected", "true");
      }
      const name = document.createElement("span");
      name.className = "pd-model-name";
      name.textContent = model.id;
      item.appendChild(name);
      if (!isFreeModel(kind, baseUrl, model)) {
        const paid = document.createElement("span");
        paid.className = "pd-model-paid";
        paid.textContent = text("paid");
        item.appendChild(paid);
      }
      if (model.label && model.label !== model.id) {
        const label = document.createElement("span");
        label.className = "pd-model-label";
        label.textContent = model.label;
        item.appendChild(label);
      }
      item.addEventListener("click", () => choose(state, model.id));
      list.appendChild(item);
    }
  }

  function openPanel(state) {
    if (!state.enabled) return;
    ensurePanel(state);
    if (!state.open) {
      state.open = true;
      state.filtering = false;
      state.activeIndex = -1;
      state.panelQuery = "";
      const search = state.panel.querySelector(".pd-model-search");
      if (search) search.value = "";
      state.panel.classList.add("pd-open");
      state.input.setAttribute("aria-expanded", "true");
      if (search) {
        setTimeout(() => {
          if (state.open) search.focus({ preventScroll: true });
        }, 0);
      }
    }
    const base = baseInputOf(state.card);
    const baseNow = base ? base.value.trim() : "";
    renderList(state);
    positionPanel(state);
    if (!state.loading && (!state.loaded || state.loadedBase !== baseNow)) load(state);
  }

  function choose(state, id) {
    state.suppressFilter = true;
    setReactInputValue(state.input, id);
    state.suppressFilter = false;
    state.filtering = false;
    state.suppressOpen = true;
    closePanel(state);
    state.input.focus({ preventScroll: true });
    setTimeout(() => {
      state.suppressOpen = false;
    }, 0);
  }

  function chooseSilently(state, id) {
    state.suppressFilter = true;
    setReactInputValue(state.input, id);
    state.suppressFilter = false;
  }

  function load(state, options = {}) {
    if (!state.enabled) return Promise.resolve();
    if (state.loading) {
      if (options.refresh) state.queued = true;
      return state.current;
    }
    const providerId = state.card.getAttribute("data-provider-id");
    const kind = kindOf(state.card);
    const baseInput = baseInputOf(state.card);
    const baseUrl = baseInput ? baseInput.value.trim() : "";
    state.loading = true;
    state.error = null;
    if (state.open) {
      renderList(state);
      positionPanel(state);
    }
    const task = (async () => {
      try {
        const result = await bridge.settings.listModels({
          providerId,
          kind,
          baseUrl,
          refresh: Boolean(options.refresh)
        });
        if (result && result.ok === false) {
          state.error = friendlyError(result.error);
          state.models = [];
          state.warning = null;
        } else {
          state.models = Array.isArray(result && result.models) ? result.models : [];
          state.error = null;
          state.warning = result && result.warning ? result.warning : null;
          if (!state.input.value.trim() && state.models.length && !state.open) {
            const pool = modelsForState(state);
            const chosen = pool.length ? pickDefault(pool, kind) : "";
            if (chosen) chooseSilently(state, chosen);
          }
        }
        state.loaded = true;
        state.loadedBase = baseUrl;
      } catch (error) {
        state.error = friendlyError((error && error.message) || error);
        state.models = [];
      } finally {
        state.loading = false;
        state.current = null;
        if (state.open) {
          renderList(state);
          positionPanel(state);
        }
        if (state.queued) {
          state.queued = false;
          load(state, { refresh: true });
        }
      }
    })();
    state.current = task;
    return task;
  }

  function onKeyDown(state, event) {
    if (event.key === "Escape" && state.open) {
      event.preventDefault();
      closePanel(state);
      return;
    }
    if (!state.open) {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openPanel(state);
      }
      return;
    }
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp" && event.key !== "Enter") return;
    const items = state.panel ? Array.from(state.panel.querySelectorAll(".pd-model-item")) : [];
    if (!items.length) return;
    if (event.key === "Enter") {
      if (state.activeIndex >= 0 && items[state.activeIndex]) {
        event.preventDefault();
        choose(state, items[state.activeIndex].dataset.id || "");
      }
      return;
    }
    event.preventDefault();
    const next =
      event.key === "ArrowDown"
        ? Math.min(items.length - 1, state.activeIndex + 1)
        : Math.max(0, state.activeIndex - 1);
    state.activeIndex = next;
    items.forEach((item, index) => item.classList.toggle("pd-active", index === next));
    items[next].scrollIntoView({ block: "nearest" });
  }

  function syncEnabled(card) {
    const state = states.get(card);
    if (!state) return;
    const enabled = isEnabled(kindOf(card));
    if (state.enabled === enabled) return;
    state.enabled = enabled;
    state.caret.classList.toggle("pd-hidden", !enabled);
    if (!enabled) closePanel(state);
  }

  function attach(card) {
    if (!card || !card.getAttribute("data-provider-id")) return;
    const input = modelInputOf(card);
    if (!input) return;
    if (attached.has(card)) {
      syncEnabled(card);
      return;
    }
    attached.add(card);
    const field = input.closest(".field") || input.parentElement;
    if (!field) return;
    field.classList.add("pd-model-field");
    input.classList.add("pd-model-input");
    input.setAttribute("autocomplete", "off");
    input.setAttribute("role", "combobox");
    input.setAttribute("aria-autocomplete", "list");
    input.setAttribute("aria-expanded", "false");
    const caret = document.createElement("span");
    caret.className = "pd-caret pd-hidden";
    caret.textContent = "▾";
    caret.setAttribute("aria-hidden", "true");
    field.appendChild(caret);
    const state = {
      card,
      input,
      field,
      caret,
      models: [],
      error: null,
      warning: null,
      loading: false,
      loaded: false,
      loadedBase: "",
      open: false,
      panel: null,
      filtering: false,
      activeIndex: -1,
      enabled: true,
      suppressFilter: false,
      suppressOpen: false,
      queued: false,
      current: null
    };
    states.set(card, state);
    input.addEventListener("focus", () => {
      if (!state.suppressOpen) openPanel(state);
    });
    input.addEventListener("click", () => openPanel(state));
    input.addEventListener("input", () => {
      if (state.suppressFilter || !state.open) return;
      state.filtering = true;
      renderList(state);
      positionPanel(state);
    });
    input.addEventListener("keydown", (event) => onKeyDown(state, event));
    const kindSelect = card.querySelector('select[aria-label="Provider type"]');
    if (kindSelect) {
      kindSelect.addEventListener("change", () => {
        state.loaded = false;
        state.models = [];
        state.error = null;
        syncEnabled(card);
        if (state.open) {
          renderList(state);
          positionPanel(state);
        }
        if (state.enabled) load(state, { refresh: true });
      });
    }
    const enabled = isEnabled(kindOf(card));
    state.enabled = enabled;
    caret.classList.toggle("pd-hidden", !enabled);
    if (enabled) load(state);
  }

  function refreshPositions() {
    document.querySelectorAll(".pd-model-panel.pd-open").forEach((panel) => {
      const state = panel.__pdState;
      if (!state) return;
      const rect = state.input.getBoundingClientRect();
      const modal = document.querySelector(".settings-modal");
      const modalRect = modal ? modal.getBoundingClientRect() : null;
      const visible =
        rect.width > 0 &&
        rect.bottom > 0 &&
        rect.top < window.innerHeight &&
        (!modalRect || (rect.top < modalRect.bottom && rect.bottom > modalRect.top));
      if (!visible) closePanel(state);
      else positionPanel(state);
    });
  }

  function showToast(text) {
    let toast = document.getElementById("pd-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "pd-toast";
      toast.className = "pd-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    requestAnimationFrame(() => toast.classList.add("pd-show"));
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("pd-show"), 2400);
  }

  document.addEventListener(
    "mousedown",
    (event) => {
      document.querySelectorAll(".pd-model-panel.pd-open").forEach((panel) => {
        const state = panel.__pdState;
        if (!state) return;
        const target = event.target;
        if (panel.contains(target)) return;
        if (state.input === target || (state.field && state.field.contains(target))) return;
        closePanel(state);
      });
    },
    true
  );
  document.addEventListener("scroll", refreshPositions, true);
  window.addEventListener("resize", refreshPositions);
  window.addEventListener("polyglot:settings-saved", () => {
    showToast("Ayarlar kaydedildi");
    document.querySelectorAll(".settings-modal [data-provider-id]").forEach((card) => {
      const state = states.get(card);
      if (state && state.enabled) load(state, { refresh: true });
    });
  });

  window.addEventListener(SHOW_PAID_EVENT, () => {
    const next = readShowPaid();
    document.querySelectorAll("input[data-pd-paid]").forEach((tick) => {
      tick.checked = next;
    });
    document.querySelectorAll(".pd-model-panel.pd-open").forEach((panel) => {
      if (panel.__pdState) renderList(panel.__pdState);
    });
  });

  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    setTimeout(() => {
      scheduled = false;
      const modal = document.querySelector(".settings-modal");
      if (!modal) {
        document.querySelectorAll(".pd-model-panel").forEach((panel) => {
          const state = panel.__pdState;
          if (state) {
            state.open = false;
            state.panel = null;
          }
          panel.remove();
        });
        return;
      }
      ensureStyles();
      modal.querySelectorAll("[data-provider-id]").forEach(attach);
    }, 120);
  }

  const observer = new MutationObserver(scheduleScan);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scheduleScan, { once: true });
  } else {
    scheduleScan();
  }
})();
