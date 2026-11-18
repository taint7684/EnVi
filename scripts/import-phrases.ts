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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main(): Promise<void> {
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
    return;
  }

  const supabase = makeAdminClient();

  const preflight = await supabase.from("phrases").select("id").limit(1);
  if (preflight.error) {
    console.error(`Không truy cập được bảng phrases: ${preflight.error.message}`);
    console.error("Chạy db/migrations/0005_phrases.sql trước nhé.");
    process.exit(1);
  }

  let success = 0;
  let failed = 0;

  for (const phrase of limited) {
    const { error } = await supabase.from("phrases").upsert(
      {
        vi_text: phrase.vi,
        en_text: phrase.en,
        topic: phrase.topic,
        difficulty: phrase.difficulty,
      },
      { onConflict: "vi_text,en_text" },
    );

    if (error) {
      failed++;
      console.error(`Lỗi DB: ${error.message} (${phrase.vi})`);
    } else {
      success++;
    }
    await sleep(50);
  }

  console.log(`\n===== KẾT QUẢ =====`);
  console.log(`Thành công: ${success}`);
  console.log(`Thất bại: ${failed}`);
}

main().catch((error) => {
  console.error("LỖI CHẶN:", error instanceof Error ? error.message : error);
  process.exit(1);
});
