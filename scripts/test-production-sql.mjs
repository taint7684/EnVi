// Test production_v2_combined.sql against a fresh DB matching Production state
import pg from "pg";
import { readFileSync } from "fs";

const conn = { host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" };
const admin = new pg.Client(conn);
await admin.connect();

await admin.query(`drop database if exists envi_sim3`);
await admin.query(`create database envi_sim3`);
console.log("Created envi_sim3");

const sim = new pg.Client({ ...conn, database: "envi_sim3" });
await sim.connect();

// Minimal auth
await sim.query(`
  create schema if not exists auth;
  create table if not exists auth.users (id uuid primary key default gen_random_uuid(), email text);
  create or replace function auth.uid() returns uuid language sql stable as $$
    select coalesce(nullif(current_setting('request.jwt.claim.sub', true), ''),
      (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'))::uuid
  $$;
`);

// Apply 0001-0008 (Production baseline)
for (const f of ["0001_init.sql", "0002_words_extend.sql", "0003_gamification.sql", "0004_indexes.sql",
                 "0005_phrases.sql", "0006_progress_tests.sql", "0007_study_plan.sql", "0008_writing.sql"]) {
  await sim.query(readFileSync(`db/migrations/${f}`, "utf8"));
}
console.log("Applied 0001-0008 (Production baseline)");

// Seed data
await sim.query(`insert into auth.users (id, email) values ('00000000-0000-0000-0000-000000000001', 'test@test.local')`);
await sim.query(`insert into public.words (lemma, meaning_vi) values ('wake', 'thức'), ('work', 'làm')`);
await sim.query(`insert into public.phrases (vi_text, en_text, difficulty) values ('Tôi thức', 'I wake', 'A2'), ('Tôi làm', 'I work', 'A2')`);
const beforeW = (await sim.query(`select count(*)::int n from public.words`)).rows[0].n;
const beforeP = (await sim.query(`select count(*)::int n from public.phrases`)).rows[0].n;
console.log(`Seeded: words=${beforeW}, phrases=${beforeP}`);

// Verify Production baseline: deck_words exists, profiles default=120, phrases 7 cols
const dw = (await sim.query(`select count(*)::int n from information_schema.tables where table_schema='public' and table_name='deck_words'`)).rows[0].n;
const mpd = (await sim.query(`select column_default from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='minutes_per_day'`)).rows[0]?.column_default;
const pc = (await sim.query(`select count(*)::int n from information_schema.columns where table_schema='public' and table_name='phrases'`)).rows[0].n;
console.log(`Baseline: deck_words=${dw>0}, mpd_default=${mpd}, phrases_cols=${pc}`);

// Run the combined production SQL
console.log("\n=== Running production_v2_combined.sql ===");
const sql = readFileSync("db/migrations/production_v2_combined.sql", "utf8");
try {
  await sim.query(sql);
  console.log("  ✅ Combined SQL executed successfully");
} catch (e) {
  console.log(`  ❌ Error: ${e.message.slice(0, 300)}`);
  await sim.end(); await admin.end();
  process.exit(1);
}

// Verification queries
console.log("\n=== VERIFICATION ===");
const B1 = (await sim.query(`select count(*)::int n from information_schema.tables where table_schema='public'`)).rows[0].n;
console.log(`B1 Table count: ${B1} (expect 50) ${B1===50?'✅':'❌'}`);

const B2 = (await sim.query(`select exists(select 1 from information_schema.tables where table_schema='public' and table_name='deck_words') as e`)).rows[0].e;
console.log(`B2 deck_words: ${B2} (expect true) ${B2?'✅':'❌'}`);

const B5 = (await sim.query(`
  select
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='en_alternatives') as en_alt,
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='reflex_reviewed') as reflex_rev,
    exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='keywords') as keywords
`)).rows[0];
console.log(`B5 Reflex cols: en_alt=${B5.en_alt}, reflex_rev=${B5.reflex_rev}, keywords=${B5.keywords} ${B5.en_alt&&B5.reflex_rev&&B5.keywords?'✅':'❌'}`);

const B6 = (await sim.query(`select column_default from information_schema.columns where table_schema='public' and table_name='profiles' and column_name='minutes_per_day'`)).rows[0]?.column_default;
console.log(`B6 mpd default: ${B6} (expect 180) ${B6?.includes('180')?'✅':'❌'}`);

const B9 = (await sim.query(`
  select
    (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity) as rls_on,
    (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r') as total
`)).rows[0];
console.log(`B9 RLS: ${B9.rls_on}/${B9.total} (expect 50/50) ${B9.rls_on===B9.total?'✅':'❌'}`);

const afterW = (await sim.query(`select count(*)::int n from public.words`)).rows[0].n;
const afterP = (await sim.query(`select count(*)::int n from public.phrases`)).rows[0].n;
console.log(`B10 Data: words=${afterW} (was ${beforeW}), phrases=${afterP} (was ${beforeP}) ${afterW===beforeW&&afterP===beforeP?'✅':'❌'}`);

const dwRls = (await sim.query(`select exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='deck_words' and c.relrowsecurity) as e`)).rows[0].e;
console.log(`B12 deck_words RLS: ${dwRls} (expect true) ${dwRls?'✅':'❌'}`);

console.log("\n=== TEST COMPLETE ===");
await sim.end();
await admin.end();