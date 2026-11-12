/* Tiny CDP driver for the packaged MultiCoder window.
 * Usage: node tools/ot-cdp.mjs "<expression>"   (expression is evaluated in the page, awaited)
 */
const port = process.env.OT_CDP_PORT || "9223";
const expression = process.argv[2] || "1";

const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const page = list.find((t) => t.type === "page" && /index\.html/.test(t.url));
if (!page) {
  console.error("no page target", list.map((t) => `${t.type} ${t.url}`));
  process.exit(1);
}

const ws = new WebSocket(page.webSocketDebuggerUrl);
let id = 0;
const pending = new Map();

ws.addEventListener("message", (event) => {
  const msg = JSON.parse(event.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
});

function send(method, params = {}) {
  const messageId = ++id;
  return new Promise((resolve) => {
    pending.set(messageId, resolve);
    ws.send(JSON.stringify({ id: messageId, method, params }));
  });
}

await new Promise((resolve) => ws.addEventListener("open", resolve, { once: true }));

if (process.env.OT_CONSOLE) {
  const events = [];
  ws.addEventListener("message", (event) => {
    const msg = JSON.parse(event.data);
    if (msg.method === "Runtime.exceptionThrown") {
      events.push(`EXCEPTION ${msg.params.exceptionDetails.text} ${msg.params.exceptionDetails.exception?.description || ""}`.trim());
    }
    if (msg.method === "Runtime.consoleAPICalled" && ["error", "warning"].includes(msg.params.type)) {
      events.push(`${msg.params.type.toUpperCase()} ${msg.params.args.map((a) => a.value ?? a.description ?? "").join(" ")}`);
    }
  });
  await send("Runtime.enable");
  await send("Runtime.evaluate", { expression: "location.reload()" });
  await new Promise((resolve) => setTimeout(resolve, Number(process.env.OT_CONSOLE) || 4000));
  console.log(events.length ? events.join("\n") : "no exceptions, no console errors");
  ws.close();
  process.exit(0);
}

if (process.env.OT_CLICK) {
  const [x, y] = process.env.OT_CLICK.split(",").map(Number);
  for (const type of ["mousePressed", "mouseReleased"]) {
    await send("Input.dispatchMouseEvent", {
      type,
      x,
      y,
      button: "left",
      clickCount: 1,
      buttons: type === "mousePressed" ? 1 : 0
    });
  }
  console.log(`clicked ${x},${y}`);
  ws.close();
  process.exit(0);
}

if (process.env.OT_SHOT) {
  const shot = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
  const { writeFileSync } = await import("node:fs");
  writeFileSync(process.env.OT_SHOT, Buffer.from(shot.result.data, "base64"));
  console.log(process.env.OT_SHOT);
  ws.close();
  process.exit(0);
}

const result = await send("Runtime.evaluate", {
  expression,
  awaitPromise: true,
  returnByValue: true,
  userGesture: true
});

if (result.error) console.error(JSON.stringify(result.error));
else if (result.result?.exceptionDetails) {
  console.error(result.result.exceptionDetails.text || "exception", JSON.stringify(result.result.exceptionDetails.exception?.description || ""));
} else {
  console.log(JSON.stringify(result.result?.result?.value, null, 2));
}
ws.close();
process.exit(0);
