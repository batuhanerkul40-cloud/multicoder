/* MultiCoder - workbench patch (providers + bottom chat).
 * Uses only the public preload API (window.polyglot) and the DOM, so it keeps
 * working when the bundled React renderer is rebuilt.
 */
(() => {
  "use strict";

  const api = window.polyglot;
  if (!api || !api.settings || !api.agents || !api.workspace) {
    console.warn("[workbench] preload API missing; patch inactive");
    return;
  }

  const KIND_LABEL = {
    openrouter: "OpenRouter",
    openai: "OpenAI",
    custom: "Custom",
    mock: "Mock",
    cli: "CLI"
  };

  const state = {
    settings: null,
    root: null,
    workspaceName: "",
    expanded: new Map(), // providerId -> {models, error, warning, loading, query, open}
    sessions: new Map(),
    sessionId: null,
    running: false,
    status: "idle",
    chatMounted: false,
    providersMounted: false,
    chatHidden: false,
    chatProviderId: null,
    chatModels: [],
    chatModelError: null,
    chatModelsLoading: false,
    showPaid: false,
    settingsPanel: null,
    themeListener: null,
    typeListener: null,
    debateEnabled: false,
    debate: null,
    debateOpen: false,
    debateStage: "",
    debateAbort: false,
    debateSelection: {},
    aiTalkActiveProviderId: null,
    activeRuns: new Set(),
    agentWaiters: new Map(),
    chatEls: null,
    modelPicker: null,
    modelPickerOpen: false,
    modelPickerActive: 0,
    providerEls: null,
    bootTimer: 0,
    saveTimer: 0
  };

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };
  const text = (key, values) =>
    typeof window.ocText === "function" ? window.ocText(key, values) : key;

  const clear = (node) => {
    while (node.firstChild) node.removeChild(node.firstChild);
  };

  const prettyKind = (kind) => KIND_LABEL[kind] || kind || "Provider";

  const shortModel = (id) => {
    if (!id) return "model seçilmedi";
    const parts = String(id).split("/");
    return parts.length > 1 ? parts.slice(1).join("/") : String(id);
  };

  const providerById = (id) =>
    (state.settings?.providers || []).find((provider) => provider.id === id) || null;

  /* free / paid model filter                                           */

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
    state.showPaid = Boolean(value);
    try {
      window.localStorage.setItem(SHOW_PAID_KEY, state.showPaid ? "1" : "0");
    } catch (error) {
      /* storage can be unavailable */
    }
    syncPaidToggles();
    window.dispatchEvent(new CustomEvent(SHOW_PAID_EVENT, { detail: state.showPaid }));
  }

  const LOCAL_HOST_RE =
    /localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\]|::1|192\.168\.|10\.\d|172\.(1[6-9]|2\d|3[01])\./i;

  function isLocalProvider(provider) {
    const url = String(provider?.baseUrl || "").trim();
    if (!url) return true;
    return LOCAL_HOST_RE.test(url);
  }

  function isFreeModel(provider, model) {
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
    const kind = provider?.kind;
    if (kind === "mock" || kind === "cli") return true;
    const providerUrl = String(provider?.baseUrl || "").trim();
    if (providerUrl && LOCAL_HOST_RE.test(providerUrl)) return true;
    if (kind === "custom" && isLocalProvider(provider)) return true;
    const id = String(model.id || "").toLowerCase();
    if (!id) return false;
    /* OpenRouter marks its free tier with a `:free` suffix. */
    if (id.endsWith(":free")) return true;
    if (/(^|[\/:_-])free([\/:_-]|$)/.test(id)) return true;
    return false;
  }

  function filteredModelsFor(provider, models) {
    const list = models || [];
    if (state.showPaid) return list;
    return list.filter((model) => isFreeModel(provider, model));
  }

  function paidToggle(labelText) {
    const wrap = el("label", "pg-paid-toggle");
    const tick = el("input", "pg-paid-tick");
    tick.type = "checkbox";
    tick.setAttribute("data-pg-paid", "1");
    tick.checked = state.showPaid;
    tick.addEventListener("click", (event) => event.stopPropagation());
    tick.addEventListener("change", () => setShowPaid(tick.checked));
    wrap.appendChild(tick);
    wrap.appendChild(el("span", "", labelText || "Ücretli modelleri de göster"));
    return wrap;
  }

  function syncPaidToggles() {
    for (const tick of document.querySelectorAll("input[data-pg-paid]")) {
      tick.checked = state.showPaid;
    }
    if (state.providerEl?.isConnected) {
      for (const box of state.providerEl.querySelectorAll(".pg-model-box[data-provider-id]")) {
        const provider = providerById(box.dataset.providerId);
        if (provider) renderModelList(provider, box);
      }
    }
    if (state.modelPickerOpen) renderModelPickerList();
    updateChatModelButton();
  }

  state.showPaid = readShowPaid();

  window.addEventListener(SHOW_PAID_EVENT, () => {
    const next = readShowPaid();
    if (next === state.showPaid) return;
    state.showPaid = next;
    syncPaidToggles();
  });

  function newSessionId() {
    const raw =
      window.crypto && typeof window.crypto.randomUUID === "function"
        ? window.crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
    return `workbench-${raw}`;
  }

  function showToast(text, tone) {
    let toast = document.getElementById("pg-toast");
    if (!toast) {
      toast = el("div", "pg-toast");
      toast.id = "pg-toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = String(text);
    toast.dataset.tone = tone || "info";
    toast.classList.add("pg-show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.remove("pg-show"), 2800);
  }

  function friendlyError(raw, kind) {
    const message = String((raw && raw.message) || raw || "Bilinmeyen hata");
    if (/fetch failed|failed to fetch|network|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|socket hang up/i.test(message)) {
      return kind === "custom" || kind === "openai"
        ? "Sunucuya ulaşılamadı. Yerel bir sunucu (Ollama, LM Studio, vLLM) kullanıyorsanız çalıştığından ve adresin doğru olduğundan emin olun."
        : "Sunucuya ulaşılamadı. İnternet bağlantınızı ve sağlayıcı adresini kontrol edin.";
    }
    if (/timed out|timeout|ETIMEDOUT/i.test(message)) {
      return "İstek zaman aşımına uğradı. Sağlayıcı yavaş yanıt verdi; tekrar deneyin.";
    }
    if (/401|403|unauthor|api key|invalid key|rejected/i.test(message)) {
      return "Sağlayıcı geçerli bir API anahtarı istiyor. “Add providers” ile anahtarı kaydedin.";
    }
    if (/429|rate limit|quota/i.test(message)) {
      return "Sağlayıcı istek sınırına takıldı. Bir süre sonra tekrar deneyin.";
    }
    return message;
  }

  const styles = `
  .agent-panel.pg-providers-host { position:relative; }
  .agent-panel.pg-providers-host > *:not(.pg-providers) { display:none !important; }
  .pg-providers { position:absolute; inset:0; z-index:6; display:flex; flex-direction:column;
    background:var(--panel,#16181a); color:var(--text,#e9e6de); min-height:0; }
  .pg-providers-head { position:relative; display:flex; align-items:center; justify-content:center; gap:8px;
    padding:9px 40px; border-bottom:1px solid var(--border,#2b2f33); flex:0 0 auto; }
  .pg-providers-main { display:flex; align-items:center; justify-content:center; gap:7px; min-width:0; }
  .pg-providers-title { font-size: var(--oc-text-3); font-weight:650; letter-spacing:.02em; }
  .pg-providers-sub { color:var(--muted,#a2a29c); background:var(--panel-alt,#1b1e20);
    border:1px solid var(--border,#2b2f33); border-radius:999px; font-size: var(--oc-text-1); line-height:1;
    padding:2px 6px; }
  .pg-providers-refresh { position:absolute; right:10px; top:50%; transform:translateY(-50%); }
  .pg-providers-spacer { flex:1; }
  .pg-icon-btn { background:none; border:1px solid var(--border-strong,#3e4449); color:var(--text,#e9e6de);
    border-radius:var(--radius-lg); width:24px; height:24px; display:inline-flex; align-items:center; justify-content:center;
    cursor:pointer; font:inherit; font-size: var(--oc-text-3); line-height:1; }
  .pg-icon-btn:hover { background:var(--panel-hover,#22262a); }
  .pg-provider-list { flex:1; min-height:0; overflow:auto; padding:8px; display:flex; flex-direction:column; gap:6px; }
  .pg-provider { border:1px solid var(--border,#2b2f33); border-radius:var(--radius-lg); background:var(--panel-alt,#1b1e20);
    overflow:hidden; }
  .pg-provider.is-open { border-color:var(--border-strong,#3e4449); }
  .pg-provider-row { width:100%; display:flex; align-items:center; gap:8px; padding:9px 10px; background:none;
    border:0; color:inherit; font:inherit; text-align:left; cursor:pointer; }
  .pg-provider-row:hover { background:var(--panel-hover,#22262a); }
  .pg-provider-dot { width:7px; height:7px; border-radius:50%; flex:0 0 auto; background:var(--muted,#a2a29c); }
  .pg-provider-dot.ok { background:var(--ok,#93af8a); }
  .pg-provider-dot.warn { background:var(--warn,#d2a75c); }
  .pg-provider-body { min-width:0; flex:1; display:flex; flex-direction:column; gap:2px; }
  .pg-provider-name { font-size: var(--oc-text-3); font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pg-provider-meta { color:var(--muted,#a2a29c); font-size: var(--oc-text-1); white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; }
  .pg-provider-chevron { color:var(--muted,#a2a29c); font-size: var(--oc-text-1); flex:0 0 auto; transition:transform .14s ease; }
  .pg-provider.is-open .pg-provider-chevron { transform:rotate(90deg); }
  .pg-model-box { border-top:1px solid var(--border,#2b2f33); padding:7px; background:var(--panel-alt,#1b1e20);
    display:flex; flex-direction:column; gap:6px; }
  .pg-model-search { width:100%; box-sizing:border-box; background:var(--bg,#0e0f10); border:1px solid var(--border-strong,#3e4449);
    color:var(--text,#e9e6de); border-radius:var(--radius-lg); padding:6px 8px; font:inherit; font-size: var(--oc-text-2); outline:none; }
  .pg-model-search:focus { border-color:var(--accent,#e9e6de); }
  .pg-search-label { display:flex; flex-direction:column; gap:4px; min-width:0; color:var(--muted,#a2a29c);
    font-size:var(--oc-text-1); line-height:1.3; }
  .pg-model-box > .pg-search-label { width:100%; }
  .pg-model-list { max-height:250px; overflow:auto; display:flex; flex-direction:column; gap:1px; }
  .pg-model { display:flex; flex:0 0 auto; flex-direction:column; gap:2px; width:100%; text-align:left; background:none; border:0;
    color:var(--text,#e9e6de); border-radius:var(--radius-lg); padding:6px 8px; font:inherit; cursor:pointer; }
  .pg-model:hover { background:var(--panel-hover,#22262a); }
  .pg-model.is-current { background:var(--accent-soft); box-shadow:inset 0 0 0 1px var(--border-strong); }
  .pg-model-id { font-size: var(--oc-text-2); line-height:1.35; word-break:break-word; }
  .pg-model-label { color:var(--muted,#a2a29c); font-size: var(--oc-text-1); line-height:1.3; }
  .pg-model-tag { align-self:flex-start; color:var(--warn,#d2a75c); border:1px solid color-mix(in srgb, var(--warn) 35%, transparent);
    border-radius:999px; font-size: var(--oc-text-1); line-height:13px; padding:0 5px; }
  .pg-model-state { padding:9px 8px; font-size: var(--oc-text-2); line-height:1.5; color:var(--muted,#a2a29c); }
  .pg-model-state.error { color:var(--warn,#d2a75c); }
  .pg-model-state .pg-retry { margin-top:6px; display:inline-block; }
  .pg-provider-hint { padding:10px; color:var(--muted,#a2a29c); font-size: var(--oc-text-2); line-height:1.5; }

  .pg-model-tools { display:flex; align-items:center; justify-content:space-between; gap:6px; }
  .pg-paid-toggle { display:inline-flex; align-items:center; gap:5px; color:var(--muted,#a2a29c);
    font-size: var(--oc-text-1); line-height:1.3; cursor:pointer; user-select:none; min-width:0; }
  .pg-paid-toggle:hover { color:var(--text,#e9e6de); }
  .pg-paid-tick { accent-color:var(--accent,#e9e6de); width:12px; height:12px; margin:0; cursor:pointer;
    flex:0 0 auto; }
  .pg-model-count { color:var(--muted,#a2a29c); font-size: var(--oc-text-1); white-space:nowrap; flex:0 0 auto; }
  .pg-model-free-note { padding:8px; font-size: var(--oc-text-1); line-height:1.5; color:var(--muted,#a2a29c); }
  .pg-model-free-note strong { color:var(--warn,#d2a75c); font-weight:600; }

  .pg-settings-gear { margin-top:auto; }
  .pg-settings-backdrop { position:fixed; inset:0; z-index:var(--oc-z-dialog); background:var(--backdrop,rgba(6,8,16,.55));
    display:flex; align-items:center; justify-content:center; padding:24px; }
  .pg-settings-panel { width:520px; max-width:100%; max-height:76vh; display:flex; flex-direction:column;
    background:var(--panel,#16181a); border:1px solid var(--border-strong,#3e4449); border-radius:var(--radius-lg);
    box-shadow:var(--shadow); overflow:hidden; }
  .pg-settings-head { display:flex; align-items:center; gap:8px; padding:10px 12px; flex:0 0 auto;
    border-bottom:1px solid var(--border,#2b2f33); background:var(--panel-alt,#1b1e20); }
  .pg-settings-head svg { flex:0 0 auto; color:var(--accent,#e9e6de); }
  .pg-settings-icon { display:inline-flex; align-items:center; justify-content:center; }
  .pg-settings-title { font-size:var(--oc-text-3); font-weight:650; }
  .pg-settings-close { margin-left:auto; background:none; border:0; color:var(--muted,#a2a29c);
    width:26px; height:26px; border-radius:var(--radius-lg); display:inline-flex; align-items:center; justify-content:center;
    font:inherit; font-size: var(--oc-text-4); line-height:1; cursor:pointer; }
  .pg-settings-close:hover { background:var(--panel-hover,#22262a); color:var(--text,#e9e6de); }
  .pg-settings-body { flex:1; min-height:180px; display:flex; align-items:center; justify-content:center;
    padding:28px 20px; color:var(--muted,#a2a29c); font-size: var(--oc-text-3); }

  .pg-add-providers { display:inline-flex; align-items:center; gap:4px; padding:3px 9px;
    border-radius:var(--radius,2px); border:1px solid var(--border-strong);
    background:var(--panel-alt); color:var(--text); font:inherit; font-size: var(--oc-text-1);
    font-weight:600; line-height:18px; white-space:nowrap; cursor:pointer; }
  .pg-add-providers:hover { background:var(--panel-hover); border-color:var(--accent,#e9e6de); }
  .pg-add-providers::before { content:"+"; color:var(--cyan,#8fb0b8); font-size: var(--oc-text-3); line-height:1; font-weight:500; }

  .center-column.pg-chat-on .editor-area { flex:1 1 50%; min-height:0; }
  .pg-chat-dock { display:flex; flex-direction:column; flex:1 1 50%; min-width:0; min-height:230px;
    border-top:1px solid var(--border-strong,#3e4449); background:var(--panel,#16181a); }
  .pg-chat-head { display:flex; align-items:center; gap:8px; height:34px; padding:0 10px; flex:0 0 auto;
    border-bottom:1px solid var(--border,#2b2f33); background:var(--panel-alt,#1b1e20); }
  .pg-chat-title { font-size:var(--oc-text-2); font-weight:600;
    color:var(--muted,#a2a29c); }
  .pg-chat-where { font-size: var(--oc-text-1); color:var(--muted,#a2a29c); white-space:nowrap; overflow:hidden;
    text-overflow:ellipsis; max-width:220px; }
  .pg-chat-spacer { flex:1; }
  .pg-chat-select { background:var(--bg,#0e0f10); border:1px solid var(--border,#2b2f33); color:var(--text,#e9e6de);
    border-radius:var(--radius-lg); font:inherit; font-size: var(--oc-text-1); padding:2px 5px; max-width:190px; outline:none; }
  .pg-chat-model-btn { position:relative; display:inline-flex; align-items:center; max-width:230px; min-width:140px;
    text-align:left; cursor:pointer; padding:4px 20px 4px 7px; }
  .pg-chat-model-btn:hover { border-color:var(--border-strong,#3e4449); background:var(--panel-hover,#22262a); }
  .pg-chat-model-btn .pg-model-btn-text { min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pg-chat-model-btn::after { content:"▾"; position:absolute; right:6px; top:50%; transform:translateY(-52%);
    font-size: var(--oc-text-1); color:var(--muted,#a2a29c); pointer-events:none; }
  .pg-chat-model-btn.is-open { border-color:var(--accent,#e9e6de); }
  .pg-model-pop { position:fixed; z-index:var(--oc-z-popover); width:460px; max-width:calc(100vw - 20px); display:flex;
    flex-direction:column; background:var(--panel-alt,#1b1e20); border:1px solid var(--border-strong,#3e4449);
    border-radius:var(--radius-lg); box-shadow:var(--shadow); overflow:hidden; }
  .pg-model-pop-head { padding:8px; border-bottom:1px solid var(--border,#2b2f33); display:flex;
    flex-direction:column; gap:6px; background:var(--panel,#16181a); }
  .pg-model-pop-search { width:100%; box-sizing:border-box; background:var(--bg,#0e0f10);
    border:1px solid var(--border-strong,#3e4449); color:var(--text,#e9e6de); border-radius:var(--radius-lg);
    padding:7px 9px; font:inherit; font-size: var(--oc-text-2); outline:none; }
  .pg-model-pop-search:focus { border-color:var(--accent,#e9e6de); }
  .pg-model-pop-meta { display:flex; align-items:center; justify-content:space-between; gap:8px;
    color:var(--muted,#a2a29c); font-size: var(--oc-text-1); line-height:1.3; }
  .pg-model-pop-meta strong { color:var(--text,#e9e6de); font-weight:600; }
  .pg-model-pop-list { overflow:auto; max-height:300px; min-height:48px; padding:4px;
    display:flex; flex-direction:column; gap:1px; }
  .pg-model-pop-item { display:flex; flex:0 0 auto; flex-direction:column; gap:2px; width:100%; text-align:left;
    background:none; border:0; color:var(--text,#e9e6de); border-radius:var(--radius-lg); padding:6px 9px;
    font:inherit; cursor:pointer; }
  .pg-model-pop-item:hover, .pg-model-pop-item.is-active { background:var(--panel-hover,#22262a); }
  .pg-model-pop-item.is-current { background:var(--accent-soft);
    box-shadow:inset 0 0 0 1px var(--border-strong); }
  .pg-model-pop-item .pg-model-id { font-size: var(--oc-text-3); line-height:1.35; word-break:break-word; }
  .pg-model-pop-item .pg-model-label { color:var(--muted,#a2a29c); font-size: var(--oc-text-1); line-height:1.3; }
  .pg-model-pop-empty { padding:12px 10px; font-size: var(--oc-text-2); line-height:1.5; color:var(--muted,#a2a29c); }
  .pg-model-pop-empty.error { color:var(--warn,#d2a75c); }

  .pg-chat-status { font-size: var(--oc-text-1); color:var(--muted,#a2a29c); display:inline-flex; align-items:center; gap:5px;
    white-space:nowrap; }
  .pg-chat-status .pg-pulse { width:6px; height:6px; border-radius:50%; background:var(--muted,#a2a29c); }
  .pg-chat-status.running .pg-pulse { background:var(--accent,#e9e6de); }
  .pg-chat-status.error { color:var(--error,#e08a7c); }
  .pg-chat-status.error .pg-pulse { background:var(--error,#e08a7c); }
  .pg-chat-status.done .pg-pulse { background:var(--ok,#93af8a); }
  .pg-chat-log { flex:1; min-height:0; overflow:auto; padding:10px 12px; display:flex; flex-direction:column; gap:7px; }
  .pg-chat-empty { margin:auto; text-align:center; color:var(--muted,#a2a29c); font-size: var(--oc-text-2); line-height:1.6;
    max-width:520px; padding:14px; }
  .pg-chat-empty strong { color:var(--text,#e9e6de); font-weight:600; }
  .pg-msg { display:flex; gap:10px; align-items:flex-start; width:100%; max-width:98%; border-radius:var(--radius-lg);
    padding:6px 10px; font-size: var(--oc-text-3); line-height:1.5; margin:3px 0; }
  .pg-msg.user { align-self:flex-end; background:var(--accent-soft); border:1px solid var(--border); }
  .pg-msg.assistant { align-self:flex-start; background:var(--panel,#16181a); border:1px solid var(--border,#2b2f33); }
  .pg-msg.system { align-self:center; background:none; border:1px dashed var(--border,#2b2f33); color:var(--muted,#a2a29c); font-size: var(--oc-text-2); }
  .pg-msg.tool { align-self:flex-start; background:var(--bg-elevated,#141618); border-left:2px solid var(--border-strong,#3e4449); color:var(--muted,#a2a29c); font-size: var(--oc-text-1); font-family:ui-monospace,Consolas,monospace; }
  .pg-msg.error { align-self:flex-start; background:var(--error-soft); border:1px solid color-mix(in srgb, var(--error) 35%, transparent); color:var(--error,#e08a7c); }
  .pg-msg-left { flex:0 0 130px; max-width:145px; display:flex; flex-direction:column; gap:2px;
    padding:4px 7px; background:var(--accent-soft); border:1px solid var(--border);
    border-radius:var(--radius-lg); font-size: var(--oc-text-1); user-select:none; }
  .pg-msg-left.user-side { background:color-mix(in srgb, var(--ok) 10%, transparent); border-color:color-mix(in srgb, var(--ok) 30%, transparent); }
  .pg-msg-left.error-side { background:var(--error-soft); border-color:color-mix(in srgb, var(--error) 30%, transparent); }
  .pg-msg-prov { font-weight:650; color:var(--accent,#e9e6de);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pg-msg-prov.user { color:var(--ok); }
  .pg-msg-prov.error { color:var(--error,#e08a7c); }
  .pg-msg-model { color:var(--muted,#a2a29c); font-size: var(--oc-text-1); line-height:1.25; word-break:break-all; }
  .pg-msg-content { flex:1; min-width:0; display:flex; flex-direction:column; gap:3px; }
  .pg-msg-text { font-size: var(--oc-text-3); line-height:1.5; white-space:pre-wrap; word-break:break-word; color:var(--text,#e9e6de); }
  .pg-round { align-self:stretch; display:flex; align-items:center; gap:8px; margin:9px 0 2px;
    color:var(--muted,#a2a29c); font-size:var(--oc-text-1); }
  .pg-round::before, .pg-round::after { content:""; height:1px; flex:1; background:var(--border,#2b2f33); }
  .pg-round span { white-space:nowrap; padding:0 2px; }
  .pg-round strong { color:var(--text,#e9e6de); font-weight:600; }

  .pg-chat-thinking { display:flex; align-items:center; gap:10px; margin:6px 0; padding:8px 12px;
    border-radius:var(--radius-lg); background:var(--panel-alt); border:1px solid var(--border);
    color:var(--text,#e9e6de); }
  .pg-thinking-spinner { position:relative; width:18px; height:18px; flex:0 0 auto; display:flex; align-items:center; justify-content:center; }
  .pg-spin-ring { width:14px; height:14px; border:1px solid var(--border-strong);
    border-top-color:var(--accent,#e9e6de); border-radius:50%; animation:pgRotateCW 1s linear infinite; }
  .pg-thinking-body { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
  .pg-thinking-title { font-size: var(--oc-text-2); font-weight:600; color:var(--text,#e9e6de); }
  .pg-thinking-desc { font-size: var(--oc-text-1); color:var(--muted,#a2a29c); }

  .pg-debate-btn { display:inline-flex; align-items:center; gap:5px; }
  .pg-debate-btn.is-on { border-color:var(--accent); background:var(--accent-soft);
    color:var(--text,#e9e6de); }
  .pg-debate-badge { background:var(--accent,#e9e6de); color:var(--accent-ink); border-radius:999px;
    font-size: var(--oc-text-1); font-weight:700; line-height:14px; min-width:14px; text-align:center; padding:0 4px; }
  .pg-debate-pop { position:fixed; z-index:var(--oc-z-popover); display:none; flex-direction:column; width:460px;
    max-width:calc(100vw - 16px); max-height:min(520px,80vh); background:var(--panel,#16181a);
    border:1px solid var(--border-strong,#3e4449); border-radius:var(--radius-lg); box-shadow:var(--shadow);
    overflow:hidden; }
  .pg-debate-pop.pg-open { display:flex; }
  .pg-debate-head { flex:0 0 auto; padding:8px 9px; display:flex; flex-direction:column; gap:6px;
    border-bottom:1px solid var(--border,#2b2f33); }
  .pg-debate-title { display:flex; align-items:center; gap:6px; font-size: var(--oc-text-2); font-weight:650;
    color:var(--text,#e9e6de); }
  .pg-debate-title span.pg-debate-hint { color:var(--muted,#a2a29c); font-weight:400; font-size: var(--oc-text-1);
    margin-left:auto; }
  .pg-debate-switch { display:inline-flex; align-items:center; gap:5px; cursor:pointer; user-select:none;
    font-size: var(--oc-text-1); color:var(--text,#e9e6de); }
  .pg-aitalk-chips { display:flex; flex-wrap:wrap; gap:4px; max-height:80px; overflow-y:auto; padding:2px 0; }
  .pg-aitalk-chip { display:inline-flex; align-items:center; gap:4px; background:var(--accent-soft);
    border:1px solid var(--border-strong); color:var(--text,#e9e6de); border-radius:var(--radius-lg);
    padding:2px 7px; font-size: var(--oc-text-1); line-height:1.3; }
  .pg-aitalk-chip-del { background:none; border:none; color:var(--muted,#a2a29c); cursor:pointer;
    font-size: var(--oc-text-2); font-weight:bold; padding:0; display:inline-flex; align-items:center; line-height:1; }
  .pg-aitalk-chip-del:hover { color:var(--error,#e08a7c); }
  .pg-debate-empty-inline { font-size: var(--oc-text-1); color:var(--muted,#a2a29c); font-style:italic; padding:2px 0; }
  .pg-provider-tabs { display:flex; gap:4px; overflow-x:auto; padding:3px 0 2px; }
  .pg-provider-tab { flex:0 0 auto; background:var(--bg,#0e0f10); border:1px solid var(--border,#2b2f33);
    border-radius:var(--radius-lg); color:var(--muted,#a2a29c); font-size: var(--oc-text-1); padding:3px 8px; cursor:pointer; }
  .pg-provider-tab:hover { background:var(--panel-hover,#22262a); color:var(--text,#e9e6de); }
  .pg-provider-tab.is-active { background:var(--accent-soft); border-color:var(--accent,#e9e6de);
    color:var(--text,#e9e6de); font-weight:600; }
  .pg-debate-search { background:var(--bg,#0e0f10); border:1px solid var(--border,#2b2f33); border-radius:var(--radius-lg);
    color:var(--text,#e9e6de); padding:6px 8px; font:inherit; font-size: var(--oc-text-2); outline:none; }
  .pg-debate-search:focus { border-color:var(--accent,#e9e6de); }
  .pg-debate-list { flex:1; min-height:0; overflow:auto; padding:4px; display:flex; flex-direction:column;
    gap:1px; }
  .pg-debate-item { display:flex; flex:0 0 auto; align-items:flex-start; gap:7px; width:100%; text-align:left;
    background:none; border:0; color:var(--text,#e9e6de); border-radius:var(--radius-lg); padding:6px 8px;
    font:inherit; cursor:pointer; }
  .pg-debate-item:hover { background:var(--panel-hover,#22262a); }
  .pg-debate-item.is-picked { background:var(--accent-soft);
    box-shadow:inset 0 0 0 1px var(--border-strong); }
  .pg-debate-item.is-locked { opacity:.5; cursor:default; }
  .pg-debate-item input { margin:2px 0 0; width:12px; height:12px; flex:0 0 auto;
    accent-color:var(--accent,#e9e6de); cursor:pointer; }
  .pg-debate-item-body { display:flex; flex-direction:column; gap:1px; min-width:0; }
  .pg-debate-item-id { font-size: var(--oc-text-2); line-height:1.35; word-break:break-word; }
  .pg-debate-item-label { color:var(--muted,#a2a29c); font-size: var(--oc-text-1); line-height:1.3; }
  .pg-debate-empty { padding:12px 10px; font-size: var(--oc-text-2); line-height:1.5; color:var(--muted,#a2a29c); }
  .pg-debate-foot { flex:0 0 auto; padding:6px 9px; display:flex; align-items:center; gap:8px;
    border-top:1px solid var(--border,#2b2f33); color:var(--muted,#a2a29c); font-size: var(--oc-text-1); }
  .pg-debate-foot .pg-btn { padding:4px 9px; font-size: var(--oc-text-1); margin-left:auto; }
  .pg-composer { flex:0 0 auto; display:flex; align-items:flex-end; gap:8px; padding:8px 10px;
    border-top:1px solid var(--border,#2b2f33); background:var(--panel-alt,#1b1e20); }
  .pg-chat-input { flex:1; resize:none; min-height:34px; max-height:130px; background:var(--bg,#0e0f10);
    border:1px solid var(--border-strong,#3e4449); border-radius:var(--radius-lg); color:var(--text,#e9e6de);
    padding:7px 9px; font:inherit; font-size: var(--oc-text-3); line-height:1.45; outline:none; }
  .pg-chat-input:focus { border-color:var(--accent,#e9e6de); }
  .pg-btn { border-radius:var(--radius-lg); border:1px solid var(--border-strong,#3e4449); background:var(--panel-hover,#22262a);
    color:var(--text,#e9e6de); font:inherit; font-size: var(--oc-text-2); padding:7px 12px; cursor:pointer; }
  .pg-btn.primary { background:var(--accent,#e9e6de); border-color:var(--accent,#e9e6de); color:var(--accent-ink); font-weight:650; }
  .pg-btn.primary:disabled { opacity:.5; cursor:default; }
  .pg-btn.danger { color:var(--error,#e08a7c); border-color:color-mix(in srgb, var(--error) 40%, transparent); background:var(--error-soft); }
  .pg-toast { position:fixed; right:20px; bottom:20px; z-index:var(--oc-z-toast); max-width:360px; background:var(--panel-alt,#1b1e20);
    border:1px solid var(--border-strong,#3e4449); color:var(--text,#e9e6de); border-radius:var(--radius-lg); padding:9px 13px;
    font-size: var(--oc-text-2); line-height:1.45; box-shadow:var(--shadow); opacity:0; transform:translateY(6px);
    transition:opacity .16s ease, transform .16s ease; pointer-events:none; }
  .pg-toast[data-tone="error"] { border-color:color-mix(in srgb, var(--error) 50%, transparent); color:var(--error,#e08a7c); }
  .pg-toast.pg-show { opacity:1; transform:none; }
  .activity-bar button[title="Settings"] { display:none !important; }
  .pd-toast { bottom:20px !important; }
  `;

  function ensureStyles() {
    if (document.getElementById("pg-workbench-style")) return;
    const tag = document.createElement("style");
    tag.id = "pg-workbench-style";
    tag.textContent = styles;
    document.head.appendChild(tag);
  }


  /* settings + provider panel                                          */

  let providerSignature = "";
  let firstProviderRender = true;
  const knownProviders = new Set();
  const keyedProviders = new Set();

  async function loadSettings(options) {
    try {
      const settings = await api.settings.get();
      if (settings && Array.isArray(settings.providers)) {
        state.settings = settings;
        const firstLoad = knownProviders.size === 0;
        for (const provider of settings.providers) {
          const isNew = !knownProviders.has(provider.id);
          const justGotKey = !keyedProviders.has(provider.id) && provider.hasKey;
          knownProviders.add(provider.id);
          if (provider.hasKey) keyedProviders.add(provider.id);
          else keyedProviders.delete(provider.id);
          if (!firstLoad && (isNew || justGotKey)) {
            state.expanded.set(provider.id, { open: true });
            if (provider.kind === "mock" || provider.kind === "cli" || provider.hasKey) {
              setTimeout(() => loadModels(provider.id, false), 0);
            }
          }
        }
        if (!state.chatProviderId) {
          state.chatProviderId = settings.activeProviderId || settings.providers[0]?.id || null;
        }
        const sig = settings.providers
          .map((p) => `${p.id}:${p.hasKey ? 1 : 0}:${p.model || ""}`)
          .join("|");
        if (sig !== providerSignature) {
          providerSignature = sig;
          if (!options || !options.quiet) renderProviders();
          if (state.chatEls) syncChatProviders();
        }
      }
      return settings;
    } catch (error) {
      console.error("[workbench] settings.get failed", error);
      return null;
    }
  }

  async function saveSettings(next, why) {
    try {
      const saved = await api.settings.save(next);
      if (saved && Array.isArray(saved.providers)) state.settings = saved;
      providerSignature = "";
      await loadSettings({ quiet: true });
      renderProviders();
      if (state.chatEls) syncChatProviders();
      showToast(why || "Kaydedildi");
      return true;
    } catch (error) {
      showToast(friendlyError(error), "error");
      return false;
    }
  }

  function openSettingsModal() {
    const buttons = [...document.querySelectorAll(".activity-bar button")];
    const gear = buttons.find((b) => (b.title || "").trim() === "Settings");
    if (gear) {
      gear.click();
      setTimeout(() => loadSettings(), 900);
      return true;
    }
    showToast("Sağlayıcı düğmesi bulunamadı; uygulamayı yeniden başlatın.", "error");
    return false;
  }

  /* left-column gear button + Görünüm panel                            */

  const GEAR_PATH =
    '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>';

  function gearSvg(size) {
    const px = size || 22;
    return `<svg width="${px}" height="${px}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${GEAR_PATH}</svg>`;
  }

  function ensureGearButton() {
    const bar = document.querySelector(".activity-bar");
    if (!bar) return;
    const existing = document.getElementById("pg-settings-gear");
    if (existing && existing.isConnected && existing.parentElement === bar) return;
    if (existing) existing.remove();
    const btn = el("button", "activity-button pg-settings-gear");
    btn.id = "pg-settings-gear";
    btn.type = "button";
    btn.title = text("appearance");
    btn.setAttribute("aria-label", text("appearance"));
    btn.innerHTML = gearSvg(22);
    btn.addEventListener("click", (event) => openWorkbenchSettings(event.currentTarget));
    bar.appendChild(btn);
  }

  function closeWorkbenchSettings() {
    const current = state.settingsPanel;
    if (!current) return;
    state.settingsPanel = null;
    document.removeEventListener("keydown", current.onKey);
    if (state.themeListener) {
      window.removeEventListener("pg-theme-change", state.themeListener);
      state.themeListener = null;
    }
    if (state.typeListener) {
      window.removeEventListener("pg-type-change", state.typeListener);
      state.typeListener = null;
    }
    current.backdrop.remove();
    if (
      current.restoreFocus &&
      current.restoreFocus !== document.body &&
      current.restoreFocus !== document.documentElement &&
      current.restoreFocus.isConnected
    ) {
      current.restoreFocus.focus({ preventScroll: true });
    } else {
      const gear = document.getElementById("pg-settings-gear");
      if (gear) gear.focus({ preventScroll: true });
    }
  }

  function themeText(theme) {
    const key = `theme${theme.id.charAt(0).toUpperCase()}${theme.id.slice(1)}`;
    const value = text(key);
    return value === key ? theme.name : value;
  }

  function typeText(preset) {
    const key = `type${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`;
    const value = text(key);
    return value === key ? preset.name : value;
  }

  function themeTagline(theme) {
    const key = `tagline${theme.id.charAt(0).toUpperCase()}${theme.id.slice(1)}`;
    const value = text(key);
    return value === key ? theme.tagline : value;
  }

  function themePreviewNode(theme) {
    const preview = el("div", "pg-theme-preview");
    preview.setAttribute("aria-hidden", "true");

    const rail = el("div", "pg-tp-rail");
    rail.appendChild(el("i", "pg-tp-dot"));
    rail.appendChild(el("i", "pg-tp-dot"));
    rail.appendChild(el("i", "pg-tp-dot"));

    const side = el("div", "pg-tp-side");
    side.appendChild(el("i", "pg-tp-line m"));
    side.appendChild(el("i", "pg-tp-line s"));
    side.appendChild(el("i", "pg-tp-line m"));
    side.appendChild(el("i", "pg-tp-line s"));

    const canvas = el("div", "pg-tp-canvas");
    canvas.appendChild(el("i", "pg-tp-code a"));
    canvas.appendChild(el("i", "pg-tp-code b"));
    canvas.appendChild(el("i", "pg-tp-code c"));
    canvas.appendChild(el("i", "pg-tp-code a"));

    const enso = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    enso.setAttribute("class", "pg-tp-enso");
    enso.setAttribute("viewBox", "0 0 24 24");
    enso.setAttribute("fill", "none");
    enso.setAttribute("aria-hidden", "true");
    enso.setAttribute("focusable", "false");
    enso.innerHTML =
      '<rect x="3" y="3" width="18" height="18" stroke="currentColor" stroke-width="2.4" fill="none"/>' +
      '<rect x="9.4" y="9.4" width="5.2" height="5.2" fill="currentColor"/>';
    canvas.appendChild(enso);

    const panel = el("div", "pg-tp-panel");
    panel.appendChild(el("i", "pg-tp-line m"));
    panel.appendChild(el("i", "pg-tp-line s"));
    panel.appendChild(el("i", "pg-tp-line m"));

    preview.appendChild(rail);
    preview.appendChild(side);
    preview.appendChild(canvas);
    preview.appendChild(panel);
    return preview;
  }

  function syncThemeCards(grid, stateLabel) {
    const current = window.pgZen ? window.pgZen.current : "";
    const themes = window.pgZen ? window.pgZen.themes : [];
    const active = themes.find((theme) => theme.id === current);
    for (const card of grid.querySelectorAll(".pg-theme-card")) {
      const on = card.dataset.theme === current;
      card.classList.toggle("is-active", on);
      card.setAttribute("aria-checked", on ? "true" : "false");
      card.tabIndex = on ? 0 : -1;
    }
    if (stateLabel) stateLabel.textContent = active ? themeText(active) : "";
  }

  function syncTypeCards(list, stateLabel) {
    const current = window.pgZen ? window.pgZen.type : "";
    const types = window.pgZen ? window.pgZen.types : [];
    const active = types.find((preset) => preset.id === current);
    for (const card of list.querySelectorAll(".pg-type-card")) {
      const on = card.dataset.type === current;
      card.classList.toggle("is-active", on);
      card.setAttribute("aria-checked", on ? "true" : "false");
      card.tabIndex = on ? 0 : -1;
    }
    if (stateLabel) stateLabel.textContent = active ? typeText(active) : "";
  }

  function rovingKeys(cards, card, event, onPick) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return false;
    event.preventDefault();
    let index = cards.indexOf(card);
    if (event.key === "Home") index = 0;
    else if (event.key === "End") index = cards.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown") index = (index + 1) % cards.length;
    else index = (index - 1 + cards.length) % cards.length;
    const next = cards[index];
    if (!next) return true;
    next.focus({ preventScroll: true });
    onPick(next);
    return true;
  }

  function buildSettingsBody() {
    const body = el("div", "pg-settings-body");
    const zen = window.pgZen;
    if (!zen) {
      body.appendChild(el("p", "pg-settings-sub", text("themeEngineUnavailable")));
      return body;
    }

    const section = el("section", "pg-settings-section pg-settings-themes");
    section.appendChild(el("div", "pg-settings-kicker", text("themeKicker")));
    section.appendChild(el("h2", "pg-settings-heading", text("themeHeading")));
    section.appendChild(el("p", "pg-settings-sub", text("themeDescription")));

    const grid = el("div", "pg-theme-grid");
    grid.setAttribute("role", "radiogroup");
    grid.setAttribute("aria-label", text("themeSelection"));

    const stateLabel = el("strong", null, "");

    for (const theme of zen.themes) {
      const card = el("button", "pg-theme-card");
      card.type = "button";
      card.dataset.theme = theme.id;
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", "false");
      card.style.setProperty("--pv-bg", theme.palette.bg);
      card.style.setProperty("--pv-elevated", theme.palette.elevated);
      card.style.setProperty("--pv-panel", theme.palette.panel);
      card.style.setProperty("--pv-border", theme.palette.border);
      card.style.setProperty("--pv-muted", theme.palette.muted);
      card.style.setProperty("--pv-accent", theme.palette.accent);

      const caption = el("div", "pg-theme-caption");
      const line = el("div", "pg-theme-line");
      line.appendChild(el("span", "pg-theme-name", themeText(theme)));
      line.appendChild(el("span", "pg-theme-jp", theme.jp));
      line.appendChild(el("span", "pg-theme-state", text("active")));
      caption.appendChild(line);
      caption.appendChild(el("div", "pg-theme-tagline", themeTagline(theme)));

      card.appendChild(themePreviewNode(theme));
      card.appendChild(caption);

      card.addEventListener("click", () => {
        zen.apply(theme.id);
        syncThemeCards(grid, stateLabel);
        showToast(`${text("themeToastPrefix")}${themeText(theme)}`);
      });

      card.addEventListener("keydown", (event) => {
        const cards = [...grid.querySelectorAll(".pg-theme-card")];
        rovingKeys(cards, card, event, (next) => next.click());
      });

      grid.appendChild(card);
    }

    section.appendChild(grid);
    body.appendChild(section);

    const typeSection = el("section", "pg-settings-section pg-settings-type");
    typeSection.appendChild(el("div", "pg-settings-kicker", text("typeKicker")));
    typeSection.appendChild(el("h2", "pg-settings-heading", text("typeHeading")));
    typeSection.appendChild(el("p", "pg-settings-sub", text("typeDescription")));

    const typeList = el("div", "pg-type-list");
    typeList.setAttribute("role", "radiogroup");
    typeList.setAttribute("aria-label", text("typeSelection"));

    const typeLabel = el("strong", null, "");

    for (const preset of zen.types) {
      const card = el("button", "pg-type-card");
      card.type = "button";
      card.dataset.type = preset.id;
      card.setAttribute("role", "radio");
      card.setAttribute("aria-checked", "false");
      card.style.setProperty("--sample-display", preset.display);

      const sample = el("span", "pg-type-sample", preset.sample);
      sample.setAttribute("aria-hidden", "true");
      card.appendChild(sample);
      card.appendChild(el("span", "pg-type-name", typeText(preset)));
      const noteKey = `typeNote${preset.id.charAt(0).toUpperCase()}${preset.id.slice(1)}`;
      const noteText = text(noteKey);
      card.appendChild(el("span", "pg-type-note", noteText === noteKey ? preset.note : noteText));
      card.appendChild(el("span", "pg-type-state", text("active")));

      card.addEventListener("click", () => {
        zen.applyType(preset.id);
        syncTypeCards(typeList, typeLabel);
        showToast(`${text("typeToastPrefix")}${typeText(preset)}`);
      });

      card.addEventListener("keydown", (event) => {
        const cards = [...typeList.querySelectorAll(".pg-type-card")];
        rovingKeys(cards, card, event, (next) => next.click());
      });

      typeList.appendChild(card);
    }

    typeSection.appendChild(typeList);
    typeSection.appendChild(
      el(
        "p",
        "pg-settings-note",
        text("typeNote")
      )
    );
    body.appendChild(typeSection);

    const foot = el("div", "pg-settings-foot");
    foot.appendChild(el("span", null, text("selectionSaved")));
    const now = el("span", "pg-settings-now");
    now.appendChild(el("span", null, text("currentThemePrefix")));
    now.appendChild(stateLabel);
    now.appendChild(el("span", "pg-foot-sep", "·"));
    now.appendChild(el("span", null, text("currentTypefacePrefix")));
    now.appendChild(typeLabel);
    foot.appendChild(now);
    body.appendChild(foot);

    syncThemeCards(grid, stateLabel);
    syncTypeCards(typeList, typeLabel);
    state.themeListener = () => syncThemeCards(grid, stateLabel);
    state.typeListener = () => syncTypeCards(typeList, typeLabel);
    window.addEventListener("pg-theme-change", state.themeListener);
    window.addEventListener("pg-type-change", state.typeListener);
    return body;
  }

  function openWorkbenchSettings(opener) {
    closeWorkbenchSettings();
    const restoreFocus = opener || document.activeElement;
    const backdrop = el("div", "pg-settings-backdrop");
    backdrop.addEventListener("mousedown", (event) => {
      if (event.target === backdrop) closeWorkbenchSettings();
    });

    const panel = el("div", "pg-settings-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-label", text("appearance"));
    panel.tabIndex = -1;

    const head = el("div", "pg-settings-head");
    const icon = el("span", "pg-settings-icon");
    icon.innerHTML = gearSvg(16);
    head.appendChild(icon);
    head.appendChild(el("span", "pg-settings-title", text("appearance")));
    const close = el("button", "pg-settings-close", "✕");
    close.type = "button";
    close.title = text("winClose");
    close.setAttribute("aria-label", text("appearanceClose"));
    close.addEventListener("click", () => closeWorkbenchSettings());
    head.appendChild(close);

    const body = buildSettingsBody();

    panel.appendChild(head);
    panel.appendChild(body);
    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);

    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeWorkbenchSettings();
        return;
      }
      if (event.key !== "Tab" || !state.settingsPanel) return;
      const focusable = [...panel.querySelectorAll("button, input, select, textarea, a[href], [tabindex]")].filter(
        (node) => !node.disabled && node.tabIndex >= 0 && node.getClientRects().length > 0
      );
      if (!focusable.length) {
        event.preventDefault();
        panel.focus({ preventScroll: true });
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!panel.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };
    document.addEventListener("keydown", onKey);
    state.settingsPanel = { backdrop, panel, onKey, restoreFocus };
    panel.focus({ preventScroll: true });
  }

  async function loadModels(providerId, force) {
    const provider = providerById(providerId);
    if (!provider) return;
    const entry = state.expanded.get(providerId) || {};
    state.expanded.set(providerId, { ...entry, open: true, loading: true, error: null });
    renderProviders();

    if (provider.kind === "mock" || provider.kind === "cli") {
      state.expanded.set(providerId, {
        open: true,
        loading: false,
        models: [{ id: provider.model || provider.kind, label: "Yerel sağlayıcı modeli" }],
        warning: null,
        error: null
      });
      renderProviders();
      return;
    }

    try {
      const result = await api.settings.listModels({
        providerId,
        kind: provider.kind,
        baseUrl: provider.baseUrl,
        refresh: Boolean(force)
      });
      if (!result || !result.ok) {
        state.expanded.set(providerId, {
          open: true,
          loading: false,
          models: [],
          warning: null,
          error: friendlyError(result && result.error, provider.kind)
        });
      } else {
        state.expanded.set(providerId, {
          open: true,
          loading: false,
          models: Array.isArray(result.models) ? result.models : [],
          warning: result.warning || null,
          error: null,
          source: result.source,
          cached: Boolean(result.cached)
        });
      }
    } catch (error) {
      state.expanded.set(providerId, {
        open: true,
        loading: false,
        models: [],
        warning: null,
        error: friendlyError(error, provider.kind)
      });
    }
    renderProviders();
  }

  function toggleProvider(providerId) {
    const entry = state.expanded.get(providerId) || { open: false };
    if (entry.open) {
      state.expanded.set(providerId, { ...entry, open: false });
      renderProviders();
      return;
    }
    const next = { ...entry, open: true };
    state.expanded.set(providerId, next);
    renderProviders();
    if (!entry.models && !entry.error && !entry.loading) loadModels(providerId, false);
  }

  async function chooseModel(providerId, modelId) {
    const provider = providerById(providerId);
    if (!provider) return;
    if (provider.model === modelId) {
      showToast(`${provider.label}: ${modelId} zaten seçili`);
      return;
    }
    const base = state.settings || (await loadSettings({ quiet: true }));
    if (!base) return;
    const next = {
      ...base,
      activeProviderId: providerId,
      providers: base.providers.map((p) => (p.id === providerId ? { ...p, model: modelId } : p))
    };
    const ok = await saveSettings(next, `${provider.label} → ${shortModel(modelId)}`);
    if (ok && state.chatEls) {
      state.chatProviderId = providerId;
      syncChatProviders();
    }
  }

  function providerMeta(provider) {
    if (provider.kind === "mock") return "Çevrimdışı demo · anahtar gerekmez";
    if (provider.kind === "cli") return `CLI · ${provider.cliCommand || provider.model}`;
    const keyState = provider.hasKey ? "anahtar kayıtlı" : "anahtar yok";
    return `${prettyKind(provider.kind)} · ${keyState}`;
  }

  function modelMatches(model, query) {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      String(model.id || "").toLowerCase().includes(q) ||
      String(model.label || "").toLowerCase().includes(q)
    );
  }

  function renderModelList(provider, box) {
    const entry = state.expanded.get(provider.id) || {};
    const list = box.querySelector(".pg-model-list");
    const stateNode = box.querySelector(".pg-model-state");
    if (!list || !stateNode) return;
    clear(list);
    stateNode.hidden = true;
    stateNode.textContent = "";

    if (entry.loading) {
      stateNode.hidden = false;
      stateNode.className = "pg-model-state";
      stateNode.textContent = "Modeller yükleniyor…";
      return;
    }
    if (entry.error) {
      stateNode.hidden = false;
      stateNode.className = "pg-model-state error";
      stateNode.textContent = entry.error;
      const retry = el("button", "pg-retry pg-btn", "Tekrar dene");
      retry.type = "button";
      retry.addEventListener("click", (event) => {
        event.stopPropagation();
        loadModels(provider.id, true);
      });
      stateNode.appendChild(document.createElement("br"));
      stateNode.appendChild(retry);
      return;
    }
    const byQuery = (entry.models || []).filter((m) => modelMatches(m, entry.query || ""));
    const models = filteredModelsFor(provider, byQuery);
    const countNode = box.querySelector(".pg-model-count");
    if (countNode) {
      const freeCount = filteredModelsFor(provider, entry.models || []).length;
      const total = (entry.models || []).length;
      countNode.textContent = state.showPaid
        ? `${total} model`
        : `${freeCount} / ${total} ücretsiz`;
    }
    if (entry.warning) {
      const note = el("div", "pg-model-state", entry.warning);
      note.style.color = "var(--warn,#d2a75c)";
      list.appendChild(note);
    }
    if (models.length === 0) {
      if (byQuery.length > 0 && !state.showPaid && !entry.query) {
        stateNode.hidden = false;
        stateNode.className = "pg-model-state";
        stateNode.appendChild(
          el("div", "", "Bu sağlayıcıda ücretsiz model yok. Ücretli modelleri görmek için yukarıdaki tiki işaretleyin.")
        );
        return;
      }
      stateNode.hidden = false;
      stateNode.className = "pg-model-state";
      stateNode.textContent = byQuery.length
        ? state.showPaid
          ? "Aramanızla eşleşen model yok."
          : "Aramanızla eşleşen ücretsiz model yok. Ücretli modeller için tiki işaretleyin."
        : "Bu sağlayıcı model listesi döndürmedi. Model adını Settings ekranından girebilirsiniz.";
      return;
    }
    const frag = document.createDocumentFragment();
    for (const model of models.slice(0, 800)) {
      const paid = !isFreeModel(provider, model);
      const row = el("button", "pg-model" + (model.id === provider.model ? " is-current" : ""));
      row.type = "button";
      row.title = model.id;
      row.appendChild(el("span", "pg-model-id", model.id));
      if (paid) row.appendChild(el("span", "pg-model-tag", "ücretli"));
      if (model.label && model.label !== model.id) {
        row.appendChild(el("span", "pg-model-label", model.label));
      }
      row.addEventListener("click", (event) => {
        event.stopPropagation();
        chooseModel(provider.id, model.id);
      });
      frag.appendChild(row);
    }
    list.appendChild(frag);
  }

  function buildProviderCard(provider) {
    const entry = state.expanded.get(provider.id) || {};
    const card = el("div", "pg-provider" + (entry.open ? " is-open" : ""));
    const row = el("button", "pg-provider-row");
    row.type = "button";
    row.title = `${provider.label}: modelleri ${entry.open ? "kapat" : "aç"}`;
    row.setAttribute("aria-expanded", entry.open ? "true" : "false");

    const dot = el("span", "pg-provider-dot " + (provider.hasKey || provider.kind === "mock" ? "ok" : "warn"));
    const body = el("span", "pg-provider-body");
    body.appendChild(el("span", "pg-provider-name", provider.label || provider.id));
    body.appendChild(el("span", "pg-provider-meta", `${providerMeta(provider)} · ${shortModel(provider.model)}`));
    row.appendChild(dot);
    row.appendChild(body);
    row.appendChild(el("span", "pg-provider-chevron", "▸"));
    row.addEventListener("click", () => toggleProvider(provider.id));
    card.appendChild(row);

    if (entry.open) {
      const box = el("div", "pg-model-box");
      box.dataset.providerId = provider.id;
      box.addEventListener("click", (event) => event.stopPropagation());
      const search = el("input", "pg-model-search");
      search.type = "search";
      search.placeholder = text("modelSearchPlaceholder");
      search.value = entry.query || "";
      search.setAttribute("aria-label", `${provider.label} ${text("providerModelSearch").toLowerCase()}`);
      const searchLabel = el("label", "pg-search-label", text("providerModelSearch"));
      searchLabel.appendChild(search);
      search.addEventListener("click", (event) => event.stopPropagation());
      search.addEventListener("input", () => {
        const current = state.expanded.get(provider.id) || {};
        state.expanded.set(provider.id, { ...current, query: search.value });
        renderModelList(provider, box);
      });
      const tools = el("div", "pg-model-tools");
      tools.appendChild(paidToggle());
      tools.appendChild(el("span", "pg-model-count", ""));
      const list = el("div", "pg-model-list");
      const stateNode = el("div", "pg-model-state");
      box.appendChild(searchLabel);
      box.appendChild(tools);
      box.appendChild(list);
      box.appendChild(stateNode);
      card.appendChild(box);
      requestAnimationFrame(() => renderModelList(provider, box));
    }
    return card;
  }

  function renderProviders() {
    const root = state.providerEl;
    if (!root || !root.isConnected) return;
    clear(root);

    const head = el("div", "pg-providers-head");
    const main = el("div", "pg-providers-main");
    main.appendChild(el("span", "pg-providers-title", "Providers"));
    const count = state.settings?.providers?.length || 0;
    main.appendChild(el("span", "pg-providers-sub", `${count}`));
    const add = el("button", "pg-add-providers", "Add providers");
    add.type = "button";
    add.title = "Sağlayıcı ekle veya API anahtarı tanımla";
    add.addEventListener("click", () => {
      openSettingsModal();
      setTimeout(() => loadSettings(), 1200);
    });
    main.appendChild(add);
    head.appendChild(main);
    const refresh = el("button", "pg-icon-btn pg-providers-refresh", "⟳");
    refresh.type = "button";
    refresh.title = "Sağlayıcıları yenile";
    refresh.addEventListener("click", async () => {
      providerSignature = "";
      await loadSettings();
      showToast("Sağlayıcı listesi yenilendi");
    });
    head.appendChild(refresh);
    root.appendChild(head);

    const list = el("div", "pg-provider-list");
    if (!state.settings) {
      list.appendChild(el("div", "pg-provider-hint", "Sağlayıcılar yükleniyor…"));
    } else if (state.settings.providers.length === 0) {
      list.appendChild(el("div", "pg-provider-hint", "Henüz sağlayıcı yok. Yukarıdaki “Add providers” düğmesiyle ekleyin."));
    } else {
      for (const provider of state.settings.providers) list.appendChild(buildProviderCard(provider));
    }
    root.appendChild(list);

    if (firstProviderRender && state.settings?.providers?.length) {
      firstProviderRender = false;
      const initial =
        state.settings.providers.find((p) => p.id === state.settings.activeProviderId) ||
        state.settings.providers[0];
      if (initial && !state.expanded.get(initial.id)?.open) {
        state.expanded.set(initial.id, { open: true });
        if (initial.kind === "mock" || initial.kind === "cli" || initial.hasKey) {
          loadModels(initial.id, false);
        }
      }
    }
  }

  function ensureProviders() {
    const panel = document.querySelector(".agent-panel");
    if (!panel) return;
    panel.classList.add("pg-providers-host");
    if (!state.providerEl || !state.providerEl.isConnected || state.providerEl.parentElement !== panel) {
      state.providerEl = el("div", "pg-providers");
      panel.appendChild(state.providerEl);
      renderProviders();
    }
  }


  /* bottom chat dock                                                   */

  let chatPaint = 0;

  function chatSession() {
    if (!state.sessionId) state.sessionId = newSessionId();
    let session = state.sessions.get(state.sessionId);
    if (!session) {
      session = { id: state.sessionId, messages: [], status: "idle", agentName: "Agent" };
      state.sessions.set(state.sessionId, session);
    }
    return session;
  }

  function pushMessage(role, text, extra) {
    const session = chatSession();
    const prov = state.chatProviderId ? providerById(state.chatProviderId) : null;
    session.messages.push({
      id: newSessionId(),
      role,
      text,
      providerId: extra?.providerId || session?.providerId || prov?.id || "",
      providerLabel: extra?.providerLabel || session?.providerLabel || prov?.label || prettyKind(prov?.kind) || "",
      modelName: extra?.modelName || session?.modelName || (prov?.model ? shortModel(prov.model) : ""),
      ...extra
    });
    scheduleChatRender();
    return session.messages[session.messages.length - 1];
  }

  function scheduleChatRender() {
    if (chatPaint) return;
    chatPaint = requestAnimationFrame(() => {
      chatPaint = 0;
      renderChatLog();
      renderChatStatus();
    });
  }

  function renderThinkingIndicator(log) {
    let thinkingNode = log.querySelector(".pg-chat-thinking");
    if (state.running) {
      if (!thinkingNode) {
        thinkingNode = el("div", "pg-chat-thinking");
        thinkingNode.innerHTML =
          '<div class="pg-thinking-spinner">' +
          '<span class="pg-spin-ring"></span>' +
          '</div>' +
          '<div class="pg-thinking-body">' +
          '<div class="pg-thinking-title">Modeller karşılaştırıyor, analiz ediyor…</div>' +
          '<div class="pg-thinking-desc"></div>' +
          '</div>';
        log.appendChild(thinkingNode);
      }
      const desc = thinkingNode.querySelector(".pg-thinking-desc");
      if (desc) {
        desc.textContent = state.debateStage
          ? `AI Talk · ${state.debateStage}`
          : "Modeller çalışıyor, çözüm üretiliyor…";
      }
    } else if (thinkingNode) {
      thinkingNode.remove();
    }
  }

  function buildMessageNode(message) {
    if (message.role === "divider") {
      const round = el("div", "pg-round");
      round.setAttribute("data-msg-id", message.id);
      round.appendChild(el("span", "", message.text));
      return round;
    }

    const node = el("div", `pg-msg ${message.role}`);
    node.setAttribute("data-msg-id", message.id);

    const left = el("div", "pg-msg-left");
    let provText = message.providerLabel || "";
    let modelText = message.modelName || "";

    if (message.role === "assistant") {
      if (!provText && message.speaker) {
        const parts = message.speaker.split(":");
        if (parts.length > 1) {
          provText = parts[0].trim();
          modelText = parts.slice(1).join(":").trim();
        } else {
          modelText = message.speaker;
        }
      }
      if (!provText && state.chatProviderId) {
        provText = providerById(state.chatProviderId)?.label || "Sağlayıcı";
      }
      if (!modelText && state.chatProviderId) {
        modelText = shortModel(providerById(state.chatProviderId)?.model) || "AI";
      }

      left.appendChild(el("span", "pg-msg-prov", provText || "AI"));
      left.appendChild(el("span", "pg-msg-model", modelText || "Model"));
    } else if (message.role === "user") {
      left.classList.add("user-side");
      left.appendChild(el("span", "pg-msg-prov user", "Kullanıcı"));
      left.appendChild(el("span", "pg-msg-model user", "Siz"));
    } else if (message.role === "error") {
      left.classList.add("error-side");
      left.appendChild(el("span", "pg-msg-prov error", "Hata"));
      left.appendChild(el("span", "pg-msg-model error", "Sistem"));
    } else {
      left.appendChild(el("span", "pg-msg-prov", "Araç"));
      left.appendChild(el("span", "pg-msg-model", "Sistem"));
    }

    const content = el("div", "pg-msg-content");
    const textNode = el("div", "pg-msg-text", message.text);
    content.appendChild(textNode);

    node.appendChild(left);
    node.appendChild(content);

    if (message.agentName) {
      node.title = message.agentName;
    }

    return node;
  }

  function renderChatStatus() {
    if (!state.chatEls) return;
    const { statusNode, sendBtn, stopBtn, input } = state.chatEls;
    const session = state.sessionId ? state.sessions.get(state.sessionId) : null;
    const status = state.running ? "running" : session?.status || "idle";
    const labels = {
      idle: "Hazır",
      running: "Çalışıyor…",
      done: "Tamamlandı",
      cancelled: "Durduruldu",
      error: "Hata"
    };
    statusNode.className =
      "pg-chat-status " +
      (status === "running" ? "running" : status === "done" ? "done" : status === "error" ? "error" : "");
    clear(statusNode);
    statusNode.appendChild(el("span", "pg-pulse"));
    const label =
      status === "running" && state.debateStage
        ? `AI Talk · ${state.debateStage}`
        : labels[status] || status;
    statusNode.appendChild(el("span", "", label));
    sendBtn.disabled = state.running;
    stopBtn.hidden = !state.running;
    input.disabled = false;
  }

  function renderChatLog() {
    const log = state.chatEls?.log;
    if (!log) return;
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 60;
    const stick = nearBottom || state.forceChatScroll;
    state.forceChatScroll = false;

    const session = state.sessionId ? state.sessions.get(state.sessionId) : null;
    const messages = session?.messages || [];

    if (messages.length === 0) {
      clear(log);
      const empty = el("div", "pg-chat-empty");
      const strong = el("strong", "", "Chat hazır. ");
      empty.appendChild(strong);
      empty.appendChild(
        document.createTextNode(
          `${state.workspaceName || "Çalışma klasörü"} açık. Aşağıya bir görev yazın; modeller birlikte çalışarak çözüm üretecektir.`
        )
      );
      log.appendChild(empty);
      renderThinkingIndicator(log);
      return;
    }

    const empty = log.querySelector(".pg-chat-empty");
    if (empty) empty.remove();

    const existingMap = new Map();
    for (const child of log.querySelectorAll(".pg-msg[data-msg-id], .pg-round[data-msg-id]")) {
      existingMap.set(child.getAttribute("data-msg-id"), child);
    }

    const thinkingNode = log.querySelector(".pg-chat-thinking");

    for (const message of messages) {
      const existing = existingMap.get(message.id);
      if (existing) {
        if (message.role !== "divider") {
          const textEl = existing.querySelector(".pg-msg-text");
          if (textEl && textEl.textContent !== message.text) {
            textEl.textContent = message.text;
          }
        }
      } else {
        const node = buildMessageNode(message);
        if (thinkingNode) {
          log.insertBefore(node, thinkingNode);
        } else {
          log.appendChild(node);
        }
      }
    }

    renderThinkingIndicator(log);
    if (stick) log.scrollTop = log.scrollHeight;
  }

  function syncChatProviders() {
    if (!state.chatEls) return;
    const { providerSelect } = state.chatEls;
    const providers = state.settings?.providers || [];
    const previous = state.chatProviderId || providerSelect.value;
    clear(providerSelect);
    for (const provider of providers) {
      const option = el("option", "", provider.label || provider.id);
      option.value = provider.id;
      providerSelect.appendChild(option);
    }
    if (previous && providers.some((p) => p.id === previous)) providerSelect.value = previous;
    else if (providers[0]) providerSelect.value = providers[0].id;
    state.chatProviderId = providerSelect.value || null;
    fillChatModels(state.chatProviderId);
  }

  function setChatModelLabel(text, title) {
    const els = state.chatEls;
    if (!els) return;
    els.modelBtnText.textContent = text || "model seç";
    els.modelBtn.title = title || text || "Model ara ve seç";
  }

  function updateChatModelButton() {
    const provider = providerById(state.chatProviderId);
    if (!provider) {
      setChatModelLabel("sağlayıcı yok", "Önce bir sağlayıcı seçin");
      return;
    }
    setChatModelLabel(provider.model || "model seç", `${provider.label} · ${provider.model || "model seç"} (aramak için tıkla)`);
  }

  function filteredChatModels() {
    const query = (state.modelPicker?.search?.value || "").trim().toLowerCase();
    const provider = providerById(state.chatProviderId);
    let models = state.chatModels || [];
    if (!state.showPaid && provider) {
      models = models.filter((model) => isFreeModel(provider, model) || model.id === provider.model);
    }
    if (!query) return models;
    return models.filter((model) => {
      return (
        String(model.id || "").toLowerCase().includes(query) ||
        String(model.label || "").toLowerCase().includes(query)
      );
    });
  }

  async function fillChatModels(providerId) {
    const provider = providerById(providerId);
    state.chatModels = [];
    state.chatModelError = null;
    state.chatModelsLoading = false;
    if (!state.chatEls) return;
    state.chatEls.modelBtn.disabled = true;
    updateChatModelButton();
    if (!provider) {
      state.chatModelsLoading = false;
      state.chatEls.modelBtn.disabled = false;
      if (state.modelPickerOpen) renderModelPickerList();
      return;
    }
    const selected = provider.model || "";
    if (selected) state.chatModels = [{ id: selected, label: "Şu an seçili model" }];
    if (provider.kind === "mock" || provider.kind === "cli") {
      state.chatEls.modelBtn.disabled = false;
      updateChatModelButton();
      if (state.modelPickerOpen) renderModelPickerList();
      return;
    }

    state.chatModelsLoading = true;
    if (state.modelPickerOpen) renderModelPickerList();
    let entry = state.expanded.get(providerId);
    if (!entry?.models && !entry?.error) {
      try {
        const result = await api.settings.listModels({
          providerId,
          kind: provider.kind,
          baseUrl: provider.baseUrl,
          refresh: false
        });
        if (result && result.ok) {
          entry = { models: result.models || [], warning: result.warning || null, error: null };
        } else {
          entry = { models: [], error: friendlyError(result && result.error, provider.kind) };
        }
      } catch (error) {
        entry = { models: [], error: friendlyError(error, provider.kind) };
      }
      const prior = state.expanded.get(providerId) || {};
      state.expanded.set(providerId, { ...prior, ...entry });
    }
    if (state.chatProviderId !== providerId) return;
    state.chatModelsLoading = false;
    if (entry?.error) {
      state.chatModelError = entry.error;
      state.chatEls.modelBtn.disabled = false;
      updateChatModelButton();
      if (state.modelPickerOpen) renderModelPickerList();
      return;
    }
    const seen = new Set();
    const models = [];
    if (selected) {
      models.push({ id: selected, label: "Şu an seçili model" });
      seen.add(selected);
    }
    for (const model of (entry?.models || []).slice(0, 800)) {
      if (!model || !model.id || seen.has(model.id)) continue;
      seen.add(model.id);
      models.push(model);
    }
    state.chatModels = models;
    state.chatEls.modelBtn.disabled = false;
    updateChatModelButton();
    if (state.modelPickerOpen) renderModelPickerList();
    if (state.debateOpen) {
      renderDebateList();
      updateDebateButton();
    }
  }

  /* searchable model picker in the chat header                         */

  function ensureModelPicker() {
    if (state.modelPicker && state.modelPicker.pop.isConnected) return state.modelPicker;
    const pop = el("div", "pg-model-pop");
    pop.id = "pg-model-picker";
    pop.style.display = "none";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", text("modelPickerDialog"));
    pop.addEventListener("mousedown", (event) => event.stopPropagation());
    pop.addEventListener("click", (event) => event.stopPropagation());

    const head = el("div", "pg-model-pop-head");
    const search = el("input", "pg-model-pop-search");
    search.type = "search";
    search.placeholder = text("chatModelSearchPlaceholder");
    search.setAttribute("aria-label", text("searchModels"));
    const searchLabel = el("label", "pg-search-label", text("searchModels"));
    searchLabel.appendChild(search);
    const meta = el("div", "pg-model-pop-meta");
    const tools = el("div", "pg-model-tools");
    tools.appendChild(paidToggle());
    head.appendChild(searchLabel);
    head.appendChild(tools);
    head.appendChild(meta);

    const list = el("div", "pg-model-pop-list");
    list.setAttribute("role", "listbox");
    pop.appendChild(head);
    pop.appendChild(list);
    document.body.appendChild(pop);
    state.modelPicker = { pop, search, meta, list };

    search.addEventListener("input", () => {
      state.modelPickerActive = 0;
      renderModelPickerList();
    });
    search.addEventListener("keydown", (event) => {
      const models = filteredChatModels();
      if (event.key === "Escape") {
        event.preventDefault();
        closeModelPicker();
        return;
      }
      if (event.key === "ArrowDown") {
        event.preventDefault();
        if (models.length) {
          state.modelPickerActive = Math.min(state.modelPickerActive + 1, models.length - 1);
          renderModelPickerList();
        }
        return;
      }
      if (event.key === "ArrowUp") {
        event.preventDefault();
        if (models.length) {
          state.modelPickerActive = Math.max(state.modelPickerActive - 1, 0);
          renderModelPickerList();
        }
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        const model = models[state.modelPickerActive];
        if (model) pickChatModel(model.id);
      }
    });
    return state.modelPicker;
  }

  function pickChatModel(modelId) {
    const providerId = state.chatProviderId;
    closeModelPicker();
    if (providerId && modelId) chooseModel(providerId, modelId);
  }

  function renderModelPickerList() {
    const picker = state.modelPicker;
    if (!picker) return;
    const provider = providerById(state.chatProviderId);
    const models = filteredChatModels();
    state.modelPickerActive = Math.min(Math.max(state.modelPickerActive, 0), Math.max(models.length - 1, 0));

    clear(picker.meta);
    picker.meta.appendChild(el("strong", "", provider ? provider.label || provider.id : "Sağlayıcı yok"));
    const total = state.chatModels.length;
    const freeTotal = provider
      ? state.chatModels.filter((model) => isFreeModel(provider, model)).length
      : total;
    const query = (picker.search.value || "").trim();
    let countText;
    if (state.chatModelsLoading) countText = "modeller yükleniyor…";
    else if (state.showPaid) countText = `${total} model`;
    else countText = `${freeTotal} / ${total} ücretsiz`;
    if (query && !state.chatModelsLoading) countText = `${models.length} sonuç · ${countText}`;
    picker.meta.appendChild(el("span", "", countText));

    clear(picker.list);
    if (state.chatModelsLoading && models.length === 0) {
      picker.list.appendChild(el("div", "pg-model-pop-empty", "Model listesi yükleniyor…"));
      return;
    }
    if (state.chatModelError && models.length === 0) {
      const box = el("div", "pg-model-pop-empty error", state.chatModelError);
      const retry = el("button", "pg-btn", "Tekrar dene");
      retry.type = "button";
      retry.style.marginTop = "7px";
      retry.addEventListener("click", () => {
        const entry = state.expanded.get(state.chatProviderId) || {};
        state.expanded.set(state.chatProviderId, { ...entry, error: null, models: null });
        fillChatModels(state.chatProviderId);
      });
      box.appendChild(document.createElement("br"));
      box.appendChild(retry);
      picker.list.appendChild(box);
      return;
    }
    if (models.length === 0) {
      const hiddenByFree =
        !state.showPaid && state.chatModels.some((model) => provider && !isFreeModel(provider, model) && model.id !== provider.model);
      picker.list.appendChild(
        el(
          "div",
          "pg-model-pop-empty",
          hiddenByFree && !query
            ? "Bu sağlayıcıda ücretsiz model yok. Ücretli modelleri görmek için yukarıdaki tiki işaretleyin."
            : state.chatModels.length
              ? "Aramanızla eşleşen model yok."
              : "Bu sağlayıcı model listesi döndürmedi. Model adını Settings ekranından girebilirsiniz."
        )
      );
      return;
    }
    const selected = provider?.model;
    models.forEach((model, index) => {
      const row = el(
        "button",
        "pg-model-pop-item" +
          (model.id === selected ? " is-current" : "") +
          (index === state.modelPickerActive ? " is-active" : "")
      );
      row.type = "button";
      row.setAttribute("role", "option");
      row.setAttribute("aria-selected", model.id === selected ? "true" : "false");
      row.appendChild(el("span", "pg-model-id", model.id));
      if (provider && !isFreeModel(provider, model)) {
        row.appendChild(el("span", "pg-model-tag", "ücretli"));
      }
      if (model.label && model.label !== model.id) {
        row.appendChild(el("span", "pg-model-label", model.label));
      }
      row.addEventListener("mouseenter", () => {
        if (state.modelPickerActive === index) return;
        state.modelPickerActive = index;
        [...picker.list.querySelectorAll(".pg-model-pop-item")].forEach((node, nodeIndex) => {
          node.classList.toggle("is-active", nodeIndex === index);
        });
      });
      row.addEventListener("click", () => pickChatModel(model.id));
      picker.list.appendChild(row);
    });
    const activeRow = picker.list.children[state.modelPickerActive];
    if (activeRow) {
      const rowTop = activeRow.offsetTop;
      const rowBottom = rowTop + activeRow.offsetHeight;
      if (rowTop < picker.list.scrollTop) picker.list.scrollTop = rowTop;
      else if (rowBottom > picker.list.scrollTop + picker.list.clientHeight) {
        picker.list.scrollTop = rowBottom - picker.list.clientHeight;
      }
    }
  }

  function positionModelPicker() {
    const picker = state.modelPicker;
    const btn = state.chatEls?.modelBtn;
    if (!picker || !btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.min(460, window.innerWidth - 20);
    picker.pop.style.width = `${width}px`;
    picker.pop.style.left = `${Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))}px`;
    picker.pop.style.top = "8px";
    const height = picker.pop.getBoundingClientRect().height;
    const spaceBelow = window.innerHeight - rect.bottom - 10;
    if (spaceBelow >= Math.min(height, 240)) {
      picker.pop.style.top = `${rect.bottom + 6}px`;
    } else {
      picker.pop.style.top = `${Math.max(8, rect.top - height - 6)}px`;
    }
  }

  function onModelPickerOutside(event) {
    const picker = state.modelPicker;
    const btn = state.chatEls?.modelBtn;
    if (!picker || !state.modelPickerOpen) return;
    if (picker.pop.contains(event.target)) return;
    if (btn && btn.contains(event.target)) return;
    closeModelPicker();
  }

  let pickerPositionFrame = 0;
  function onModelPickerResize() {
    if (!state.modelPickerOpen || pickerPositionFrame) return;
    pickerPositionFrame = requestAnimationFrame(() => {
      pickerPositionFrame = 0;
      if (state.modelPickerOpen) positionModelPicker();
    });
  }

  function openModelPicker() {
    const picker = ensureModelPicker();
    const btn = state.chatEls?.modelBtn;
    if (!btn) return;
    state.modelPickerOpen = true;
    state.modelPickerActive = 0;
    btn.classList.add("is-open");
    picker.search.value = "";
    picker.pop.style.display = "flex";
    renderModelPickerList();
    positionModelPicker();
    picker.search.focus({ preventScroll: true });
    if (state.chatModels.length === 0 && !state.chatModelError && !state.chatModelsLoading) {
      fillChatModels(state.chatProviderId);
    }
    setTimeout(() => {
      if (state.modelPickerOpen) picker.search.focus({ preventScroll: true });
    }, 0);
    document.addEventListener("mousedown", onModelPickerOutside, true);
    window.addEventListener("resize", onModelPickerResize);
  }

  function closeModelPicker() {
    if (!state.modelPickerOpen) return;
    state.modelPickerOpen = false;
    if (state.modelPicker) state.modelPicker.pop.style.display = "none";
    if (state.chatEls?.modelBtn) state.chatEls.modelBtn.classList.remove("is-open");
    document.removeEventListener("mousedown", onModelPickerOutside, true);
    window.removeEventListener("resize", onModelPickerResize);
  }

  function toggleModelPicker() {
    if (state.modelPickerOpen) closeModelPicker();
    else openModelPicker();
  }

  async function submitPrompt() {
    if (state.running) return;
    const { input } = state.chatEls;
    const prompt = input.value.trim();
    if (!prompt) return;
    const providerId = state.chatEls.providerSelect.value;
    const provider = providerById(providerId);
    if (!provider) {
      showToast("Önce sağdaki Providers panelinden bir sağlayıcı seçin.", "error");
      return;
    }
    if (provider.kind !== "mock" && provider.kind !== "cli" && !provider.hasKey) {
      showToast(`${provider.label} için API anahtarı yok. “Add providers” ile ekleyin.`, "error");
      return;
    }

    if (state.debateEnabled) {
      const participants = getAiTalkParticipants();
      if (participants.length < 2) {
        showToast("AI Talk için en az 2 model seçin (farklı sağlayıcılardan en fazla 2'şer model seçebilirsiniz).", "error");
        openDebatePop();
        return;
      }
      for (const p of participants) {
        const prov = providerById(p.providerId);
        if (prov && prov.kind !== "mock" && prov.kind !== "cli" && !prov.hasKey) {
          showToast(`${prov.label} için API anahtarı girilmemiş. Lütfen sağlayıcı ayarlarından anahtarı kaydedin.`, "error");
          return;
        }
      }
      closeDebatePop();
      await runDebateFlow(prompt, providerId, provider);
      return;
    }

    const session = chatSession();
    session.status = "running";
    session.providerId = providerId;
    session.providerLabel = provider.label || prettyKind(provider.kind);
    session.modelName = shortModel(provider.model);
    session.speaker = shortModel(provider.model);
    state.running = true;
    pushMessage("user", prompt);
    state.forceChatScroll = true;
    input.value = "";
    input.style.height = "";
    renderChatStatus();

    const sessionId = state.sessionId;
    try {
      await api.agents.start({
        sessionId,
        providerId,
        prompt,
        agentName: "Workbench"
      });
    } catch (error) {
      const message = friendlyError(error, provider.kind);
      session.status = "error";
      state.running = false;
      pushMessage("error", message);
      renderChatStatus();
      showToast(message, "error");
    }
  }

  function handleAgentEvent(event) {
    if (!event || !event.sessionId) return;
    const session = state.sessions.get(event.sessionId);
    if (!session) return;
    const isMain = event.sessionId === state.sessionId;
    switch (event.type) {
      case "started":
        if (event.agentName) session.agentName = event.agentName;
        break;
      case "text": {
        if (session.collect) session.collect.push(event.delta || "");
        const last = session.messages[session.messages.length - 1];
        if (last && last.role === "assistant" && last.streaming) {
          last.text += event.delta || "";
        } else {
          const prov = session.providerId
            ? providerById(session.providerId)
            : (state.chatProviderId ? providerById(state.chatProviderId) : null);
          session.messages.push({
            id: newSessionId(),
            role: "assistant",
            text: event.delta || "",
            streaming: true,
            speaker: session.speaker || "",
            providerId: session.providerId || prov?.id || "",
            providerLabel: session.providerLabel || prov?.label || prettyKind(prov?.kind) || "",
            modelName: session.modelName || (prov?.model ? shortModel(prov.model) : "AI"),
            agentName: session.agentName
          });
        }
        break;
      }
      case "message":
        session.messages.push({ id: newSessionId(), role: "system", text: event.text || "" });
        break;
      case "tool-call": {
        const args = event.args ? JSON.stringify(event.args) : "";
        const text = `→ ${event.tool || "tool"} ${args.length > 220 ? args.slice(0, 220) + "…" : args}`;
        session.messages.push({ id: newSessionId(), role: "tool", text, speaker: session.speaker || "" });
        break;
      }
      case "tool-result": {
        const source = event.output ?? event.result ?? "";
        const raw = typeof source === "string" ? source : JSON.stringify(source);
        const text = String(raw ?? "").replace(/^"|"$/g, "").trim();
        if (text) {
          session.messages.push({
            id: newSessionId(),
            role: "tool",
            text: `← ${event.tool || "tool"}: ${text.slice(0, 300)}`
          });
        }
        break;
      }
      case "file-edit":
        session.messages.push({
          id: newSessionId(),
          role: "tool",
          text: `✎ ${event.edit?.relPath || event.relPath || event.path || "dosya"}`
        });
        break;
      case "status": {
        session.status = event.status || "done";
        for (const message of session.messages) message.streaming = false;
        if (event.status === "error") {
          session.messages.push({
            id: newSessionId(),
            role: "error",
            text: `${session.speaker ? session.speaker + ": " : ""}${friendlyError(event.error)}`
          });
        }
        state.activeRuns.delete(event.sessionId);
        const waiter = state.agentWaiters.get(event.sessionId);
        if (waiter) {
          state.agentWaiters.delete(event.sessionId);
          waiter({ status: session.status, error: event.error || "", text: (session.collect || []).join("") });
        }
        if (isMain) state.running = false;
        renderChatStatus();
        break;
      }
      default:
        return;
    }
    scheduleChatRender();
  }

  /* AI Talk (Multi-Provider Collaborative Debate & Implementation)     */

  const AI_TALK_ON_KEY = "pg.aitalk.on";
  const AI_TALK_SEL_KEY = "pg.aitalk.models";
  const LEGACY_DEBATE_ON_KEY = "pg.debate.on";
  const LEGACY_DEBATE_SEL_KEY = "pg.debate.models";
  const MAX_PER_PROVIDER = 2;

  function readDebatePrefs() {
    try {
      const onVal = window.localStorage.getItem(AI_TALK_ON_KEY) ?? window.localStorage.getItem(LEGACY_DEBATE_ON_KEY);
      state.debateEnabled = onVal === "1";
      const raw = window.localStorage.getItem(AI_TALK_SEL_KEY) ?? window.localStorage.getItem(LEGACY_DEBATE_SEL_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      state.debateSelection = {};
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        for (const [providerId, value] of Object.entries(parsed)) {
          if (!Array.isArray(value)) continue;
          const ids = value.filter((id) => typeof id === "string" && id.trim());
          if (ids.length) state.debateSelection[providerId] = ids.slice(0, MAX_PER_PROVIDER);
        }
      }
    } catch (error) {
      state.debateEnabled = false;
      state.debateSelection = {};
    }
  }

  function saveDebatePrefs() {
    try {
      window.localStorage.setItem(AI_TALK_ON_KEY, state.debateEnabled ? "1" : "0");
      window.localStorage.setItem(AI_TALK_SEL_KEY, JSON.stringify(state.debateSelection));
    } catch (error) {
      /* storage can be unavailable */
    }
  }

  function getAiTalkSelected(providerId) {
    if (!providerId) return [];
    return (state.debateSelection[providerId] || []).slice(0, MAX_PER_PROVIDER);
  }

  function setAiTalkSelected(providerId, ids) {
    if (!providerId) return;
    const next = (ids || []).filter(Boolean).slice(0, MAX_PER_PROVIDER);
    if (next.length) state.debateSelection[providerId] = next;
    else delete state.debateSelection[providerId];
    saveDebatePrefs();
  }

  function getAiTalkParticipants() {
    const list = [];
    const providers = state.settings?.providers || [];
    for (const provider of providers) {
      const ids = getAiTalkSelected(provider.id);
      for (const modelId of ids) {
        list.push({
          providerId: provider.id,
          providerLabel: provider.label || prettyKind(provider.kind),
          modelId,
          agentName: `${provider.label || prettyKind(provider.kind)}: ${shortModel(modelId)}`,
          label: `${provider.label || prettyKind(provider.kind)}: ${shortModel(modelId)}`
        });
      }
    }
    return list;
  }

  function currentAiTalkProviderId() {
    const providers = state.settings?.providers || [];
    if (state.aiTalkActiveProviderId && providers.some((p) => p.id === state.aiTalkActiveProviderId)) {
      return state.aiTalkActiveProviderId;
    }
    if (state.chatProviderId && providers.some((p) => p.id === state.chatProviderId)) {
      return state.chatProviderId;
    }
    return providers[0]?.id || null;
  }

  function toggleAiTalkModel(providerId, modelId) {
    if (!providerId || !modelId) return;
    const current = getAiTalkSelected(providerId);
    if (current.includes(modelId)) {
      setAiTalkSelected(providerId, current.filter((id) => id !== modelId));
    } else if (current.length >= MAX_PER_PROVIDER) {
      const prov = providerById(providerId);
      showToast(`${prov?.label || "Bu sağlayıcı"} için en fazla ${MAX_PER_PROVIDER} model seçebilirsiniz.`, "error");
      return;
    } else {
      setAiTalkSelected(providerId, [...current, modelId]);
    }
    renderDebateList();
    updateDebateButton();
  }

  async function loadModelsForAiTalk(providerId) {
    const provider = providerById(providerId);
    if (!provider) return;
    const entry = state.expanded.get(providerId) || {};
    state.expanded.set(providerId, { ...entry, loading: true, error: null });
    renderDebateList();
    if (provider.kind === "mock" || provider.kind === "cli") {
      state.expanded.set(providerId, {
        loading: false,
        models: [{ id: provider.model || provider.kind, label: "Yerel sağlayıcı modeli" }],
        error: null
      });
      renderDebateList();
      return;
    }
    try {
      const result = await api.settings.listModels({
        providerId,
        kind: provider.kind,
        baseUrl: provider.baseUrl,
        refresh: false
      });
      if (result && result.ok) {
        state.expanded.set(providerId, {
          loading: false,
          models: Array.isArray(result.models) ? result.models : [],
          error: null
        });
      } else {
        state.expanded.set(providerId, {
          loading: false,
          models: [],
          error: friendlyError(result && result.error, provider.kind)
        });
      }
    } catch (err) {
      state.expanded.set(providerId, {
        loading: false,
        models: [],
        error: friendlyError(err, provider.kind)
      });
    }
    renderDebateList();
  }

  function updateDebateButton() {
    const els = state.chatEls;
    if (!els || !els.debateBtn) return;
    const on = state.debateEnabled;
    const count = getAiTalkParticipants().length;
    els.debateBtn.classList.toggle("is-on", on);
    els.debateBtn.setAttribute("aria-pressed", on ? "true" : "false");
    els.debateBadge.textContent = String(count);
    els.debateBadge.hidden = !on;
    els.debateBtn.title = on
      ? `AI Talk açık, ${count} model birlikte çalışır`
      : "AI Talk: Farklı sağlayıcılardan modeller seçin";
  }

  function renderDebateList() {
    const box = state.debate;
    if (!box) return;
    const activeProvId = currentAiTalkProviderId();
    const provider = providerById(activeProvId);
    const providers = state.settings?.providers || [];
    const allParticipants = getAiTalkParticipants();

    // 1. Render selected chips
    clear(box.chips);
    if (allParticipants.length === 0) {
      box.chips.appendChild(el("span", "pg-debate-empty-inline", "Henüz model seçilmedi. Aşağıdaki sağlayıcılardan model seçin."));
    } else {
      for (const p of allParticipants) {
        const chip = el("span", "pg-aitalk-chip");
        chip.textContent = `${p.providerLabel}: ${shortModel(p.modelId)}`;
        const del = el("button", "pg-aitalk-chip-del", " ×");
        del.type = "button";
        del.title = "Kaldır";
        del.addEventListener("click", (e) => {
          e.stopPropagation();
          toggleAiTalkModel(p.providerId, p.modelId);
        });
        chip.appendChild(del);
        box.chips.appendChild(chip);
      }
    }

    // 2. Render provider tabs
    clear(box.tabs);
    for (const prov of providers) {
      const pickedCount = getAiTalkSelected(prov.id).length;
      const tab = el(
        "button",
        "pg-provider-tab" + (prov.id === activeProvId ? " is-active" : "")
      );
      tab.type = "button";
      tab.textContent = `${prov.label} (${pickedCount}/${MAX_PER_PROVIDER})`;
      tab.addEventListener("click", () => {
        state.aiTalkActiveProviderId = prov.id;
        renderDebateList();
        const entry = state.expanded.get(prov.id);
        if (!entry?.models && !entry?.loading) {
          loadModelsForAiTalk(prov.id);
        }
      });
      box.tabs.appendChild(tab);
    }

    // 3. Render model list for active provider
    clear(box.list);
    if (!provider) {
      box.list.appendChild(el("div", "pg-debate-empty", "Önce bir sağlayıcı seçin."));
      box.count.textContent = "";
      box.footNote.textContent = "";
      return;
    }

    const selectedForProv = getAiTalkSelected(activeProvId);
    box.count.textContent = `${provider.label}: ${selectedForProv.length}/${MAX_PER_PROVIDER} seçili (Toplam: ${allParticipants.length})`;

    const entry = state.expanded.get(activeProvId) || {};
    if (entry.loading) {
      box.list.appendChild(el("div", "pg-debate-empty", "Modeller yükleniyor…"));
    } else if (entry.error) {
      const errBox = el("div", "pg-debate-empty", `${entry.error} `);
      const retry = el("button", "pg-btn", "Tekrar dene");
      retry.type = "button";
      retry.style.padding = "2px 8px";
      retry.style.fontSize = "11px";
      retry.addEventListener("click", () => loadModelsForAiTalk(activeProvId));
      errBox.appendChild(retry);
      box.list.appendChild(errBox);
    } else {
      let pool = (entry.models && entry.models.length > 0) ? entry.models : [];
      if (pool.length === 0 && provider.model) {
        pool = [{ id: provider.model, label: `Yapılandırılmış model (${provider.model})` }];
      }
      const query = (box.search?.value || "").trim().toLowerCase();
      let candidates = pool;
      if (!state.showPaid && provider) {
        candidates = candidates.filter(
          (m) => isFreeModel(provider, m) || selectedForProv.includes(m.id)
        );
      }
      if (query) {
        candidates = candidates.filter(
          (m) =>
            String(m.id || "").toLowerCase().includes(query) ||
            String(m.label || "").toLowerCase().includes(query)
        );
      }

      if (candidates.length === 0) {
        box.list.appendChild(
          el(
            "div",
            "pg-debate-empty",
            pool.length ? "Aramanızla eşleşen model yok." : "Bu sağlayıcı için model listesi boş."
          )
        );
      } else {
        for (const model of candidates.slice(0, 600)) {
          const picked = selectedForProv.includes(model.id);
          const atMax = !picked && selectedForProv.length >= MAX_PER_PROVIDER;
          const row = el(
            "button",
            "pg-debate-item" + (picked ? " is-picked" : "") + (atMax ? " is-locked" : "")
          );
          row.type = "button";
          row.setAttribute("aria-pressed", picked ? "true" : "false");
          const tick = el("input", "");
          tick.type = "checkbox";
          tick.checked = picked;
          tick.disabled = atMax;
          tick.tabIndex = -1;
          row.appendChild(tick);
          const body = el("div", "pg-debate-item-body");
          body.appendChild(el("span", "pg-debate-item-id", model.id));
          if (model.label && model.label !== model.id) {
            body.appendChild(el("span", "pg-debate-item-label", model.label));
          }
          row.appendChild(body);
          row.addEventListener("click", () => toggleAiTalkModel(activeProvId, model.id));
          box.list.appendChild(row);
        }
      }
    }

    const total = allParticipants.length;
    box.footNote.textContent =
      total < 2
        ? "En az 2 model seçin (farklı sağlayıcılardan en fazla 2'şer model)."
        : `${total} model birlikte çalışarak ortak çözüm üretecek.`;
  }

  function ensureDebatePop() {
    if (state.debate && state.debate.pop.isConnected) return state.debate;
    const pop = el("div", "pg-debate-pop");
    pop.id = "pg-debate-pop";
    pop.setAttribute("role", "dialog");
    pop.setAttribute("aria-label", "AI Talk");
    pop.addEventListener("mousedown", (event) => event.stopPropagation());
    pop.addEventListener("click", (event) => event.stopPropagation());

    const head = el("div", "pg-debate-head");
    const title = el("div", "pg-debate-title");
    const modeWrap = el("label", "pg-debate-switch");
    const modeTick = el("input", "pg-paid-tick");
    modeTick.type = "checkbox";
    modeTick.checked = state.debateEnabled;
    modeTick.addEventListener("click", (event) => event.stopPropagation());
    modeTick.addEventListener("change", () => {
      state.debateEnabled = modeTick.checked;
      saveDebatePrefs();
      updateDebateButton();
    });
    modeWrap.appendChild(modeTick);
    modeWrap.appendChild(el("span", "", "AI Talk"));
    title.appendChild(modeWrap);
    title.appendChild(el("span", "pg-debate-hint", "Sağlayıcı başına maks. 2 model"));
    head.appendChild(title);

    const chips = el("div", "pg-aitalk-chips");
    head.appendChild(chips);

    const tabs = el("div", "pg-provider-tabs");
    head.appendChild(tabs);

    const search = el("input", "pg-debate-search");
    search.type = "search";
    search.placeholder = text("modelSearchPlaceholder");
    search.setAttribute("aria-label", text("searchModels"));
    const searchLabel = el("label", "pg-search-label", text("searchModels"));
    searchLabel.appendChild(search);
    head.appendChild(searchLabel);

    const tools = el("div", "pg-model-tools");
    tools.appendChild(paidToggle());
    const count = el("span", "pg-model-count", "");
    tools.appendChild(count);
    head.appendChild(tools);

    const list = el("div", "pg-debate-list");
    list.setAttribute("role", "listbox");
    list.setAttribute("aria-multiselectable", "true");

    const foot = el("div", "pg-debate-foot");
    const footNote = el("span", "", "");
    const resetBtn = el("button", "pg-btn", "Tümünü Sıfırla");
    resetBtn.type = "button";
    resetBtn.addEventListener("click", () => {
      state.debateSelection = {};
      saveDebatePrefs();
      renderDebateList();
      updateDebateButton();
    });
    foot.appendChild(footNote);
    foot.appendChild(resetBtn);

    pop.appendChild(head);
    pop.appendChild(list);
    pop.appendChild(foot);
    document.body.appendChild(pop);

    search.addEventListener("input", renderDebateList);
    search.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDebatePop();
      }
    });

    state.debate = { pop, search, list, count, footNote, modeTick, chips, tabs };
    return state.debate;
  }

  function positionDebatePop() {
    const box = state.debate;
    const btn = state.chatEls?.debateBtn;
    if (!box || !btn) return;
    const rect = btn.getBoundingClientRect();
    const width = Math.min(460, window.innerWidth - 20);
    box.pop.style.width = `${width}px`;
    box.pop.style.left = `${Math.max(8, Math.min(rect.left, window.innerWidth - width - 8))}px`;
    const height = box.pop.getBoundingClientRect().height;
    const spaceBelow = window.innerHeight - rect.bottom - 10;
    box.pop.style.top =
      spaceBelow >= Math.min(height, 240)
        ? `${rect.bottom + 6}px`
        : `${Math.max(8, rect.top - height - 6)}px`;
  }

  function onDebateOutside(event) {
    const box = state.debate;
    const btn = state.chatEls?.debateBtn;
    if (!box || !state.debateOpen) return;
    if (box.pop.contains(event.target)) return;
    if (btn && btn.contains(event.target)) return;
    closeDebatePop();
  }

  function openDebatePop() {
    closeModelPicker();
    const box = ensureDebatePop();
    const btn = state.chatEls?.debateBtn;
    if (!btn) return;
    state.debateOpen = true;
    box.modeTick.checked = state.debateEnabled;
    box.search.value = "";
    box.pop.classList.add("pg-open");
    box.pop.style.display = "flex";

    const activeProvId = currentAiTalkProviderId();
    if (activeProvId) {
      const entry = state.expanded.get(activeProvId);
      if (!entry?.models && !entry?.loading) {
        loadModelsForAiTalk(activeProvId);
      }
    }
    renderDebateList();
    updateDebateButton();
    positionDebatePop();
    box.search.focus({ preventScroll: true });
    document.addEventListener("mousedown", onDebateOutside, true);
    window.addEventListener("resize", positionDebatePop);
  }

  function closeDebatePop() {
    if (!state.debateOpen) return;
    state.debateOpen = false;
    if (state.debate) {
      state.debate.pop.classList.remove("pg-open");
      state.debate.pop.style.display = "none";
    }
    document.removeEventListener("mousedown", onDebateOutside, true);
    window.removeEventListener("resize", positionDebatePop);
  }

  function toggleDebatePop() {
    if (state.debateOpen) closeDebatePop();
    else openDebatePop();
  }

  function pushDivider(text) {
    const session = chatSession();
    session.messages.push({ id: newSessionId(), role: "divider", text });
    scheduleChatRender();
  }

  async function startCouncilRun(options) {
    const { agentName, model, prompt, providerId, mode, messages } = options;
    const sessionId = `${state.sessionId}-d${Date.now().toString(36)}${Math.random()
      .toString(36)
      .slice(2, 6)}`;
    const prov = providerById(providerId);
    const session = {
      id: sessionId,
      messages,
      status: "running",
      agentName,
      speaker: agentName,
      providerId,
      providerLabel: prov?.label || prettyKind(prov?.kind) || providerId,
      modelName: shortModel(model),
      collect: []
    };
    state.sessions.set(sessionId, session);
    state.activeRuns.add(sessionId);
    const done = new Promise((resolve) => state.agentWaiters.set(sessionId, resolve));
    try {
      await api.agents.start({ sessionId, providerId, model, prompt, agentName, mode });
    } catch (error) {
      state.agentWaiters.delete(sessionId);
      state.activeRuns.delete(sessionId);
      const message = friendlyError(error);
      messages.push({ id: newSessionId(), role: "error", text: `${agentName}: ${message}` });
      scheduleChatRender();
      return { status: "error", error: message, text: "" };
    }
    return done;
  }

  const clip = (text, max) => {
    const value = String(text || "").trim();
    return value.length > max ? `${value.slice(0, max)}\n…` : value;
  };

  async function stopAllAgents() {
    const ids = new Set(state.activeRuns);
    if (state.sessionId) ids.add(state.sessionId);
    state.debateAbort = true;
    for (const id of ids) {
      try {
        await api.agents.cancel(id);
      } catch (error) {
        /* a finished run cannot be cancelled */
      }
    }
  }

  async function runDebateFlow(prompt, defaultProviderId, defaultProvider) {
    const session = chatSession();
    session.status = "running";
    state.running = true;
    state.debateAbort = false;
    pushMessage("user", prompt);
    state.forceChatScroll = true;
    state.chatEls.input.value = "";
    state.chatEls.input.style.height = "";
    renderChatStatus();

    const participants = getAiTalkParticipants();
    if (participants.length === 0) {
      pushMessage("error", "AI Talk için hiç model seçilmedi.");
      return;
    }

    const proposals = [];
    const critiques = [];
    let synthesis = "";

    try {
      /* round 1 - proposals & analysis across all chosen providers */
      pushDivider(`1. tur · analiz ve öneri (${participants.length} model)`);
      for (const participant of participants) {
        if (state.debateAbort) return;
        const earlier = proposals
          .map((item) => `### ${item.label}\n${clip(item.text, 4000)}`)
          .join("\n\n");
        const ask = [
          "AI TALK, ROUND 1: PROPOSAL & ANALYSIS",
          "",
          "User request:",
          prompt,
          "",
          earlier
            ? `Proposals from models that answered before you:\n\n${earlier}`
            : "You speak first; there are no other proposals yet.",
          "",
          `You are participating in AI Talk as representative model "${participant.label}".`,
          "Analyze the user's request from your perspective. Propose the best technical solution, design, and plan.",
          "Be concrete: which files matter, what needs to be created or changed, and the trade-offs you see.",
          "Do not echo the other proposals; build on them or contradict them with reasons. Max ~250 words.",
          "Reply in the same language the user wrote in."
        ].join("\n");
        state.debateStage = `1/3 öneri · ${participant.label}`;
        renderChatStatus();
        const result = await startCouncilRun({
          agentName: participant.label,
          model: participant.modelId,
          prompt: ask,
          providerId: participant.providerId,
          mode: "debate",
          messages: session.messages
        });
        if (state.debateAbort) return;
        if (result.status === "done" && result.text.trim()) {
          proposals.push({ label: participant.label, text: result.text.trim() });
        } else if (result.status === "error") {
          pushMessage("error", `${participant.label} yanıt veremedi: ${result.error || "Bilinmeyen hata"}`);
        }
      }
      if (!proposals.length) {
        pushMessage("error", "AI Talk tamamlanamadı: modellerden yanıt alınamadı.");
        return;
      }
      const proposalText = proposals
        .map((item) => `### ${item.label}\n${clip(item.text, 5000)}`)
        .join("\n\n");

      /* round 2 - critique & comparison across providers */
      pushDivider("2. tur · karşılaştırma ve eleştiri");
      for (const participant of participants) {
        if (state.debateAbort) return;
        const earlier = critiques
          .map((item) => `### ${item.label}\n${clip(item.text, 3000)}`)
          .join("\n\n");
        const ask = [
          "AI TALK, ROUND 2: CRITIQUE & COMPARISON",
          "",
          "User request:",
          prompt,
          "",
          `Proposals from all models across providers:\n\n${proposalText}`,
          earlier ? `Critiques already raised:\n\n${earlier}` : "",
          "",
          `You are "${participant.label}". You are a strict reviewer.`,
          "Compare the proposals. Pick the strongest proposal and explain why.",
          "Then list concrete problems in the other proposals (and in the strongest one) with the exact fixes you recommend.",
          "Call out anything that would break, missing edge cases, and architectural flaws.",
          "Do not restate the whole proposal. Max ~200 words.",
          "Reply in the same language the user wrote in."
        ].join("\n");
        state.debateStage = `2/3 eleştiri · ${participant.label}`;
        renderChatStatus();
        const result = await startCouncilRun({
          agentName: participant.label,
          model: participant.modelId,
          prompt: ask,
          providerId: participant.providerId,
          mode: "debate",
          messages: session.messages
        });
        if (state.debateAbort) return;
        if (result.status === "done" && result.text.trim()) {
          critiques.push({ label: participant.label, text: result.text.trim() });
        } else if (result.status === "error") {
          pushMessage("error", `${participant.label} eleştiri sunamadı: ${result.error || "Hata"}`);
        }
      }
      const critiqueText = critiques
        .map((item) => `### ${item.label}\n${clip(item.text, 4000)}`)
        .join("\n\n");

      /* round 3 - chair synthesis */
      const chair = participants[0];
      pushDivider(`3. tur · ortak sentez (${chair.label})`);
      state.debateStage = `3/3 sentez · ${chair.label}`;
      renderChatStatus();
      const synthAsk = [
        "AI TALK, ROUND 3: FINAL SYNTHESIS & CONSENSUS",
        "",
        "User request:",
        prompt,
        "",
        `Proposals:\n\n${proposalText}`,
        critiqueText ? `Critiques and comparisons:\n\n${critiqueText}` : "",
        "",
        `You are the chair (${chair.label}). All participating models from various providers have finished their debate.`,
        "Produce ONE final unified plan that combines the best ideas and addresses every valid critique.",
        "Resolve disagreements explicitly: for each contested point state which approach wins and why.",
        "Output a numbered, concrete implementation plan with exact file paths and logic. Max ~350 words.",
        "Reply in the same language the user wrote in."
      ].join("\n");
      const chairResult = await startCouncilRun({
        agentName: `Sentez · ${chair.label}`,
        model: chair.modelId,
        prompt: synthAsk,
        providerId: chair.providerId,
        mode: "debate",
        messages: session.messages
      });
      if (state.debateAbort) return;
      if (chairResult.status === "done" && chairResult.text.trim()) {
        synthesis = chairResult.text.trim();
      } else {
        synthesis = proposals
          .map((item) => `- ${item.label}: ${clip(item.text, 900)}`)
          .join("\n");
      }

      /* implementation - builder model writes the code */
      const builderProvider = defaultProvider || providerById(chair.providerId) || participants[0];
      const builderProviderId = defaultProviderId || chair.providerId;
      const builderModel = builderProvider.model || chair.modelId;
      pushDivider(`uygulama · ${shortModel(builderModel)}`);
      state.debateStage = `uygulama · ${shortModel(builderModel)}`;
      session.speaker = shortModel(builderModel);
      renderChatStatus();
      const implAsk = [
        "AI Talk models across multiple providers debated the user's request and reached an agreed plan below.",
        "",
        "User request:",
        prompt,
        "",
        "Agreed Solution & Plan:",
        synthesis,
        "",
        "Implement this plan now in the project using your tools. Keep changes targeted, follow the agreed plan, and finish with a summary of what you implemented."
      ].join("\n");
      const done = new Promise((resolve) => state.agentWaiters.set(state.sessionId, resolve));
      try {
        await api.agents.start({
          sessionId: state.sessionId,
          providerId: builderProviderId,
          model: builderModel,
          prompt: implAsk,
          agentName: `Uygulama · ${shortModel(builderModel)}`,
          mode: "build"
        });
        await done;
      } catch (error) {
        const message = friendlyError(error);
        session.messages.push({ id: newSessionId(), role: "error", text: message });
        session.status = "error";
        showToast(message, "error");
      }
    } finally {
      const aborted = state.debateAbort;
      state.debateAbort = false;
      state.debateStage = "";
      state.running = false;
      state.activeRuns.clear();
      session.speaker = "";
      if (aborted) {
        session.status = "cancelled";
        session.messages.push({
          id: newSessionId(),
          role: "system",
          text: "AI Talk durduruldu."
        });
      } else if (session.status === "running") {
        session.status = "done";
      }
      renderChatStatus();
      scheduleChatRender();
    }
  }

  function buildChatDock() {
    closeModelPicker();
    closeDebatePop();
    const dock = el("div", "pg-chat-dock");
    dock.id = "pg-chat-dock";

    const head = el("div", "pg-chat-head");
    head.appendChild(el("span", "pg-chat-title", "Chat"));
    const where = el("span", "pg-chat-where", "klasör yok");
    head.appendChild(where);
    head.appendChild(el("span", "pg-chat-spacer"));

    const providerSelect = el("select", "pg-chat-select");
    providerSelect.setAttribute("aria-label", "Sağlayıcı");
    providerSelect.title = "Sağlayıcı seç";
    const modelBtn = el("button", "pg-chat-select pg-chat-model-btn");
    modelBtn.type = "button";
    modelBtn.setAttribute("aria-label", "Model ara ve seç");
    modelBtn.setAttribute("aria-haspopup", "dialog");
    modelBtn.title = "Model ara ve seç";
    const modelBtnText = el("span", "pg-model-btn-text", "model seç");
    modelBtn.appendChild(modelBtnText);
    const statusNode = el("span", "pg-chat-status");
    statusNode.appendChild(el("span", "pg-pulse"));
    statusNode.appendChild(el("span", "", "Hazır"));
    const debateBtn = el("button", "pg-chat-select pg-debate-btn");
    debateBtn.type = "button";
    debateBtn.setAttribute("aria-haspopup", "dialog");
    debateBtn.setAttribute("aria-pressed", "false");
    debateBtn.appendChild(el("span", "", "AI Talk"));
    const debateBadge = el("span", "pg-debate-badge", "0");
    debateBadge.hidden = true;
    debateBtn.appendChild(debateBadge);
    head.appendChild(providerSelect);
    head.appendChild(modelBtn);
    head.appendChild(debateBtn);
    head.appendChild(statusNode);
    dock.appendChild(head);

    debateBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleDebatePop();
    });

    providerSelect.addEventListener("change", () => {
      closeModelPicker();
      closeDebatePop();
      state.chatProviderId = providerSelect.value;
      fillChatModels(state.chatProviderId);
      updateDebateButton();
    });
    modelBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleModelPicker();
    });

    const log = el("div", "pg-chat-log");
    log.setAttribute("role", "log");
    log.setAttribute("aria-live", "polite");
    dock.appendChild(log);

    const composer = el("div", "pg-composer");
    const input = el("textarea", "pg-chat-input");
    input.rows = 1;
    input.placeholder = "Agent'a bir görev yazın… (Ctrl+Enter ile gönder)";
    input.setAttribute("aria-label", "Chat mesajı");
    input.addEventListener("input", () => {
      input.style.height = "auto";
      input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
    });
    input.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        submitPrompt();
      }
    });
    const sendBtn = el("button", "pg-btn primary", "Gönder");
    sendBtn.type = "button";
    sendBtn.addEventListener("click", submitPrompt);
    const stopBtn = el("button", "pg-btn danger", "Durdur");
    stopBtn.type = "button";
    stopBtn.hidden = true;
    stopBtn.addEventListener("click", async () => {
      await stopAllAgents();
    });
    composer.appendChild(input);
    composer.appendChild(sendBtn);
    composer.appendChild(stopBtn);
    dock.appendChild(composer);

    state.chatEls = {
      dock,
      where,
      providerSelect,
      modelBtn,
      modelBtnText,
      debateBtn,
      debateBadge,
      statusNode,
      log,
      input,
      sendBtn,
      stopBtn
    };
    state.chatEl = dock;
    state.chatMounted = true;
    updateDebateButton();
    return dock;
  }

  function applyChatVisibility() {
    if (!state.chatEl) return;
    const visible = Boolean(state.root);
    state.chatEl.style.display = visible ? "flex" : "none";
    if (!visible) {
      closeModelPicker();
      closeDebatePop();
    }
    const center = state.chatEl.parentElement;
    if (center) center.classList.toggle("pg-chat-on", visible);
    if (state.chatEls) {
      state.chatEls.where.textContent = state.workspaceName
        ? `çalışma alanı: ${state.workspaceName}`
        : "klasör yok";
      state.chatEls.where.title = state.root || "";
    }
    if (visible) requestAnimationFrame(() => window.dispatchEvent(new Event("resize")));
  }

  function ensureChat() {
    const center = document.querySelector(".center-column");
    if (!center) return;
    if (!state.chatEl || !state.chatEl.isConnected) {
      const dock = buildChatDock();
      center.appendChild(dock);
      syncChatProviders();
      renderChatLog();
      renderChatStatus();
    } else if (state.chatEl.parentElement !== center) {
      center.appendChild(state.chatEl);
    }
    applyChatVisibility();
  }


  /* mounting                                                           */

  async function pollWorkspace() {
    try {
      const current = await api.workspace.current();
      const root = current?.root || null;
      if (root !== state.root) {
        if (state.running) {
          stopAllAgents().catch(() => {});
        }
        state.root = root;
        state.workspaceName = current?.name || (root ? root.split(/[\\/]/).pop() : "");
        state.sessionId = null;
        state.running = false;
        state.sessions.clear();
        if (state.chatEls) {
          const session = { id: newSessionId(), messages: [], status: "idle", agentName: "Agent" };
          state.sessions.set(session.id, session);
        }
        ensureChat();
        applyChatVisibility();
        renderChatLog();
        renderChatStatus();
      } else if (current?.name && current.name !== state.workspaceName) {
        state.workspaceName = current.name;
        applyChatVisibility();
      }
    } catch (error) {
      /* workspace IPC can fail briefly during teardown */
    }
  }

  function ensureMount() {
    ensureStyles();
    ensureProviders();
    ensureChat();
    ensureGearButton();
  }

  let mountTimer = 0;
  function scheduleMount() {
    if (mountTimer) return;
    mountTimer = setTimeout(() => {
      mountTimer = 0;
      ensureMount();
    }, 60);
  }

  async function boot() {
    if (window.__pgWorkbenchActive) return;
    window.__pgWorkbenchActive = true;

    ensureStyles();
    readDebatePrefs();
    await loadSettings({ quiet: true });
    ensureMount();
    await pollWorkspace();
    ensureMount();

    try {
      api.agents.onEvent((event) => handleAgentEvent(event));
    } catch (error) {
      console.warn("[workbench] could not subscribe to agent events", error);
    }

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.addedNodes.length || mutation.removedNodes.length) {
          scheduleMount();
          return;
        }
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });

    setInterval(pollWorkspace, 800);
    setInterval(() => {
      if (document.visibilityState === "visible" && state.providerEl?.isConnected) {
        loadSettings();
      }
    }, 2500);
  }

  /* Tiny read/act bridge used by the opencode shell patch (oc-shell.js).
   * It exposes session bookkeeping only; rendering stays in this file. */
  window.pgWorkbench = {
    newSession() {
      state.sessionId = null;
      state.running = false;
      ensureChat();
      if (state.chatEls) clear(state.chatEls.log);
      renderChatLog();
      renderChatStatus();
      return true;
    },
    sessions() {
      return [...state.sessions.values()].map((session) => ({
        id: session.id,
        count: session.messages.length,
        status: session.status,
        agentName: session.agentName
      }));
    },
    currentId() {
      return state.sessionId;
    },
    useSession(id) {
      if (!state.sessions.has(id)) return false;
      state.sessionId = id;
      state.running = false;
      if (state.chatEls) clear(state.chatEls.log);
      renderChatLog();
      renderChatStatus();
      return true;
    },
    isRunning: () => Boolean(state.running)
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
