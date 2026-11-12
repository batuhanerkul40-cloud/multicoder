import { DatabaseSync } from "node:sqlite";
import { homedir } from "node:os";

const db = new DatabaseSync(homedir() + "/.local/share/opencode/opencode.db", { readOnly: true });

const sess = db
  .prepare(
    "SELECT id, title FROM session_v2 WHERE title IS NOT NULL AND length(title) > 0 ORDER BY time_updated DESC LIMIT 3"
  )
  .all();

for (const s of sess) {
  console.log("=== SESSION:", s.id, "|", s.title);
  const msgs = db
    .prepare(
      "SELECT id, type, seq, time_created, data FROM session_message WHERE session_id = ? ORDER BY seq LIMIT 4"
    )
    .all(s.id);
  for (const m of msgs) {
    console.log("--- msg", m.id, "type:", m.type, "seq:", m.seq);
    let data;
    try {
      data = JSON.parse(m.data);
    } catch (e) {
      console.log("  unparseable, raw:", String(m.data).slice(0, 300));
      continue;
    }
    console.log("  top keys:", Object.keys(data).join(", "));
    if (data.parts) {
      console.log("  parts:", data.parts.length);
      for (const p of data.parts.slice(0, 4)) {
        const desc = Object.keys(p).join(",");
        const txt = p.text ? String(p.text).slice(0, 160) : "";
        console.log(`    [${p.type}] {${desc}} ${txt}`);
      }
    }
    if (data.info) console.log("  info:", JSON.stringify(data.info).slice(0, 300));
  }
  console.log();
}
db.close();
