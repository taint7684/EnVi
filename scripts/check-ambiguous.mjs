import { readFileSync } from "node:fs";

const envFile = readFileSync(".env.local", "utf-8");
function getEnv(name) {
  const line = envFile.split(/\r?\n/).find((l) => l.startsWith(name + "="));
  return line ? line.slice(name.length + 1).trim() : "";
}
const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "User-Agent": "EnVi-Audit/1.0" };

async function checkTable(t) {
  const r = await fetch(`${url}/rest/v1/${t}?select=id&limit=1`, { headers });
  return { name: t, status: r.status, ok: r.ok || r.status === 206 };
}
async function checkCol(t, c) {
  const r = await fetch(`${url}/rest/v1/${t}?select=${c}&limit=0`, { headers });
  let body = "";
  if (r.status === 400) body = (await r.text()).slice(0, 150);
  return { name: `${t}.${c}`, status: r.status, ok: r.ok || r.status === 206, body };
}

console.log("=== Production read-only checks (ricthhogtmgxoyjstfkz) ===");
for (const t of ["deck_words", "decks", "card_reviews"]) {
  const r = await checkTable(t);
  console.log(`  table ${r.name}: HTTP ${r.status} ${r.ok ? "EXISTS" : "MISSING"}`);
}
for (const c of [["words", "cefr_level"], ["profiles", "minutes_per_day"], ["profiles", "role"]]) {
  const r = await checkCol(c[0], c[1]);
  console.log(`  col ${r.name}: HTTP ${r.status} ${r.ok ? "EXISTS" : "MISSING"}${r.body ? " | " + r.body : ""}`);
}

// Try to reach local Supabase (qa.env target)
console.log("\n=== Local Supabase (127.0.0.1:54321) ===");
try {
  const r = await fetch("http://127.0.0.1:54321/rest/v1/", { signal: AbortSignal.timeout(3000) });
  console.log(`  HTTP ${r.status} — local Supabase IS running`);
} catch (e) {
  console.log(`  NOT reachable: ${e.message.slice(0, 60)}`);
}