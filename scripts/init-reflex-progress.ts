/**
 * Initialize reflex-progress.json from DB (phrases that already have en_alternatives).
 * Run once before starting the generator.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeAdminClient } from "./lib/supabase";
import { loadEnv } from "./lib/env";

const PROGRESS_FILE = join(process.cwd(), "scripts", "reflex-progress.json");

async function main() {
  loadEnv();
  const admin = makeAdminClient();

  const { data, error } = await admin
    .from("phrases")
    .select("id,en_alternatives")
    .limit(3000);
  if (error) throw error;

  const ids = (data ?? [])
    .filter((p: { en_alternatives: string[] }) => p.en_alternatives?.length > 0)
    .map((p: { id: string }) => p.id);

  const progress = {
    processedIds: ids,
    lastLevel: "A2",
    lastBatch: 0,
    totalProcessed: ids.length,
    totalFailed: 0,
  };

  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2) + "\n", "utf-8");
  console.log(`Initialized progress with ${ids.length} existing phrase IDs.`);
  console.log(`Progress file: ${PROGRESS_FILE}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});