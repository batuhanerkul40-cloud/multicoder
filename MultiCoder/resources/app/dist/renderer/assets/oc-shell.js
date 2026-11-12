/* MultiCoder - "opencode" shell
 *
 * A minimal, single-stream workbench laid over the shipped React chrome.
 * It does not rebuild the app: chat-workbench.js keeps owning the agent
 * engine (sessions, streaming, model picker) and this file only
 *   • hides the VS Code-style chrome (activity bar, sidebar, tabs, status bar,
 *     agent panel) and re-lays out the existing chat dock,
 *   • decorates the transcript into opencode-style rows (hidden raw text,
 *     formatted view, collapsible tool calls),
 *   • adds the keyboard-first surfaces: slash commands, @ file picker,
 *     ! shell, command palette, theme picker, editor slide-over.
 *
 * Layout lives in oc-shell.css. Everything is scoped to html[data-oc="1"], so
 * /classic restores the original layout with one attribute.
 *
 * Conventions follow the other patches in this folder: plain IIFE, no build
 * step, CSP-safe (external script, no eval, no innerHTML with user data).
 */
(() => {
  "use strict";

  const api = window.polyglot;
  if (!api) return;
  if (window.__pgOcShell) return;
  window.__pgOcShell = true;

  /* strings                                                             */

  const STRINGS = {
    tr: {
      ready: "Hazır",
      send: "Gönder",
      stop: "Durdur",
      noWorkspace: "klasör açılmadı",
      workspace: "çalışma alanı",
      commands: "Komutlar",
      files: "Dosyalar",
      theme: "Tema",
      help: "Kısayollar",
      sessions: "Oturumlar",
      filterCommands: "Komut ara…",
      filterFiles: "Dosya ara…",
      noMatch: "Eşleşme yok",
      noSessions: "Henüz oturum yok",
      hint: "agent: Tab · komutlar: Ctrl+P · dosya: @ · kabuk: ! · durdur: Esc",
      chips: { files: "Dosyalar", editor: "Editör", theme: "Tema", settings: "Sağlayıcılar" },
      newSession: "Yeni oturum",
      newSessionDesc: "Akışı temizle, yeni bir oturum başlat",
      pickModel: "Model seç",
      pickModelDesc: "Sağlayıcının model listesini aç",
      providers: "Sağlayıcı ve anahtarlar",
      providersDesc: "Sağlayıcılar penceresini aç",
      themeDesc: "Malzeme ve tipografi",
      lang: "Dil: Türkçe",
      langDesc: "Arayüz dilini değiştir",
      filesDesc: "Dosya gezginini aç",
      editorDesc: "Kod editörünü aç/kapat",
      extensions: "Uzantılar",
      extensionsDesc: "Uzantı panelini aç",
      details: "Tool ayrıntıları",
      detailsDesc: "Tool çıktılarını varsayılan açık yap",
      stopDesc: "Süren akışı durdur",
      classic: "Klasik düzen",
      classicDesc: "VS Code tarzı arayüze dön",
      helpDesc: "Tuş haritası",
      sessionsDesc: "Önceki oturumlara dön",
      open: "Aç",
      copy: "Kopyala",
      copied: "Kopyalandı",
      shellRunning: "çalışıyor…",
      shellDone: "bitti",
      shellFailed: "başarısız",
      stopped: "Durduruldu",
      noApi: "Bu sürümde kullanılamıyor",
      welcome: "Bir görev yaz. / komutlar · @ dosya · ! kabuk",
      brand: "MultiCoder",
      welcomeSub: "Bir klasör aç ya da aşağıya bir görev yaz.",
      welcomeCta: "Klasör aç",
      welcomeGhost: "Komutlar",
      metaLabel: "Çalışma alanı",
      metaFolder: "Klasör",
      metaNoFolder: "açık değil",
      winMin: "Simge durumuna küçült",
      winMax: "Büyüt",
      winRestore: "Geri yükle",
      winClose: "Kapat",
      appearance: "Görünüm",
      appearanceClose: "Görünüm ayarlarını kapat",
      themeKicker: "Renk teması",
      themeHeading: "Tema",
      themeDescription: "Üç malzeme. Seçim anında uygulanır ve kaydedilir.",
      themeSelection: "Tema seçimi",
      themeEngineUnavailable: "Tema motoru yüklenemedi.",
      themeGraphite: "Grafit",
      themeLedger: "Defter",
      themeBlueprint: "Aydınger",
      taglineGraphite: "Grafit ve gümüş",
      taglineLedger: "Kâğıt ve mürekkep",
      taglineBlueprint: "Çizim masası",
      active: "Etkin",
      typeKicker: "Tipografi",
      typeHeading: "Yazı tipi",
      typeDescription: "Arayüz, sohbet ve panel metinleri için yazı karakteri.",
      typeSelection: "Yazı tipi seçimi",
      typeInstrument: "Ölçü",
      typeDrawing: "Çizim",
      typeBook: "Kitap",
      typeNoteInstrument: "Sitka · Segoe UI",
      typeNoteDrawing: "Bahnschrift · Cascadia",
      typeNoteBook: "Constantia · Candara",
      typeNote: "Kod düzenleyicisi kendi sabit yazı tipini korur; bu seçim arayüz yazı tipini değiştirir.",
      selectionSaved: "Seçim otomatik kaydedilir.",
      currentThemePrefix: "Tema: ",
      currentTypefacePrefix: "Yazı: ",
      themeToastPrefix: "Tema: ",
      typeToastPrefix: "Yazı tipi: ",
      searchModels: "Modellerde ara",
      modelSearchPlaceholder: "Model ara…",
      chatModelSearchPlaceholder: "Model ara… (ör. claude, gpt-4o)",
      modelPickerDialog: "Model ara ve seç",
      providerModelSearch: "Sağlayıcı modellerinde ara",
      showPaidModels: "Ücretli modelleri de göster",
      refresh: "Yenile",
      retry: "Tekrar dene",
      models: "Modeller",
      modelsLoading: "Modeller sağlayıcıdan alınıyor…",
      modelListError: "Model listesi alınamadı.",
      modelNetworkError: "Sunucuya ulaşılamadı. Yerel bir sunucu (Ollama, LM Studio, vLLM) kullanıyorsanız çalıştığından ve adresin doğru olduğundan emin olun; bulut sağlayıcıda internet bağlantısını kontrol edin.",
      modelApiKeyError: "Bu sağlayıcı geçerli bir API anahtarı istiyor. Anahtarı yazıp Save'e basın; liste otomatik yenilenir.",
      modelTimeoutError: "İstek zaman aşımına uğradı. Yenile ile tekrar deneyin.",
      modelRateLimitError: "Sağlayıcı istek sınırına takıldı. Bir süre sonra Yenile ile tekrar deneyin.",
      modelResultCount: "{count} sonuç · {free} ücretsiz",
      modelFreeCount: "{free} / {total} ücretsiz",
      modelFilteredCount: "{count} / {total} model",
      modelTotalCount: "{count} model",
      modelListLabel: "Model listesi",
      savedModelMissing: "Kayıtlı model ({model}) sağlayıcının {list} listesinde yok.",
      providerFreeModelsEmpty: "Bu sağlayıcıda ücretsiz model yok. Ücretli modelleri görmek için yukarıdaki tiki işaretleyin.",
      modelNoMatch: "Eşleşen model yok.",
      modelProviderEmpty: "Sağlayıcı model listesi döndürmedi.",
      paid: "ücretli",
      free: "ücretsiz",
      chatModelsLoading: "Modeller yükleniyor…",
      noProvider: "Sağlayıcı yok",
      noProviders: "Henüz sağlayıcı yok. Yukarıdaki “Add providers” düğmesiyle ekleyin.",
      providersLoading: "Sağlayıcılar yükleniyor…",
      extensionSearchMore: "Daha fazla eklenti ara…",
      extensionSearchLabel: "Eklenti ara",
      extensionSearchPlaceholder: "Eklenti ara (Open VSX / Marketplace)…",
      search: "Ara"
    },
    en: {
      ready: "Ready",
      send: "Send",
      stop: "Stop",
      noWorkspace: "no folder open",
      workspace: "workspace",
      commands: "Commands",
      files: "Files",
      theme: "Theme",
      help: "Shortcuts",
      sessions: "Sessions",
      filterCommands: "Search commands…",
      filterFiles: "Search files…",
      noMatch: "No match",
      noSessions: "No sessions yet",
      hint: "agent: Tab · commands: Ctrl+P · file: @ · shell: ! · stop: Esc",
      chips: { files: "Files", editor: "Editor", theme: "Theme", settings: "Providers" },
      newSession: "New session",
      newSessionDesc: "Clear the stream and start a fresh session",
      pickModel: "Pick model",
      pickModelDesc: "Open the provider's model list",
      providers: "Providers and keys",
      providersDesc: "Open the settings dialog",
      themeDesc: "Material and typography",
      lang: "Language: English",
      langDesc: "Switch the interface language",
      filesDesc: "Open the file explorer",
      editorDesc: "Toggle the code editor",
      extensions: "Extensions",
      extensionsDesc: "Open the extensions panel",
      details: "Tool details",
      detailsDesc: "Expand tool output by default",
      stopDesc: "Interrupt the running stream",
      classic: "Classic layout",
      classicDesc: "Go back to the VS Code-style UI",
      helpDesc: "Key map",
      sessionsDesc: "Return to an earlier session",
      open: "Open",
      copy: "Copy",
      copied: "Copied",
      shellRunning: "running…",
      shellDone: "done",
      shellFailed: "failed",
      stopped: "Stopped",
      noApi: "Not available in this build",
      welcome: "Type a task. / commands · @ file · ! shell",
      brand: "MultiCoder",
      welcomeSub: "Open a folder or type a task below.",
      welcomeCta: "Open folder",
      welcomeGhost: "Commands",
      metaLabel: "Workspace",
      metaFolder: "Folder",
      metaNoFolder: "not open",
      winMin: "Minimize",
      winMax: "Maximize",
      winRestore: "Restore",
      winClose: "Close",
      appearance: "Appearance",
      appearanceClose: "Close appearance settings",
      themeKicker: "Color theme",
      themeHeading: "Theme",
      themeDescription: "Three materials. Changes apply immediately and are saved.",
      themeSelection: "Theme selection",
      themeEngineUnavailable: "The theme engine could not be loaded.",
      themeGraphite: "Graphite",
      themeLedger: "Ledger",
      themeBlueprint: "Blueprint",
      taglineGraphite: "Graphite and silver",
      taglineLedger: "Paper and ink",
      taglineBlueprint: "Drafting table",
      active: "Active",
      typeKicker: "Typography",
      typeHeading: "Typeface",
      typeDescription: "Typeface for interface, chat, and panel text.",
      typeSelection: "Typeface selection",
      typeInstrument: "Instrument",
      typeDrawing: "Drawing",
      typeBook: "Book",
      typeNoteInstrument: "Sitka · Segoe UI",
      typeNoteDrawing: "Bahnschrift · Cascadia",
      typeNoteBook: "Constantia · Candara",
      typeNote: "The code editor keeps its fixed typeface; this setting changes the interface typeface.",
      selectionSaved: "Your selection is saved automatically.",
      currentThemePrefix: "Theme: ",
      currentTypefacePrefix: "Typeface: ",
      themeToastPrefix: "Theme: ",
      typeToastPrefix: "Typeface: ",
      searchModels: "Search models",
      modelSearchPlaceholder: "Search models…",
      chatModelSearchPlaceholder: "Search models… (e.g. claude, gpt-4o)",
      modelPickerDialog: "Search and select a model",
      providerModelSearch: "Search provider models",
      showPaidModels: "Include paid models",
      refresh: "Refresh",
      retry: "Try again",
      models: "Models",
      modelsLoading: "Loading models from provider…",
      modelListError: "Could not load the model list.",
      modelNetworkError: "Could not reach the server. If you use a local server (Ollama, LM Studio, vLLM), make sure it is running and the address is correct; for a cloud provider, check your internet connection.",
      modelApiKeyError: "This provider requires a valid API key. Enter the key and select Save; the list will refresh automatically.",
      modelTimeoutError: "The request timed out. Select Refresh to try again.",
      modelRateLimitError: "The provider rate limit was reached. Wait a moment, then select Refresh.",
      modelResultCount: "{count} results · {free} free",
      modelFreeCount: "{free} / {total} free",
      modelFilteredCount: "{count} / {total} models",
      modelTotalCount: "{count} models",
      modelListLabel: "Model list",
      savedModelMissing: "Saved model ({model}) is not in the provider's {list} list.",
      providerFreeModelsEmpty: "This provider has no free models. Enable the option above to show paid models.",
      modelNoMatch: "No matching models.",
      modelProviderEmpty: "The provider returned no models.",
      paid: "paid",
      free: "free",
      chatModelsLoading: "Loading models…",
      noProvider: "No provider",
      noProviders: "No providers yet. Add one with the “Add providers” button above.",
      providersLoading: "Loading providers…",
      extensionSearchMore: "Find more extensions…",
      extensionSearchLabel: "Search extensions",
      extensionSearchPlaceholder: "Search extensions (Open VSX / Marketplace)…",
      search: "Search"
    }
  };

  const LS = {
    skin: "pg.skin",
    lang: "pg.lang",
    details: "pg.details",
    seeded: "pg.ocSeen"
  };

  function read(key, fallback) {
    try {
      const value = window.localStorage.getItem(key);
      return value === null ? fallback : value;
    } catch (error) {
      return fallback;
    }
  }

  function write(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      /* storage can be unavailable */
    }
  }

  let lang = read(LS.lang, "tr") === "en" ? "en" : "tr";
  document.documentElement.lang = lang;

  function t(key, values) {
    const table = STRINGS[lang] || STRINGS.tr;
    const value = table[key] === undefined ? key : table[key];
    if (typeof value !== "string" || !values) return value;
    return value.replace(/\{(\w+)\}/g, (match, name) =>
      Object.prototype.hasOwnProperty.call(values, name) ? String(values[name]) : match
    );
  }
  window.ocText = t;

  /* helpers                                                             */

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  };

  const clear = (node) => {
    while (node.firstChild) node.removeChild(node.firstChild);
  };

  const q = (selector, root) => (root || document).querySelector(selector);
  const qa = (selector, root) => Array.from((root || document).querySelectorAll(selector));

  const clickByTitle = (title) => {
    const button = qa(".activity-bar button").find((node) => (node.title || "").trim() === title);
    if (button) {
      button.click();
      return true;
    }
    return false;
  };

  const timestamp = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  };

  const truncate = (text, max) => {
    const value = String(text || "");
    return value.length > max ? `${value.slice(0, max)}…` : value;
  };

  /* fuzzy subsequence match, returns a score (lower is better) or -1 */
  function fuzzyScore(needle, haystack) {
    const n = needle.toLowerCase();
    const h = haystack.toLowerCase();
    if (!n) return 0;
    let index = 0;
    let score = 0;
    let lastHit = -1;
    for (let i = 0; i < h.length && index < n.length; i += 1) {
      if (h[i] === n[index]) {
        if (lastHit >= 0 && i === lastHit + 1) score -= 1;
        if (i === 0 || h[i - 1] === "/" || h[i - 1] === "-" || h[i - 1] === "_") score -= 2;
        lastHit = i;
        index += 1;
      } else {
        score += 1;
      }
    }
    return index === n.length ? score : -1;
  }

  /* state                                                               */

  const state = {
    shell: null,
    head: null,
    crumb: null,
    scrim: null,
    toastHost: null,
    overlay: null,
    dock: null,
    hint: null,
    shellout: null,
    editorOpen: false,
    drawer: null,
    fileIndex: null,
    fileIndexAt: 0,
    detailDefault: read(LS.details, "0") === "1",
    welcome: null,
    welcomeDismissed: false,
    winMaxButton: null,
    greeting: "",
    decorating: false,
    pending: new Set(),
    flushQueued: false,
    workspaceName: "",
    workspaceRoot: "",
    metaFolder: null,
    terminals: new Map()
  };

  const SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    ".hg",
    ".svn",
    "dist",
    "build",
    "out",
    ".next",
    ".nuxt",
    ".cache",
    "vendor",
    "resources",
    "coverage",
    "target",
    ".venv",
    "venv",
    "__pycache__"
  ]);

  /* shell chrome                                                        */

  function icon(paths, size) {
    const px = size || 14;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", String(px));
    svg.setAttribute("height", String(px));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.8");
    svg.setAttribute("stroke-linecap", "round");
    svg.setAttribute("stroke-linejoin", "round");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    for (const d of paths) {
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      svg.appendChild(path);
    }
    return svg;
  }

  /* The product mark: a viewfinder, not a brush circle. Same shape as the
   * activity-rail mark in zen-themes.js so the two never disagree. */
  function instrumentMark(size) {
    const px = size || 15;
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("width", String(px));
    svg.setAttribute("height", String(px));
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("fill", "none");
    svg.setAttribute("stroke", "currentColor");
    svg.setAttribute("stroke-width", "1.4");
    svg.setAttribute("aria-hidden", "true");
    svg.setAttribute("focusable", "false");
    const frame = document.createElementNS(ns, "rect");
    frame.setAttribute("x", "2.5");
    frame.setAttribute("y", "2.5");
    frame.setAttribute("width", "19");
    frame.setAttribute("height", "19");
    const rule = document.createElementNS(ns, "path");
    rule.setAttribute("d", "M2.5 9.5h7M9.5 2.5v19");
    const block = document.createElementNS(ns, "rect");
    block.setAttribute("x", "9.5");
    block.setAttribute("y", "9.5");
    block.setAttribute("width", "5");
    block.setAttribute("height", "5");
    block.setAttribute("fill", "currentColor");
    block.setAttribute("stroke", "none");
    svg.appendChild(frame);
    svg.appendChild(rule);
    svg.appendChild(block);
    return svg;
  }

  function buildHeader() {
    const head = el("header", "oc-head");
    head.setAttribute("role", "banner");

    const brand = el("div", "oc-brand");
    brand.appendChild(instrumentMark(15));
    brand.appendChild(el("span", "oc-brand-name", t("brand")));
    head.appendChild(brand);

    const crumb = el("div", "oc-crumb");
    crumb.appendChild(el("span", "oc-sep", "/"));
    const name = el("strong", "", "");
    crumb.appendChild(name);
    head.appendChild(crumb);

    head.appendChild(el("div", "oc-spacer"));

    const chips = el("div", "oc-head-chips");

    const chip = (label, paths, onClick, title) => {
      const button = el("button", "oc-chip");
      button.type = "button";
      button.title = title || label;
      button.setAttribute("aria-label", title || label);
      button.appendChild(icon(paths));
      button.appendChild(el("span", "", label));
      button.addEventListener("click", onClick);
      return button;
    };

    chips.appendChild(
      chip(t("chips").files, ["M4 5h6l2 2h8v12H4z"], () => toggleDrawer("explorer"))
    );
    chips.appendChild(
      chip(t("chips").editor, ["M8 6 3 12l5 6", "M16 6l5 6-5 6"], () => toggleEditor())
    );
    chips.appendChild(chip(t("chips").theme, ["M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9z"], () => openTheme()));
    chips.appendChild(
      chip(
        lang === "tr" ? "TR" : "EN",
        ["M4 6h16", "M4 12h16", "M4 18h10"],
        () => setLang(lang === "tr" ? "en" : "tr"),
        t("langDesc")
      )
    );
    chips.appendChild(
      chip(
        t("chips").settings,
        [
          "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
        ],
        openReactSettings,
        t("providers")
      )
    );

    head.appendChild(chips);
    head.appendChild(buildWindowControls());

    state.crumb = name;
    return head;
  }

  /* ---- window controls (the window is frameless) ------------------- */

  const WIN_ICONS = {
    min: "<svg width='10' height='10' viewBox='0 0 10 10' aria-hidden='true'><path d='M1 5h8' stroke='currentColor' stroke-width='1.15'/></svg>",
    max: "<svg width='10' height='10' viewBox='0 0 10 10' fill='none' aria-hidden='true'><rect x='1.4' y='1.4' width='7.2' height='7.2' rx='1' stroke='currentColor' stroke-width='1.1'/></svg>",
    restore: "<svg width='10' height='10' viewBox='0 0 10 10' fill='none' aria-hidden='true'><rect x='1' y='3' width='6' height='6' rx='1' stroke='currentColor' stroke-width='1.1'/><path d='M3.2 3V2.2A1.2 1.2 0 0 1 4.4 1h4.4A1.2 1.2 0 0 1 10 2.2v4.4A1.2 1.2 0 0 1 8.8 7.8H8' stroke='currentColor' stroke-width='1.1'/></svg>",
    close: "<svg width='10' height='10' viewBox='0 0 10 10' aria-hidden='true'><path d='M1.6 1.6l6.8 6.8M8.4 1.6L1.6 8.4' stroke='currentColor' stroke-width='1.15' stroke-linecap='round'/></svg>"
  };

  async function syncWinState() {
    if (!api.win || !state.winMaxButton) return;
    try {
      const win = await api.win.state();
      const maximized = Boolean(win && win.maximized);
      state.winMaxButton.innerHTML = maximized ? WIN_ICONS.restore : WIN_ICONS.max;
      const label = maximized ? t("winRestore") : t("winMax");
      state.winMaxButton.title = label;
      state.winMaxButton.setAttribute("aria-label", label);
    } catch (error) {
      /* window state is best-effort */
    }
  }

  function buildWindowControls() {
    const group = el("div", "oc-win");
    if (!api.win) return group;

    const button = (kind, label, onClick) => {
      const node = el("button", `oc-win-btn oc-win-${kind}`);
      node.type = "button";
      node.title = label;
      node.setAttribute("aria-label", label);
      node.innerHTML = WIN_ICONS[kind];
      node.addEventListener("click", onClick);
      return node;
    };

    group.appendChild(button("min", t("winMin"), () => api.win.minimize()));
    const maxButton = button("max", t("winMax"), () => {
      api.win.toggleMaximize();
      window.setTimeout(syncWinState, 160);
    });
    state.winMaxButton = maxButton;
    group.appendChild(maxButton);
    group.appendChild(button("close", t("winClose"), () => api.win.close()));

    window.addEventListener("resize", () => {
      window.clearTimeout(syncWinState.timer);
      syncWinState.timer = window.setTimeout(syncWinState, 180);
    });
    window.setTimeout(syncWinState, 60);
    return group;
  }

  /* ---- greeting ---------------------------------------------------- */

  function pickGreeting() {
    const hellos = lang === "tr"
      ? ["Hoş geldin!", "Merhaba!", "Nasılsın?", "Naber?"]
      : ["Welcome!", "Hi there!", "How are you?", "What's up?"];
    const openers = lang === "tr"
      ? ["Bugün ne yapıyoruz?", "Bugün aklında ne var?"]
      : ["What are we building today?", "What's on your mind today?"];
    const hello = hellos[Math.floor(Math.random() * hellos.length)];
    const opener = openers[Math.floor(Math.random() * openers.length)];
    const roll = Math.random();
    if (roll < 0.4) return hello;
    if (roll < 0.8) return `${hello} ${opener}`;
    return opener;
  }

  /* ---- welcome surface --------------------------------------------- */

  function metaRow(parent, label) {
    const row = el("div", "oc-meta-row");
    row.appendChild(el("dt", "oc-meta-key", label));
    const value = el("dd", "oc-meta-val", "");
    row.appendChild(value);
    parent.appendChild(row);
    return value;
  }

  function syncSessionReadout() {
    const row = state.metaFolder;
    if (!row) return;
    const folder = state.workspaceName || "";
    const text = folder || t("metaNoFolder");
    if (row.textContent !== text) row.textContent = text;
    const flag = folder ? "0" : "1";
    if (row.dataset.empty !== flag) row.dataset.empty = flag;
  }

  function buildWelcome() {
    const wrap = el("section", "oc-welcome");
    wrap.id = "oc-welcome";
    wrap.setAttribute("aria-label", t("brand"));

    const inner = el("div", "oc-welcome-inner");

    const mark = el("div", "oc-greet-mark");
    mark.setAttribute("aria-hidden", "true");
    mark.appendChild(instrumentMark(30));
    inner.appendChild(mark);

    inner.appendChild(el("h1", "oc-greet", state.greeting || t("brand")));
    inner.appendChild(el("p", "oc-greet-sub", t("welcomeSub")));

    /* the folder the next task will run in */
    const meta = el("dl", "oc-greet-meta");
    meta.setAttribute("aria-label", t("metaLabel"));
    state.metaFolder = metaRow(meta, t("metaFolder"));
    inner.appendChild(meta);
    syncSessionReadout();

    const actions = el("div", "oc-welcome-actions");
    const cta = el("button", "oc-welcome-cta", t("welcomeCta"));
    cta.type = "button";
    cta.addEventListener("click", openFolder);
    actions.appendChild(cta);

    const ghost = el("button", "oc-welcome-ghost", t("welcomeGhost"));
    ghost.type = "button";
    ghost.addEventListener("click", () => openCommandPalette(""));
    actions.appendChild(ghost);
    inner.appendChild(actions);

    const hints = el("div", "oc-welcome-hints");
    const hint = (key, label) => {
      hints.appendChild(el("kbd", "", key));
      hints.appendChild(el("span", "", label));
    };
    hint("Ctrl+B", lang === "tr" ? "dosyalar" : "files");
    hint("/", lang === "tr" ? "komutlar" : "commands");
    hint("@", lang === "tr" ? "dosya" : "file");
    inner.appendChild(hints);

    wrap.appendChild(inner);
    state.welcome = wrap;
    return wrap;
  }

  /* The React provider dialog now sits above the whole shell ladder, so the
   * greeting only has to come back when the dialog closes; it no longer has to
   * be hidden to keep clicks away from it. */
  function dialogOpen() {
    return Boolean(q(".modal-backdrop")) || Boolean(state.overlay);
  }

  let dialogWasOpen = false;

  function syncDialogs() {
    const open = dialogOpen();

    /* the dialog is the provider editor now, so name it that way */
    const title = q(".modal-backdrop #settings-title");
    if (title) {
      const label = lang === "tr" ? "Sağlayıcılar" : "Providers";
      if (title.textContent !== label) title.textContent = label;
    }

    if (open !== dialogWasOpen) {
      dialogWasOpen = open;
      if (!open && state.welcome) {
        const hasWorkspace = Boolean(state.workspaceRoot || state.workspaceName);
        applyWelcome(!hasWorkspace && !state.welcomeDismissed);
      }
    }
  }

  function applyWelcome(visible) {
    if (!state.welcome) return;
    const on = Boolean(visible) && !dialogOpen();
    state.welcome.classList.toggle("is-visible", on);
    state.welcome.setAttribute("aria-hidden", on ? "false" : "true");
    /* the transcript placeholder keeps quiet while the greeting is up */
    document.documentElement.toggleAttribute("data-oc-welcome", on);
  }

  async function openFolder() {
    try {
      await api.workspace.openDialog();
    } catch (error) {
      toast(String(error && error.message ? error.message : error), "error");
    }
  }

  function buildShell() {
    if (state.shell && state.shell.isConnected) return;

    const shell = el("div", "");
    shell.id = "oc-shell";

    shell.appendChild(buildHeader());
    shell.appendChild(buildWelcome());

    const scrim = el("div", "oc-scrim");
    scrim.addEventListener("click", () => setDrawer(null));
    shell.appendChild(scrim);
    state.scrim = scrim;

    const closeButton = el("button", "oc-editor-close", "✕");
    closeButton.type = "button";
    closeButton.title = lang === "tr" ? "Editörü kapat" : "Close editor";
    closeButton.setAttribute("aria-label", closeButton.title);
    closeButton.addEventListener("click", () => setEditor(false));
    shell.appendChild(closeButton);

    const toasts = el("div", "oc-toast-host");
    toasts.setAttribute("aria-live", "polite");
    shell.appendChild(toasts);
    state.toastHost = toasts;

    state.shell = shell;
    (document.body || document.documentElement).appendChild(shell);
  }

  function toast(message, level) {
    if (!state.toastHost) return;
    const item = el("div", `oc-toast${level === "error" ? " is-error" : ""}`, message);
    state.toastHost.appendChild(item);
    window.setTimeout(() => item.remove(), 3600);
  }

  function refreshCrumb() {
    if (!state.crumb) return;
    const label = state.workspaceName || t("noWorkspace");
    if (state.crumb.textContent !== label) state.crumb.textContent = label;
    state.crumb.title = state.workspaceRoot || label;
    const hasWorkspace = Boolean(state.workspaceRoot || state.workspaceName);
    applyWelcome(!hasWorkspace && !state.welcomeDismissed);
    syncSessionReadout();
  }

  /* dock attachment                                                     */

  function attachDock() {
    const dock = document.getElementById("pg-chat-dock") || q(".pg-chat-dock");
    if (!dock) return;
    if (dock !== state.dock) {
      state.dock = dock;
      state.hint = null;
      state.shellout = null;
    }

    if (!state.shellout || !state.shellout.isConnected || state.shellout.parentElement !== dock) {
      const host = el("div", "oc-shellout");
      dock.appendChild(host);
      state.shellout = host;
    }

    if (!state.hint || !state.hint.isConnected || state.hint.parentElement !== dock) {
      const hint = el("div", "oc-hint");
      const keys = el("span", "oc-hint-keys");
      for (const part of t("hint").split(" · ")) {
        const bits = part.split(": ");
        if (bits.length === 2) {
          keys.appendChild(el("span", "", bits[0]));
          keys.appendChild(el("kbd", "", bits[1]));
        } else {
          keys.appendChild(el("span", "", part));
        }
      }
      hint.appendChild(keys);
      hint.appendChild(el("span", "oc-hint-status"));
      dock.appendChild(hint);
      state.hint = hint;
    }

    const input = q(".pg-chat-input", dock);
    if (input) {
      const placeholder =
        lang === "tr"
          ? "Bir görev yaz…  / komutlar · @ dosya · ! kabuk  ·  Enter gönderir"
          : "Type a task…  / commands · @ file · ! shell  ·  Enter sends";
      if (input.placeholder !== placeholder) input.placeholder = placeholder;
    }
    if (input && input.dataset.ocBound !== "1") bindComposer(input);
    const badge = q(".pg-debate-badge", dock);
    if (badge) {
      const count = (badge.textContent || "").trim();
      const shouldHide = !count || count === "0";
      if (badge.hidden !== shouldHide) badge.hidden = shouldHide;
    }

    const sendBtn = q(".pg-composer .pg-btn.primary", dock);
    if (sendBtn && sendBtn.dataset.ocBound !== "1") {
      sendBtn.dataset.ocBound = "1";
      sendBtn.title = t("send");
    }
    const stopBtn = q(".pg-composer .pg-btn.danger", dock);
    if (stopBtn && stopBtn.dataset.ocBound !== "1") {
      stopBtn.dataset.ocBound = "1";
      stopBtn.title = t("stop");
    }
  }

  /* transcript decoration                                               */

  function markdown(text) {
    const frag = document.createDocumentFragment();
    const lines = String(text || "").split("\n");
    let i = 0;

    const inline = (target, value) => {
      let rest = value;
      const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\n]+\*)|(https?:\/\/[^\s)]+)/;
      while (rest.length) {
        const match = pattern.exec(rest);
        if (!match) {
          target.appendChild(document.createTextNode(rest));
          return;
        }
        if (match.index > 0) target.appendChild(document.createTextNode(rest.slice(0, match.index)));
        const token = match[0];
        if (token.startsWith("`")) {
          target.appendChild(el("code", "oc-inline-code", token.slice(1, -1)));
        } else if (token.startsWith("**")) {
          const strong = el("strong", "", token.slice(2, -2));
          target.appendChild(strong);
        } else if (token.startsWith("*")) {
          const em = el("em", "", token.slice(1, -1));
          target.appendChild(em);
        } else {
          const link = el("a", "oc-link", token);
          link.href = token;
          link.target = "_blank";
          link.rel = "noreferrer noopener";
          target.appendChild(link);
        }
        rest = rest.slice(match.index + token.length);
      }
    };

    while (i < lines.length) {
      const line = lines[i];

      const fence = /^\s*```([\w+#.-]*)\s*$/.exec(line);
      if (fence) {
        const code = [];
        i += 1;
        while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) {
          code.push(lines[i]);
          i += 1;
        }
        i += 1;
        const pre = el("pre", "oc-code");
        pre.appendChild(el("span", "oc-code-lang", fence[1] || "code"));
        const copy = el("button", "oc-copy", "⧉");
        copy.type = "button";
        copy.title = t("copy");
        copy.setAttribute("aria-label", t("copy"));
        const source = code.join("\n");
        copy.addEventListener("click", () => {
          if (navigator.clipboard) {
            navigator.clipboard.writeText(source).then(
              () => toast(t("copied")),
              () => undefined
            );
          }
        });
        pre.appendChild(copy);
        const codeEl = el("code", "", source);
        pre.appendChild(codeEl);
        frag.appendChild(pre);
        continue;
      }

      const heading = /^(#{1,6})\s+(.*)$/.exec(line);
      if (heading) {
        const node = el("div", `oc-h oc-h${heading[1].length}`);
        inline(node, heading[2]);
        frag.appendChild(node);
        i += 1;
        continue;
      }

      const bullet = /^\s*[-*+]\s+(.*)$/.exec(line);
      if (bullet) {
        const list = el("ul", "oc-ul");
        while (i < lines.length) {
          const item = /^\s*[-*+]\s+(.*)$/.exec(lines[i]);
          if (!item) break;
          const li = el("li", "");
          inline(li, item[1]);
          list.appendChild(li);
          i += 1;
        }
        frag.appendChild(list);
        continue;
      }

      const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
      if (numbered) {
        const list = el("ol", "oc-ol");
        while (i < lines.length) {
          const item = /^\s*\d+[.)]\s+(.*)$/.exec(lines[i]);
          if (!item) break;
          const li = el("li", "");
          inline(li, item[1]);
          list.appendChild(li);
          i += 1;
        }
        frag.appendChild(list);
        continue;
      }

      const quote = /^\s*>\s?(.*)$/.exec(line);
      if (quote) {
        const node = el("blockquote", "oc-quote");
        inline(node, quote[1]);
        frag.appendChild(node);
        i += 1;
        continue;
      }

      if (!line.trim()) {
        i += 1;
        continue;
      }

      const paragraph = [];
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^\s*```/.test(lines[i]) &&
        !/^#{1,6}\s/.test(lines[i]) &&
        !/^\s*[-*+]\s/.test(lines[i]) &&
        !/^\s*\d+[.)]\s/.test(lines[i]) &&
        !/^\s*>\s?/.test(lines[i])
      ) {
        paragraph.push(lines[i]);
        i += 1;
      }
      const node = el("p", "oc-p");
      inline(node, paragraph.join("\n"));
      frag.appendChild(node);
    }

    return frag;
  }

  function toolRow(raw) {
    const marker = raw.slice(0, 1);
    const kind = marker === "←" ? "result" : marker === "✎" ? "edit" : "call";
    const glyph = kind === "result" ? "←" : kind === "edit" ? "✎" : "→";
    const body = raw.slice(2).trim();

    const wrap = el("div", "oc-tool");
    wrap.dataset.state = kind === "call" ? "run" : "ok";
    wrap.dataset.open = state.detailDefault ? "1" : "0";

    const head = el("button", "oc-tool-head");
    head.type = "button";
    head.setAttribute("aria-expanded", wrap.dataset.open === "1" ? "true" : "false");

    head.appendChild(el("span", "oc-glyph", glyph));

    let name = "";
    let rest = body;
    if (kind === "edit") {
      // "✎ path/to/file" - the path is the payload, not a tool name
      name = body;
      rest = "";
    } else {
      const named = /^([\w.-]+)\s*([\s\S]*)$/.exec(body);
      if (named) {
        name = named[1];
        rest = named[2].trim();
      }
    }

    head.appendChild(el("span", "oc-tool-name", name || (kind === "result" ? "result" : "tool")));
    head.appendChild(el("span", "oc-tool-arg", truncate(rest, 160)));
    head.appendChild(el("span", "oc-tool-caret", "›"));

    const bodyBox = el("div", "oc-tool-body");
    const pre = el("pre", "", body);
    bodyBox.appendChild(pre);

    if (kind === "edit") {
      const open = el("button", "oc-tool-open", `${t("files")} →`);
      open.type = "button";
      open.addEventListener("click", (event) => {
        event.stopPropagation();
        openDrawer("explorer");
      });
      bodyBox.appendChild(open);
    }

    head.addEventListener("click", () => {
      const open = wrap.dataset.open === "1";
      wrap.dataset.open = open ? "0" : "1";
      head.setAttribute("aria-expanded", open ? "false" : "true");
    });

    wrap.appendChild(head);
    wrap.appendChild(bodyBox);
    return wrap;
  }

  function decorateMessage(node) {
    const textEl = q(".pg-msg-text", node);
    if (!textEl) return;
    const raw = textEl.textContent || "";
    const content = q(".pg-msg-content", node);
    if (!content) return;

    let host = q(":scope > .oc-render", content);
    if (node.dataset.ocRaw === raw && host) return;

    node.dataset.ocRaw = raw;
    if (!host) {
      host = el("div", "oc-render");
      content.appendChild(host);
    }
    clear(host);

    if (node.classList.contains("tool")) {
      host.appendChild(toolRow(raw));
    } else if (node.classList.contains("assistant")) {
      host.appendChild(markdown(raw));
    } else {
      host.appendChild(el("div", "oc-plain", raw));
    }
  }

  function flushDecoration() {
    state.flushQueued = false;
    const pending = Array.from(state.pending);
    state.pending.clear();
    state.decorating = true;
    try {
      for (const node of pending) {
        if (node.isConnected) decorateMessage(node);
      }
    } finally {
      state.decorating = false;
    }
  }

  function scheduleDecoration(nodes) {
    for (const node of nodes) state.pending.add(node);
    if (state.flushQueued) return;
    state.flushQueued = true;
    window.requestAnimationFrame(flushDecoration);
  }

  function scanTranscript() {
    const log = q(".pg-chat-log");
    if (!log) return;
    decorateEmpty(log);
    const messages = qa(".pg-msg[data-msg-id]", log);
    /* the greeting steps aside as soon as the first message exists */
    if (messages.length && !state.welcomeDismissed) {
      state.welcomeDismissed = true;
      applyWelcome(false);
    }
    scheduleDecoration(messages);
  }

  function decorateEmpty(log) {
    const empty = q(".pg-chat-empty", log);
    if (!empty || empty.dataset.ocCopy === "1") return;
    empty.dataset.ocCopy = "1";
    clear(empty);
    /* the greeting lives on the welcome surface; the transcript only hints */
    empty.appendChild(el("div", "oc-welcome-sub", t("welcome")));
  }

  /* composer                                                            */

  function send() {
    const button = q(".pg-composer .pg-btn.primary");
    if (button && !button.disabled) button.click();
  }

  function stopRun() {
    const button = q(".pg-composer .pg-btn.danger");
    if (button && !button.hidden) {
      button.click();
      return true;
    }
    return false;
  }

  function cycleProvider(direction) {
    const select = q(".pg-chat-head .pg-chat-select");
    if (!select || !select.options || select.options.length < 2) return;
    const step = direction < 0 ? -1 : 1;
    const next = (select.selectedIndex + step + select.options.length) % select.options.length;
    select.selectedIndex = next;
    select.dispatchEvent(new Event("change", { bubbles: true }));
    toast(select.options[next].textContent, "info");
  }

  function bindComposer(input) {
    input.dataset.ocBound = "1";

    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const value = input.value.trim();
        if (value.startsWith("!")) {
          event.preventDefault();
          event.stopPropagation();
          input.value = "";
          runShell(value.slice(1).trim());
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        send();
        return;
      }

      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        cycleProvider(1);
        return;
      }

      if (event.key === "Tab" && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        cycleProvider(-1);
        return;
      }

      if (event.key === "Escape") {
        if (stopRun()) {
          event.preventDefault();
          toast(t("stopped"));
        }
      }
    });

    input.addEventListener("input", () => {
      const value = input.value;

      if (value === "/") {
        input.value = "";
        openCommandPalette("");
        return;
      }

      const token = /(?:^|\s)@([^\s]*)$/.exec(value);
      if (token) {
        openFilePalette(token[1], (relPath) => {
          const prefix = value.slice(0, token.index);
          input.value = `${prefix}${prefix && !/\s$/.test(prefix) ? " " : ""}@${relPath} `;
          input.focus();
        });
      }
    });
  }

  /* overlays                                                            */

  function closeOverlay() {
    if (!state.overlay) return;
    state.overlay.el.remove();
    state.overlay = null;
    syncDialogs();
  }

  function openOverlay(cfg) {
    closeOverlay();
    buildShell();

    const overlay = el("div", "oc-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", cfg.title || "");

    const box = el("div", "oc-modal");
    const head = el("div", "oc-modal-head");
    head.appendChild(el("span", "oc-modal-title", cfg.title || ""));

    let input = null;
    if (cfg.placeholder !== null) {
      input = el("input", "oc-input");
      input.type = "search";
      input.placeholder = cfg.placeholder || "";
      input.setAttribute("aria-label", cfg.placeholder || cfg.title || "");
      head.appendChild(input);
    }
    box.appendChild(head);

    const list = el("div", "oc-list");
    list.setAttribute("role", "listbox");
    box.appendChild(list);

    const foot = el("div", "oc-modal-foot");
    const kbd = (text) => {
      foot.appendChild(el("kbd", "", text));
    };
    kbd("↑↓");
    foot.appendChild(el("span", "", lang === "tr" ? "gezin" : "navigate"));
    kbd("⏎");
    foot.appendChild(el("span", "", lang === "tr" ? "seç" : "select"));
    kbd("Esc");
    foot.appendChild(el("span", "", lang === "tr" ? "kapat" : "close"));
    box.appendChild(foot);

    overlay.appendChild(box);

    let rows = [];
    let active = 0;

    const paint = () => {
      clear(list);
      if (!rows.length) {
        list.appendChild(el("div", "oc-empty", cfg.empty || t("noMatch")));
        return;
      }
      rows.forEach((row, index) => {
        const node = el("button", `oc-row${index === active ? " is-active" : ""}`);
        node.type = "button";
        node.setAttribute("role", "option");
        node.setAttribute("aria-selected", index === active ? "true" : "false");
        if (row.icon) node.appendChild(el("span", "oc-row-icon", row.icon));
        const label = el("span", "oc-row-label");
        label.appendChild(el("span", "", row.label));
        if (row.sub) label.appendChild(el("span", "oc-row-sub", row.sub));
        node.appendChild(label);
        if (row.hint) node.appendChild(el("span", "oc-row-hint", row.hint));
        node.addEventListener("mouseenter", () => {
          active = index;
          for (const other of qa(".oc-row", list)) other.classList.remove("is-active");
          node.classList.add("is-active");
        });
        node.addEventListener("click", () => pick(index));
        list.appendChild(node);
      });
      const current = list.children[active];
      if (current && current.scrollIntoView) current.scrollIntoView({ block: "nearest" });
    };

    const rebuild = (query) => {
      rows = cfg.getRows ? cfg.getRows(query || "") : [];
      if (active >= rows.length) active = 0;
      paint();
    };

    const pick = (index) => {
      const row = rows[index];
      if (!row) return;
      closeOverlay();
      if (cfg.keepFocus !== false) {
        const inputEl = q(".pg-chat-input");
        if (inputEl) inputEl.focus();
      }
      try {
        row.run();
      } catch (error) {
        toast(String(error && error.message ? error.message : error), "error");
      }
    };

    if (input) {
      input.addEventListener("input", () => {
        active = 0;
        rebuild(input.value);
      });
    }

    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeOverlay();
        const composer = q(".pg-chat-input");
        if (composer) composer.focus();
        return;
      }
      if (event.key === "ArrowDown" || (event.ctrlKey && event.key === "n")) {
        event.preventDefault();
        if (!rows.length) return;
        active = (active + 1) % rows.length;
        paint();
        return;
      }
      if (event.key === "ArrowUp" || (event.ctrlKey && event.key === "p")) {
        event.preventDefault();
        if (!rows.length) return;
        active = (active - 1 + rows.length) % rows.length;
        paint();
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        pick(active);
      }
    });

    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) closeOverlay();
    });

    buildShell();
    (state.shell || document.body).appendChild(overlay);
    state.overlay = { el: overlay };
    syncDialogs();

    rebuild("");
    if (input) {
      input.focus({ preventScroll: true });
    } else {
      overlay.tabIndex = -1;
      overlay.focus({ preventScroll: true });
    }
  }

  /* commands                                                            */

  function openReactSettings() {
    if (clickByTitle("Settings")) {
      syncDialogs();
      return;
    }
    toast(t("noApi"), "error");
  }

  function openProviderModelPicker() {
    const button = q(".pg-chat-head .pg-chat-model-btn");
    if (button) {
      button.click();
      return;
    }
    toast(t("noApi"), "error");
  }

  function newSession() {
    const bridge = window.pgWorkbench;
    if (!bridge || typeof bridge.newSession !== "function") {
      toast(t("noApi"), "error");
      return;
    }
    bridge.newSession();
    toast(t("newSession"));
    const composer = q(".pg-chat-input");
    if (composer) composer.focus();
  }

  function openSessions() {
    const bridge = window.pgWorkbench;
    if (!bridge || typeof bridge.sessions !== "function") {
      toast(t("noApi"), "error");
      return;
    }
    const sessions = bridge.sessions() || [];
    openOverlay({
      title: t("sessions"),
      placeholder: null,
      empty: t("noSessions"),
      getRows: () =>
        sessions.map((session, index) => ({
          label: `${index + 1}. ${session.agentName || "Agent"}`,
          sub: `${session.count || 0} ${lang === "tr" ? "mesaj" : "messages"} · ${session.status || "idle"}`,
          icon: session.id === bridge.currentId() ? "•" : "",
          run: () => {
            bridge.useSession(session.id);
            scanTranscript();
          }
        }))
    });
  }

  /* theme + typography picker */
  function openTheme() {
    const zen = window.pgZen;
    if (!zen || !Array.isArray(zen.themes)) {
      toast(t("noApi"), "error");
      return;
    }

    const overlay = el("div", "oc-overlay");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", t("theme"));

    const box = el("div", "oc-modal oc-theme-modal");
    const head = el("div", "oc-modal-head");
    head.appendChild(el("span", "oc-modal-title", t("theme")));
    box.appendChild(head);

    const scroll = el("div", "oc-modal-scroll");

    const themesSection = el("section", "oc-modal-section");
    themesSection.appendChild(el("h3", "oc-kicker", lang === "tr" ? "Renk teması" : "Colour theme"));
    const grid = el("div", "oc-themes");
    const current = zen.current;

    for (const theme of zen.themes) {
      const card = el("button", `oc-theme${theme.id === current ? " is-active" : ""}`);
      card.type = "button";
      card.setAttribute("aria-pressed", theme.id === current ? "true" : "false");
      const swatch = el("div", "oc-theme-swatch");
      const colors = [
        theme.palette?.bg,
        theme.palette?.panel,
        theme.palette?.border,
        theme.palette?.accent,
        theme.palette?.muted
      ];
      for (const color of colors) {
        const dot = el("i", "");
        if (color) dot.style.background = color;
        swatch.appendChild(dot);
      }
      card.appendChild(swatch);
      const name = el("div", "oc-theme-name");
      name.appendChild(el("span", "", theme.name));
      name.appendChild(el("small", "", theme.jp || ""));
      card.appendChild(name);
      card.appendChild(el("small", "", theme.tagline || ""));
      card.addEventListener("click", () => {
        zen.apply(theme.id);
        for (const other of qa(".oc-theme", grid)) other.classList.remove("is-active");
        card.classList.add("is-active");
      });
      grid.appendChild(card);
    }
    themesSection.appendChild(grid);
    scroll.appendChild(themesSection);

    const presets = Array.isArray(zen.types) ? zen.types : [];
    if (presets.length) {
      const typeSection = el("section", "oc-modal-section");
      typeSection.appendChild(
        el(
          "h3",
          "oc-kicker",
          lang === "tr" ? `Yazı biçimi · ${presets.length}` : `Typography · ${presets.length}`
        )
      );

      const typeGrid = el("div", "oc-types");
      typeGrid.setAttribute("role", "radiogroup");
      typeGrid.setAttribute("aria-label", lang === "tr" ? "Yazı biçimi" : "Typography");

      const syncTypes = () => {
        for (const card of qa(".oc-type", typeGrid)) {
          const on = card.dataset.type === zen.type;
          card.classList.toggle("is-active", on);
          card.setAttribute("aria-checked", on ? "true" : "false");
        }
      };

      for (const preset of presets) {
        const card = el("button", "oc-type");
        card.type = "button";
        card.dataset.type = preset.id;
        card.setAttribute("role", "radio");
        card.setAttribute("aria-checked", "false");

        const sample = el("span", "oc-type-sample", preset.sample || "Aa");
        sample.setAttribute("aria-hidden", "true");
        if (preset.display) sample.style.fontFamily = preset.display;
        card.appendChild(sample);

        const text = el("span", "oc-type-text");
        text.appendChild(el("span", "oc-type-name", preset.name));
        text.appendChild(el("span", "oc-type-note", preset.note || ""));
        card.appendChild(text);

        card.addEventListener("click", () => {
          zen.applyType(preset.id);
          syncTypes();
        });
        typeGrid.appendChild(card);
      }
      syncTypes();
      typeSection.appendChild(typeGrid);
      scroll.appendChild(typeSection);
    }

    box.appendChild(scroll);

    const foot = el("div", "oc-modal-foot");
    foot.appendChild(
      el(
        "span",
        "",
        lang === "tr" ? "Tema ve yazı biçimi hemen uygulanır" : "Theme and typography apply immediately"
      )
    );
    box.appendChild(foot);

    overlay.appendChild(box);
    overlay.addEventListener("mousedown", (event) => {
      if (event.target === overlay) closeOverlay();
    });
    overlay.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeOverlay();
      }
    });

    closeOverlay();
    buildShell();
    (state.shell || document.body).appendChild(overlay);
    state.overlay = { el: overlay };
    syncDialogs();
    overlay.tabIndex = -1;
    overlay.focus({ preventScroll: true });
  }

  function openHelp() {
    const rows = [
      { keys: "Enter", tr: "Gönder", en: "Send" },
      { keys: "Shift+Enter", tr: "Yeni satır", en: "New line" },
      { keys: "Tab", tr: "Sağlayıcı/agent değiştir", en: "Switch provider/agent" },
      { keys: "Esc", tr: "Akışı durdur", en: "Stop the stream" },
      { keys: "Ctrl+P", tr: "Komut paleti", en: "Command palette" },
      { keys: "Ctrl+E", tr: "Editör paneli", en: "Editor panel" },
      { keys: "Ctrl+B", tr: "Dosya gezgini", en: "File explorer" },
      { keys: "/", tr: "Komutlar", en: "Commands" },
      { keys: "@", tr: "Dosya referansı", en: "File reference" },
      { keys: "!", tr: "Kabuk komutu", en: "Shell command" }
    ];

    openOverlay({
      title: t("help"),
      placeholder: null,
      empty: "",
      getRows: () =>
        rows.map((row) => ({
          label: row[lang],
          hint: row.keys,
          run: () => undefined
        }))
    });
  }

  function openCommandPalette(query) {
    openOverlay({
      title: t("commands"),
      placeholder: t("filterCommands"),
      getRows: (text) =>
        COMMANDS.map((command) => {
          const label = lang === "tr" ? command.tr : command.en;
          return { command, label, score: fuzzyScore(text, label) };
        })
          .filter((entry) => entry.score !== -1)
          .sort((a, b) => a.score - b.score)
          .map((entry) => ({
            label: entry.label,
            sub: lang === "tr" ? entry.command.subTr : entry.command.subEn,
            hint: entry.command.hint || "",
            icon: entry.command.icon || "›",
            run: entry.command.run
          }))
    });
    if (query) {
      const input = q(".oc-overlay .oc-input");
      if (input) {
        input.value = query;
        input.dispatchEvent(new Event("input"));
      }
    }
  }

  async function fileList() {
    const now = Date.now();
    if (state.fileIndex && now - state.fileIndexAt < 30000) return state.fileIndex;

    const files = [];
    const queue = [""];
    let visited = 0;
    while (queue.length && files.length < 900 && visited < 500) {
      const dir = queue.shift();
      visited += 1;
      let entries = [];
      try {
        entries = await api.workspace.readDir(dir);
      } catch (error) {
        continue;
      }
      for (const entry of entries || []) {
        if (!entry || !entry.relPath) continue;
        if (entry.kind === "dir") {
          if (SKIP_DIRS.has(entry.name)) continue;
          if (dir.split("/").filter(Boolean).length < 3) queue.push(entry.relPath);
        } else {
          files.push(entry.relPath);
        }
        if (files.length >= 900) break;
      }
    }
    state.fileIndex = files.sort();
    state.fileIndexAt = now;
    return state.fileIndex;
  }

  function openFilePalette(query, onPick) {
    openOverlay({
      title: t("files"),
      placeholder: t("filterFiles"),
      getRows: () => [
        {
          label: lang === "tr" ? "yükleniyor…" : "loading…",
          run: () => undefined
        }
      ]
    });

    fileList().then((files) => {
      if (!state.overlay) return;
      const pick = onPick || ((relPath) => {
        const composer = q(".pg-chat-input");
        if (composer) {
          composer.focus();
          composer.value = `${composer.value}@${relPath} `;
        }
      });

      openOverlay({
        title: t("files"),
        placeholder: t("filterFiles"),
        getRows: (text) =>
          files
            .map((file) => ({ file, score: fuzzyScore(text, file) }))
            .filter((entry) => entry.score !== -1)
            .sort((a, b) => a.score - b.score || a.file.length - b.file.length)
            .slice(0, 200)
            .map((entry) => ({
              label: entry.file,
              icon: "·",
              run: () => pick(entry.file)
            }))
      });
      const input = q(".oc-overlay .oc-input");
      if (input && query) {
        input.value = query;
        input.dispatchEvent(new Event("input"));
      }
    });
  }

  const COMMANDS = [
    { id: "new", tr: "Yeni oturum", en: "New session", subTr: "Akışı temizle", subEn: "Clear the stream", hint: "Ctrl+N", icon: "+", run: newSession },
    { id: "sessions", tr: "Oturumlar", en: "Sessions", subTr: "Önceki oturumlara dön", subEn: "Return to an earlier session", icon: "≡", run: openSessions },
    { id: "model", tr: "Model seç", en: "Pick model", subTr: "Model listesini aç", subEn: "Open the model list", icon: "◇", run: openProviderModelPicker },
    { id: "providers", tr: "Sağlayıcılar", en: "Providers", subTr: "Sağlayıcı ve anahtarlar", subEn: "Providers and keys", hint: "Ctrl+,", icon: "⚙", run: openReactSettings },
    { id: "theme", tr: "Tema", en: "Theme", subTr: "Malzeme ve tipografi", subEn: "Material and typography", icon: "◑", run: openTheme },
    { id: "lang", tr: "Dil değiştir", en: "Switch language", subTr: "TR / EN", subEn: "TR / EN", icon: "文", run: () => setLang(lang === "tr" ? "en" : "tr") },
    { id: "files", tr: "Dosyalar", en: "Files", subTr: "Dosya gezgini", subEn: "File explorer", hint: "Ctrl+B", icon: "▤", run: () => openDrawer("explorer") },
    { id: "editor", tr: "Editör paneli", en: "Editor panel", subTr: "Aç / kapat", subEn: "Toggle", hint: "Ctrl+E", icon: "▥", run: () => toggleEditor() },
    { id: "extensions", tr: "Uzantılar", en: "Extensions", subTr: "Uzantı paneli", subEn: "Extensions panel", icon: "⊞", run: () => openDrawer("extensions") },
    { id: "details", tr: "Tool ayrıntıları", en: "Tool details", subTr: "Varsayılan açık/kapalı", subEn: "Default expanded/collapsed", icon: "↕", run: toggleDetails },
    { id: "stop", tr: "Durdur", en: "Stop", subTr: "Süren akışı kes", subEn: "Interrupt the stream", hint: "Esc", icon: "■", run: () => stopRun() || toast(t("ready")) },
    { id: "classic", tr: "Klasik düzen", en: "Classic layout", subTr: "VS Code tarzına dön", subEn: "Back to the VS Code-style UI", icon: "▣", run: () => applySkin("classic") },
    { id: "help", tr: "Kısayollar", en: "Shortcuts", subTr: "Tuş haritası", subEn: "Key map", hint: "?", icon: "?", run: openHelp }
  ];

  /* drawer, editor, skin                                                */

  function openDrawer(kind) {
    const title = kind === "extensions" ? "Extensions" : "Explorer";
    const side = q(".sidebar");
    const current = (q(".sidebar-title") || {}).textContent || "";
    // The activity button toggles the panel: only click when the sidebar is
    // unmounted or a different view is showing, otherwise React hides it.
    if (!side || current.trim().toLowerCase() !== title.toLowerCase()) clickByTitle(title);
    state.drawer = kind;
    document.documentElement.dataset.ocDrawer = kind;
  }

  function setDrawer(kind) {
    state.drawer = kind;
    if (kind) document.documentElement.dataset.ocDrawer = kind;
    else delete document.documentElement.dataset.ocDrawer;
  }

  function toggleDrawer(kind) {
    if (state.drawer === kind) setDrawer(null);
    else openDrawer(kind);
  }

  function setEditor(open) {
    state.editorOpen = Boolean(open);
    if (open) {
      document.documentElement.dataset.ocEditor = "open";
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), 220);
    } else {
      delete document.documentElement.dataset.ocEditor;
      window.setTimeout(() => window.dispatchEvent(new Event("resize")), 220);
    }
  }

  function toggleEditor() {
    if (!state.editorOpen && !q(".tab-bar .tab-name")) {
      toast(lang === "tr" ? "Önce bir dosya aç" : "Open a file first");
      openDrawer("explorer");
      return;
    }
    setEditor(!state.editorOpen);
  }

  function applySkin(next) {
    const skin = next === "classic" ? "classic" : "opencode";
    write(LS.skin, skin);
    document.documentElement.dataset.oc = skin === "opencode" ? "1" : "classic";
    if (skin === "classic") {
      setDrawer(null);
      setEditor(false);
      closeOverlay();
    } else {
      setEditor(state.editorOpen);
      attachDock();
      scanTranscript();
    }
  }

  function setLang(next) {
    lang = next === "en" ? "en" : "tr";
    write(LS.lang, lang);
    document.documentElement.lang = lang;
    closeOverlay();
    if (state.shell) {
      state.shell.remove();
      state.shell = null;
    }
    state.hint = null;
    state.greeting = pickGreeting();
    buildShell();
    attachDock();
    refreshCrumb();
    toast(lang === "tr" ? "Dil: Türkçe" : "Language: English");
  }

  function toggleDetails() {
    state.detailDefault = !state.detailDefault;
    write(LS.details, state.detailDefault ? "1" : "0");
    for (const node of qa(".oc-tool")) node.dataset.open = state.detailDefault ? "1" : "0";
    toast(`${t("details")}: ${state.detailDefault ? "on" : "off"}`);
  }

  /* shell (!) commands                                                  */

  function shellCard(command) {
    if (!state.shellout) attachDock();
    let host = state.shellout;
    if (!host) return null;

    const card = el("div", "oc-shellout-card");
    const head = el("div", "oc-shellout-head");
    head.appendChild(el("strong", "", `! ${truncate(command, 60)}`));
    const status = el("span", "", t("shellRunning"));
    head.appendChild(status);
    const close = el("button", "oc-shellout-close", "✕");
    close.type = "button";
    close.setAttribute("aria-label", lang === "tr" ? "Kapat" : "Close");
    close.addEventListener("click", () => card.remove());
    head.appendChild(close);
    card.appendChild(head);

    const body = el("pre", "oc-shellout-body", "");
    card.appendChild(body);

    host.appendChild(card);
    while (host.children.length > 3) host.removeChild(host.firstChild);

    return { card, status, body };
  }

  async function runShell(command) {
    if (!command) return;
    if (!api.terminal || !api.terminal.create) {
      toast(t("noApi"), "error");
      return;
    }

    const view = shellCard(command);
    if (!view) return;

    let id = null;
    try {
      const created = await api.terminal.create({ cwd: "" });
      id = typeof created === "string" ? created : created && created.id;
    } catch (error) {
      view.status.textContent = t("shellFailed");
      view.body.textContent = String(error && error.message ? error.message : error);
      return;
    }

    if (!id) {
      view.status.textContent = t("shellFailed");
      return;
    }

    const buffer = [];
    let done = false;
    let quiet = 0;

    // The terminal is a persistent pipe-backed shell, so a command does not end
    // the process. Treat a quiet pipe as "finished", like opencode's ! runner.
    const settle = () => {
      window.clearTimeout(quiet);
      quiet = window.setTimeout(() => finish("done"), 900);
    };

    const offData = api.terminal.onData((payload) => {
      if (!payload || payload.id !== id) return;
      buffer.push(payload.data || "");
      view.body.textContent = buffer.join("");
      view.body.scrollTop = view.body.scrollHeight;
      settle();
    });

    const offExit = api.terminal.onExit((payload) => {
      if (!payload || payload.id !== id) return;
      finish(payload.code === 0 ? "done" : "failed");
    });

    const timer = window.setTimeout(() => finish("failed"), 120000);

    function finish(result) {
      if (done) return;
      done = true;
      window.clearTimeout(timer);
      window.clearTimeout(quiet);
      view.status.textContent = result === "failed" ? t("shellFailed") : t("shellDone");
      try {
        offData();
        offExit();
      } catch (error) {
        /* ignore */
      }
      api.terminal.kill(id).catch(() => undefined);
    }

    state.terminals.set(id, finish);

    try {
      await api.terminal.write(id, `${command}\r\n`);
    } catch (error) {
      view.body.textContent = String(error && error.message ? error.message : error);
      view.status.textContent = t("shellFailed");
    }
  }

  /* keyboard + observers                                                */

  function onGlobalKey(event) {
    if (document.documentElement.dataset.oc !== "1") return;
    const meta = event.ctrlKey || event.metaKey;
    const target = event.target;
    const inField =
      target &&
      (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

    if (meta && !event.shiftKey && event.key.toLowerCase() === "p") {
      event.preventDefault();
      event.stopPropagation();
      openCommandPalette("");
      return;
    }

    if (meta && !event.shiftKey && event.key.toLowerCase() === "e") {
      event.preventDefault();
      event.stopPropagation();
      toggleEditor();
      return;
    }

    if (meta && !event.shiftKey && event.key.toLowerCase() === "b") {
      event.preventDefault();
      event.stopPropagation();
      toggleDrawer("explorer");
      return;
    }

    if (meta && !event.shiftKey && event.key.toLowerCase() === "n") {
      event.preventDefault();
      event.stopPropagation();
      newSession();
      return;
    }

    if (event.key === "Escape" && !state.overlay) {
      if (state.drawer) {
        setDrawer(null);
        return;
      }
      if (state.editorOpen) {
        setEditor(false);
        return;
      }
      if (inField) return;
      if (stopRun()) toast(t("stopped"));
      return;
    }

    if (event.key === "?" && !inField && !meta) {
      event.preventDefault();
      openHelp();
    }
  }

  function bindObservers() {
    if (document.body) {
      const bodyObserver = new MutationObserver(() => {
        if (state.overlay) return;
        attachDock();
        refreshCrumb();
      });
      bodyObserver.observe(document.body, { childList: true, subtree: false });

      const shellObserver = new MutationObserver(() => {
        scanTranscript();
        syncSessionReadout();
      });
      shellObserver.observe(document.body, { childList: true, subtree: true });
      state.transcriptObserver = shellObserver;

      const dialogObserver = new MutationObserver(() => syncDialogs());
      dialogObserver.observe(document.body, { childList: true, subtree: true });
      state.dialogObserver = dialogObserver;
      syncDialogs();

      const textObserver = new MutationObserver((mutations) => {
        if (state.decorating) return;
        const nodes = new Set();
        for (const mutation of mutations) {
          const node = mutation.target.nodeType === 1 ? mutation.target : mutation.target.parentElement;
          const message = node && node.closest ? node.closest(".pg-msg[data-msg-id]") : null;
          if (message) nodes.add(message);
        }
        if (nodes.size) scheduleDecoration(nodes);
      });
      textObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
      state.textObserver = textObserver;
    }

    document.addEventListener("keydown", onGlobalKey, true);
    window.addEventListener("polyglot:settings-saved", syncSessionReadout);

    document.addEventListener(
      "click",
      (event) => {
        if (document.documentElement.dataset.oc !== "1") return;
        const row = event.target && event.target.closest ? event.target.closest(".sidebar .tree-row") : null;
        if (row && state.drawer) {
          setDrawer(null);
          // only slide the editor in when the click actually opened a file
          window.setTimeout(() => {
            if (q(".tab-bar .tab-name")) setEditor(true);
          }, 260);
        }
      },
      true
    );
  }

  async function pollWorkspace() {
    try {
      const current = await api.workspace.current();
      const name = current?.name || (current?.root ? String(current.root).split(/[\\/]/).pop() : "");
      if (name !== state.workspaceName) {
        state.workspaceName = name || "";
        refreshCrumb();
      }
      state.workspaceRoot = current?.root || "";
      refreshCrumb();
    } catch (error) {
      /* workspace IPC can fail during teardown */
    }
  }

  function mirrorStatus() {
    const hint = state.hint && q(".oc-hint-status", state.hint);
    if (!hint) return;
    const items = qa(".status-bar .status-item")
      .map((node) => (node.textContent || "").trim())
      .filter(Boolean)
      .slice(0, 3);
    const signature = items.join("|");
    if (hint.dataset.ocSig === signature) return;
    hint.dataset.ocSig = signature;
    clear(hint);
    for (const item of items) hint.appendChild(el("span", "", item));
  }

  function boot() {
    state.greeting = pickGreeting();
    buildShell();

    const skin = read(LS.skin, "opencode");
    applySkin(skin === "classic" ? "classic" : "opencode");

    bindObservers();
    attachDock();
    scanTranscript();
    refreshCrumb();

    window.setInterval(() => {
      if (document.documentElement.dataset.oc !== "1") return;
      attachDock();
      scanTranscript();
      mirrorStatus();
      syncDialogs();
    }, 1200);

    window.setInterval(pollWorkspace, 1500);
    pollWorkspace();

    if (read(LS.seeded, "0") !== "1") write(LS.seeded, "1");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
