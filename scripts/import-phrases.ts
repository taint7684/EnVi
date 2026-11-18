import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadEnv, requireEnv } from "./lib/env";
import { makeAdminClient } from "./lib/supabase";

type PhraseRow = {
  vi: string;
  en: string;
  topic: string;
  difficulty: string;
};

const PHRASES_FILE = "data/phrases.txt";
const PHRASES_ADVANCED_FILE = "data/phrases-advanced.txt";

const SAMPLE_PHRASES: PhraseRow[] = [
  { vi: "Lái xe cẩn thận.", en: "Be careful driving.", topic: "general", difficulty: "A2" },
  { vi: "Hãy cẩn thận.", en: "Be careful.", topic: "general", difficulty: "A1" },
  { vi: "Bạn có thể dịch cho tôi cái này được không?", en: "Can you translate this for me?", topic: "general", difficulty: "B1" },
  { vi: "Đừng lo.", en: "Don't worry.", topic: "general", difficulty: "A1" },
  { vi: "Mọi người biết điều đó.", en: "Everyone knows it.", topic: "general", difficulty: "A2" },
  { vi: "Mọi thứ đã sẵn sàng.", en: "Everything is ready.", topic: "general", difficulty: "A2" },
  { vi: "Xuất sắc.", en: "Excellent.", topic: "general", difficulty: "A1" },
  { vi: "Ý kiến hay.", en: "Good idea.", topic: "general", difficulty: "A2" },
  { vi: "Giúp tôi!", en: "Help!", topic: "general", difficulty: "A1" },
  { vi: "Anh ta đang tới.", en: "He's coming soon.", topic: "general", difficulty: "A2" },
  { vi: "Bạn khỏe không?", en: "How are you?", topic: "greetings", difficulty: "A1" },
  { vi: "Nhanh lên!", en: "Hurry!", topic: "general", difficulty: "A1" },
  { vi: "Tôi đã ăn rồi.", en: "I ate already.", topic: "food", difficulty: "A2" },
  { vi: "Tôi không hiểu.", en: "I don't understand.", topic: "general", difficulty: "A1" },
  { vi: "Tôi không muốn làm phiền bạn.", en: "I don't want to bother you.", topic: "general", difficulty: "B1" },
  { vi: "Tôi cảm thấy khỏe.", en: "I feel good.", topic: "general", difficulty: "A2" },
  { vi: "Tôi yêu bạn.", en: "I love you.", topic: "general", difficulty: "A1" },
  { vi: "Tôi sẽ gọi bạn khi tôi ra đi.", en: "I'll call you when I leave.", topic: "general", difficulty: "B1" },
  { vi: "Tôi sẽ trả.", en: "I'll pay.", topic: "shopping", difficulty: "A2" },
  { vi: "Tôi là một người Mỹ.", en: "I'm an American.", topic: "general", difficulty: "A1" },
];

function parsePhrases(raw: string): PhraseRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const phrases: PhraseRow[] = [];
  for (let i = 0; i + 1 < lines.length; i += 2) {
    const vi = lines[i];
    const en = lines[i + 1];
    if (!vi || !en) continue;

    // Skip header/footer lines
    const skipPatterns = [
      "1000 CỤM TỪ THÔNG DỤNG",
      "TÀI LIỆU SƯU TẦM",
      "PHAN NGỌC LỢI",
      "MỤC LỤC",
      "TRANG",
    ];
    if (skipPatterns.some((p) => vi.includes(p))) continue;
    if (skipPatterns.some((p) => en.includes(p))) continue;

    // Detect topic from Roman numeral sections (I., II., etc.)
    const topicMatch = vi.match(/^(I{1,3}|IV|V|VI{0,3}|IX|X)\.\s+(.+)/);
    let topic = "general";
    if (topicMatch) {
      topic = topicMatch[2].trim();
    }

    phrases.push({ vi, en, topic, difficulty: "A2" });
  }

  return phrases.length > 0 ? phrases : SAMPLE_PHRASES;
}

const DIFFICULTY_MARKER = /^\[(A1|A2|B1|B2|C1)\]$/i;

function parseAdvancedPhrases(raw: string): PhraseRow[] {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const phrases: PhraseRow[] = [];
  let difficulty = "A2";
  let pending: string[] = [];

  const flush = () => {
    if (pending.length === 2) {
      const [vi, en] = pending;
      phrases.push({ vi, en, topic: "advanced", difficulty });
    }
    pending = [];
  };

  for (const line of lines) {
    const marker = line.match(DIFFICULTY_MARKER);
    if (marker) {
      flush();
      difficulty = marker[1].toUpperCase();
      continue;
    }
    pending.push(line);
    if (pending.length === 2) flush();
  }
  flush();

  return phrases;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// So cau moi batch (giam so request, tranh spam API).
const BATCH_SIZE = 50;
// Thoi gian cho toi da cho moi lan goi Supabase (ms).
const REQUEST_TIMEOUT_MS = 10_000;

// Boc mot promise voi timeout: neu qua han thi reject de khong treo mai.
function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  label: string,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Qua ${ms / 1000}s ma ${label} khong phan hoi`));
    }, ms);
    Promise.resolve(promise).then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

async function main(): Promise<number> {
  const opts = {
    dryRun: process.argv.includes("--dry-run"),
    limit: Number(process.argv[process.argv.indexOf("--limit") + 1]) || null,
  };

  loadEnv();
  console.log("=== EnVi — import 1000 Cụm từ thông dụng ===");
  console.log(`chế độ: ${opts.dryRun ? "DRY-RUN" : "THẬT"}`);

  let phrases: PhraseRow[] = SAMPLE_PHRASES;
  let sourceNote = "dữ liệu mẫu (20 câu)";

  if (requireEnv("NEXT_PUBLIC_SUPABASE_URL")) {
    try {
      const raw = readFileSync(resolve(process.cwd(), PHRASES_FILE), "utf8");
      const parsed = parsePhrases(raw);
      if (parsed.length > 0) {
        phrases = parsed;
        sourceNote = `file ${PHRASES_FILE} (${phrases.length} câu)`;
      }
    } catch {
      console.log(`Không tìm thấy ${PHRASES_FILE}, dùng dữ liệu mẫu.`);
    }

    try {
      const advRaw = readFileSync(
        resolve(process.cwd(), PHRASES_ADVANCED_FILE),
        "utf8",
      );
      const advanced = parseAdvancedPhrases(advRaw);
      if (advanced.length > 0) {
        phrases = [...phrases, ...advanced];
        sourceNote += ` + ${PHRASES_ADVANCED_FILE} (${advanced.length} câu B1/B2)`;
      }
    } catch {
      console.log(`Không tìm thấy ${PHRASES_ADVANCED_FILE}, bỏ qua.`);
    }
  }

  const limited = opts.limit ? phrases.slice(0, opts.limit) : phrases;
  console.log(`Nguồn: ${sourceNote}`);
  console.log(`Sẽ xử lý: ${limited.length} câu${opts.limit ? ` (--limit ${opts.limit})` : ""}`);

  console.log("\n-- Preview 5 câu đầu --");
  for (const p of limited.slice(0, 5)) {
    console.log(`  VI: ${p.vi}`);
    console.log(`  EN: ${p.en}`);
    console.log(`  topic: ${p.topic}, difficulty: ${p.difficulty}`);
    console.log("");
  }

  if (opts.dryRun) {
    console.log("DRY-RUN xong. Không ghi DB.");
    return 0;
  }

  // Tao client (co the nem loi ro rang neu thieu env/URL sai).
  let supabase: ReturnType<typeof makeAdminClient>;
  try {
    supabase = makeAdminClient();
  } catch (error) {
    console.error("Lỗi khi khởi tạo Supabase client:", error);
    return 1;
  }

  // Preflight: kiem tra ket noi + bang ton tai (co timeout).
  console.log("--- Kiểm tra kết nối tới bảng phrases ---");
  let preflightError: string | null = null;
  try {
    const preflight = await withTimeout(
      supabase.from("phrases").select("id").limit(1),
      REQUEST_TIMEOUT_MS,
      "preflight",
    );
    if (preflight.error) preflightError = preflight.error.message;
  } catch (error) {
    console.error(
      "Lỗi khi kiểm tra kết nối:",
      error instanceof Error ? error.message : error,
    );
    return 1;
  }
  if (preflightError) {
    console.error(`Không truy cập được bảng phrases: ${preflightError}`);
    console.error("Kiểm tra: (1) project Supabase có đang chạy? (2) đã chạy db/migrations/0005_phrases.sql? (3) service_role key đúng?");
    return 1;
  }
  console.log("✓ Kết nối OK, bảng phrases truy cập được.\n");

  let success = 0;
  let failed = 0;
  const totalBatches = Math.ceil(limited.length / BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const chunk = limited.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    const batchNo = b + 1;
    console.log(`--- Bắt đầu up batch ${batchNo}/${totalBatches} (${chunk.length} câu) ---`);

    const rows = chunk.map((p) => ({
      vi_text: p.vi,
      en_text: p.en,
      topic: p.topic,
      difficulty: p.difficulty,
    }));

    try {
      const res = await withTimeout(
        supabase
          .from("phrases")
          .upsert(rows, { onConflict: "vi_text,en_text" }),
        REQUEST_TIMEOUT_MS,
        `batch ${batchNo}`,
      );

      if (res.error) {
        failed += chunk.length;
        console.error(`Lỗi khi up batch ${batchNo}:`, res.error.message);
      } else {
        success += chunk.length;
        console.log(`✓ batch ${batchNo}/${totalBatches} xong (${chunk.length} câu)`);
      }
    } catch (error) {
      failed += chunk.length;
      console.error(`Lỗi khi up batch ${batchNo}:`, error);
    }

    await sleep(50);
  }

  console.log(`\n===== KẾT QUẢ =====`);
  console.log(`Thành công: ${success}`);
  console.log(`Thất bại: ${failed}`);
  return failed > 0 ? 1 : 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error) => {
    console.error("LỖI CHẶN:", error instanceof Error ? error.message : error);
    process.exit(1);
  });
