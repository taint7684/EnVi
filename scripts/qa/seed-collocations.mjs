// Seed word_collocations into a target database.
//
// Modes:
//   1) Local QA (direct Postgres):   node scripts/qa/seed-collocations.mjs --pg-url "postgres://postgres:postgres@localhost:54322/postgres"
//   2) Any Supabase (REST/service):  node scripts/qa/seed-collocations.mjs --url "https://xxx.supabase.co" --service-key "<service_role>"
//
// Reads data/word-collocations.json (object keyed by word id).
// Idempotent: upserts on conflict (word_id) update content.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..", "..");
const DATA_PATH = path.join(ROOT, "data", "word-collocations.json");

function arg(name) {
  const i = process.argv.indexOf("--" + name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const pgUrl = arg("pg-url");
const supaUrl = arg("url");
const serviceKey = arg("service-key");

const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
const entries = Object.entries(data).map(([id, v]) => ({
  word_id: id,
  collocation: v.collocation,
  example_en: v.example_en,
  example_vi: v.example_vi,
}));
console.log(`Loaded ${entries.length} collocation entries from ${DATA_PATH}`);

async function seedPg() {
  const { default: pg } = await import("pg");
  const pool = new pg.Pool({ connectionString: pgUrl });
  const BATCH = 400;
  let done = 0;
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const values = [];
    const params = [];
    let p = 1;
    for (const e of batch) {
      values.push(`($${p}, $${p + 1}, $${p + 2}, $${p + 3})`);
      params.push(e.word_id, e.collocation, e.example_en, e.example_vi);
      p += 4;
    }
    const sql = `insert into public.word_collocations (word_id, collocation, example_en, example_vi)
      values ${values.join(",")}
      on conflict (word_id) do update set
        collocation = excluded.collocation,
        example_en = excluded.example_en,
        example_vi = excluded.example_vi,
        updated_at = now()`;
    await pool.query(sql, params);
    done += batch.length;
    console.log(`  pg: ${done}/${entries.length}`);
  }
  await pool.end();
  console.log(`pg seed complete: ${done} rows upserted.`);
}

async function seedRest() {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supaUrl, serviceKey, { auth: { persistSession: false } });
  const BATCH = 500;
  let done = 0;
  for (let i = 0; i < entries.length; i += BATCH) {
    const batch = entries.slice(i, i + BATCH);
    const { error } = await supabase
      .from("word_collocations")
      .upsert(batch, { onConflict: "word_id" });
    if (error) throw new Error("upsert failed: " + error.message);
    done += batch.length;
    console.log(`  rest: ${done}/${entries.length}`);
  }
  console.log(`rest seed complete: ${done} rows upserted.`);
}

(async () => {
  if (pgUrl) await seedPg();
  else if (supaUrl && serviceKey) await seedRest();
  else {
    console.error("Provide --pg-url for local QA, or --url + --service-key for Supabase REST.");
    process.exit(1);
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});