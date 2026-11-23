// Programmatically concatenate migration files into a single production SQL
// This ensures the combined SQL exactly matches individual migrations
import { readFileSync, writeFileSync } from "fs";

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
  "0004_indexes.sql",
];

const header = `-- ============================================================
-- EnVi v2 — PRODUCTION MIGRATION SCRIPT (AUTO-GENERATED)
-- Commit: c4c9f60
-- Target: Supabase Production (ricthhogtmgxoyjstfkz)
-- Generated: ${new Date().toISOString().slice(0, 10)}
-- ============================================================
--
-- BEFORE RUNNING:
--   1. Backup: Supabase Dashboard → Database → Backups → Create backup
--   2. Run this ENTIRE script in Supabase SQL Editor (single transaction)
--   3. If ANY statement fails, the transaction rolls back — nothing applied
--   4. After success, run the VERIFICATION QUERIES at the bottom
--
-- MIGRATION ORDER (tested on QA simulation, 16/16 applied ✅):
--   ${order.join(" → ")}
--
-- NOTE: deck_words already exists in Production (from 0001, 2 cols, RLS enabled).
--       No Step 0 needed. All migrations use IF NOT EXISTS (idempotent).
--
-- MID-FAILURE HANDLING:
--   If the script fails, note the last "-- ✅ APPLIED: XXXX" before the error.
--   Run DIAGNOSTIC QUERIES (§A) to see what was created.
--   Fix the failing migration, then re-run the ENTIRE script (safe — idempotent).
-- ============================================================

begin;

`;

let body = "";
for (const f of order) {
  const sql = readFileSync(`db/migrations/${f}`, "utf8");
  body += `-- ------------------------------------------------------------\n`;
  body += `-- ✅ APPLIED: ${f}\n`;
  body += `-- ------------------------------------------------------------\n`;
  body += sql.trim() + "\n\n";
}

const footer = `commit;

-- ============================================================
-- §2: POST-RUN VERIFICATION QUERIES
-- Run AFTER migration succeeds (outside the transaction)
-- ============================================================

-- §A: DIAGNOSTIC — Run this if migration fails, to see what was applied
-- select table_name from information_schema.tables where table_schema = 'public' order by table_name;
-- select column_name from information_schema.columns where table_schema = 'public' and table_name = 'phrases' order by column_name;
-- select column_name, column_default from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'minutes_per_day';

-- §B: VERIFICATION — All should return expected values

-- B1: Table count (expect 50)
select count(*) as table_count from information_schema.tables where table_schema = 'public';

-- B2: deck_words exists (expect true)
select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'deck_words') as deck_words_exists;

-- B3: daily_plans exists (expect true)
select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'daily_plans') as daily_plans_exists;

-- B4: activity_events exists (expect true)
select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activity_events') as activity_events_exists;

-- B5: Reflex columns on phrases (expect 7 true)
select
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='en_alternatives') as en_alternatives,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='situation_en') as situation_en,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='keywords') as keywords,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='reflex_reviewed') as reflex_reviewed,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='level') as level,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='latency_ms') as latency_ms,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='meaning_score') as meaning_score;

-- B6: profiles.minutes_per_day default (expect 180)
select column_default from information_schema.columns
where table_schema='public' and table_name='profiles' and column_name='minutes_per_day';

-- B7: speaking_sessions new columns (expect 7 true)
select
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='mode') as mode,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='level') as level,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='feedback_mode') as feedback_mode,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='offline') as offline,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='courage_before') as courage_before,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='courage_after') as courage_after,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='summary_json') as summary_json;

-- B8: writing_drafts.kind (expect true)
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='writing_drafts' and column_name='kind') as kind_exists;

-- B9: RLS enabled on all tables (expect 50/50)
select
  (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity) as rls_enabled,
  (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r') as total_tables;

-- B10: Data integrity (expect words=5029, phrases=1354)
select
  (select count(*)::int from public.words) as words_count,
  (select count(*)::int from public.phrases) as phrases_count;

-- B11: RPC functions exist (expect 3 true)
select
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='award_xp') as award_xp,
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='delete_my_account') as delete_my_account,
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='log_activity') as log_activity;

-- B12: deck_words RLS (expect true)
select exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='deck_words' and c.relrowsecurity) as deck_words_rls;

-- ============================================================
-- §3: EXPECTED RESULTS
-- ============================================================
-- B1: 50
-- B2: true
-- B3: true
-- B4: true
-- B5: 7x true
-- B6: 180
-- B7: 7x true
-- B8: true
-- B9: 50, 50
-- B10: 5029, 1354
-- B11: 3x true
-- B12: true
-- ============================================================
`;

writeFileSync("db/migrations/production_v2_combined.sql", header + body + footer, "utf8");
console.log("Generated production_v2_combined.sql from individual migrations");
console.log(`Order: ${order.join(" → ")}`);
console.log(`File size: ${(header + body + footer).length} chars`);