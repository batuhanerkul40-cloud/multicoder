"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const port = Number(process.env.MULTICODER_CDP_PORT || 9223);
const assets = path.resolve(__dirname, "..", "renderer", "assets");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function connect() {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`);
  if (!response.ok) throw new Error(`DevTools endpoint returned ${response.status}`);
  const pages = await response.json();
  const target = pages.find((page) => page.url.includes("/renderer/index.html"));
  if (!target) throw new Error("MultiCoder renderer page was not found in DevTools targets");

  const socket = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });

  let nextId = 0;
  const pending = new Map();
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolve(message);
  });

  const command = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ id, method, params }));
    });

  const evaluate = async (expression) => {
    const message = await command("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true
    });
    if (message.result.exceptionDetails) {
      throw new Error(message.result.exceptionDetails.exception?.description || "Renderer evaluation failed");
    }
    return message.result.result.value;
  };

  return { command, evaluate, close: () => socket.close() };
}

async function waitFor(evaluate, expression, description) {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    try {
      if (await evaluate(expression)) return;
    } catch {}
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${description}`);
}

async function resetApp(page, skin, lang) {
  await page.evaluate(
    `(() => {
      localStorage.setItem("pg.skin", ${JSON.stringify(skin)});
      localStorage.setItem("pg.lang", ${JSON.stringify(lang)});
      return true;
    })()`
  );
  await page.command("Page.reload", { ignoreCache: true });
  await waitFor(
    page.evaluate,
    `document.documentElement.lang === ${JSON.stringify(lang)} &&
      document.documentElement.dataset.oc === ${JSON.stringify(skin === "opencode" ? "1" : "classic")}`,
    `${skin}/${lang} renderer`
  );
  await waitFor(
    page.evaluate,
    `document.querySelector("#pg-settings-gear") !== null`,
    "custom shell initialization"
  );
}

async function openAppearance(page) {
  await page.evaluate(`document.querySelector("#pg-settings-gear").click(); true`);
  await waitFor(page.evaluate, `document.querySelector(".pg-settings-panel") !== null`, "appearance dialog");
}

test("MultiCoder UI regression checks", { concurrency: false }, async (t) => {
  const page = await connect();

  try {
    await t.test("English appearance settings use English labels and the real theme count", async () => {
      await resetApp(page, "opencode", "en");
      await openAppearance(page);
      const text = await page.evaluate(`document.querySelector(".pg-settings-panel").innerText`);
      assert.match(text, /Appearance/);
      assert.match(text, /Three materials/);
      assert.match(text, /Graphite/);
      assert.match(text, /Ledger/);
      assert.match(text, /Blueprint/);
      assert.match(text, /Instrument/);
      assert.match(text, /Drawing/);
      assert.match(text, /Book/);
      assert.doesNotMatch(text, /Görünüm|Yedi Zen|Renk teması|Yazı tipi|Defter|Aydınger|Ölçü|Çizim|Kitap/);

      await page.evaluate(`document.querySelector('[aria-label="Provider settings"]').click(); true`);
      await waitFor(page.evaluate, `document.querySelector(".pd-model-input") !== null`, "provider settings");
      await page.evaluate(`document.querySelector(".pd-model-input").click(); true`);
      await waitFor(page.evaluate, `document.querySelector(".pd-model-panel")?.classList.contains("pd-open")`, "model panel");
      const modelPanelText = await page.evaluate(`JSON.stringify({
        title: document.querySelector(".pd-model-panel-title").textContent,
        refresh: document.querySelector(".pd-model-panel-refresh").textContent,
        searchLabel: document.querySelector(".pd-model-search-label").textContent,
        paidLabel: document.querySelector(".pd-paid-toggle span").textContent
      })`);
      assert.deepEqual(JSON.parse(modelPanelText), {
        title: "Models",
        refresh: "Refresh",
        searchLabel: "Search models",
        paidLabel: "Include paid models"
      });
    });

    await t.test("appearance dialog traps Tab in both directions and restores focus", async () => {
      await resetApp(page, "classic", "tr");
      await openAppearance(page);
      const focusResult = await page.evaluate(`(() => {
        const panel = document.querySelector(".pg-settings-panel");
        const controls = [...panel.querySelectorAll("button, input, select, textarea, a[href], [tabindex]")]
          .filter((element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length > 0);
        const first = controls[0];
        const last = controls[controls.length - 1];
        first.focus();
        const backward = new KeyboardEvent("keydown", { key: "Tab", shiftKey: true, bubbles: true, cancelable: true });
        document.dispatchEvent(backward);
        const wrappedBackward = backward.defaultPrevented && document.activeElement === last;
        last.focus();
        const forward = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
        document.dispatchEvent(forward);
        const wrappedForward = forward.defaultPrevented && document.activeElement === first;
        const escape = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
        document.dispatchEvent(escape);
        return JSON.stringify({
          enoughControls: controls.length > 1,
          wrappedBackward,
          wrappedForward,
          focusRestored: document.activeElement.id === "pg-settings-gear"
        });
      })()`);
      const result = JSON.parse(focusResult);
      assert.equal(result.enoughControls, true);
      assert.equal(result.wrappedBackward, true);
      assert.equal(result.wrappedForward, true);
      assert.equal(result.focusRestored, true, JSON.stringify(result));
    });

    await t.test("model search inputs have associated visible labels", async () => {
      await resetApp(page, "opencode", "tr");
      await page.evaluate(`document.querySelector(".pg-chat-model-btn").click(); true`);
      await waitFor(page.evaluate, `document.querySelector(".pg-model-pop-search") !== null`, "chat model search");
      await page.evaluate(`document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); true`);
      await page.evaluate(`document.querySelector('[aria-label="Provider settings"]').click(); true`);
      await waitFor(page.evaluate, `document.querySelector(".pd-model-input") !== null`, "provider settings");
      await page.evaluate(`document.querySelector(".pd-model-input").click(); true`);
      await waitFor(page.evaluate, `document.querySelector(".pd-model-search") !== null`, "provider model search");
      const labels = await page.evaluate(`JSON.stringify([
        document.querySelector(".pg-model-search"),
        document.querySelector(".pg-model-pop-search"),
        document.querySelector(".pd-model-search")
      ].map((input) => input ? input.labels.length : 0))`);
      assert.deepEqual(JSON.parse(labels), [1, 1, 1]);
    });

    await t.test("model discovery search moves the active result with ArrowDown", async () => {
      await resetApp(page, "opencode", "tr");
      await page.evaluate(`document.querySelector('[aria-label="Provider settings"]').click(); true`);
      await waitFor(page.evaluate, `document.querySelector(".pd-model-input") !== null`, "provider settings");
      await page.evaluate(`document.querySelector(".pd-model-input").click(); true`);
      await waitFor(page.evaluate, `document.querySelector(".pd-model-search") !== null`, "provider model search");
      await waitFor(
        page.evaluate,
        `(() => { const panel = document.querySelector(".pd-model-panel"); return panel && panel.__pdState && !panel.__pdState.loading; })()`,
        "provider models"
      );
      const result = await page.evaluate(`(() => {
        const list = document.querySelector(".pd-model-panel-list");
        const fixtures = [];
        for (const id of ["fixture-first", "fixture-second"]) {
          const item = document.createElement("button");
          item.type = "button";
          item.className = "pd-model-item";
          item.dataset.id = id;
          item.textContent = id;
          fixtures.push(item);
        }
        list.replaceChildren(...fixtures);
        const event = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
        document.querySelector(".pd-model-search").dispatchEvent(event);
        return JSON.stringify({
          prevented: event.defaultPrevented,
          active: document.querySelector(".pd-model-item.pd-active")?.dataset.id || null
        });
      })()`);
      assert.deepEqual(JSON.parse(result), { prevented: true, active: "fixture-first" });
    });

    await t.test("marketplace search has a visible label, focus indicator, and theme-neutral color", async () => {
      await resetApp(page, "classic", "en");
      await page.evaluate(`(() => {
        let view = document.querySelector(".extensions-view");
        if (!view) {
          view = document.createElement("section");
          view.className = "extensions-view";
          document.body.appendChild(view);
        }
        let list = view.querySelector(".extension-list");
        if (!list) {
          list = document.createElement("div");
          list.className = "extension-list";
          view.appendChild(list);
        }
        list.replaceChildren();
        return true;
      })()`);
      await waitFor(page.evaluate, `document.querySelector("[data-pg-ext-search-more]") !== null`, "marketplace search action");
      const state = await page.evaluate(`(() => {
        const trigger = document.querySelector(".pg-ext-search-btn");
        trigger.click();
        const input = document.querySelector(".pg-ext-search-box input[type=search]");
        input.focus();
        const style = getComputedStyle(input);
        return JSON.stringify({
          labels: input.labels.length,
          outline: style.outlineStyle,
          outlineWidth: style.outlineWidth,
          background: getComputedStyle(trigger).backgroundColor
        });
      })()`);
      const result = JSON.parse(state);
      assert.equal(result.labels, 1);
      assert.notEqual(result.outline, "none");
      assert.notEqual(result.outlineWidth, "0px");
      assert.doesNotMatch(result.background, /124,\s*156,\s*255/);
    });

    await t.test("contrast, model-panel tokens, motion, and comment separators follow the design", async () => {
      await resetApp(page, "opencode", "tr");
      const contrast = JSON.parse(await page.evaluate(`(() => {
        const toRgb = (value) => value.match(/[0-9.]+/g).slice(0, 3).map(Number);
        const linear = (value) => {
          const channel = value / 255;
          return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
        };
        const luminance = (value) => {
          const [red, green, blue] = toRgb(value).map(linear);
          return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
        };
        const ratio = (foreground, background) => {
          const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
          return (light + 0.05) / (dark + 0.05);
        };
        let input = document.querySelector(".pg-chat-input");
        if (!input) {
          const composer = document.createElement("div");
          composer.className = "pg-composer";
          input = document.createElement("textarea");
          input.className = "pg-chat-input";
          composer.appendChild(input);
          document.body.appendChild(composer);
        }
        let hint = document.querySelector(".oc-hint-status span");
        if (!hint) {
          const hintLine = document.createElement("div");
          hintLine.className = "oc-hint";
          const status = document.createElement("div");
          status.className = "oc-hint-status";
          hint = document.createElement("span");
          status.appendChild(hint);
          hintLine.appendChild(status);
          (document.querySelector(".pg-chat-dock") || document.querySelector(".center-column") || document.body)
            .appendChild(hintLine);
        }
        const hintStyle = getComputedStyle(hint);
        const hintSurface = hint.closest(".pg-chat-dock, .center-column") || document.body;
        let dot = document.querySelector(".pg-chat-status .pg-pulse");
        if (!dot) {
          const status = document.createElement("div");
          status.className = "pg-chat-status";
          dot = document.createElement("span");
          dot.className = "pg-pulse";
          status.appendChild(dot);
          document.body.appendChild(status);
        }
        const result = [];
        for (const theme of ["graphite", "ledger", "blueprint"]) {
          window.pgZen.apply(theme);
          const placeholder = getComputedStyle(input, "::placeholder");
          const inputBg = getComputedStyle(input.parentElement).backgroundColor;
          const hintBg = getComputedStyle(hintSurface).backgroundColor;
          const hintParentOpacity =
            Number(getComputedStyle(hint.parentElement).opacity) *
            Number(getComputedStyle(hint.parentElement.parentElement).opacity);
          result.push({
            theme,
            placeholderOpacity: Number(placeholder.opacity),
            placeholderRatio: ratio(placeholder.color, inputBg),
            hintOpacity: Number(hintStyle.opacity) * hintParentOpacity,
            hintRatio: ratio(hintStyle.color, hintBg),
            hintColor: hintStyle.color,
            hintBackground: hintBg
          });
        }
        const header = getComputedStyle(document.querySelector(".oc-head")).animationName;
        if (dot) dot.parentElement.classList.add("running");
        const pulse = dot ? getComputedStyle(dot).animationName : "none";
        return JSON.stringify({ result, header, pulse });
      })()`));
      for (const item of contrast.result) {
        assert.equal(item.placeholderOpacity, 1, `${item.theme} placeholder opacity`);
        assert.ok(item.placeholderRatio >= 4.5, `${item.theme} placeholder contrast: ${item.placeholderRatio}`);
        assert.equal(item.hintOpacity, 1, `${item.theme} hint opacity`);
        assert.ok(item.hintRatio >= 4.5, `${item.theme} hint contrast: ${item.hintRatio}`);
      }
      assert.equal(contrast.header, "none");
      assert.equal(contrast.pulse, "none");

      await page.evaluate(`document.querySelector('[aria-label="Provider settings"]').click(); true`);
      await waitFor(page.evaluate, `document.querySelector(".pd-model-input") !== null`, "provider settings");
      await page.evaluate(`document.querySelector(".pd-model-input").click(); true`);
      await waitFor(page.evaluate, `document.querySelector(".pd-model-panel")?.classList.contains("pd-open")`, "model discovery panel");
      const tokens = JSON.parse(await page.evaluate(`(() => {
        const panel = document.querySelector(".pd-model-panel");
        const style = getComputedStyle(panel);
        const providers = document.querySelector(".pg-add-providers");
        return JSON.stringify({
          radius: style.borderRadius,
          zIndex: style.zIndex,
          shadow: style.boxShadow,
          providerRadius: providers ? getComputedStyle(providers).borderRadius : null
        });
      })()`));
      assert.equal(tokens.radius, "4px");
      assert.equal(tokens.zIndex, "80");
      assert.match(tokens.shadow, /\b4px 4px 0px/);
      assert.equal(tokens.providerRadius, "2px");

      for (const file of ["chat-workbench.js", "oc-shell.js", "model-discovery.js"]) {
        const source = fs.readFileSync(path.join(assets, file), "utf8");
        assert.doesNotMatch(source, /^\s*\/\*\s*-{3,}\s*\*\/\s*$/m, `${file} has a decorative divider`);
      }
    });
  } finally {
    page.close();
  }
});
