/* MultiCoder - Instrument themes
 * One drawing instrument in three materials: graphite, ledger paper and
 * drafting paper. Ink is the only accent, a filled block marks the active
 * state, hairlines carry the structure and nothing glows. Injects the token
 * sets, the app-chrome overrides and the typography presets. Selection is
 * persisted in localStorage ("pg.theme" and "pg.type").
 */
(() => {
  "use strict";

  const STORAGE_KEY = "pg.theme";
  const DEFAULT_THEME = "graphite";

  const THEMES = [
    {
      id: "graphite",
      name: "Grafit",
      jp: "01",
      tagline: "Grafit ve gümüş",
      mode: "dark",
      palette: {
        bg: "#0e0f10",
        elevated: "#131416",
        panel: "#16181a",
        border: "#2b2f33",
        muted: "#a2a29c",
        accent: "#e9e6de"
      },
      vars: {
        "bg": "#0e0f10",
        "bg-elevated": "#131416",
        "panel": "#16181a",
        "panel-alt": "#1b1e20",
        "panel-hover": "#22262a",
        "border": "#2b2f33",
        "border-strong": "#3e4449",
        "text": "#e9e6de",
        "muted": "#a2a29c",
        "accent": "#e9e6de",
        "accent-ink": "#0e0f10",
        "accent-soft": "rgba(233, 230, 222, 0.10)",
        "cyan": "#8fb0b8",
        "ok": "#93af8a",
        "warn": "#d2a75c",
        "error": "#e08a7c",
        "error-soft": "rgba(224, 138, 124, 0.12)",
        "radius": "2px",
        "radius-lg": "4px",
        "selection": "rgba(233, 230, 222, 0.16)",
        "backdrop": "rgba(5, 6, 7, 0.76)",
        "shadow": "4px 4px 0 rgba(0, 0, 0, 0.5)",
        "scroll-thumb": "#2e3237",
        "scroll-thumb-hover": "#454b51",
        "editor-bg": "#0d0e0f",
        "editor-line": "#141618",
        "editor-selection": "rgba(233, 230, 222, 0.15)",
        "editor-gutter": "#63676b",
        "editor-gutter-active": "#e9e6de",
        "editor-indent": "#1b1e20",
        "syn-fg": "#e9e6de",
        "syn-keyword": "#d2a75c",
        "syn-string": "#93af8a",
        "syn-number": "#c0a8d8",
        "syn-func": "#8fb0b8",
        "syn-type": "#b6a6c9",
        "syn-comment": "#6e7276",
        "syn-const": "#d2a75c",
        "syn-invalid": "#e08a7c",
        "syn-punct": "#8e8e88"
      }
    },
    {
      id: "ledger",
      name: "Defter",
      jp: "02",
      tagline: "Kâğıt ve mürekkep",
      mode: "light",
      palette: {
        bg: "#f5f3ec",
        elevated: "#faf8f2",
        panel: "#eeeae0",
        border: "#d3cdc0",
        muted: "#59564c",
        accent: "#1a1814"
      },
      vars: {
        "bg": "#f5f3ec",
        "bg-elevated": "#faf8f2",
        "panel": "#eeeae0",
        "panel-alt": "#e7e3d8",
        "panel-hover": "#dfdacd",
        "border": "#d3cdc0",
        "border-strong": "#b5ae9d",
        "text": "#1a1814",
        "muted": "#59564c",
        "accent": "#1a1814",
        "accent-ink": "#f5f3ec",
        "accent-soft": "rgba(26, 24, 20, 0.08)",
        "cyan": "#2c5560",
        "ok": "#3e6244",
        "warn": "#7a5a18",
        "error": "#97352a",
        "error-soft": "rgba(151, 53, 42, 0.10)",
        "radius": "2px",
        "radius-lg": "4px",
        "selection": "rgba(26, 24, 20, 0.16)",
        "backdrop": "rgba(30, 28, 22, 0.32)",
        "shadow": "4px 4px 0 rgba(26, 24, 20, 0.12)",
        "scroll-thumb": "#cfc8b9",
        "scroll-thumb-hover": "#b3aa97",
        "editor-bg": "#fbf9f3",
        "editor-line": "#f0ece1",
        "editor-selection": "rgba(26, 24, 20, 0.14)",
        "editor-gutter": "#8a857a",
        "editor-gutter-active": "#1a1814",
        "editor-indent": "#e2dccc",
        "syn-fg": "#23211b",
        "syn-keyword": "#8a5a1c",
        "syn-string": "#46603f",
        "syn-number": "#7a5a18",
        "syn-func": "#2c5560",
        "syn-type": "#6b4a79",
        "syn-comment": "#7e7a70",
        "syn-const": "#7a5a18",
        "syn-invalid": "#97352a",
        "syn-punct": "#6e6a5f"
      }
    },
    {
      id: "blueprint",
      name: "Aydınger",
      jp: "03",
      tagline: "Çizim masası",
      mode: "light",
      palette: {
        bg: "#f0f3f6",
        elevated: "#f7fafc",
        panel: "#e6ebf0",
        border: "#c3cbd5",
        muted: "#4c5966",
        accent: "#0f151b"
      },
      vars: {
        "bg": "#f0f3f6",
        "bg-elevated": "#f7fafc",
        "panel": "#e6ebf0",
        "panel-alt": "#dde3ea",
        "panel-hover": "#d2d9e2",
        "border": "#c3cbd5",
        "border-strong": "#9eabb9",
        "text": "#0f151b",
        "muted": "#4c5966",
        "accent": "#0f151b",
        "accent-ink": "#f0f3f6",
        "accent-soft": "rgba(15, 21, 27, 0.08)",
        "cyan": "#24576b",
        "ok": "#345f46",
        "warn": "#7a5514",
        "error": "#932f26",
        "error-soft": "rgba(147, 47, 38, 0.10)",
        "radius": "2px",
        "radius-lg": "4px",
        "selection": "rgba(15, 21, 27, 0.14)",
        "backdrop": "rgba(20, 26, 32, 0.30)",
        "shadow": "4px 4px 0 rgba(15, 21, 27, 0.12)",
        "scroll-thumb": "#c2cbd4",
        "scroll-thumb-hover": "#a5b0bc",
        "editor-bg": "#f8fafc",
        "editor-line": "#edf1f5",
        "editor-selection": "rgba(15, 21, 27, 0.14)",
        "editor-gutter": "#7e8894",
        "editor-gutter-active": "#0f151b",
        "editor-indent": "#dce2e9",
        "syn-fg": "#1a222a",
        "syn-keyword": "#7a5514",
        "syn-string": "#345f46",
        "syn-number": "#7a5514",
        "syn-func": "#24576b",
        "syn-type": "#5a4a78",
        "syn-comment": "#6e7a86",
        "syn-const": "#7a5514",
        "syn-invalid": "#932f26",
        "syn-punct": "#5c6672"
      }
    }
  ];
  const themeVars = (theme) =>
    Object.entries(theme.vars)
      .map(([key, value]) => `--${key}:${value};`)
      .join("");

  const THEME_CSS = THEMES.map(
    (theme) =>
      `:root[data-pg-theme="${theme.id}"]{color-scheme:${theme.mode};${themeVars(theme)}}`
  ).join("\n");

  const TYPE_KEY = "pg.type";
  const DEFAULT_TYPE = "instrument";

  const TYPE_PRESETS = [
    {
      id: "instrument",
      name: "Ölçü",
      note: "Sitka · Segoe UI",
      sample: "Aa",
      vars: {
        "display-font": `"Sitka Banner", "Sitka Text", Charter, "Palatino Linotype", Georgia, serif`,
        "ui-font": `"Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif`,
        "mono-font": `"Cascadia Mono", "Cascadia Code", Consolas, monospace`,
        "tracking": "0em"
      }
    },
    {
      id: "drawing",
      name: "Çizim",
      note: "Bahnschrift · Cascadia",
      sample: "Aa",
      vars: {
        "display-font": `Bahnschrift, "Segoe UI Variable Display", "Segoe UI", sans-serif`,
        "ui-font": `Bahnschrift, "Segoe UI Variable Text", "Segoe UI", sans-serif`,
        "mono-font": `"Cascadia Mono", "Cascadia Code", Consolas, monospace`,
        "tracking": ".01em"
      }
    },
    {
      id: "book",
      name: "Kitap",
      note: "Constantia · Candara",
      sample: "Aa",
      vars: {
        "display-font": `Constantia, Georgia, "Times New Roman", serif`,
        "ui-font": `Candara, "Segoe UI", "Trebuchet MS", sans-serif`,
        "mono-font": `Consolas, "Cascadia Mono", monospace`,
        "tracking": ".002em"
      }
    },
  ];
  const TYPE_CSS = TYPE_PRESETS.map(
    (preset) =>
      `:root[data-pg-type="${preset.id}"]{${Object.entries(preset.vars)
        .map(([key, value]) => `--${key}:${value};`)
        .join("")}}`
  ).join("\n");

  const BASE_CSS = `
  /* ---------------------------------------------------------------- */
  /* ground, type, the quiet architecture                              */
  /* ---------------------------------------------------------------- */
  :root {
    --display-font: "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif;
    --ui-font: "Segoe UI Variable Text", "Segoe UI", system-ui, -apple-system, sans-serif;
    --mono-font: "JetBrains Mono", "Cascadia Code", Consolas, monospace;
  }
  html[data-pg-theme] body {
    background: var(--bg);
    color: var(--text);
    font-family: var(--ui-font);
    font-size: var(--oc-text-3);
    letter-spacing: var(--tracking, .002em);
    -webkit-font-smoothing: antialiased;
  }
  html[data-pg-theme] ::selection { background: var(--selection); color: var(--text); }
  html[data-pg-theme] ::-webkit-scrollbar { width: 10px; height: 10px; }
  html[data-pg-theme] ::-webkit-scrollbar-thumb {
    background: var(--scroll-thumb) padding-box content-box;
    border: 3px solid transparent; border-radius: 999px;
  }
  html[data-pg-theme] ::-webkit-scrollbar-thumb:hover {
    background: var(--scroll-thumb-hover) padding-box content-box;
  }
  html[data-pg-theme] ::-webkit-scrollbar-track { background: transparent; }
  html[data-pg-theme] code, html[data-pg-theme] kbd {
    background: var(--panel-alt); color: var(--text);
    border: 1px solid var(--border); border-radius: var(--radius);
    font-family: var(--mono-font); font-size: var(--oc-text-2);
  }
  html[data-pg-theme] button { color: inherit; font-family: inherit; }
  html[data-pg-theme] button:focus-visible,
  html[data-pg-theme] input:focus-visible,
  html[data-pg-theme] textarea:focus-visible,
  html[data-pg-theme] select:focus-visible,
  html[data-pg-theme] [tabindex]:focus-visible {
    outline: 1.5px solid var(--accent); outline-offset: 2px;
  }
  html[data-pg-theme] .boot-screen { background: var(--bg); color: var(--muted); }

  /* activity rail ---------------------------------------------------- */
  html[data-pg-theme] .activity-bar {
    background: var(--bg-elevated);
    border-right: 1px solid var(--border);
    width: 56px; flex: 0 0 56px;
    padding: 10px 0 8px; gap: 2px;
  }
  html[data-pg-theme] .activity-button {
    width: 36px; height: 36px; border-radius: var(--radius);
    color: var(--muted);
    transition: background-color .18s ease, color .18s ease;
  }
  html[data-pg-theme] .activity-button:hover {
    background: var(--panel-hover); color: var(--text);
  }
  html[data-pg-theme] .activity-button.active {
    background: var(--accent); color: var(--accent-ink);
  }
  html[data-pg-theme] .activity-button.active:hover {
    background: var(--accent); color: var(--accent-ink);
  }
  html[data-pg-theme] .activity-button svg { width: 19px; height: 19px; }
  html[data-pg-theme] .pg-settings-gear svg { width: 19px; height: 19px; }
  html[data-pg-theme] .pg-brand {
    position: relative; width: 36px; height: 36px; flex: 0 0 36px;
    display: grid; place-items: center; color: var(--accent);
    margin-bottom: 10px; opacity: .9;
  }
  html[data-pg-theme] .pg-brand::after {
    content: ""; position: absolute; left: 8px; right: 8px; bottom: -7px;
    height: 1px; background: var(--border);
  }

  /* explorer --------------------------------------------------------- */
  html[data-pg-theme] .sidebar {
    background: var(--panel); border-right: 1px solid var(--border);
    flex: 0 0 252px; width: 252px;
  }
  html[data-pg-theme] .sidebar-header {
    height: 44px; border-bottom: 1px solid var(--border);
    padding: 0 8px 0 16px;
  }
  html[data-pg-theme] .sidebar-title {
    font-size: var(--oc-text-1); letter-spacing: .04em; font-weight: 600; color: var(--muted);
  }
  html[data-pg-theme] .sidebar-actions .icon-button { width: 24px; height: 24px; border-radius: var(--radius); }
  html[data-pg-theme] .tree { padding: 7px 8px; }
  html[data-pg-theme] .tree-row {
    height: 28px; border-radius: var(--radius); color: var(--text);
    font-size: var(--oc-text-3); gap: 6px; padding-right: 10px;
    transition: background-color .15s ease, color .15s ease;
  }
  html[data-pg-theme] .tree-row:hover { background: var(--panel-hover); }
  html[data-pg-theme] .tree-row.selected { background: var(--panel-hover); }
  html[data-pg-theme] .tree-row.active { background: var(--accent-soft); color: var(--text); }
  html[data-pg-theme] .tree-chevron, html[data-pg-theme] .tree-icon { color: var(--muted); }
  html[data-pg-theme] .sidebar-footer { border-top: 1px solid var(--border); padding: 10px 14px; }
  html[data-pg-theme] .empty-explorer { padding: 26px 18px; gap: 14px; }
  html[data-pg-theme] .empty-explorer p { color: var(--muted); font-size: var(--oc-text-3); line-height: 1.6; }
  html[data-pg-theme] .create-row { border-bottom: 1px solid var(--border); padding: 7px 12px; }
  html[data-pg-theme] .inline-input {
    background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius);
    color: var(--text); padding: 4px 7px; font: inherit; font-size: var(--oc-text-2);
  }
  html[data-pg-theme] .inline-input:focus { border-color: var(--accent); outline: none; }

  /* editor frame ------------------------------------------------------ */
  html[data-pg-theme] .center-column { background: var(--bg); }
  html[data-pg-theme] .tab-bar {
    background: var(--bg-elevated); border-bottom: 1px solid var(--border);
    height: 38px; flex-basis: 38px;
  }
  html[data-pg-theme] .tab {
    position: relative; background: transparent; border-right: 0;
    color: var(--muted); font-size: var(--oc-text-3); padding: 0 14px;
    transition: background-color .15s ease, color .15s ease;
  }
  html[data-pg-theme] .tab:hover { background: var(--panel-hover); color: var(--text); }
  html[data-pg-theme] .tab.active { background: transparent; color: var(--text); box-shadow: none; }
  html[data-pg-theme] .tab.active::after {
    content: ""; position: absolute; left: 14px; right: 14px; bottom: 0;
    height: 1px; background: var(--accent);
  }
  html[data-pg-theme] .tab-close:hover { background: var(--panel-hover); color: var(--text); }
  html[data-pg-theme] .tab-dirty { background: var(--accent); }

  /* welcome ----------------------------------------------------------- */
  html[data-pg-theme] .welcome-overlay { background: var(--bg); padding: 40px; overflow: hidden; }
  html[data-pg-theme] .welcome-card {
    max-width: 540px; gap: 16px; align-items: flex-start; text-align: left;
  }
  html[data-pg-theme] .welcome-card.compact {
    align-items: flex-start; text-align: left; gap: 8px;
  }
  html[data-pg-theme] .welcome-card.compact h2 {
    margin: 0; color: var(--text); font-family: var(--display-font);
    font-size: var(--oc-text-5); font-weight: 400; letter-spacing: -.01em;
  }
  html[data-pg-theme] .welcome-card.compact p {
    color: var(--muted); font-size: var(--oc-text-3); line-height: 1.7; max-width: 42ch;
  }
  html[data-pg-theme] .welcome-card.compact .pg-enso-mark {
    display: none;
  }
  html[data-pg-theme] .welcome-card > svg { display: none; }
  html[data-pg-theme] .pg-enso-mark {
    width: 34px; height: 34px; color: var(--accent); opacity: 1; margin-bottom: 6px;
  }
  html[data-pg-theme] .welcome-card h1 {
    background: none; -webkit-background-clip: initial; background-clip: initial;
    -webkit-text-fill-color: currentColor; color: var(--text);
    font-family: var(--display-font); font-size: var(--oc-text-display);
    font-weight: 400; line-height: 1.08; letter-spacing: -.012em;
  }
  html[data-pg-theme] .welcome-card p {
    color: var(--muted); font-size: var(--oc-text-3); line-height: 1.75; max-width: 50ch;
  }
  html[data-pg-theme] .welcome-actions { gap: 10px; margin-top: 6px; }
  html[data-pg-theme] .welcome-points {
    margin-top: 10px; font-size: var(--oc-text-3); line-height: 1.95; color: var(--muted);
  }
  html[data-pg-theme] .welcome-points li::marker { color: var(--accent); }

  /* buttons ----------------------------------------------------------- */
  html[data-pg-theme] .primary-button {
    background: var(--accent); border: 1px solid var(--accent); color: var(--accent-ink);
    border-radius: var(--radius); padding: 8px 15px; font-size: var(--oc-text-3); font-weight: 600;
    transition: filter .16s ease;
  }
  html[data-pg-theme] .primary-button:hover { filter: brightness(1.05); }
  html[data-pg-theme] .primary-button:active { }
  html[data-pg-theme] .secondary-button {
    background: transparent; border: 1px solid var(--border-strong); color: var(--text);
    border-radius: var(--radius); padding: 7px 14px; font-size: var(--oc-text-3);
    transition: background-color .16s ease, border-color .16s ease;
  }
  html[data-pg-theme] .secondary-button:hover { background: var(--panel-hover); border-color: var(--muted); }
  html[data-pg-theme] .secondary-button:active { }
  html[data-pg-theme] .link-button { color: var(--accent); }
  html[data-pg-theme] .icon-button { border-radius: var(--radius); }
  html[data-pg-theme] .icon-button:hover { background: var(--panel-hover); color: var(--text); }
  html[data-pg-theme] .pill { background: var(--panel-hover); color: var(--muted); }
  html[data-pg-theme] .muted { color: var(--muted); }
  /* providers --------------------------------------------------------- */
  html[data-pg-theme] .agent-panel {
    background: var(--panel); border-left: 1px solid var(--border);
  }
  html[data-pg-theme] .agent-panel-header {
    height: 44px; flex-basis: 44px; border-bottom: 1px solid var(--border);
  }
  html[data-pg-theme] .agent-panel-title { color: var(--text); font-weight: 550; }
  html[data-pg-theme] .panel-header {
    background: var(--panel); border-bottom: 1px solid var(--border);
    height: 34px; flex-basis: 34px;
  }
  html[data-pg-theme] .panel-title { font-size: var(--oc-text-1); letter-spacing: .04em; }
  html[data-pg-theme] .pg-providers { background: var(--panel); color: var(--text); }
  html[data-pg-theme] .pg-providers-head {
    border-bottom: 1px solid var(--border); padding: 12px 40px;
  }
  html[data-pg-theme] .pg-providers-title { font-size: var(--oc-text-2); font-weight: 600; letter-spacing: .02em; }
  html[data-pg-theme] .pg-providers-sub {
    background: transparent; border: 1px solid var(--border); color: var(--muted);
    font-size: var(--oc-text-1); line-height: 1; padding: 2px 7px; border-radius: 999px;
  }
  html[data-pg-theme] .pg-providers-refresh { right: 12px; }
  html[data-pg-theme] .pg-provider-list { padding: 4px 12px 14px; gap: 0; }
  html[data-pg-theme] .pg-provider {
    background: transparent; border: 0; border-bottom: 1px solid var(--border);
    border-radius: 0;
  }
  html[data-pg-theme] .pg-provider:last-child { border-bottom: 0; }
  html[data-pg-theme] .pg-provider.is-open { border-color: var(--border); }
  html[data-pg-theme] .pg-provider-row {
    padding: 12px 6px; gap: 9px; border-radius: var(--radius);
    transition: background-color .15s ease;
  }
  html[data-pg-theme] .pg-provider-row:hover { background: var(--panel-hover); }
  html[data-pg-theme] .pg-provider-name { font-size: var(--oc-text-3); font-weight: 550; }
  html[data-pg-theme] .pg-provider-meta { font-size: var(--oc-text-1); }
  html[data-pg-theme] .pg-provider-dot { width: 5px; height: 5px; }
  html[data-pg-theme] .pg-provider-dot.ok { background: var(--ok); }
  html[data-pg-theme] .pg-provider-chevron { font-size: var(--oc-text-1); }
  html[data-pg-theme] .pg-model-box {
    background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius);
    margin: 0 0 12px; padding: 8px;
  }
  html[data-pg-theme] .pg-model-search {
    background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius);
    color: var(--text);
  }
  html[data-pg-theme] .pg-model-search:focus {
    border-color: var(--accent); box-shadow: 0 0 0 2px var(--accent-soft); outline: none;
  }
  html[data-pg-theme] .pg-model:hover { background: var(--panel-hover); }
  html[data-pg-theme] .pg-model.is-current {
    background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--border-strong);
  }
  html[data-pg-theme] .pg-model-tag {
    color: var(--warn); border: 1px solid var(--border); background: transparent;
  }
  html[data-pg-theme] .pg-model-free-note strong { color: var(--warn); font-weight: 600; }
  html[data-pg-theme] .pg-add-providers {
    background: var(--accent); border: 1px solid var(--accent); color: var(--accent-ink);
    border-radius: var(--radius); padding: 3px 10px; font-size: var(--oc-text-1); font-weight: 600;
    transition: filter .16s ease;
  }
  html[data-pg-theme] .pg-add-providers:hover {
    background: var(--accent); border-color: var(--accent); filter: brightness(1.05);
  }
  html[data-pg-theme] .pg-add-providers::before { color: var(--accent-ink); opacity: .7; }

  /* bottom chat band --------------------------------------------------- */
  html[data-pg-theme] .pg-chat-dock {
    background: var(--panel); border-top: 1px solid var(--border);
  }
  html[data-pg-theme] .pg-chat-head {
    height: 38px; background: var(--panel); border-bottom: 1px solid var(--border);
    padding: 0 12px;
  }
  html[data-pg-theme] .pg-chat-title { font-size: var(--oc-text-2); }
  html[data-pg-theme] .pg-chat-where { font-size: var(--oc-text-1); }
  html[data-pg-theme] .pg-chat-select {
    background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text);
  }
  html[data-pg-theme] .pg-chat-model-btn { border-radius: var(--radius); }
  html[data-pg-theme] .pg-chat-model-btn:hover {
    border-color: var(--border-strong); background: var(--panel-hover);
  }
  html[data-pg-theme] .pg-chat-model-btn.is-open { border-color: var(--accent); }
  html[data-pg-theme] .pg-model-pop {
    background: var(--panel); border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg); box-shadow: var(--shadow);
  }
  html[data-pg-theme] .pg-model-pop-head { background: var(--panel); border-bottom: 1px solid var(--border); }
  html[data-pg-theme] .pg-model-pop-search {
    background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text);
  }
  html[data-pg-theme] .pg-model-pop-search:focus { border-color: var(--accent); outline: none; }
  html[data-pg-theme] .pg-model-pop-item:hover,
  html[data-pg-theme] .pg-model-pop-item.is-active { background: var(--panel-hover); }
  html[data-pg-theme] .pg-model-pop-item.is-current {
    background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--border-strong);
  }
  html[data-pg-theme] .pg-chat-log { padding: 14px 18px; gap: 9px; }
  html[data-pg-theme] .pg-msg {
    border-radius: var(--radius-lg); padding: 8px 12px; font-size: var(--oc-text-3); line-height: 1.6;
    animation: pg-msg-in .24s ease-out both;
  }
  html[data-pg-theme] .pg-msg.user {
    background: var(--accent-soft); border: 1px solid var(--border-strong);
    color: var(--text); border-bottom-right-radius: 2px;
  }
  html[data-pg-theme] .pg-msg.assistant {
    background: transparent; border: 1px solid var(--border);
    color: var(--text); border-bottom-left-radius: 2px;
  }
  html[data-pg-theme] .pg-msg.system { background: none; border: 1px dashed var(--border); color: var(--muted); }
  html[data-pg-theme] .pg-msg.tool {
    background: var(--bg); border-left: 2px solid var(--accent);
    border-top: 1px solid var(--border); border-right: 1px solid var(--border);
    border-bottom: 1px solid var(--border); color: var(--muted);
  }
  html[data-pg-theme] .pg-msg.error { background: transparent; border: 1px solid var(--error); color: var(--error); }
  html[data-pg-theme] .pg-msg-speaker { color: var(--accent); font-size: var(--oc-text-1); }
  html[data-pg-theme] .pg-round {
    color: var(--muted); font-size: var(--oc-text-1);
    animation: pg-msg-in .24s ease-out both;
  }
  html[data-pg-theme] .pg-round::before,
  html[data-pg-theme] .pg-round::after { background: var(--border); }
  html[data-pg-theme] .pg-composer {
    background: var(--panel); border-top: 1px solid var(--border); padding: 10px 14px;
  }
  html[data-pg-theme] .pg-chat-input {
    background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-lg); color: var(--text);
  }
  html[data-pg-theme] .pg-chat-input:focus {
    border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-soft); outline: none;
  }
  html[data-pg-theme] .pg-btn {
    background: transparent; border: 1px solid var(--border-strong);
    border-radius: var(--radius); color: var(--text);
    transition: background-color .15s ease, border-color .15s ease, transform .12s ease;
  }
  html[data-pg-theme] .pg-btn:hover { background: var(--panel-hover); }
  html[data-pg-theme] .pg-btn:active { }
  html[data-pg-theme] .pg-btn.primary {
    background: var(--accent); border-color: var(--accent); color: var(--accent-ink); font-weight: 600;
  }
  html[data-pg-theme] .pg-btn.primary:hover { filter: brightness(1.05); }
  html[data-pg-theme] .pg-btn.danger {
    color: var(--error); border-color: var(--error); background: transparent;
  }
  html[data-pg-theme] .pg-toast {
    background: var(--panel); border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg); box-shadow: var(--shadow); color: var(--text);
  }
  html[data-pg-theme] .pg-toast[data-tone="error"] { border-color: var(--error); color: var(--error); }

  /* debate ------------------------------------------------------------- */
  html[data-pg-theme] .pg-debate-btn.is-on {
    border-color: var(--border-strong); background: var(--accent-soft); color: var(--text);
  }
  html[data-pg-theme] .pg-debate-badge { background: var(--accent); color: var(--accent-ink); }
  html[data-pg-theme] .pg-debate-pop {
    background: var(--panel); border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg); box-shadow: var(--shadow);
  }
  html[data-pg-theme] .pg-debate-head { border-bottom: 1px solid var(--border); }
  html[data-pg-theme] .pg-debate-search {
    background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text);
  }
  html[data-pg-theme] .pg-debate-search:focus { border-color: var(--accent); outline: none; }
  html[data-pg-theme] .pg-debate-item:hover { background: var(--panel-hover); }
  html[data-pg-theme] .pg-debate-item.is-picked {
    background: var(--accent-soft); box-shadow: inset 0 0 0 1px var(--border-strong);
  }
  html[data-pg-theme] .pg-debate-foot { border-top: 1px solid var(--border); }
  /* settings dialog + theme picker ------------------------------------- */
  html[data-pg-theme] .pg-settings-backdrop {
    background: var(--backdrop); backdrop-filter: blur(3px);
    animation: pg-fade .18s ease-out both;
  }
  html[data-pg-theme] .pg-settings-panel {
    width: 980px; max-width: 100%; background: var(--panel);
    border: 1px solid var(--border-strong); border-radius: var(--radius-lg);
    box-shadow: var(--shadow); overflow: hidden;
    animation: pg-dialog-in .28s cubic-bezier(.16, 1, .3, 1) both;
  }
  html[data-pg-theme] .pg-settings-panel:focus { outline: none; }
  html[data-pg-theme] .pg-settings-head {
    background: transparent; border-bottom: 1px solid var(--border);
    padding: 14px 18px; gap: 10px;
  }  html[data-pg-theme] .pg-settings-head svg { color: var(--muted); }
  html[data-pg-theme] .pg-settings-title {
    font-family: var(--display-font); font-size: var(--oc-text-5); font-weight: 500; letter-spacing: .01em;
  }
  html[data-pg-theme] .pg-settings-close {
    border-radius: var(--radius); color: var(--muted); width: 28px; height: 28px;
  }
  html[data-pg-theme] .pg-settings-close:hover { background: var(--panel-hover); color: var(--text); }
  html[data-pg-theme] .pg-settings-close:focus { outline: none; border-color: var(--border-strong); }
  html[data-pg-theme] .pg-settings-close:focus-visible {
    outline: 1.5px solid var(--accent); outline-offset: 2px;
  }
  html[data-pg-theme] .pg-settings-body {
    display: grid;
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
    grid-template-rows: auto auto;
    column-gap: 26px;
    align-items: stretch;
    padding: 18px 24px 18px; color: var(--text);
    overflow: auto; max-height: min(84vh, 820px);
  }
  /* Native settings dialog (opens from "Add providers" in the workbench) */
  .modal-backdrop:not(.palette-backdrop) {
    animation: pg-fade .18s ease-out both;
  }
  .modal.settings-modal {
    animation: pg-dialog-in .28s cubic-bezier(.16, 1, .3, 1) both;
  }
  html[data-pg-theme] .pg-settings-section { display: flex; flex-direction: column; min-width: 0; }
  html[data-pg-theme] .pg-settings-themes { grid-column: 1; grid-row: 1; }
  html[data-pg-theme] .pg-settings-type {
    grid-column: 2; grid-row: 1;
    border-left: 1px solid var(--border); padding-left: 26px;
  }
  html[data-pg-theme] .pg-settings-kicker {
    font-size: var(--oc-text-1); color: var(--muted);
  }
  html[data-pg-theme] .pg-settings-heading {
    font-family: var(--display-font); font-size: var(--oc-text-5); font-weight: 500;
    margin: 5px 0 0; letter-spacing: -.01em;
  }
  html[data-pg-theme] .pg-settings-sub {
    margin: 5px 0 0; font-size: var(--oc-text-2); line-height: 1.6; color: var(--muted); max-width: 54ch;
  }
  html[data-pg-theme] .pg-theme-grid {
    display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px; margin-top: 12px;
  }
  html[data-pg-theme] .pg-theme-card {
    display: flex; flex-direction: column; gap: 7px; padding: 7px;
    background: transparent; border: 1px solid var(--border); border-radius: var(--radius-lg);
    text-align: left; cursor: pointer; color: var(--text);
    transition: border-color .2s ease, background-color .2s ease, transform .2s ease;
  }
  html[data-pg-theme] .pg-theme-card:hover {
    border-color: var(--border-strong); background: var(--panel-hover);
  }
  html[data-pg-theme] .pg-theme-card:active { transform: translateY(0); }
  html[data-pg-theme] .pg-theme-card.is-active {
    border-color: var(--accent); background: var(--accent-soft);
  }
  html[data-pg-theme] .pg-theme-preview {
    position: relative; display: flex; height: 60px; overflow: hidden;
    border: 1px solid var(--pv-border, var(--border)); border-radius: var(--radius);
    background: var(--pv-bg, var(--bg));
  }
  html[data-pg-theme] .pg-tp-rail {
    flex: 0 0 11px; display: flex; flex-direction: column; align-items: center; gap: 3px;
    padding-top: 6px; background: var(--pv-elevated, var(--bg-elevated));
    border-right: 1px solid var(--pv-border, var(--border));
  }
  html[data-pg-theme] .pg-tp-dot {
    width: 3px; height: 3px; border-radius: 50%; background: var(--pv-muted, var(--muted)); opacity: .5;
  }
  html[data-pg-theme] .pg-tp-dot:first-child { background: var(--pv-accent, var(--accent)); opacity: 1; }
  html[data-pg-theme] .pg-tp-side {
    flex: 0 0 34px; display: flex; flex-direction: column; gap: 4px; padding: 8px 6px;
    background: var(--pv-panel, var(--panel)); border-right: 1px solid var(--pv-border, var(--border));
  }
  html[data-pg-theme] .pg-tp-line {
    height: 2px; border-radius: 2px; background: var(--pv-muted, var(--muted)); opacity: .35;
  }
  html[data-pg-theme] .pg-tp-line.s { width: 62%; }
  html[data-pg-theme] .pg-tp-line.m { width: 82%; }
  html[data-pg-theme] .pg-tp-canvas {
    position: relative; flex: 1; display: flex; flex-direction: column; gap: 5px;
    padding: 10px; background: var(--pv-bg, var(--bg));
  }
  html[data-pg-theme] .pg-tp-code {
    height: 2px; border-radius: 2px; background: var(--pv-muted, var(--muted)); opacity: .35;
  }
  html[data-pg-theme] .pg-tp-code.a { width: 64%; }
  html[data-pg-theme] .pg-tp-code.b { width: 80%; background: var(--pv-accent, var(--accent)); opacity: .75; }
  html[data-pg-theme] .pg-tp-code.c { width: 46%; }
  html[data-pg-theme] .pg-tp-enso {
    position: absolute; right: 8px; bottom: 7px; width: 16px; height: 16px;
    color: var(--pv-accent, var(--accent)); opacity: .62;
  }
  html[data-pg-theme] .pg-tp-panel {
    flex: 0 0 26px; display: flex; flex-direction: column; gap: 4px; padding: 8px 5px;
    background: var(--pv-panel, var(--panel)); border-left: 1px solid var(--pv-border, var(--border));
  }
  html[data-pg-theme] .pg-theme-caption { display: flex; flex-direction: column; gap: 1px; padding: 0 3px 1px; }
  html[data-pg-theme] .pg-theme-line { display: flex; align-items: baseline; gap: 6px; min-width: 0; }
  html[data-pg-theme] .pg-theme-name {
    font-family: var(--display-font); font-size: var(--oc-text-4); font-weight: 600; letter-spacing: .01em;
    white-space: nowrap;
  }
  html[data-pg-theme] .pg-theme-jp {
    flex: 0 0 auto; font-size: var(--oc-text-1); color: var(--muted);
    letter-spacing: .04em; white-space: nowrap;
  }
  html[data-pg-theme] .pg-theme-state {
    margin-left: auto; flex: 0 0 auto; font-size: var(--oc-text-1);
    color: var(--accent); opacity: 0; transition: opacity .2s ease; white-space: nowrap;
  }
  html[data-pg-theme] .pg-theme-card.is-active .pg-theme-state { opacity: 1; }
  html[data-pg-theme] .pg-theme-tagline { padding: 0 3px 2px; font-size: var(--oc-text-1); color: var(--muted); }
  /* typography picker --------------------------------------------------- */
  html[data-pg-theme] .pg-type-list {
    display: flex; flex-direction: column; gap: 8px; margin-top: 16px;
  }
  html[data-pg-theme] .pg-type-card {
    display: grid; grid-template-columns: 46px minmax(0, 1fr) auto;
    align-items: center; column-gap: 12px; row-gap: 1px;
    padding: 9px 12px; background: transparent;
    border: 1px solid var(--border); border-radius: var(--radius-lg);
    color: var(--text); text-align: left; cursor: pointer;
    transition: border-color .18s ease, background-color .18s ease;
  }
  html[data-pg-theme] .pg-type-card:hover {
    border-color: var(--border-strong); background: var(--panel-hover);
  }

  html[data-pg-theme] .pg-type-card.is-active { border-color: var(--accent); background: var(--accent-soft); }
  html[data-pg-theme] .pg-type-sample {
    grid-row: 1 / span 2; display: grid; place-items: center;
    width: 46px; height: 40px; border-radius: var(--radius);
    border: 1px solid var(--border); background: var(--bg);
    color: var(--text); font-family: var(--sample-display, var(--display-font));
    font-size: var(--oc-text-5); line-height: 1; letter-spacing: -.01em;
  }
  html[data-pg-theme] .pg-type-card.is-active .pg-type-sample { border-color: var(--border-strong); }
  html[data-pg-theme] .pg-type-name {
    font-family: var(--sample-display, var(--display-font));
    font-size: var(--oc-text-4); font-weight: 600; letter-spacing: .01em;
  }
  html[data-pg-theme] .pg-type-note { font-size: var(--oc-text-1); color: var(--muted); }
  html[data-pg-theme] .pg-type-state {
    grid-column: 3; grid-row: 1 / span 2; font-size: var(--oc-text-1);
    color: var(--accent);
    opacity: 0; transition: opacity .2s ease;
  }
  html[data-pg-theme] .pg-type-card.is-active .pg-type-state { opacity: 1; }
  html[data-pg-theme] .pg-settings-note {
    margin: 14px 0 0; font-size: var(--oc-text-1); line-height: 1.65; color: var(--muted);
  }
  html[data-pg-theme] .pg-settings-foot {
    grid-column: 1 / -1; grid-row: 2;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
    margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--border);
    color: var(--muted); font-size: var(--oc-text-1);
  }
  html[data-pg-theme] .pg-settings-foot strong { color: var(--text); font-weight: 500; }
  html[data-pg-theme] .pg-settings-foot .pg-foot-sep { opacity: .45; padding: 0 2px; }
  /* code editor -------------------------------------------------------- */
  html[data-pg-theme] .editor-area { background: var(--editor-bg); }
  html[data-pg-theme] .monaco-editor,
  html[data-pg-theme] .monaco-editor .monaco-editor-background,
  html[data-pg-theme] .monaco-editor .margin,
  html[data-pg-theme] .monaco-editor .minimap {
    background-color: var(--editor-bg) !important;
  }
  html[data-pg-theme] .monaco-editor .line-numbers { color: var(--editor-gutter) !important; }
  html[data-pg-theme] .monaco-editor .line-numbers.active-line-number { color: var(--editor-gutter-active) !important; }
  html[data-pg-theme] .monaco-editor .view-overlays .current-line,
  html[data-pg-theme] .monaco-editor .current-line-exact {
    border: none !important; background-color: var(--editor-line) !important;
  }
  html[data-pg-theme] .monaco-editor .margin-view-overlays .current-line,
  html[data-pg-theme] .monaco-editor .margin-view-overlays .current-line-margin {
    background-color: var(--editor-line) !important;
    border: none !important; box-shadow: none !important;
  }
  html[data-pg-theme] .monaco-editor .view-lines { color: var(--syn-fg); }
  html[data-pg-theme] .monaco-editor .minimap {
    opacity: .28;
    -webkit-mask-image: linear-gradient(to right, transparent, #000 55%);
    mask-image: linear-gradient(to right, transparent, #000 55%);
  }
  html[data-pg-theme="ledger"] .monaco-editor .minimap,
  html[data-pg-theme="blueprint"] .monaco-editor .minimap {
    filter: invert(1) grayscale(1) contrast(.75); opacity: .42;
  }
  html[data-pg-theme] .monaco-editor .decorationsOverviewRuler { opacity: 0; }
  html[data-pg-theme] .monaco-editor .minimap-slider { background: var(--border-strong) !important; }
  html[data-pg-theme] .monaco-editor .minimap-slider:hover { background: var(--muted) !important; }
  html[data-pg-theme] .monaco-editor .scroll-decoration { box-shadow: none !important; }
  html[data-pg-theme] .monaco-editor .selectionHighlight { background-color: var(--accent-soft) !important; }
  html[data-pg-theme] .monaco-editor .selected-text { background-color: var(--editor-selection) !important; }
  html[data-pg-theme] .monaco-editor .cursor,
  html[data-pg-theme] .monaco-editor .cursor .cursor { background-color: var(--accent) !important; border-color: var(--accent) !important; }
  html[data-pg-theme] .monaco-editor .indent-guide { border-color: var(--editor-indent) !important; }
  html[data-pg-theme] .monaco-editor .bracket-match { border-color: var(--accent) !important; }
  html[data-pg-theme] .monaco-editor .scrollbar .slider { background: var(--scroll-thumb) !important; }
  html[data-pg-theme] .monaco-editor .scrollbar .slider:hover { background: var(--scroll-thumb-hover) !important; }
  html[data-pg-theme] .monaco-editor .find-widget,
  html[data-pg-theme] .monaco-editor .suggest-widget,
  html[data-pg-theme] .monaco-editor .monaco-hover {
    background: var(--panel) !important; border-color: var(--border-strong) !important; color: var(--text) !important;
  }
  html[data-pg-theme] .mtk1 { color: var(--syn-fg) !important; }
  html[data-pg-theme] .mtk2 { color: var(--syn-fg) !important; }
  html[data-pg-theme] .mtk3 { color: var(--syn-string) !important; }
  html[data-pg-theme] .mtk4 { color: var(--syn-type) !important; }
  html[data-pg-theme] .mtk5 { color: var(--syn-string) !important; }
  html[data-pg-theme] .mtk6 { color: var(--syn-fg) !important; }
  html[data-pg-theme] .mtk7 { color: var(--syn-number) !important; }
  html[data-pg-theme] .mtk8 { color: var(--syn-comment) !important; }
  html[data-pg-theme] .mtk9 { color: var(--syn-comment) !important; }
  html[data-pg-theme] .mtk10 { color: var(--syn-keyword) !important; }
  html[data-pg-theme] .mtk11 { color: var(--syn-fg) !important; }
  html[data-pg-theme] .mtk12 { color: var(--syn-comment) !important; }
  html[data-pg-theme] .mtk13 { color: var(--syn-func) !important; }
  html[data-pg-theme] .mtk14 { color: var(--syn-invalid) !important; }
  html[data-pg-theme] .mtk15 { color: var(--syn-type) !important; }
  html[data-pg-theme] .mtk16 { color: var(--syn-keyword) !important; }
  html[data-pg-theme] .mtk17 { color: var(--syn-const) !important; }
  html[data-pg-theme] .mtk18 { color: var(--syn-invalid) !important; }
  html[data-pg-theme] .mtk19 { color: var(--syn-number) !important; }
  html[data-pg-theme] .mtk20 { color: var(--syn-func) !important; }
  html[data-pg-theme] .mtk21 { color: var(--syn-comment) !important; }
  html[data-pg-theme] .mtk22 { color: var(--syn-comment) !important; }
  html[data-pg-theme] .mtk23 { color: var(--syn-type) !important; }
  html[data-pg-theme] .mtk24 { color: var(--syn-type) !important; }
  html[data-pg-theme] .mtk25 { color: var(--syn-string) !important; }
  html[data-pg-theme] .mtk26 { color: var(--syn-invalid) !important; }
  html[data-pg-theme] .mtk27 { color: var(--syn-keyword) !important; }
  html[data-pg-theme] .mtk28 { color: var(--syn-func) !important; }
  html[data-pg-theme] .mtk29 { color: var(--syn-type) !important; }
  html[data-pg-theme] .mtk30 { color: var(--syn-func) !important; }
  html[data-pg-theme] .mtk31 { color: var(--syn-keyword) !important; }

  /* status bar --------------------------------------------------------- */
  html[data-pg-theme] .status-bar {
    background: var(--panel); border-top: 1px solid var(--border);
    color: var(--muted); height: 26px; flex-basis: 26px; font-size: var(--oc-text-1);
  }
  html[data-pg-theme] .status-bar .info { color: var(--muted); }

  /* motion -------------------------------------------------------------- */
  @keyframes pg-rise {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: none; }
  }
  @keyframes pg-fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes pg-dialog-in {
    from { opacity: 0; transform: translateY(8px) scale(.985); }
    to { opacity: 1; transform: none; }
  }
  @keyframes pg-msg-in {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: none; }
  }
  html.pg-theme-transition body,
  html.pg-theme-transition .activity-bar,
  html.pg-theme-transition .sidebar,
  html.pg-theme-transition .center-column,
  html.pg-theme-transition .tab-bar,
  html.pg-theme-transition .agent-panel,
  html.pg-theme-transition .pg-providers,
  html.pg-theme-transition .pg-chat-dock,
  html.pg-theme-transition .pg-settings-panel,
  html.pg-theme-transition .status-bar,
  html.pg-theme-transition .monaco-editor {
    transition: background-color .42s ease, color .3s ease, border-color .42s ease;
  }

  /* close / save confirmation dialog ----------------------------------- */
  html[data-pg-theme] .pg-close-backdrop {
    position: fixed; inset: 0; z-index: var(--oc-z-sheet);
    display: grid; place-items: center; padding: 24px;
    background: var(--backdrop); backdrop-filter: blur(3px);
    animation: pg-fade .18s ease-out both;
  }
  html[data-pg-theme] .pg-close-dialog {
    width: 468px; max-width: 100%; background: var(--panel); color: var(--text);
    border: 1px solid var(--border-strong); border-radius: var(--radius-lg);
    box-shadow: var(--shadow); overflow: hidden;
    animation: pg-dialog-in .28s cubic-bezier(.16, 1, .3, 1) both;
  }
  html[data-pg-theme] .pg-close-dialog:focus { outline: none; }
  html[data-pg-theme] .pg-close-head {
    display: flex; align-items: center; gap: 10px;
    padding: 15px 20px 13px; border-bottom: 1px solid var(--border);
  }
  html[data-pg-theme] .pg-close-mark {
    display: grid; place-items: center; flex: 0 0 26px; width: 26px; height: 26px;
    border: 1px solid var(--border-strong); border-radius: 50%; color: var(--accent);
  }
  html[data-pg-theme] .pg-close-mark[data-tone="error"] { color: var(--error); border-color: var(--error); }
  html[data-pg-theme] .pg-close-mark[data-tone="info"] { color: var(--muted); }
  html[data-pg-theme] .pg-close-title {
    font-family: var(--display-font); font-size: var(--oc-text-5); font-weight: 500; letter-spacing: .01em;
  }
  html[data-pg-theme] .pg-close-body { padding: 16px 20px 4px; }
  html[data-pg-theme] .pg-close-message { margin: 0; font-size: var(--oc-text-3); line-height: 1.6; }
  html[data-pg-theme] .pg-close-detail {
    margin: 7px 0 0; font-size: var(--oc-text-2); line-height: 1.65; color: var(--muted);
  }
  html[data-pg-theme] .pg-close-files {
    margin: 11px 0 0; padding: 8px 11px; list-style: none;
    max-height: 148px; overflow: auto;
    background: var(--bg); border: 1px solid var(--border); border-radius: var(--radius-lg);
    font-family: var(--mono-font); font-size: var(--oc-text-2); color: var(--text);
  }
  html[data-pg-theme] .pg-close-files li { display: flex; gap: 7px; padding: 2px 0; min-width: 0; }
  html[data-pg-theme] .pg-close-files li::before {
    content: "\\2022"; color: var(--accent); flex: 0 0 auto;
  }
  html[data-pg-theme] .pg-close-files li span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  html[data-pg-theme] .pg-close-more { padding: 5px 0 0; font-size: var(--oc-text-1); color: var(--muted); }
  html[data-pg-theme] .pg-close-foot {
    display: flex; justify-content: flex-end; gap: 8px; padding: 16px 20px 18px;
  }
  html[data-pg-theme] .pg-close-btn {
    min-width: 92px; padding: 8px 15px; border-radius: var(--radius); cursor: pointer;
    background: transparent; border: 1px solid var(--border-strong); color: var(--text);
    font-size: var(--oc-text-3); font-weight: 500; font-family: var(--ui-font);
    transition: background-color .15s ease, border-color .15s ease, transform .12s ease;
  }
  html[data-pg-theme] .pg-close-btn:hover { background: var(--panel-hover); }
  html[data-pg-theme] .pg-close-btn:active { }
  html[data-pg-theme] .pg-close-btn[data-variant="primary"] {
    background: var(--accent); border-color: var(--accent); color: var(--accent-ink); font-weight: 600;
  }
  html[data-pg-theme] .pg-close-btn[data-variant="primary"]:hover { filter: brightness(1.05); }
  html[data-pg-theme] .pg-close-btn[data-variant="danger"] { color: var(--error); border-color: var(--error); }
  html[data-pg-theme] .pg-close-btn[data-variant="danger"]:hover { background: transparent; filter: brightness(1.08); }

  /* extensions panel --------------------------------------------------- */
  html[data-pg-theme] .extension-card { background: var(--panel-alt); border-color: var(--border); border-radius: var(--radius-lg); }
  html[data-pg-theme] .extension-card header strong { margin-right: auto; font-size: var(--oc-text-3); }
  html[data-pg-theme] .extension-card header { gap: 6px; }
  html[data-pg-theme] .pg-ext-remove {
    flex: 0 0 22px; width: 22px; height: 22px; border-radius: var(--radius);
    color: var(--muted); opacity: .6;
    transition: opacity .16s ease, background-color .16s ease, color .16s ease;
  }
  html[data-pg-theme] .extension-card:hover .pg-ext-remove,
  html[data-pg-theme] .pg-ext-remove:focus-visible { opacity: 1; }
  html[data-pg-theme] .pg-ext-remove:hover { background: var(--panel-hover); color: var(--error); opacity: 1; }
  html[data-pg-theme] .pg-ext-restore {
    display: flex; flex-direction: column; gap: 8px;
    margin-top: 4px; padding: 10px 11px;
    background: transparent; border: 1px dashed var(--border-strong); border-radius: var(--radius-lg);
  }
  html[data-pg-theme] .pg-ext-restore-head {
    display: flex; align-items: center; gap: 8px;
  }
  html[data-pg-theme] .pg-ext-restore-title {
    font-size: var(--oc-text-1); color: var(--muted);
  }
  html[data-pg-theme] .pg-ext-restore-note {
    margin: 0; font-size: var(--oc-text-2); line-height: 1.55; color: var(--muted);
  }
  html[data-pg-theme] .pg-ext-restore-row {
    display: flex; align-items: center; gap: 8px; min-width: 0;
    padding: 6px 8px; border: 1px solid var(--border); border-radius: var(--radius);
    background: var(--bg);
  }
  html[data-pg-theme] .pg-ext-restore-name {
    flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    font-size: var(--oc-text-2);
  }
  html[data-pg-theme] .pg-ext-restore-source {
    flex: 0 0 auto; font-size: var(--oc-text-1); color: var(--muted);
  }
  html[data-pg-theme] .pg-ext-restore-btn {
    flex: 0 0 auto; padding: 4px 9px; border-radius: var(--radius); cursor: pointer;
    background: transparent; border: 1px solid var(--border-strong); color: var(--text);
    font-size: var(--oc-text-1); font-family: var(--ui-font);
    transition: background-color .15s ease, border-color .15s ease;
  }
  html[data-pg-theme] .pg-ext-restore-btn:hover { background: var(--panel-hover); border-color: var(--accent); }

  /* responsive --------------------------------------------------------- */
  @media (max-width: 1280px) {
    html[data-pg-theme] .sidebar { flex-basis: 230px; width: 230px; }
    html[data-pg-theme] .agent-panel { flex-basis: 340px; width: 340px; }
  }
  @media (max-width: 1080px) {
    html[data-pg-theme] .pg-theme-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    html[data-pg-theme] .pg-settings-body { grid-template-columns: minmax(0, 1fr); }
    html[data-pg-theme] .pg-settings-type {
      grid-column: 1; grid-row: 2; border-left: 0; border-top: 1px solid var(--border);
      padding: 20px 0 0; margin-top: 20px;
    }
    html[data-pg-theme] .pg-settings-foot { grid-row: 3; }
  }
  @media (max-width: 860px) {
    html[data-pg-theme] .pg-theme-grid { grid-template-columns: 1fr; }
  }
  @media (prefers-reduced-motion: reduce) {
    html[data-pg-theme] *,
    html[data-pg-theme] *::before,
    html[data-pg-theme] *::after {
      animation-duration: .001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: .001ms !important;
      scroll-behavior: auto !important;
    }
  }
  `;
  const byId = new Map(THEMES.map((theme) => [theme.id, theme]));
  const typeById = new Map(TYPE_PRESETS.map((preset) => [preset.id, preset]));
  let currentTheme = DEFAULT_THEME;
  let currentType = DEFAULT_TYPE;
  let transitionTimer = 0;

  const readStored = () => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      return byId.has(stored) ? stored : DEFAULT_THEME;
    } catch (error) {
      return DEFAULT_THEME;
    }
  };

  const readStoredType = () => {
    try {
      const stored = window.localStorage.getItem(TYPE_KEY);
      return typeById.has(stored) ? stored : DEFAULT_TYPE;
    } catch (error) {
      return DEFAULT_TYPE;
    }
  };

  const injectStyles = () => {
    if (document.getElementById("pg-zen-style")) return;
    const tag = document.createElement("style");
    tag.id = "pg-zen-style";
    tag.textContent = THEME_CSS + TYPE_CSS + BASE_CSS;
    (document.head || document.documentElement).appendChild(tag);
  };

  const applyTheme = (id, options) => {
    const theme = byId.get(id) || byId.get(DEFAULT_THEME);
    currentTheme = theme.id;
    document.documentElement.setAttribute("data-pg-theme", theme.id);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme.id);
    } catch (error) {
      /* storage can be unavailable */
    }
    if (!options || !options.instant) {
      document.documentElement.classList.add("pg-theme-transition");
      window.clearTimeout(transitionTimer);
      transitionTimer = window.setTimeout(
        () => document.documentElement.classList.remove("pg-theme-transition"),
        520
      );
      window.dispatchEvent(
        new CustomEvent("pg-theme-change", {
          detail: { id: theme.id, name: theme.name, tagline: theme.tagline }
        })
      );
    }
    return theme.id;
  };

  const applyType = (id, options) => {
    const preset = typeById.get(id) || typeById.get(DEFAULT_TYPE);
    currentType = preset.id;
    document.documentElement.setAttribute("data-pg-type", preset.id);
    try {
      window.localStorage.setItem(TYPE_KEY, preset.id);
    } catch (error) {
      /* storage can be unavailable */
    }
    if (!options || !options.instant) {
      window.dispatchEvent(
        new CustomEvent("pg-type-change", {
          detail: {
            id: preset.id,
            name: preset.name,
            note: preset.note,
            display: preset.vars["display-font"]
          }
        })
      );
    }
    return preset.id;
  };

  const ensoSvg = (size) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">` +
    `<rect x="2.25" y="2.25" width="19.5" height="19.5" stroke="currentColor" stroke-width="1.3"/>` +
    `<path d="M2.25 9.6h7.35M9.6 2.25v19.5" stroke="currentColor" stroke-width="1.3"/>` +
    `<rect x="9.6" y="9.6" width="4.7" height="4.7" fill="currentColor"/>` +
    `</svg>`;

  const ensureBrand = () => {
    const bar = document.querySelector(".activity-bar");
    if (!bar || bar.querySelector(".pg-brand")) return;
    const brand = document.createElement("div");
    brand.className = "pg-brand";
    brand.title = "MultiCoder";
    brand.setAttribute("aria-hidden", "true");
    brand.innerHTML = ensoSvg(28);
    bar.insertBefore(brand, bar.firstChild);
  };

  const ensureWelcome = () => {
    const card = document.querySelector(".welcome-card");
    if (card && !card.querySelector(".pg-enso-mark")) {
      const mark = document.createElement("div");
      mark.className = "pg-enso-mark";
      mark.setAttribute("aria-hidden", "true");
      mark.innerHTML = ensoSvg(34);
      card.insertBefore(mark, card.firstChild);
    }
  };

  const mountDecor = () => {
    ensureBrand();
    ensureWelcome();
  };

  const closeIconSvg = () =>
    `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true" focusable="false">` +
    `<path d="M8 2.4v6.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>` +
    `<circle cx="8" cy="12.2" r="1.05" fill="currentColor"/></svg>`;

  const closeDialog = (options = {}) =>
    new Promise((resolve) => {
      if (!document.body) {
        resolve(typeof options.cancelId === "string" ? options.cancelId : "cancel");
        return;
      }
      const previousBackdrop = document.querySelector(".pg-close-backdrop");
      if (previousBackdrop) previousBackdrop.remove();

      const specs =
        Array.isArray(options.buttons) && options.buttons.length
          ? options.buttons
          : [{ id: "ok", label: "Tamam", variant: "primary" }];
      const cancelId =
        typeof options.cancelId === "string" ? options.cancelId : specs[specs.length - 1].id;
      const defaultId = typeof options.defaultId === "string" ? options.defaultId : specs[0].id;
      const tone = options.tone === "error" || options.tone === "info" ? options.tone : "warn";
      const previousFocus = document.activeElement;

      const backdrop = document.createElement("div");
      backdrop.className = "pg-close-backdrop";
      backdrop.setAttribute("role", "presentation");

      const dialog = document.createElement("div");
      dialog.className = "pg-close-dialog";
      dialog.setAttribute("role", "alertdialog");
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-labelledby", "pg-close-title");
      dialog.setAttribute("aria-describedby", "pg-close-message");
      dialog.tabIndex = -1;

      const head = document.createElement("header");
      head.className = "pg-close-head";
      const mark = document.createElement("span");
      mark.className = "pg-close-mark";
      mark.dataset.tone = tone;
      mark.setAttribute("aria-hidden", "true");
      mark.innerHTML = closeIconSvg();
      const title = document.createElement("h2");
      title.className = "pg-close-title";
      title.id = "pg-close-title";
      title.textContent = options.title || "Kapat";
      head.append(mark, title);

      const body = document.createElement("div");
      body.className = "pg-close-body";
      const message = document.createElement("p");
      message.className = "pg-close-message";
      message.id = "pg-close-message";
      message.textContent = options.message || "";
      body.appendChild(message);
      if (options.detail) {
        const detail = document.createElement("p");
        detail.className = "pg-close-detail";
        detail.textContent = options.detail;
        body.appendChild(detail);
      }
      if (Array.isArray(options.files) && options.files.length) {
        const list = document.createElement("ul");
        list.className = "pg-close-files";
        for (const file of options.files) {
          const item = document.createElement("li");
          const name = document.createElement("span");
          name.textContent = String(file);
          item.appendChild(name);
          list.appendChild(item);
        }
        body.appendChild(list);
      }
      if (Number(options.more) > 0) {
        const more = document.createElement("div");
        more.className = "pg-close-more";
        more.textContent = `\u2026 ve ${Number(options.more)} dosya daha`;
        body.appendChild(more);
      }

      const foot = document.createElement("div");
      foot.className = "pg-close-foot";
      let defaultFocus = null;
      let settled = false;
      let focusTimer = 0;

      const onKey = (event) => {
        if (event.key === "Escape") {
          event.preventDefault();
          event.stopPropagation();
          finish(cancelId);
          return;
        }
        if (event.key !== "Tab") return;
        const nodes = Array.from(foot.querySelectorAll("button"));
        if (!nodes.length) return;
        const first = nodes[0];
        const last = nodes[nodes.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        } else if (!dialog.contains(document.activeElement)) {
          event.preventDefault();
          first.focus();
        }
      };

      const finish = (id) => {
        if (settled) return;
        settled = true;
        document.removeEventListener("keydown", onKey, true);
        window.clearTimeout(focusTimer);
        backdrop.remove();
        if (previousFocus && typeof previousFocus.focus === "function") {
          try {
            previousFocus.focus();
          } catch (error) {
            /* focus can be gone */
          }
        }
        resolve(id);
      };

      for (const spec of specs) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "pg-close-btn";
        button.dataset.variant = spec.variant || "ghost";
        button.textContent = spec.label || spec.id;
        button.addEventListener("click", () => finish(spec.id));
        foot.appendChild(button);
        if (spec.id === defaultId) defaultFocus = button;
      }

      backdrop.addEventListener("mousedown", (event) => {
        if (event.target === backdrop) finish(cancelId);
      });

      dialog.append(head, body, foot);
      backdrop.appendChild(dialog);
      document.body.appendChild(backdrop);
      document.addEventListener("keydown", onKey, true);
      focusTimer = window.setTimeout(() => {
        (defaultFocus || dialog).focus();
      }, 30);
    });

  const closePrompt = async (options = {}) => {
    const guard = globalThis.polyglotCloseGuard;
    const readDirty = () =>
      guard && typeof guard.dirty === "function"
        ? (guard.dirty() || []).filter((item) => typeof item === "string")
        : [];
    const hasDocuments =
      guard && typeof guard.hasDocuments === "function"
        ? guard.hasDocuments() === true
        : document.querySelectorAll(".tab-name").length > 0;
    const hasWorkspace =
      options.workspaceOpen === true ||
      (guard && typeof guard.hasWorkspace === "function" ? guard.hasWorkspace() === true : false);

    const dirty = readDirty();
    if (dirty.length === 0) {
      if (!hasDocuments && !hasWorkspace) return "no-documents";
      return closeDialog({
        tone: "info",
        title: "Uygulamadan \u00e7\u0131k",
        message: "Yap\u0131lan de\u011fi\u015fiklikleri kaydetmeyi unutmay\u0131n.",
        detail: "MultiCoder'i kapatmak istiyor musunuz?",
        buttons: [
          { id: "close", label: "\u00c7\u0131k", variant: "primary" },
          { id: "cancel", label: "Vazge\u00e7" }
        ],
        defaultId: "close",
        cancelId: "cancel"
      });
    }

    const files = dirty.slice(0, 8);
    const more = Math.max(0, dirty.length - files.length);
    const choice = await closeDialog({
      tone: "warn",
      title: "Kaydedilmemi\u015f de\u011fi\u015fiklikler",
      message: `${dirty.length} dosyada kaydedilmemi\u015f de\u011fi\u015fiklik var.`,
      detail: "\u00c7\u0131kmadan \u00f6nce de\u011fi\u015fiklikleri kaydetmek ister misiniz?",
      files,
      more,
      buttons: [
        { id: "save", label: "Kaydet ve \u00c7\u0131k", variant: "primary" },
        { id: "discard", label: "Kaydetmeden \u00c7\u0131k", variant: "danger" },
        { id: "cancel", label: "Vazge\u00e7" }
      ],
      defaultId: "save",
      cancelId: "cancel"
    });
    if (choice === "discard") return "close";
    if (choice !== "save") return "cancel";

    try {
      if (guard && typeof guard.saveAll === "function") await guard.saveAll();
    } catch (error) {
      await closeDialog({
        tone: "error",
        title: "Kaydetme ba\u015far\u0131s\u0131z",
        message: "Dosyalar kaydedilemedi.",
        detail: String(error?.message ?? error),
        buttons: [{ id: "ok", label: "Tamam", variant: "primary" }],
        defaultId: "ok",
        cancelId: "ok"
      });
      return "cancel";
    }

    const remaining = readDirty();
    if (remaining.length > 0) {
      await closeDialog({
        tone: "error",
        title: "Kaydetme tamamlanmad\u0131",
        message: "Baz\u0131 dosyalar h\u00e2l\u00e2 kaydedilmemi\u015f g\u00f6r\u00fcn\u00fcyor.",
        detail: remaining.join("\n"),
        buttons: [{ id: "ok", label: "Tamam", variant: "primary" }],
        defaultId: "ok",
        cancelId: "ok"
      });
      return "cancel";
    }
    return "close";
  };

  const boot = () => {
    mountDecor();
    if (typeof MutationObserver !== "function" || !document.body) return;
    let queued = false;
    const observer = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(() => {
        queued = false;
        mountDecor();
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  };

  window.pgZen = {
    themes: THEMES.map((theme) => ({
      id: theme.id,
      name: theme.name,
      jp: theme.jp,
      tagline: theme.tagline,
      mode: theme.mode,
      palette: { ...theme.palette }
    })),
    apply: (id) => applyTheme(id),
    get current() {
      return currentTheme;
    },
    get defaultTheme() {
      return DEFAULT_THEME;
    },
    types: TYPE_PRESETS.map((preset) => ({
      id: preset.id,
      name: preset.name,
      note: preset.note,
      sample: preset.sample,
      display: preset.vars["display-font"],
      ui: preset.vars["ui-font"],
      mono: preset.vars["mono-font"]
    })),
    applyType: (id) => applyType(id),
    get type() {
      return currentType;
    },
    get defaultType() {
      return DEFAULT_TYPE;
    }
  };

  window.pgCloseDialog = closeDialog;
  window.pgClosePrompt = closePrompt;

  injectStyles();
  applyTheme(readStored(), { instant: true });
  applyType(readStoredType(), { instant: true });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot, { once: true });
  } else {
    boot();
  }
})();
