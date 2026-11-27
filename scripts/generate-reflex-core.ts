/**
 * Generate Reflex core data: en_alternatives, situation_en, keywords
 * for ALL levels (A2, B1, B2).
 *
 * Features:
 * - Progress file (scripts/reflex-progress.json) for resume after 429/503
 * - Exponential backoff on rate limits
 * - Larger batch sizes configurable
 * - Marks reflex_reviewed = false (AI-generated, unreviewed)
 * - Quality validation (no empty alternatives, no duplicates)
 *
 * Usage:
 *   npx tsx scripts/generate-reflex-core.ts --batch 15 --level A2 --limit 854
 *   npx tsx scripts/generate-reflex-core.ts --batch 15 --level B1 --limit 500
 *   npx tsx scripts/generate-reflex-core.ts --batch 15 --level B2 --limit 150
 *   npx tsx scripts/generate-reflex-core.ts --batch 15 --all
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { makeAdminClient } from "./lib/supabase";
import { loadEnv, requireEnv } from "./lib/env";

type PhraseRow = {
  id: string;
  vi_text: string;
  en_text: string;
  difficulty: string;
};

type ReflexData = {
  en_alternatives: string[];
  situation_en: string;
  keywords: string[];
};

type ProgressFile = {
  processedIds: string[];
  lastLevel: string;
  lastBatch: number;
  totalProcessed: number;
  totalFailed: number;
};

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "qwen/qwen3.8-27b";
const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 8000;
const PROGRESS_FILE = join(process.cwd(), "scripts", "reflex-progress.json");

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function loadProgress(): ProgressFile {
  if (existsSync(PROGRESS_FILE)) {
    try {
      return JSON.parse(readFileSync(PROGRESS_FILE, "utf-8")) as ProgressFile;
    } catch {
      // corrupted file, start fresh
    }
  }
  return { processedIds: [], lastLevel: "", lastBatch: 0, totalProcessed: 0, totalFailed: 0 };
}

function saveProgress(progress: ProgressFile): void {
  writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2) + "\n", "utf-8");
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
          max_tokens: 4000,
        }),
        signal: AbortSignal.timeout(45_000),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        return data.choices[0]?.message?.content ?? "{}";
      }
      if (res.status === 429 || res.status >= 500) {
        const retryAfter = Number(res.headers.get("retry-after") ?? "10");
        const waitMs = Math.max(retryAfter * 1000, BASE_DELAY_MS * (attempt + 1));
        lastError = new Error(`Groq ${res.status}, wait ${Math.round(waitMs / 1000)}s`);
        console.log(`  Rate limited (${res.status}), waiting ${Math.round(waitMs / 1000)}s...`);
        await sleep(waitMs);
        continue;
      }
      throw new Error(`Groq ${res.status}: ${await res.text()}`);
    } catch (e) {
      lastError = e;
      if (attempt < MAX_ATTEMPTS - 1) {
        const waitMs = (attempt + 1) * 5000;
        await sleep(waitMs);
      }
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Groq failed");
}

async function callGemini(prompt: string): Promise<string> {
  const apiKey = requireEnv("GEMINI_API_KEY");
  const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 4000,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
  };
  return data.candidates[0]?.content?.parts?.[0]?.text ?? "{}";
}

async function callAI(prompt: string): Promise<string> {
  try {
    return await callGroq(prompt);
  } catch (groqError) {
    console.log(`  Groq failed, trying Gemini...`);
    try {
      return await callGemini(prompt);
    } catch (geminiError) {
      throw new Error(
        `Both providers failed. Groq: ${groqError instanceof Error ? groqError.message : String(groqError)}. Gemini: ${geminiError instanceof Error ? geminiError.message : String(geminiError)}`,
      );
    }
  }
}

function buildPrompt(phrases: PhraseRow[]): string {
  const level = phrases[0]?.difficulty ?? "A2";
  const isB1 = level === "B1";
  const isB2 = level === "B2";

  let instructions: string;
  if (isB1) {
    instructions = `Voi moi cap cau duoi day, tra ve:
- en_alternatives: 2-3 cach noi tieng Anh dung khac (tu nhien, cap do B1)
- situation_en: 1 cau tinh huong tieng Anh ngan (dung cho L2 - mo dau bang vi du "You are at..." hoac "Your colleague asks...")
- keywords: 3-5 tu khoa quan trong de cham diem`;
  } else if (isB2) {
    instructions = `Voi moi cap cau duoi day, tra ve:
- en_alternatives: 2-3 cach noi tieng Anh dung khac (tu nhien, cap do B2, thanh ngu/cum dong tu neu phu hop)
- situation_en: 1 cau hoi/tinh huong tieng Anh (dung cho L3 - Q&A dang cau hoi mo)
- keywords: 3-5 tu khoa quan trong de cham diem`;
  } else {
    instructions = `Voi moi cap cau duoi day, tra ve:
- en_alternatives: 2-3 cach noi tieng Anh dung khac (chap nhan duoc, tu nhien, cap do A2)
- situation_en: 1 cau tinh huong tieng Anh ngan (dung cho L2 - prompt thay vi dich)
- keywords: 3-5 tu khoa quan trong de cham diem`;
  }

  return `${instructions}

DANH SACH:
${phrases.map((p, i) => `${i + 1}. VI: ${p.vi_text} | EN: ${p.en_text}`).join("\n")}

Tra ve JSON: {"items":[{"index":1,"en_alternatives":["..."],"situation_en":"...","keywords":["..."]}]}`;
}

function validateReflexData(data: ReflexData, enText: string): boolean {
  if (!data.en_alternatives || data.en_alternatives.length === 0) return false;
  if (!data.situation_en || data.situation_en.trim().length < 5) return false;
  if (!data.keywords || data.keywords.length < 2) return false;

  const allText = [enText, ...data.en_alternatives].join(" ").toLowerCase();
  for (const alt of data.en_alternatives) {
    if (!alt || alt.trim().length < 3) return false;
    if (alt.toLowerCase() === enText.toLowerCase()) continue;
  }
  for (const kw of data.keywords) {
    if (!kw || kw.trim().length < 2) return false;
    if (!allText.includes(kw.toLowerCase().split(" ")[0]!)) return false;
  }
  return true;
}

async function generateForBatch(
  phrases: PhraseRow[],
): Promise<Map<string, ReflexData>> {
  const prompt = buildPrompt(phrases);
  const raw = await callAI(prompt);
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
    const data: ReflexData = {
      en_alternatives: (item.en_alternatives ?? []).filter(
        (a: string) => a && a.trim().length > 0 && a.toLowerCase() !== phrase.en_text.toLowerCase(),
      ),
      situation_en: item.situation_en ?? "",
      keywords: (item.keywords ?? []).filter(
        (k: string) => k && k.trim().length > 0,
      ),
    };
    if (validateReflexData(data, phrase.en_text)) {
      map.set(phrase.id, data);
    } else {
      console.warn(
        `  Quality check failed for "${phrase.vi_text.slice(0, 40)}...", skipping`,
      );
    }
  }
  return map;
}

async function main() {
  loadEnv();
  const args = process.argv.slice(2);
  let batchSize = 15;
  let limit = 999999;
  let targetLevel = "ALL";

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--batch") batchSize = Number(args[++i]) || 15;
    else if (args[i] === "--limit") limit = Number(args[++i]) || 999999;
    else if (args[i] === "--level") targetLevel = (args[++i] ?? "ALL").toUpperCase();
    else if (args[i] === "--all") targetLevel = "ALL";
  }

  const admin = makeAdminClient();
  const progress = loadProgress();

  const levels = targetLevel === "ALL" ? ["A2", "B1", "B2"] : [targetLevel];
  console.log(`=== Reflex Core Data Generator (all levels) ===`);
  console.log(`Levels: ${levels.join(", ")}, batch: ${batchSize}, limit: ${limit}`);
  console.log(`Progress: ${progress.totalProcessed} processed, ${progress.totalFailed} failed`);

  let grandProcessed = 0;
  let grandFailed = 0;

  for (const level of levels) {
    const { data, error } = await admin
      .from("phrases")
      .select("id,vi_text,en_text,difficulty")
      .eq("difficulty", level)
      .limit(limit);
    if (error) throw error;

    const allPhrases = (data ?? []) as PhraseRow[];
    const toProcess = allPhrases.filter((p) => !progress.processedIds.includes(p.id));

    console.log(`\n--- Level ${level}: ${allPhrases.length} total, ${toProcess.length} to process ---`);

    if (toProcess.length === 0) {
      console.log(`  All ${level} phrases already processed.`);
      continue;
    }

    for (let i = 0; i < toProcess.length; i += batchSize) {
      const batch = toProcess.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(toProcess.length / batchSize);

      try {
        const map = await generateForBatch(batch);
        let batchOk = 0;
        for (const [id, reflexData] of map) {
          const { error: updateError } = await admin
            .from("phrases")
            .update({
              en_alternatives: reflexData.en_alternatives,
              situation_en: reflexData.situation_en,
              keywords: reflexData.keywords,
              reflex_reviewed: false,
            })
            .eq("id", id);
          if (updateError) {
            console.error(`  DB error for ${id}: ${updateError.message}`);
            grandFailed++;
          } else {
            progress.processedIds.push(id);
            progress.totalProcessed++;
            grandProcessed++;
            batchOk++;
          }
        }
        console.log(
          `  [${level} batch ${batchNum}/${totalBatches}] OK: ${batchOk}/${batch.length} phrases`,
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error(`  [${level} batch ${batchNum}/${totalBatches}] FAILED: ${msg.slice(0, 120)}`);
        grandFailed += batch.length;
        progress.totalFailed += batch.length;
      }

      progress.lastLevel = level;
      progress.lastBatch = batchNum;
      saveProgress(progress);

      if (i + batchSize < toProcess.length) {
        await sleep(BASE_DELAY_MS);
      }
    }
  }

  console.log(`\n===== KET QUA =====`);
  console.log(`Processed: ${grandProcessed}`);
  console.log(`Failed: ${grandFailed}`);
  console.log(`Progress saved to: ${PROGRESS_FILE}`);

  const { data: finalCounts } = await admin
    .from("phrases")
    .select("difficulty")
    .limit(3000);
  if (finalCounts) {
    const byLevel: Record<string, number> = {};
    for (const p of finalCounts) {
      const d = (p as { difficulty: string }).difficulty;
      byLevel[d] = (byLevel[d] ?? 0) + 1;
    }
    console.log(`\nTotal phrases in DB: ${finalCounts.length}`);
    for (const [d, c] of Object.entries(byLevel)) {
      console.log(`  ${d}: ${c}`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});