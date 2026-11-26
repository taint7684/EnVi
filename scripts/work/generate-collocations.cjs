// Resumable collocation generator using Groq (openai/gpt-oss-20b).
// Reads data/words.json, appends results to data/word-collocations.jsonl (one JSON per line).
// Skips words already present in the jsonl. Retries with backoff on 429/errors.
//
// Usage: node scripts/work/generate-collocations.cjs [--limit N] [--concurrency N]
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const env = {};
  for (const l of fs.readFileSync(path.join(__dirname, "..", "..", ".env.local"), "utf8").split(/\r?\n/)) {
    const i = l.indexOf("=");
    if (i > 0) {
      const k = l.slice(0, i).trim();
      let v = l.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      env[k] = v;
    }
  }
  return env;
}

const args = process.argv.slice(2);
function argVal(name, def) {
  const i = args.indexOf("--" + name);
  return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : def;
}
const LIMIT = argVal("limit", 0); // 0 = all
const CONCURRENCY = argVal("concurrency", 2);

const ROOT = path.join(__dirname, "..", "..");
const WORDS_PATH = path.join(ROOT, "data", "words.json");
const OUT_PATH = path.join(ROOT, "data", "word-collocations.jsonl");
const PROGRESS_PATH = path.join(__dirname, "gen-progress.json");

const GROQ_MODEL = "openai/gpt-oss-20b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const env = loadEnv();
const GROQ_KEY = env.GROQ_API_KEY;
if (!GROQ_KEY) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

function buildPrompt(w) {
  const ref = w.example_en ? `\nCâu ví dụ gốc (tham khảo nghĩa): ${w.example_en}` : "";
  return `Bạn là chuyên gia từ vựng tiếng Anh, tạo flashcard cho người Việt.

Từ tiếng Anh: ${w.lemma}
Loại từ: ${w.pos || "(không rõ)"}
Nghĩa tiếng Việt ĐANG HỌC: ${w.meaning_vi}${ref}

Hãy tạo 1 collocation (cụm từ) tiếng Anh TỰ NHIÊN, PHỔ BIẾN, ĐÚNG với nghĩa tiếng Việt đang học ở trên (KHÔNG dùng nghĩa khác của từ).
Yêu cầu bắt buộc:
- "collocation": 2-4 từ, là cụm người bản xứ hay dùng, phải chứa từ "${w.lemma}" (hoặc dạng biến đổi của nó).
- "example": đúng 1 câu tiếng Anh dùng NGUYÊN VĂN cụm collocation đó (các từ của collocation xuất hiện liền nhau trong câu, có thể viết thường).
- "example_vi": dịch câu example sang tiếng Việt.

Chỉ trả về JSON, không thêm gì khác:
{"collocation":"...","example":"...","example_vi":"..."}`;
}

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
}

function validate(res, lemma) {
  if (!res || typeof res !== "object") return "no-object";
  const col = (res.collocation || "").trim();
  const ex = (res.example || "").trim();
  const exvi = (res.example_vi || "").trim();
  if (!col) return "no-collocation";
  if (!ex) return "no-example";
  if (!exvi) return "no-example-vi";
  if (col.split(/\s+/).length > 5) return "collocation-too-long";
  const ncol = normalize(col);
  const nex = normalize(ex);
  if (!nex.includes(ncol)) return "example-missing-collocation";
  return null;
}

async function callGroq(prompt) {
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 1500,
      reasoning_effort: "low",
    }),
    signal: AbortSignal.timeout(45000),
  });
  if (res.status === 429) {
    const err = new Error("rate-limited");
    err.status = 429;
    throw err;
  }
  if (!res.ok) {
    const t = await res.text();
    const err = new Error("groq " + res.status + ": " + t.slice(0, 200));
    err.status = res.status;
    throw err;
  }
  const j = await res.json();
  const content = j.choices?.[0]?.message?.content || "";
  return content;
}

function parseJson(content) {
  let c = content.trim();
  // strip code fences
  c = c.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = c.indexOf("{");
  const end = c.lastIndexOf("}");
  if (start >= 0 && end > start) c = c.slice(start, end + 1);
  return JSON.parse(c);
}

function loadDone() {
  if (!fs.existsSync(OUT_PATH)) return new Set();
  const done = new Set();
  for (const line of fs.readFileSync(OUT_PATH, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { done.add(JSON.parse(line).id); } catch {}
  }
  return done;
}

async function genOne(w) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 8; attempt++) {
    try {
      const content = await callGroq(buildPrompt(w));
      const res = parseJson(content);
      const v = validate(res, w.lemma);
      if (v) { lastErr = new Error("validation:" + v); }
      else {
        return {
          id: w.id,
          lemma: w.lemma,
          pos: w.pos || null,
          meaning_vi: w.meaning_vi || null,
          collocation: res.collocation.trim(),
          example_en: res.example.trim(),
          example_vi: res.example_vi.trim(),
        };
      }
    } catch (e) {
      lastErr = e;
      if (e.status === 429) {
        const wait = Math.min(30000, 5000 * attempt) + Math.random() * 1000;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
    }
    await new Promise((r) => setTimeout(r, 800 * attempt));
  }
  throw lastErr || new Error("failed");
}

(async () => {
  const words = JSON.parse(fs.readFileSync(WORDS_PATH, "utf8"));
  const done = loadDone();
  const queue = words.filter((w) => !done.has(w.id));
  const target = LIMIT > 0 ? queue.slice(0, LIMIT) : queue;
  console.log(`Total words: ${words.length}, already done: ${done.size}, to generate: ${target.length}, concurrency: ${CONCURRENCY}`);

  const outStream = fs.createWriteStream(OUT_PATH, { flags: "a" });
  let idx = 0;
  let ok = 0;
  let fail = 0;
  const failures = [];
  const started = Date.now();

  async function worker() {
    while (true) {
      const my = idx++;
      if (my >= target.length) return;
      const w = target[my];
      try {
        const rec = await genOne(w);
        outStream.write(JSON.stringify(rec) + "\n");
        ok++;
      } catch (e) {
        fail++;
        failures.push({ id: w.id, lemma: w.lemma, error: String(e.message || e).slice(0, 120) });
      }
      const processed = ok + fail;
      if (processed % 20 === 0) {
        const rate = (processed / ((Date.now() - started) / 1000)).toFixed(1);
        console.log(`[${processed}/${target.length}] ok=${ok} fail=${fail} rate=${rate}/s`);
        fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ processed, total: target.length, ok, fail, rate: parseFloat(rate), failures: failures.slice(-20) }, null, 2));
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  outStream.end();
  console.log(`DONE. ok=${ok} fail=${fail}. Output: ${OUT_PATH}`);
  if (failures.length) console.log("Failures sample:", JSON.stringify(failures.slice(0, 10), null, 2));
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ processed: ok + fail, total: target.length, ok, fail, rate: 0, failures: failures.slice(-20), done: true }, null, 2));
})();