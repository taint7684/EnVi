import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parseCsv } from "./lib/csv";
import { loadEnv, requireEnv } from "./lib/env";
import { makeAdminClient } from "./lib/supabase";
import { fetchIpa } from "./lib/dictionary";
import { generateWithFallback, type GenerateResult } from "./lib/gemini";

type Source = "oxford" | "ngsl";

type WordRow = {
  lemma: string;
  pos: string | null;
  cefr: string | null;
  frequency_rank: number | null;
  audio_url: string | null;
  source: Source;
};

type CliOptions = {
  dryRun: boolean;
  limit: number | null;
  source: Source | "both";
  delayMs: number;
  batchSize: number;
  useDictionary: boolean;
};

const OXFORD_FILE = "data/oxford-5k.csv";
const NGSL_FILE = "data/ngsl-1.2.csv";

function parseArgs(argv: string[]): CliOptions {
  const opts: CliOptions = {
    dryRun: false,
    limit: null,
    source: "both",
    delayMs: 4500,
    batchSize: 50,
    useDictionary: true,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") opts.dryRun = true;
    else if (arg === "--no-ipa-dict") opts.useDictionary = false;
    else if (arg === "--limit") opts.limit = Number(argv[++i]);
    else if (arg === "--delay") opts.delayMs = Number(argv[++i]);
    else if (arg === "--batch") opts.batchSize = Number(argv[++i]);
    else if (arg === "--source") {
      const value = argv[++i];
      if (value === "oxford" || value === "ngsl" || value === "both") {
        opts.source = value;
      }
    }
  }

  if (!Number.isFinite(opts.delayMs) || opts.delayMs < 0) opts.delayMs = 4500;
  if (!Number.isFinite(opts.batchSize) || opts.batchSize < 1) opts.batchSize = 50;
  if (opts.limit !== null && (!Number.isFinite(opts.limit) || opts.limit <= 0)) {
    opts.limit = null;
  }
  return opts;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function printCsvInfo(label: string, file: string, raw: string): void {
  const firstLine = raw.split(/\r?\n/, 1)[0] ?? "";
  const cols = parseCsv(firstLine.replace(/^\uFEFF/, "")).headers;
  console.log(`\n[${label}] ${file}`);
  console.log(`  header thô : ${firstLine.replace(/^\uFEFF/, "")}`);
  console.log(`  cột (${cols.length}) : ${cols.join(" | ")}`);
}

function readCsvFile(label: string, file: string) {
  const raw = readFileSync(resolve(process.cwd(), file), "utf8");
  printCsvInfo(label, file, raw);
  const table = parseCsv(raw);
  console.log(`  số dòng dữ liệu: ${table.rows.length}`);
  return table;
}

async function main(): Promise<void> {
  const opts = parseArgs(process.argv.slice(2));
  loadEnv();

  console.log("=== EnVi — import từ vựng ===");
  console.log(`chế độ       : ${opts.dryRun ? "DRY-RUN (không gọi API/DB)" : "THẬT"}`);
  console.log(
    `nguồn        : ${opts.source} | batch: ${opts.batchSize} | delay: ${opts.delayMs}ms | ipa-dict: ${opts.useDictionary ? "bật" : "tắt"}`,
  );

  const oxfordTable = readCsvFile("Oxford 5k", OXFORD_FILE);
  const ngslTable = readCsvFile("NGSL 1.2", NGSL_FILE);

  console.log("\n-- 3 dòng mẫu Oxford --");
  for (const row of oxfordTable.rows.slice(0, 3)) console.log("  " + JSON.stringify(row));
  console.log("-- 3 dòng mẫu NGSL --");
  for (const row of ngslTable.rows.slice(0, 3)) console.log("  " + JSON.stringify(row));

  const oxford = new Map<string, WordRow>();
  let oxfordDuplicates = 0;
  for (const row of oxfordTable.rows) {
    const lemma = (row.word ?? "").trim().toLowerCase();
    if (!lemma) continue;
    if (oxford.has(lemma)) {
      oxfordDuplicates++;
      continue;
    }
    oxford.set(lemma, {
      lemma,
      pos: (row.pos ?? "").trim() || null,
      cefr: (row.level ?? "").trim().toLowerCase() || null,
      frequency_rank: null,
      audio_url: (row.voice_url ?? "").trim() || null,
      source: "oxford",
    });
  }

  const ngsl = new Map<string, number>();
  let ngslDuplicates = 0;
  for (const row of ngslTable.rows) {
    const lemma = (row.Lemma ?? "").trim().toLowerCase();
    const rank = Number.parseInt(row["SFI Rank"] ?? "", 10);
    if (!lemma || !Number.isFinite(rank)) continue;
    if (ngsl.has(lemma)) {
      ngslDuplicates++;
      continue;
    }
    ngsl.set(lemma, rank);
  }

  for (const [lemma, row] of oxford) {
    const rank = ngsl.get(lemma);
    if (rank !== undefined) row.frequency_rank = rank;
  }

  const all: WordRow[] = [];
  if (opts.source === "oxford" || opts.source === "both") {
    all.push(...oxford.values());
  }
  if (opts.source === "ngsl" || opts.source === "both") {
    for (const [lemma, rank] of ngsl) {
      if (opts.source === "both" && oxford.has(lemma)) continue;
      all.push({
        lemma,
        pos: null,
        cefr: null,
        frequency_rank: rank,
        audio_url: null,
        source: "ngsl",
      });
    }
  }

  const overlap = [...oxford.keys()].filter((lemma) => ngsl.has(lemma)).length;
  console.log(`\n-- Thống kê nguồn --`);
  console.log(
    `  Oxford: ${oxfordTable.rows.length} dòng, ${oxford.size} từ duy nhất (trùng nội bộ: ${oxfordDuplicates})`,
  );
  console.log(
    `  NGSL  : ${ngslTable.rows.length} dòng, ${ngsl.size} từ duy nhất (trùng nội bộ: ${ngslDuplicates})`,
  );
  console.log(`  Trùng Oxford & NGSL: ${overlap} từ (Oxford được ưu tiên)`);

  const limited = opts.limit ? all.slice(0, opts.limit) : all;
  console.log(`  Tổng từ sẽ xử lý: ${limited.length}${opts.limit ? ` ( sau --limit ${opts.limit})` : ""}`);

  console.log("\n-- Preview 3 từ sau map (trước khi gọi Gemini) --");
  for (const row of limited.slice(0, 3)) console.log("  " + JSON.stringify(row));

  if (opts.dryRun) {
    console.log("\nDRY-RUN xong. Không gọi Gemini, không ghi DB.");
    return;
  }

  const geminiKey = requireEnv("GEMINI_API_KEY");
  const supabase = makeAdminClient();

  const preflight = await supabase.from("words").select("id").limit(1);
  if (preflight.error) {
    console.error(`\nKhông truy cập được bảng words: ${preflight.error.message}`);
    console.error("Kiểm tra SUPABASE_SERVICE_ROLE_KEY và đã chạy 0002_words_extend.sql chưa?");
    process.exit(1);
  }
  const colCheck = await supabase.from("words").select("cefr_level").limit(1);
  if (colCheck.error) {
    console.error(`\nThiếu cột cefr_level: ${colCheck.error.message}`);
    console.error("Chạy db/migrations/0002_words_extend.sql trước nhé.");
    process.exit(1);
  }

  const sources: Source[] = opts.source === "both" ? ["oxford", "ngsl"] : [opts.source];
  const existing = new Map<Source, Set<string>>();
  for (const source of sources) {
    const set = await fetchExisting(supabase, source);
    existing.set(source, set);
    console.log(`Đã có sẵn trong DB (${source}): ${set.size} từ → bỏ qua.`);
  }

  const pending = limited.filter((row) => !existing.get(row.source)?.has(row.lemma));
  console.log(`\nCần xử lý: ${pending.length} từ (${limited.length - pending.length} đã có).`);

  let success = 0;
  let failedGemini = 0;
  let failedDb = 0;
  let dictHits = 0;
  const startedAt = Date.now();

  let dictConsecutiveErrors = 0;
  let dictDisabled = !opts.useDictionary;
  const ipaCache = new Map<string, { ipa: string | null; fromDict: boolean }>();

  async function resolveIpa(
    lemma: string,
    geminiIpa: string | null,
  ): Promise<{ ipa: string | null; fromDict: boolean }> {
    if (dictDisabled) return { ipa: geminiIpa, fromDict: false };

    const cached = ipaCache.get(lemma);
    if (cached) return cached;

    const result = await fetchIpa(lemma);
    let resolved: { ipa: string | null; fromDict: boolean };

    if ("ipa" in result) {
      resolved = { ipa: result.ipa, fromDict: true };
      dictConsecutiveErrors = 0;
    } else if (result.status === "error") {
      dictConsecutiveErrors++;
      if (dictConsecutiveErrors >= 10) {
        dictDisabled = true;
        console.warn("⚠ Dictionary API lỗi liên tục → tắt, dùng IPA từ Gemini.");
      }
      resolved = { ipa: geminiIpa, fromDict: false };
    } else {
      resolved = { ipa: geminiIpa, fromDict: false };
    }

    ipaCache.set(lemma, resolved);
    return resolved;
  }

  for (let i = 0; i < pending.length; i += opts.batchSize) {
    const batch = pending.slice(i, i + opts.batchSize);
    const batchNo = Math.floor(i / opts.batchSize) + 1;
    const totalBatches = Math.ceil(pending.length / opts.batchSize);
    const lemmas = batch.map((row) => row.lemma);

    let result: GenerateResult;
    try {
      result = await generateWithFallback(lemmas, geminiKey);
    } catch (error) {
      failedGemini += batch.length;
      console.error(
        `  [batch ${batchNo}/${totalBatches}] AI lỗi cả batch (${batch.length} từ) → bỏ qua: ${(error as Error).message}`,
      );
      if (i + opts.batchSize < pending.length) await sleep(opts.delayMs);
      continue;
    }
    const gemini = result.words;

    const ipaList = await mapPool(batch, 5, (row) => {
      const fromGemini = gemini.get(row.lemma)?.ipa ?? null;
      return resolveIpa(row.lemma, fromGemini);
    });

    const rowsToInsert: Record<string, unknown>[] = [];
    for (let j = 0; j < batch.length; j++) {
      const row = batch[j];
      const generated = gemini.get(row.lemma);
      if (!generated || !generated.meaning_vi.trim()) {
        failedGemini++;
        continue;
      }
      const ipaInfo = ipaList[j];
      if (ipaInfo.fromDict) dictHits++;
      rowsToInsert.push({
        lemma: row.lemma,
        ipa: ipaInfo.ipa,
        pos: row.pos,
        meaning_vi: generated.meaning_vi.trim(),
        example_en: generated.example_en || null,
        example_vi: generated.example_vi || null,
        image_url: null,
        audio_url: row.audio_url,
        topic: null,
        frequency_rank: row.frequency_rank,
        source: row.source,
        cefr_level: row.cefr,
        needs_review: true,
      });
    }

    if (rowsToInsert.length > 0) {
      const { error } = await supabase
        .from("words")
        .upsert(rowsToInsert, { onConflict: "lemma,source" });
      if (error) {
        failedDb += rowsToInsert.length;
        console.error(`  [batch ${batchNo}/${totalBatches}] DB lỗi: ${error.message}`);
      } else {
        success += rowsToInsert.length;
        console.log(
          `  [batch ${batchNo}/${totalBatches}] OK: ${rowsToInsert.length} từ (nguồn: ${result.source}, AI ${gemini.size}, IPA dict ${ipaList.filter((x) => x.fromDict).length})`,
        );
      }
    } else {
      console.log(`  [batch ${batchNo}/${totalBatches}] không có từ hợp lệ để ghi.`);
    }

    if (i + opts.batchSize < pending.length) await sleep(opts.delayMs);
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n===== KẾT QUẢ =====`);
  console.log(`Tổng từ cần xử lý   : ${pending.length}`);
  console.log(`Thành công (upsert) : ${success}`);
  console.log(`Lỗi AI (bỏ qua)     : ${failedGemini}`);
  console.log(`Lỗi DB              : ${failedDb}`);
  console.log(`needs_review = true : ${success}`);
  console.log(`IPA từ dictionary   : ${dictHits}`);
  console.log(`Thời gian           : ${seconds}s`);
}

async function fetchExisting(
  supabase: ReturnType<typeof makeAdminClient>,
  source: Source,
): Promise<Set<string>> {
  const set = new Set<string>();
  const pageSize = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from("words")
      .select("lemma")
      .eq("source", source)
      .range(from, from + pageSize - 1);

    if (error) throw new Error(`Đọc words (${source}) lỗi: ${error.message}`);

    const rows = (data ?? []) as { lemma: string }[];
    for (const row of rows) set.add(String(row.lemma).toLowerCase());
    if (rows.length < pageSize) break;
    from += pageSize;
  }

  return set;
}



async function mapPool<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let cursor = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = cursor++;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

main().catch((error) => {
  console.error("\nLỖI CHẶN:", error instanceof Error ? error.message : error);
  process.exit(1);
});