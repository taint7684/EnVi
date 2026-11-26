import pg from "pg";
const c = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" });
await c.connect();
const tables = (await c.query(`select tablename from pg_tables where schemaname='public' order by tablename`)).rows.map(r=>r.tablename);
console.log(`Tables: ${tables.length}`);
const counts = {};
for (const t of ["profiles","words","phrases","speaking_sessions","speaking_turns","progress_tests","ai_usage_log","writing_drafts","card_reviews","phrase_reviews","daily_progress"]) {
  try { counts[t] = (await c.query(`select count(*)::int n from public.${t}`)).rows[0].n; }
  catch { counts[t] = "ERR"; }
}
console.log(JSON.stringify(counts, null, 2));
const expected = {profiles:3,words:5029,phrases:1354,speaking_sessions:172,speaking_turns:197,progress_tests:21,ai_usage_log:185,writing_drafts:15,card_reviews:11,phrase_reviews:1,daily_progress:1};
let ok = true;
for (const [t,e] of Object.entries(expected)) { const m = counts[t]===e; if(!m) ok=false; console.log(`  ${t}: ${counts[t]} (exp ${e}) ${m?'✅':'❌'}`); }
console.log(`\nRestore: ${ok?'PASS ✅':'FAIL ❌'}`);
await c.end();