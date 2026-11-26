// Simulate Production migration WITHOUT Step 0 (deck_words already exists)
// This matches actual Production state: 0001-0008 applied, deck_words intact
import pg from "pg";
import { readFileSync } from "fs";

const conn = { host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" };
const admin = new pg.Client(conn);
await admin.connect();

// Create fresh sim DB
await admin.query(`drop database if exists envi_sim2`);
await admin.query(`create database envi_sim2`);
console.log("Created fresh envi_sim2 database");

// Connect to sim DB
const sim = new pg.Client({ ...conn, database: "envi_sim2" });
await sim.connect();

// Create minimal auth schema
await sim.query(`
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
  create or replace function auth.uid() returns uuid language sql stable as $$
    select coalesce(
      nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
    )::uuid
  $$;
`);
console.log("Created minimal auth schema");

async function applyFile(name) {
  const sql = readFileSync(`db/migrations/${name}`, "utf8");
  try { await sim.query(sql); console.log(`  ✅ ${name}`); return true; }
  catch (e) { console.log(`  ❌ ${name}: ${e.message.slice(0, 150)}`); return false; }
}

// PHASE 1: Apply 0001-0008 (WITHOUT dropping deck_words — Production has it)
console.log("\n=== PHASE 1: Apply 0001-0008 (deck_words intact) ===");
let ok = true;
for (const f of ["0001_init.sql", "0002_words_extend.sql", "0003_gamification.sql", "0004_indexes.sql",
                 "0005_phrases.sql", "0006_progress_tests.sql", "0007_study_plan.sql", "0008_writing.sql"]) {
  if (!(await applyFile(f))) ok = false;
}

// Seed sample data
console.log("\n=== Seeding sample data ===");
await sim.query(`
  insert into auth.users (id, email) values
    ('00000000-0000-0000-0000-000000000001', 'test1@test.local'),
    ('00000000-0000-0000-0000-000000000002', 'test2@test.local')
`);
const w = (await sim.query(`insert into public.words (lemma, meaning_vi) values ('wake', 'thức dậy'), ('work', 'làm việc') returning id`)).rows;
const p = (await sim.query(`insert into public.phrases (vi_text, en_text, difficulty) values ('Tôi thức dậy', 'I wake up', 'A2'), ('Tôi làm việc', 'I work', 'A2') returning id`)).rows;
console.log(`  Seeded ${w.length} words, ${p.length} phrases`);

// Verify deck_words exists after Phase 1
const dw = (await sim.query(`select count(*)::int n from information_schema.tables where table_schema='public' and table_name='deck_words'`)).rows[0].n;
console.log(`  deck_words exists after Phase 1: ${dw > 0 ? "✅" : "❌"}`);

// PHASE 2: Apply 0009-0023 + 0004 (NO Step 0)
console.log("\n=== PHASE 2: Apply 0009-0023 + 0004 (NO Step 0) ===");
const order = [
  "0009_client_errors.sql", "0010_activity_events.sql", "0011_s1_daily_plan.sql",
  "0012_s2_speaking_coach.sql", "0013_s3_error_log_makeup.sql", "0014_s4_reflex_vocab_v2.sql",
  "0015_s5_onboarding_checkpoint.sql", "0016_s6_missions_drills.sql", "0017_s7_listen_pronunciation.sql",
  "0018_s8_reading_grammar_writing.sql", "0019_s9_roadmap_gamification.sql", "0020_s10_real_world.sql",
  "0021_default_180_minutes.sql", "0022_reflex_core_fields.sql", "0023_reflex_reviewed.sql",
  "0004_indexes.sql",
];
for (const f of order) { if (!(await applyFile(f))) ok = false; }

// PHASE 3: Verify
console.log("\n=== PHASE 3: Verify ===");
const tables = (await sim.query(`select table_name from information_schema.tables where table_schema='public' order by table_name`)).rows.map(r=>r.table_name);
console.log(`Total public tables: ${tables.length}`);
console.log(`deck_words present: ${tables.includes("deck_words")}`);
console.log(`daily_plans present: ${tables.includes("daily_plans")}`);
console.log(`activity_events present: ${tables.includes("activity_events")}`);

// Reflex columns
const pc = (await sim.query(`select column_name from information_schema.columns where table_schema='public' and table_name='phrases' order by column_name`)).rows.map(r=>r.column_name);
console.log(`\nPhrases columns (${pc.length}): ${pc.join(", ")}`);
for (const c of ["en_alternatives","situation_en","keywords","reflex_reviewed","level","latency_ms","meaning_score"]) {
  console.log(`  ${c}: ${pc.includes(c) ? "✅" : "❌"}`);
}

// profiles default
const pmpd = (await sim.query(`select column_default from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='minutes_per_day'`)).rows[0];
console.log(`\nprofiles.minutes_per_day default: ${pmpd?.column_default ?? "N/A"}`);

// Data integrity
const wc = (await sim.query(`select count(*)::int n from public.words`)).rows[0].n;
const phc = (await sim.query(`select count(*)::int n from public.phrases`)).rows[0].n;
console.log(`\nData: words=${wc} (was 2), phrases=${phc} (was 2)`);

// RLS
const rls = (await sim.query(`select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity`)).rows[0].n;
const totalT = (await sim.query(`select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r'`)).rows[0].n;
console.log(`\nRLS: ${rls}/${totalT} tables`);
const noRls = (await sim.query(`select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity`)).rows;
if (noRls.length) console.log(`  RLS disabled: ${noRls.map(r=>r.relname).join(", ")}`);

console.log(`\n=== RESULT: ${ok ? "ALL MIGRATIONS APPLIED ✅" : "SOME FAILED ❌"} ===`);

await sim.end();
await admin.end();