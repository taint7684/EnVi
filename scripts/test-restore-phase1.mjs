import pg from "pg";
const conn = { host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" };

// Record before counts
const c1 = new pg.Client(conn);
await c1.connect();
const beforeCounts = {};
for (const t of ["profiles", "words", "phrases", "daily_plans", "activity_events", "speaking_sessions", "speaking_turns"]) {
  try { beforeCounts[t] = (await c1.query(`select count(*)::int n from public.${t}`)).rows[0].n; }
  catch { beforeCounts[t] = "N/A"; }
}
console.log("Before:", JSON.stringify(beforeCounts));
await c1.end();

// Drop tables to simulate migration failure
console.log("\n=== DROP daily_plans + activity_events (simulate failure) ===");
const c2 = new pg.Client(conn);
await c2.connect();
await c2.query(`drop table if exists public.daily_plans cascade`);
await c2.query(`drop table if exists public.activity_events cascade`);
console.log("  Dropped daily_plans + activity_events");
const afterDrop = {};
for (const t of ["daily_plans", "activity_events"]) {
  try { afterDrop[t] = (await c2.query(`select count(*)::int n from public.${t}`)).rows[0].n; }
  catch { afterDrop[t] = "MISSING"; }
}
console.log("After drop:", JSON.stringify(afterDrop));
await c2.end();