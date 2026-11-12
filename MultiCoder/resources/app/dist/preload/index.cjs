"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/preload/index.ts
var index_exports = {};
module.exports = __toCommonJS(index_exports);
var import_electron = require("electron");

// src/shared/ipc.ts
var CH = {
  appInfo: "app:info",
  workspaceOpenDialog: "workspace:open-dialog",
  workspaceOpenPath: "workspace:open-path",
  workspaceReadDir: "workspace:read-dir",
  workspaceReadFile: "workspace:read-file",
  workspaceWriteFile: "workspace:write-file",
  workspaceCreateFile: "workspace:create-file",
  workspaceCreateDir: "workspace:create-dir",
  workspaceRename: "workspace:rename",
  workspaceDelete: "workspace:delete",
  workspaceReveal: "workspace:reveal",
  workspaceCurrent: "workspace:current",
  workspaceConfirmDelete: "workspace:confirm-delete",
  workspaceActiveFile: "workspace:active-file",
  settingsGet: "settings:get",
  settingsSave: "settings:save",
  settingsSetKey: "settings:set-key",
  settingsListModels: "settings:list-models",
  collabOpen: "collab:open",
  collabUpdate: "collab:update",
  collabSave: "collab:save",
  agentStart: "agent:start",
  agentCancel: "agent:cancel",
  agentList: "agent:list",
  terminalCreate: "terminal:create",
  terminalWrite: "terminal:write",
  terminalResize: "terminal:resize",
  terminalKill: "terminal:kill",
  extensionsList: "extensions:list",
  extensionsCommands: "extensions:commands",
  extensionsExecute: "extensions:execute",
  extensionsReload: "extensions:reload",
  extensionsSaveDocument: "extensions:save-document",
  extensionsRemove: "extensions:remove",
  extensionsRestore: "extensions:restore",
  extensionsDisabled: "extensions:disabled",
  /** main -> renderer push channels */
  evtAgent: "evt:agent",
  evtCollab: "evt:collab",
  evtWorkspace: "evt:workspace",
  evtTerminalData: "evt:terminal-data",
  evtTerminalExit: "evt:terminal-exit",
  evtExtension: "evt:extension",
  evtMenu: "evt:menu"
};

// src/preload/index.ts
function subscribe(channel, listener) {
  const handler = (_event, payload) => listener(payload);
  import_electron.ipcRenderer.on(channel, handler);
  return () => import_electron.ipcRenderer.removeListener(channel, handler);
}
var api = {
  info: () => import_electron.ipcRenderer.invoke(CH.appInfo),
  workspace: {
    openDialog: () => import_electron.ipcRenderer.invoke(CH.workspaceOpenDialog),
    openPath: (root) => import_electron.ipcRenderer.invoke(CH.workspaceOpenPath, root),
    readDir: (relPath) => import_electron.ipcRenderer.invoke(CH.workspaceReadDir, relPath),
    readFile: (relPath) => import_electron.ipcRenderer.invoke(CH.workspaceReadFile, relPath),
    writeFile: (relPath, content) => import_electron.ipcRenderer.invoke(CH.workspaceWriteFile, relPath, content),
    createFile: (relPath, content) => import_electron.ipcRenderer.invoke(CH.workspaceCreateFile, relPath, content ?? ""),
    createDir: (relPath) => import_electron.ipcRenderer.invoke(CH.workspaceCreateDir, relPath),
    rename: (fromRel, toRel) => import_electron.ipcRenderer.invoke(CH.workspaceRename, fromRel, toRel),
    remove: (relPath) => import_electron.ipcRenderer.invoke(CH.workspaceDelete, relPath),
    reveal: (relPath) => import_electron.ipcRenderer.invoke(CH.workspaceReveal, relPath),
    confirmDelete: (relPath) => import_electron.ipcRenderer.invoke(CH.workspaceConfirmDelete, relPath),
    current: () => import_electron.ipcRenderer.invoke(CH.workspaceCurrent),
    setActiveFile: (relPath) => import_electron.ipcRenderer.invoke(CH.workspaceActiveFile, relPath),
    onDidChange: (listener) => subscribe(CH.evtWorkspace, listener)
  },
  settings: {
    get: () => import_electron.ipcRenderer.invoke(CH.settingsGet),
    save: (settings) => import_electron.ipcRenderer.invoke(CH.settingsSave, settings),
    setKey: (providerId, key) => import_electron.ipcRenderer.invoke(CH.settingsSetKey, providerId, key),
    listModels: (request) => import_electron.ipcRenderer.invoke(CH.settingsListModels, request)
  },
  collab: {
    open: (relPath) => import_electron.ipcRenderer.invoke(CH.collabOpen, relPath),
    update: (relPath, update) => import_electron.ipcRenderer.invoke(CH.collabUpdate, relPath, update),
    save: (relPath) => import_electron.ipcRenderer.invoke(CH.collabSave, relPath),
    onUpdate: (listener) => subscribe(CH.evtCollab, listener)
  },
  agents: {
    start: (request) => import_electron.ipcRenderer.invoke(CH.agentStart, request),
    cancel: (sessionId) => import_electron.ipcRenderer.invoke(CH.agentCancel, sessionId),
    list: () => import_electron.ipcRenderer.invoke(CH.agentList),
    onEvent: (listener) => subscribe(CH.evtAgent, listener)
  },
  terminal: {
    create: (request) => import_electron.ipcRenderer.invoke(CH.terminalCreate, request),
    write: (id, data) => import_electron.ipcRenderer.invoke(CH.terminalWrite, id, data),
    resize: (id, cols, rows) => import_electron.ipcRenderer.invoke(CH.terminalResize, id, cols, rows),
    kill: (id) => import_electron.ipcRenderer.invoke(CH.terminalKill, id),
    onData: (listener) => subscribe(CH.evtTerminalData, listener),
    onExit: (listener) => subscribe(CH.evtTerminalExit, listener)
  },
  extensions: {
    list: () => import_electron.ipcRenderer.invoke(CH.extensionsList),
    commands: () => import_electron.ipcRenderer.invoke(CH.extensionsCommands),
    execute: (command, ...args) => import_electron.ipcRenderer.invoke(CH.extensionsExecute, command, args),
    reload: () => import_electron.ipcRenderer.invoke(CH.extensionsReload),
    notifySave: (relPath) => import_electron.ipcRenderer.invoke(CH.extensionsSaveDocument, relPath),
    remove: (id, ...args) => import_electron.ipcRenderer.invoke(CH.extensionsRemove, id, ...args),
    restore: (id) => import_electron.ipcRenderer.invoke(CH.extensionsRestore, id),
    disabled: () => import_electron.ipcRenderer.invoke(CH.extensionsDisabled),
    onEvent: (listener) => subscribe(CH.evtExtension, listener)
  },
  win: {
    minimize: () => import_electron.ipcRenderer.send("win:minimize"),
    toggleMaximize: () => import_electron.ipcRenderer.send("win:toggle-maximize"),
    close: () => import_electron.ipcRenderer.send("win:close"),
    state: () => import_electron.ipcRenderer.invoke("win:state")
  },
  onMenuAction: (listener) => subscribe(CH.evtMenu, listener)
};
import_electron.contextBridge.exposeInMainWorld("polyglot", api);
