import pg from "pg";
const c = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" });
await c.connect();
const tables = (await c.query(`select tablename from pg_tables where schemaname='public' order by tablename`)).rows.map(r=>r.tablename);
console.log(`Total public tables: ${tables.length}`);
const counts = {};
for (const t of ["profiles", "words", "phrases", "daily_plans", "activity_events", "speaking_sessions", "speaking_turns", "deck_words", "user_word_triage"]) {
  try { counts[t] = (await c.query(`select count(*)::int n from public.${t}`)).rows[0].n; }
  catch { counts[t] = "MISSING"; }
}
console.log("Counts:", JSON.stringify(counts));
// Check if daily_plans and activity_events exist
console.log(`daily_plans exists: ${tables.includes("daily_plans")}`);
console.log(`activity_events exists: ${tables.includes("activity_events")}`);
await c.end();