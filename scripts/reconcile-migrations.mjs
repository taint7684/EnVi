import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const envFile = readFileSync(".env.local", "utf-8");
function getEnv(name) {
  const line = envFile.split(/\r?\n/).find((l) => l.startsWith(name + "="));
  return line ? line.slice(name.length + 1).trim() : "";
}
const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "User-Agent": "EnVi-Audit/1.0" };

const migDir = join(process.cwd(), "db/migrations");
const files = readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort();

// Parse a migration for tables + added columns
function parse(sql) {
  const tables = new Set();
  const cols = []; // {table, column}
  // create table [if not exists] public.NAME
  for (const m of sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?([a-z_][\w]*)/gi)) {
    tables.add(m[1]);
  }
  // alter table public.NAME ... add column [if not exists] COL
  for (const m of sql.matchAll(/alter\s+table\s+(?:public\.)?([a-z_][\w]*)[\s\S]*?add\s+column\s+(?:if\s+not\s+exists\s+)?([a-z_][\w]*)/gi)) {
    cols.push({ table: m[1], column: m[2] });
  }
  return { tables: [...tables], cols };
}

async function tableExists(t) {
  const r = await fetch(`${url}/rest/v1/${t}?select=id&limit=1`, { headers });
  return r.status === 200 || r.status === 206;
}
async function colExists(t, c) {
  const r = await fetch(`${url}/rest/v1/${t}?select=${c}&limit=0`, { headers });
  // 200/206 = exists; 400 (42703) = column missing
  if (r.status === 200 || r.status === 206) return true;
  if (r.status === 400) {
    const body = await r.text();
    if (body.includes("does not exist")) return false;
  }
  return false;
}

const report = [];
for (const f of files) {
  const sql = readFileSync(join(migDir, f), "utf-8");
  const { tables, cols } = parse(sql);
  const tableResults = [];
  for (const t of tables) tableResults.push({ t, ok: await tableExists(t) });
  const colResults = [];
  for (const c of cols) colResults.push({ ...c, ok: await colExists(c.table, c.column) });

  const checks = [...tableResults, ...colResults];
  const present = checks.filter((c) => c.ok).length;
  const total = checks.length;
  let status;
  if (total === 0) status = "NOOP"; // index/comment only
  else if (present === total) status = "APPLIED";
  else if (present === 0) status = "MISSING";
  else status = "PARTIAL";

  report.push({ f, status, present, total, tables: tableResults, cols: colResults });
}

console.log("=== Migration Reconciliation ===\n");
for (const r of report) {
  const tag = r.status === "APPLIED" ? "✅" : r.status === "MISSING" ? "❌" : r.status === "PARTIAL" ? "⚠️ " : "➖";
  const detail = [];
  for (const t of r.tables) if (!t.ok) detail.push(`table ${t.t}`);
  for (const c of r.cols) if (!c.ok) detail.push(`${c.table}.${c.column}`);
  console.log(`${tag} ${r.f}  [${r.status} ${r.present}/${r.total}]${detail.length ? "  missing: " + detail.join(", ") : ""}`);
}

const missing = report.filter((r) => r.status === "MISSING");
const partial = report.filter((r) => r.status === "PARTIAL");
const applied = report.filter((r) => r.status === "APPLIED");
console.log(`\nSummary: ${applied.length} APPLIED, ${partial.length} PARTIAL, ${missing.length} MISSING`);
if (missing.length) console.log(`\nTruly missing files (${missing.length}):\n  ` + missing.map((m) => m.f).join("\n  "));