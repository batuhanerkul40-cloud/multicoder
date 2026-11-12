import { DatabaseSync } from "node:sqlite";
import { homedir } from "node:os";

const db = new DatabaseSync(homedir() + "/.local/share/opencode/opencode.db", { readOnly: true });

// Deep-dive one user msg and one assistant msg
const user = db
  .prepare(
    "SELECT data FROM session_message WHERE type='user' ORDER BY time_created DESC LIMIT 1"
  )
  .get();
const assistant = db
  .prepare(
    "SELECT data FROM session_message WHERE type='assistant' ORDER BY time_created DESC LIMIT 1"
  )
  .get();
const idle = db
  .prepare("SELECT data FROM session_message WHERE type='idle' LIMIT 1")
  .get();

console.log("=== USER MSG (full) ===");
console.log(JSON.stringify(JSON.parse(user.data), null, 2).slice(0, 2500));

console.log("\n=== ASSISTANT MSG structure ===");
const a = JSON.parse(assistant.data);
console.log("keys:", Object.keys(a));
console.log("time:", JSON.stringify(a.time));
console.log("agent:", a.agent, "model:", a.model);
console.log("finish:", a.finish, "cost:", a.cost, "tokens:", JSON.stringify(a.tokens));
console.log("content type:", Array.isArray(a.content) ? "array" : typeof a.content, "len:", a.content?.length);
if (Array.isArray(a.content)) {
  for (const c of a.content.slice(0, 3)) {
    console.log("  content item:", JSON.stringify(c).slice(0, 400));
  }
}

if (idle) {
  console.log("\n=== IDLE MSG ===");
  console.log(idle.data.slice(0, 400));
}

// session_v2 full row of a titled session
const sess = db
  .prepare(
    "SELECT * FROM session_v2 WHERE title IS NOT NULL AND length(title)>0 ORDER BY time_updated DESC LIMIT 1"
  )
  .get();
console.log("\n=== SESSION ROW keys ===");
console.log(Object.keys(sess).join(", "));
console.log("directory:", sess.directory, "path:", sess.path, "agent:", sess.agent, "model:", sess.model);

db.close();
