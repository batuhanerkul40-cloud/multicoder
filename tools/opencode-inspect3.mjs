import { DatabaseSync } from "node:sqlite";
import { homedir } from "node:os";

const db = new DatabaseSync(homedir() + "/.local/share/opencode/opencode.db", { readOnly: true });

// 1. event table: is it source of truth?
const evCount = db.prepare("SELECT COUNT(*) c FROM event").get();
console.log("event rows:", evCount.c);
const evSample = db.prepare("SELECT id, aggregate_id, seq, type, substr(data,1,200) d FROM event ORDER BY rowid DESC LIMIT 5").all();
console.log("=== event sample ===");
for (const e of evSample) console.log(` ${e.id} | ${e.aggregate_id} | seq=${e.seq} | ${e.type} | ${e.d}`);

// events for our sample session
const sess = db.prepare("SELECT id FROM session_v2 WHERE title IS NOT NULL AND length(title)>0 ORDER BY time_updated DESC LIMIT 1").get();
const evFor = db.prepare("SELECT type, seq, COUNT(*) c FROM event WHERE aggregate_id = ? GROUP BY type").all(sess.id);
console.log("=== events for session", sess.id, "=== ");
for (const e of evFor) console.log(` ${e.type}: ${e.c} (max seq ${e.seq})`);

// event_sequence row
const es = db.prepare("SELECT * FROM event_sequence WHERE aggregate_id = ?").get(sess.id);
console.log("event_sequence:", JSON.stringify(es));

// 2. kv table keys
const kvs = db.prepare("SELECT key, length(value) lv FROM kv ORDER BY rowid DESC LIMIT 15").all();
console.log("=== kv keys ===");
for (const k of kvs) console.log(` ${k.key} (${k.lv})`);

// 3. projects - is there one for FREEBUFF?
const projs = db.prepare("SELECT id, worktree, name, time_created FROM project").all();
console.log("=== all projects ===");
for (const p of projs) console.log(` ${p.id} | ${p.worktree} | ${p.name}`);

// 4. project_directory rows
const pd = db.prepare("SELECT * FROM project_directory LIMIT 10").all();
console.log("=== project_directory ===");
for (const r of pd) console.log(` ${r.project_id} | ${r.directory} | ${r.type} | ${r.strategy}`);

db.close();
