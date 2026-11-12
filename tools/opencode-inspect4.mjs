import { createHash } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { homedir } from "node:os";

const db = new DatabaseSync(homedir() + "/.local/share/opencode/opencode.db", { readOnly: true });
const dirs = db.prepare("SELECT id, worktree FROM project").all();

for (const d of dirs) {
  const candidates = {
    raw: createHash("sha1").update(d.worktree).digest("hex"),
    lower: createHash("sha1").update(d.worktree.toLowerCase()).digest("hex"),
    backslash: createHash("sha1").update(d.worktree.replace(/\//g, "\\")).digest("hex"),
    lowerBack: createHash("sha1").update(d.worktree.replace(/\//g, "\\").toLowerCase()).digest("hex"),
  };
  console.log(d.worktree, "->", d.id);
  for (const [k, v] of Object.entries(candidates)) {
    if (v === d.id) console.log("   MATCH:", k);
  }
}

console.log("---permissions---");
console.log(JSON.stringify(db.prepare("SELECT * FROM permission LIMIT 10").all()));
console.log("session_inbox:", db.prepare("SELECT COUNT(*) c FROM session_inbox").get().c);
console.log("session_pending:", db.prepare("SELECT COUNT(*) c FROM session_pending").get().c);
db.close();
