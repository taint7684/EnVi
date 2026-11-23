import pg from "pg";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const migDir = join(process.cwd(), "db/migrations");
const files = readdirSync(migDir).filter((f) => f.endsWith(".sql")).sort();

// Connect to the default postgres db to create a fresh simulation DB
const admin = new pg.Client({
  host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres",
});
await admin.connect();

// Drop + create envi_sim for a clean simulation
await admin.query(`drop database if exists envi_sim`);
await admin.query(`create database envi_sim`);
console.log("Created fresh envi_sim database");
await admin.end();

const sim = new pg.Client({
  host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "envi_sim",
});
await sim.connect();

// Minimal auth schema so migrations referencing auth.users / auth.uid() work
await sim.query(`
  create schema if not exists auth;
  create table if not exists auth.users (
    id uuid primary key default gen_random_uuid(),
    email text unique,
    created_at timestamptz default now()
  );
  create or replace function auth.uid() returns uuid language sql stable as $$ select null::uuid $$;
`);
console.log("Created minimal auth schema");

async function applyFile(name, opts = {}) {
  const sql = readFileSync(join(migDir, name), "utf-8");
  try {
    await sim.query(sql);
    console.log(`  ✅ ${name}`);
    return true;
  } catch (e) {
    console.log(`  ❌ ${name}: ${e.message.slice(0, 120)}`);
    if (opts.stopOnError) throw e;
    return false;
  }
}

// === PHASE 1: Simulate Production (0001-0008 applied, deck_words MISSING) ===
console.log("\n=== PHASE 1: Simulate Production schema (0001-0008, deck_words missing) ===");
await applyFile("0001_init.sql");
// Simulate the bug: deck_words was never created (or dropped)
await sim.query(`drop table if exists public.deck_words cascade`);
console.log("  ⚠️  Dropped deck_words to simulate Production bug");
for (const f of ["0002_words_extend.sql", "0003_gamification.sql", "0004_indexes.sql",
                 "0005_phrases.sql", "0006_progress_tests.sql", "0007_study_plan.sql",
                 "0008_writing.sql"]) {
  await applyFile(f);
}

// Seed sample data (words + phrases with OLD schema, no new columns yet)
console.log("\n=== Seeding sample data (old schema) ===");
await sim.query(`
  insert into auth.users (id, email) values
    ('00000000-0000-0000-0000-000000000001', 'qa.sim@test.local')
  on conflict (id) do nothing;
`);
// Trigger handle_new_user creates a profile automatically
const wordRes = await sim.query(`
  insert into public.words (lemma, ipa, pos, meaning_vi, example_en, example_vi, topic, frequency_rank, source)
  values
    ('run', '/rʌn/', 'verb', 'chạy', 'I run every morning.', 'Tôi chạy mỗi sáng.', 'daily_routine', 100, 'seed'),
    ('breakfast', '/ˈbrekfəst/', 'noun', 'bữa sáng', 'I have breakfast at 7.', 'Tôi ăn sáng lúc 7.', 'daily_routine', 200, 'seed'),
    ('subway', '/ˈsʌbweɪ/', 'noun', 'tàu điện ngầm', 'I take the subway.', 'Tôi đi tàu điện.', 'transport', 300, 'seed')
  returning id
`);
console.log(`  Seeded ${wordRes.rows.length} words`);

const phraseRes = await sim.query(`
  insert into public.phrases (en_text, vi_text, topic, difficulty)
  values
    ('I usually wake up at six thirty.', 'Tôi thường thức dậy lúc sáu giờ.', 'daily_routine', 'A2'),
    ('I take the subway to work.', 'Tôi đi tàu điện đi làm.', 'transport', 'A2'),
    ('A daily routine helps me stay productive.', 'Một thói quen hàng ngày giúp tôi năng suất.', 'opinion', 'B1')
  returning id
`);
console.log(`  Seeded ${phraseRes.rows.length} phrases`);

const beforeWords = (await sim.query(`select count(*)::int n from public.words`)).rows[0].n;
const beforePhrases = (await sim.query(`select count(*)::int n from public.phrases`)).rows[0].n;
console.log(`  Data before upgrade: words=${beforeWords}, phrases=${beforePhrases}`);

// === PHASE 2: Apply missing migrations in candidate order ===
console.log("\n=== PHASE 2: Apply missing migrations (candidate order) ===");
const order = [
  "0009_client_errors.sql",
  "0010_activity_events.sql",
  "0011_s1_daily_plan.sql",
  "0012_s2_speaking_coach.sql",
  "0013_s3_error_log_makeup.sql",
  "0014_s4_reflex_vocab_v2.sql",
  "0015_s5_onboarding_checkpoint.sql",
  "0016_s6_missions_drills.sql",
  "0017_s7_listen_pronunciation.sql",
  "0018_s8_reading_grammar_writing.sql",
  "0019_s9_roadmap_gamification.sql",
  "0020_s10_real_world.sql",
  "0021_default_180_minutes.sql",
  "0022_reflex_core_fields.sql",
  "0023_reflex_reviewed.sql",
];
let allOk = true;
for (const f of order) {
  const ok = await applyFile(f);
  if (!ok) allOk = false;
}

// Fix deck_words (from 0001, was missing)
console.log("\n=== Fix: create deck_words ===");
try {
  await sim.query(`
    create table if not exists public.deck_words (
      deck_id uuid not null references public.decks(id) on delete cascade,
      word_id uuid not null references public.words(id) on delete cascade,
      ease_factor real not null default 2.5 check (ease_factor > 0),
      interval_days integer not null default 1 check (interval_days >= 0),
      repetitions integer not null default 0 check (repetitions >= 0),
      lapses integer not null default 0 check (lapses >= 0),
      next_review date not null default current_date,
      last_reviewed_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now(),
      primary key (deck_id, word_id)
    );
    create index if not exists deck_words_due_idx on public.deck_words (next_review);
    drop trigger if exists deck_words_set_updated_at on public.deck_words;
    create trigger deck_words_set_updated_at before update on public.deck_words
      for each row execute function public.set_updated_at();
  `);
  console.log("  ✅ deck_words created");
} catch (e) {
  console.log(`  ❌ deck_words: ${e.message.slice(0, 120)}`);
  allOk = false;
}

// Apply 0004 again (idempotent — indexes)
console.log("\n=== Re-apply 0004 (indexes, idempotent) ===");
await applyFile("0004_indexes.sql");

// === PHASE 3: Verify ===
console.log("\n=== PHASE 3: Verify ===");
const tables = (await sim.query(`
  select table_name from information_schema.tables where table_schema='public' order by table_name
`)).rows.map((r) => r.table_name);
console.log(`Total public tables: ${tables.length}`);
console.log(`deck_words present: ${tables.includes("deck_words")}`);
console.log(`daily_plans present: ${tables.includes("daily_plans")}`);

const phraseCols = (await sim.query(`
  select column_name from information_schema.columns
  where table_schema='public' and table_name='phrases' order by column_name
`)).rows.map((r) => r.column_name);
const newCols = ["en_alternatives", "situation_en", "keywords", "reflex_reviewed", "level", "latency_ms", "meaning_score"];
console.log(`\nPhrases new columns:`);
for (const c of newCols) console.log(`  ${c}: ${phraseCols.includes(c) ? "EXISTS ✅" : "MISSING ❌"}`);

// Backfill sample reflex data to verify columns accept data
console.log("\n=== Backfill sample Reflex data into new columns ===");
await sim.query(`
  update public.phrases set
    en_alternatives = array['I usually get up at six thirty.'],
    situation_en = 'Talking about daily routines',
    keywords = array['wake up', 'routine'],
    level = 'L1',
    reflex_reviewed = true,
    latency_ms = 1200,
    meaning_score = 0.85
  where id = (select id from public.phrases limit 1)
`);
const reflexCheck = (await sim.query(`
  select en_text, en_alternatives, situation_en, keywords, level, reflex_reviewed
  from public.phrases where situation_en is not null limit 1
`)).rows[0];
console.log(`  Sample reflex row:`, JSON.stringify(reflexCheck));

// Verify data intact
const afterWords = (await sim.query(`select count(*)::int n from public.words`)).rows[0].n;
const afterPhrases = (await sim.query(`select count(*)::int n from public.phrases`)).rows[0].n;
console.log(`\n=== Data integrity ===`);
console.log(`words: before=${beforeWords}, after=${afterWords} ${beforeWords === afterWords ? "✅ INTACT" : "❌ LOST"}`);
console.log(`phrases: before=${beforePhrases}, after=${afterPhrases} ${beforePhrases === afterPhrases ? "✅ INTACT" : "❌ LOST"}`);

// Check profile was created by trigger
const profile = (await sim.query(`select * from public.profiles limit 1`)).rows[0];
console.log(`profile from trigger: ${profile ? "EXISTS ✅" : "MISSING ❌"}`);
if (profile) console.log(`  minutes_per_day default: ${profile.minutes_per_day}`);

// Check log_activity + award_xp functions exist
const fns = (await sim.query(`
  select routine_name from information_schema.routines
  where routine_schema='public' and routine_name in ('log_activity','award_xp','delete_my_account')
  order by routine_name
`)).rows.map((r) => r.routine_name);
console.log(`RPC functions: ${fns.join(", ")}`);

console.log(`\n=== RESULT: ${allOk ? "ALL MIGRATIONS APPLIED ✅" : "SOME MIGRATIONS FAILED ❌"} ===`);
await sim.end();