"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/exthost/api.ts
var import_node_fs = require("node:fs");
var import_node_path = __toESM(require("node:path"));
var Uri = class _Uri {
  constructor(scheme, fsPath) {
    this.scheme = scheme;
    this.fsPath = fsPath;
  }
  scheme;
  fsPath;
  static file(fsPath) {
    return new _Uri("file", import_node_path.default.resolve(fsPath));
  }
  static joinPath(base, ...segments) {
    return new _Uri(base.scheme, import_node_path.default.join(base.fsPath, ...segments));
  }
  static parse(value) {
    if (value.startsWith("file://")) return _Uri.file(decodeURIComponent(value.slice("file://".length)));
    return new _Uri("file", import_node_path.default.resolve(value));
  }
  get path() {
    return this.fsPath.split(import_node_path.default.sep).join("/");
  }
  toString() {
    return `${this.scheme}://${this.path}`;
  }
};
var Emitter = class {
  listeners = /* @__PURE__ */ new Set();
  event = (listener) => {
    this.listeners.add(listener);
    return { dispose: () => this.listeners.delete(listener) };
  };
  fire(event) {
    for (const listener of [...this.listeners]) {
      try {
        listener(event);
      } catch (error) {
        console.error("[ext-host] listener failed", error);
      }
    }
  }
  dispose() {
    this.listeners.clear();
  }
};
var LANGUAGE_BY_EXT = {
  ".ts": "typescript",
  ".tsx": "typescriptreact",
  ".js": "javascript",
  ".jsx": "javascriptreact",
  ".json": "json",
  ".md": "markdown",
  ".css": "css",
  ".html": "html",
  ".py": "python",
  ".rs": "rust",
  ".go": "go",
  ".java": "java",
  ".c": "c",
  ".cpp": "cpp",
  ".yml": "yaml",
  ".yaml": "yaml"
};
function languageIdFor(filePath) {
  return LANGUAGE_BY_EXT[import_node_path.default.extname(filePath).toLowerCase()] ?? "plaintext";
}
var ExtensionApi = class {
  constructor(send2, workspaceRoot) {
    this.send = send2;
    this.workspaceRoot = workspaceRoot;
  }
  send;
  workspaceRoot;
  commands = /* @__PURE__ */ new Map();
  commandOwners = /* @__PURE__ */ new Map();
  commandTitles = /* @__PURE__ */ new Map();
  statusItems = /* @__PURE__ */ new Map();
  nextStatusId = 1;
  currentExtensionId = "unknown";
  activeRelPath = null;
  saveEmitter = new Emitter();
  activeEmitter = new Emitter();
  disposed = false;
  /* -------------------------------------------------------------- loading */
  setCurrentExtension(id) {
    this.currentExtensionId = id;
  }
  registerTitle(commandId, title) {
    this.commandTitles.set(commandId, title);
  }
  getCommandIds() {
    return [...this.commands.keys()];
  }
  commandContributions() {
    return [...this.commands.keys()].map((id) => ({
      id,
      title: this.commandTitles.get(id) ?? id,
      extensionId: this.commandOwners.get(id) ?? "unknown"
    }));
  }
  getStatusItems() {
    return [...this.statusItems.values()].filter((item) => item.visible).sort((a, b) => {
      if (a.alignment !== b.alignment) return a.alignment === "left" ? -1 : 1;
      return a.priority - b.priority;
    }).map((item) => ({
      id: item.id,
      text: item.text,
      tooltip: item.tooltip,
      command: item.command,
      alignment: item.alignment,
      priority: item.priority
    }));
  }
  publishCommands() {
    this.send({ type: "commands", commands: this.commandContributions() });
  }
  publishStatus() {
    this.send({ type: "status", items: this.getStatusItems() });
  }
  /* ------------------------------------------------------------ documents */
  setActiveFile(relPath) {
    this.activeRelPath = relPath;
    const document = this.readDocument(relPath);
    this.activeEmitter.fire(document);
  }
  readDocument(relPath) {
    if (!relPath || !this.workspaceRoot || this.disposed) return void 0;
    const abs = import_node_path.default.join(this.workspaceRoot, relPath);
    try {
      const text = (0, import_node_fs.readFileSync)(abs, "utf8");
      return {
        uri: Uri.file(abs),
        fileName: abs,
        languageId: languageIdFor(abs),
        lineCount: text.split("\n").length,
        getText: () => text
      };
    } catch {
      return void 0;
    }
  }
  fireSave(relPath) {
    const document = this.readDocument(relPath);
    if (document) this.saveEmitter.fire(document);
  }
  /* ------------------------------------------------------------- namespace */
  createNamespace() {
    const api2 = this;
    return {
      version: "1.0.0",
      Uri,
      Disposable: class {
        dispose() {
        }
      },
      commands: {
        registerCommand(id, callback) {
          api2.commands.set(id, callback);
          api2.commandOwners.set(id, api2.currentExtensionId);
          api2.publishCommands();
          return {
            dispose() {
              api2.commands.delete(id);
              api2.publishCommands();
            }
          };
        },
        async executeCommand(id, ...args) {
          return api2.executeCommand(id, args);
        },
        getCommands() {
          return Promise.resolve([...api2.commands.keys()]);
        }
      },
      window: {
        showInformationMessage(message) {
          api2.send({ type: "notify", level: "info", text: String(message) });
          return Promise.resolve(void 0);
        },
        showWarningMessage(message) {
          api2.send({ type: "notify", level: "warn", text: String(message) });
          return Promise.resolve(void 0);
        },
        showErrorMessage(message) {
          api2.send({ type: "notify", level: "error", text: String(message) });
          return Promise.resolve(void 0);
        },
        createStatusBarItem(alignment, priority) {
          return api2.createStatusBarItem(alignment, priority);
        },
        get activeTextDocument() {
          return api2.readDocument(api2.activeRelPath);
        },
        onDidChangeActiveTextEditor(listener) {
          return api2.activeEmitter.event(listener);
        }
      },
      workspace: {
        get workspaceFolders() {
          if (!api2.workspaceRoot) return void 0;
          return [{ uri: Uri.file(api2.workspaceRoot), name: import_node_path.default.basename(api2.workspaceRoot), index: 0 }];
        },
        get rootPath() {
          return api2.workspaceRoot;
        },
        fs: {
          async readFile(uri) {
            return new Uint8Array(await import_node_fs.promises.readFile(uri.fsPath));
          },
          async writeFile(uri, content) {
            await import_node_fs.promises.mkdir(import_node_path.default.dirname(uri.fsPath), { recursive: true });
            await import_node_fs.promises.writeFile(uri.fsPath, content);
          },
          async stat(uri) {
            const stat = (0, import_node_fs.statSync)(uri.fsPath);
            return { type: stat.isDirectory() ? "directory" : "file", size: stat.size };
          }
        },
        onDidSaveTextDocument(listener) {
          return api2.saveEmitter.event(listener);
        }
      }
    };
  }
  createStatusBarItem(alignment = 2, priority = 100) {
    const id = `status-${this.nextStatusId++}`;
    const state = {
      id,
      text: "",
      alignment: alignment === 1 ? "left" : "right",
      priority,
      visible: false
    };
    this.statusItems.set(id, state);
    const handle = {
      get text() {
        return state.text;
      },
      set text(value) {
        state.text = value;
        api2.publishStatus();
      },
      get tooltip() {
        return state.tooltip;
      },
      set tooltip(value) {
        state.tooltip = value;
        api2.publishStatus();
      },
      get command() {
        return state.command;
      },
      set command(value) {
        state.command = value;
        api2.publishStatus();
      },
      show() {
        state.visible = true;
        api2.publishStatus();
      },
      hide() {
        state.visible = false;
        api2.publishStatus();
      },
      dispose() {
        api2.statusItems.delete(id);
        api2.publishStatus();
      }
    };
    const api2 = this;
    return handle;
  }
  async executeCommand(id, args = []) {
    const handler = this.commands.get(id);
    if (!handler) throw new Error(`Command not found: ${id}`);
    return handler(...args);
  }
  log(level, text) {
    this.send({ type: "log", level, text });
  }
  dispose() {
    this.disposed = true;
    this.saveEmitter.dispose();
    this.activeEmitter.dispose();
    this.commands.clear();
    this.statusItems.clear();
  }
};

// src/exthost/loader.ts
var import_node_fs2 = require("node:fs");
var import_node_path2 = __toESM(require("node:path"));
var ModuleCtor = require("node:module");
var resolverInstalled = false;
function installVscodeResolver(getNamespace) {
  if (resolverInstalled) return;
  resolverInstalled = true;
  const originalLoad = ModuleCtor._load;
  ModuleCtor._load = function patchedLoad(request, parent, isMain) {
    if (request === "vscode") return getNamespace();
    return originalLoad.call(this, request, parent, isMain);
  };
}
async function readManifest(dir) {
  try {
    const raw = await import_node_fs2.promises.readFile(import_node_path2.default.join(dir, "package.json"), "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
async function loadExtensions(dirs, api2, vscodeNamespace, disabled = /* @__PURE__ */ new Set()) {
  const loaded2 = [];
  const seen = /* @__PURE__ */ new Set();
  for (const { dir, source } of dirs) {
    let folders;
    try {
      folders = (await import_node_fs2.promises.readdir(dir, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => import_node_path2.default.join(dir, entry.name));
    } catch {
      continue;
    }
    for (const extensionDir of folders) {
      const manifest = await readManifest(extensionDir);
      if (!manifest) continue;
      const id = manifest.name || import_node_path2.default.basename(extensionDir);
      if (seen.has(id)) continue;
      seen.add(id);
      if (disabled.has(id)) {
        api2.log("info", `skipped disabled extension ${id} (${source})`);
        continue;
      }
      const info = {
        id,
        name: manifest.displayName || manifest.name || import_node_path2.default.basename(extensionDir),
        version: manifest.version || "0.0.0",
        description: manifest.description,
        commands: [],
        source
      };
      try {
        for (const contribution of manifest.contributes?.commands ?? []) {
          api2.registerTitle(contribution.command, contribution.title);
        }
        const entryRelative = manifest.main || "extension.js";
        const entryPath = import_node_path2.default.resolve(extensionDir, entryRelative);
        const moduleRequire = ModuleCtor.createRequire(import_node_path2.default.join(extensionDir, "package.json"));
        const moduleExports = moduleRequire(entryPath);
        api2.setCurrentExtension(id);
        if (typeof moduleExports.activate === "function") {
          const before = new Set(api2.getCommandIds());
          await moduleExports.activate({
            subscriptions: [],
            extensionPath: extensionDir,
            extensionUri: Uri.file(extensionDir),
            vscode: vscodeNamespace
          });
          info.commands = api2.getCommandIds().filter((command) => !before.has(command));
        }
        if (typeof moduleExports.deactivate === "function") {
          loaded2.push({ info, dir: extensionDir, deactivate: moduleExports.deactivate });
        } else {
          loaded2.push({ info, dir: extensionDir });
        }
        api2.log("info", `activated ${id}@${info.version} (${source})`);
      } catch (error) {
        info.error = error.message;
        loaded2.push({ info, dir: extensionDir });
        api2.log("error", `failed to activate ${id}: ${error.message}`);
      }
    }
  }
  return loaded2;
}

// src/exthost/index.ts
var send = (message) => {
  if (process.send) process.send(message);
};
var api = null;
var namespace = {};
var loaded = [];
var initialized = false;
installVscodeResolver(() => {
  if (!initialized) {
    throw new Error("The vscode API was requested before the extension host was initialised");
  }
  return namespace;
});
async function handleInit(message) {
  if (initialized) return;
  initialized = true;
  api = new ExtensionApi(send, message.workspaceRoot);
  namespace = api.createNamespace();
  try {
    loaded = await loadExtensions(
      message.dirs,
      api,
      namespace,
      new Set(Array.isArray(message.disabled) ? message.disabled : [])
    );
  } catch (error) {
    send({ type: "fatal", error: `Extension host failed to load extensions: ${error.message}` });
  }
  send({ type: "ready", extensions: loaded.map((extension) => extension.info) });
  send({ type: "commands", commands: api.commandContributions() });
  send({ type: "status", items: api.getStatusItems() });
}
async function handleExecute(message) {
  if (!api) {
    send({ type: "response", id: message.id, ok: false, error: "Extension host is not initialised" });
    return;
  }
  try {
    const value = await api.executeCommand(message.command, message.args ?? []);
    send({ type: "response", id: message.id, ok: true, value: value ?? null });
  } catch (error) {
    send({ type: "response", id: message.id, ok: false, error: error.message });
  }
}
function shutdown() {
  for (const extension of loaded) {
    try {
      extension.deactivate?.();
    } catch (error) {
      console.error("[ext-host] deactivate failed", error);
    }
  }
  api?.dispose();
  process.exit(0);
}
process.on("message", (raw) => {
  const message = raw;
  if (!message || typeof message !== "object") return;
  switch (message.type) {
    case "init":
      void handleInit(message);
      break;
    case "execute":
      void handleExecute(message);
      break;
    case "save":
      api?.fireSave(message.relPath);
      break;
    case "active":
      api?.setActiveFile(message.relPath);
      break;
    case "shutdown":
      shutdown();
      break;
    default:
      break;
  }
});
process.on("uncaughtException", (error) => {
  console.error("[ext-host] uncaught exception", error);
  send({ type: "fatal", error: `Extension host crashed: ${error.message}` });
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("[ext-host] unhandled rejection", reason);
});
process.on("disconnect", () => process.exit(0));
