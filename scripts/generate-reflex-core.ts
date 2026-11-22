/**
 * Generate Reflex core data: en_alternatives, situation_en, keywords
 * for a core set of A2 phrases.
 *
 * Usage: npx tsx scripts/generate-reflex-core.ts --batch 10 --limit 50
 */
import { readFileSync } from "node:fs";
import { makeAdminClient } from "./lib/supabase";
import { loadEnv, requireEnv } from "./lib/env";

type PhraseRow = {
  id: string;
  vi_text: string;
  en_text: string;
};

type ReflexData = {
  en_alternatives: string[];
  situation_en: string;
  keywords: string[];
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";
const MAX_ATTEMPTS = 3;
const BATCH_SIZE = 10;
const DELAY_MS = 5000;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function callGroq(prompt: string): Promise<string> {
  const apiKey = requireEnv("GROQ_API_KEY");
  let lastError: unknown;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content:
                "Ban la chuyen gia tieng Anh. Tra ve DUY NHAT mot object JSON hop le theo schema. Khong them binh luan, khong markdown.",
            },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(30_000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        return data.choices[0]?.message?.content ?? "{}";
      }
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after") ?? "5");
        lastError = new Error(`Groq ${res.status}, retry after ${retryAfter}s`);
        await sleep(retryAfter * 1000 + attempt * 1000);
        continue;
      }
      throw new Error(`Groq ${res.status}: ${await res.text()}`);
    } catch (e) {
      lastError = e;
      if (attempt < MAX_ATTEMPTS - 1) await sleep((attempt + 1) * 2000);
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Groq failed");
}

async function generateForBatch(phrases: PhraseRow[]): Promise<Map<string, ReflexData>> {
  const prompt = `Voi moi cap cau duoi day, tra ve:
- en_alternatives: 2-3 cach noi tieng Anh dung khac (chap nhan duoc, tu nhien)
- situation_en: 1 cau tinh huong tieng Anh ngan (dung cho L2 - prompt thay vi dich)
- keywords: 3-5 tu khoa quan trong de cham diem

DANH SACH:
${phrases.map((p, i) => `${i + 1}. VI: ${p.vi_text} | EN: ${p.en_text}`).join("\n")}

Tra ve JSON: {"items":[{"index":1,"en_alternatives":["..."],"situation_en":"...","keywords":["..."]}]}`;

  const raw = await callGroq(prompt);
  const parsed = JSON.parse(raw) as {
    items: Array<{
      index: number;
      en_alternatives: string[];
      situation_en: string;
      keywords: string[];
    }>;
  };

  const map = new Map<string, ReflexData>();
  for (const item of parsed.items ?? []) {
    const phrase = phrases[item.index - 1];
    if (!phrase) continue;
    map.set(phrase.id, {
      en_alternatives: item.en_alternatives ?? [],
      situation_en: item.situation_en ?? "",
      keywords: item.keywords ?? [],
    });
  }
  return map;
}

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  let batchSize = BATCH_SIZE;
  let limit = 50;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch") batchSize = Number(args[++i]) || BATCH_SIZE;
    else if (args[i] === "--limit") limit = Number(args[++i]) || 50;
  }

  const admin = makeAdminClient();

  // Fetch A2 phrases that don't have en_alternatives yet
  const { data, error } = await admin
    .from("phrases")
    .select("id,vi_text,en_text")
    .eq("difficulty", "A2")
    .limit(limit);
  if (error) throw error;

  const phrases = (data ?? []) as PhraseRow[];
  // Filter: only phrases where en_alternatives is empty
  const { data: existing } = await admin
    .from("phrases")
    .select("id,en_alternatives")
    .eq("difficulty", "A2")
    .not("en_alternatives", "is", null);
  const existingIds = new Set(
    (existing ?? [])
      .filter((p: { en_alternatives: string[] }) => p.en_alternatives?.length > 0)
      .map((p: { id: string }) => p.id),
  );

  const toProcess = phrases.filter((p) => !existingIds.has(p.id));
  console.log(`=== Reflex Core Data Generator ===`);
  console.log(`Fetched: ${phrases.length} A2 phrases, ${toProcess.length} need data`);
  console.log(`Batch size: ${batchSize}, limit: ${limit}`);

  if (toProcess.length === 0) {
    console.log("All phrases already have data. Nothing to do.");
    return;
  }

  let processed = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i += batchSize) {
    const batch = toProcess.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    const totalBatches = Math.ceil(toProcess.length / batchSize);

    try {
      const map = await generateForBatch(batch);
      for (const [id, data] of map) {
        const { error: updateError } = await admin
          .from("phrases")
          .update({
            en_alternatives: data.en_alternatives,
            situation_en: data.situation_en,
            keywords: data.keywords,
          })
          .eq("id", id);
        if (updateError) {
          console.error(`  DB error for ${id}: ${updateError.message}`);
          failed++;
        } else {
          processed++;
        }
      }
      console.log(
        `  [batch ${batchNum}/${totalBatches}] OK: ${map.size} phrases updated`,
      );
    } catch (e) {
      console.error(
        `  [batch ${batchNum}/${totalBatches}] FAILED: ${e instanceof Error ? e.message : String(e)}`,
      );
      failed += batch.length;
    }

    if (i + batchSize < toProcess.length) {
      await sleep(DELAY_MS);
    }
  }

  console.log(`\n===== KET QUA =====`);
  console.log(`Processed: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${toProcess.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});