// Batched collocation generator using Groq.
// Sends BATCH_SIZE words per request, expects a JSON array back.
// Appends one JSON line per word to data/word-collocations.jsonl (same format as before).
// Resumable: skips words already in the jsonl.
//
// Usage: node scripts/work/generate-collocations-batch.cjs [--batch N] [--concurrency N] [--limit N]
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
const BATCH_SIZE = argVal("batch", 10);
const CONCURRENCY = argVal("concurrency", 2);
const LIMIT = argVal("limit", 0);

const ROOT = path.join(__dirname, "..", "..");
const WORDS_PATH = path.join(ROOT, "data", "words.json");
const OUT_PATH = path.join(ROOT, "data", "word-collocations.jsonl");
const PROGRESS_PATH = path.join(__dirname, "gen-progress.json");

const GROQ_MODEL = "openai/gpt-oss-20b";
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const env = loadEnv();
const GROQ_KEY = env.GROQ_API_KEY;
if (!GROQ_KEY) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

// Global pacing: ensure request starts are spaced by at least MIN_GAP ms (reduces 429 bursts).
const MIN_GAP = 3000;
let globalSlot = 0;
async function waitForSlot() {
  const now = Date.now();
  const wait = Math.max(0, globalSlot - now);
  globalSlot = Math.max(now, globalSlot) + MIN_GAP;
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
}

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
}

// Collocation tokens must appear in the example as an in-order subsequence.
// Accepts discontinuous collocations ("accuse ... of") and simple inflections ("accuse"/"accused").
function tokensMatch(a, b) {
  if (a === b) return true;
  if (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4)) return true;
  return false;
}
function exampleHasCollocation(example, collocation) {
  const ex = normalize(example).split(" ").filter(Boolean);
  const col = normalize(collocation).split(" ").filter(Boolean);
  if (col.length === 0) return false;
  let ei = 0;
  for (const ct of col) {
    let found = -1;
    for (let j = ei; j < ex.length; j++) { if (tokensMatch(ex[j], ct)) { found = j; break; } }
    if (found < 0) return false;
    ei = found + 1;
  }
  return true;
}

function buildPrompt(batch) {
  const lines = batch.map((w, i) =>
    `${i}. lemma="${w.lemma}" | pos="${w.pos || "?"}" | nghia="${w.meaning_vi || "?"}"`
  ).join("\n");
  return `Bạn là chuyên gia từ vựng tiếng Anh, tạo flashcard cho người Việt.
Với MỖI từ dưới đây, hãy tạo:
- "collocation": 1 cụm từ tiếng Anh TỰ NHIÊN, PHỔ BIẾN (2-4 từ), ĐÚNG với nghĩa tiếng Việt đang học (KHÔNG dùng nghĩa khác), phải chứa từ lemma (hoặc dạng biến đổi của nó).
- "example": đúng 1 câu tiếng Anh. BẮT BUỘC các từ của collocation phải xuất hiện NGUYÊN VĂN, LIỀN NHAU trong câu (viết thường cũng được).
- "example_vi": dịch câu example sang tiếng Việt.

Ví dụ mẫu:
lemma="abandon" | nghia="từ bỏ" -> {"i":0,"collocation":"abandon hope","example":"They refused to abandon hope.","example_vi":"Họ từ chối từ bỏ hy vọng."}

Danh sách từ (${batch.length} từ):
${lines}

Trả về JSON array có ĐÚNG ${batch.length} phần tử, mỗi phần tử có "i" (số thứ tự 0..${batch.length - 1}), "collocation", "example", "example_vi". Chỉ trả về JSON, không thêm gì khác.`;
}

function parseJsonArray(content) {
  let c = content.trim();
  c = c.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = c.indexOf("[");
  const end = c.lastIndexOf("]");
  if (start < 0 || end <= start) throw new Error("no-json-array");
  c = c.slice(start, end + 1);
  const arr = JSON.parse(c);
  if (!Array.isArray(arr)) throw new Error("not-array");
  return arr;
}

async function callGroq(prompt) {
  await waitForSlot();
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
      max_tokens: 4000,
      reasoning_effort: "low",
    }),
    signal: AbortSignal.timeout(90000),
  });
  if (res.status === 429) { const e = new Error("rate-limited"); e.status = 429; throw e; }
  if (!res.ok) { const t = await res.text(); const e = new Error("groq " + res.status + ": " + t.slice(0, 200)); e.status = res.status; throw e; }
  const j = await res.json();
  return j.choices?.[0]?.message?.content || "";
}

function validateItem(it, w) {
  const col = (it.collocation || "").trim();
  const ex = (it.example || "").trim();
  const exvi = (it.example_vi || "").trim();
  if (!col) return "no-collocation";
  if (!ex) return "no-example";
  if (!exvi) return "no-example-vi";
  if (col.split(/\s+/).length > 5) return "collocation-too-long";
  if (!exampleHasCollocation(ex, col)) return "example-missing-collocation";
  return null;
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

async function genBatch(batch) {
  let lastErr = null;
  for (let attempt = 1; attempt <= 10; attempt++) {
    try {
      const content = await callGroq(buildPrompt(batch));
      const arr = parseJsonArray(content);
      const byIdx = {};
      for (const it of arr) {
        if (it && Number.isInteger(it.i) && it.i >= 0 && it.i < batch.length) byIdx[it.i] = it;
      }
      const out = [];
      const failed = [];
      for (let i = 0; i < batch.length; i++) {
        const w = batch[i];
        const it = byIdx[i];
        if (!it) { failed.push({ id: w.id, lemma: w.lemma, error: "missing-item" }); continue; }
        const v = validateItem(it, w);
        if (v) { failed.push({ id: w.id, lemma: w.lemma, error: "validation:" + v }); continue; }
        out.push({
          id: w.id, lemma: w.lemma, pos: w.pos || null, meaning_vi: w.meaning_vi || null,
          collocation: it.collocation.trim(), example_en: it.example.trim(), example_vi: it.example_vi.trim(),
        });
      }
      return { ok: out, failed };
    } catch (e) {
      lastErr = e;
      if (e.status === 429) { await new Promise((r) => setTimeout(r, Math.min(30000, 5000 * attempt) + Math.random() * 1000)); continue; }
    }
    await new Promise((r) => setTimeout(r, 700 * attempt));
  }
  // Final failure: mark all as failed
  return { ok: [], failed: batch.map((w) => ({ id: w.id, lemma: w.lemma, error: String(lastErr && lastErr.message || "failed").slice(0, 120) })) };
}

(async () => {
  const words = JSON.parse(fs.readFileSync(WORDS_PATH, "utf8"));
  const done = loadDone();
  const queue = words.filter((w) => !done.has(w.id));
  const target = LIMIT > 0 ? queue.slice(0, LIMIT * BATCH_SIZE) : queue;

  const batches = [];
  for (let i = 0; i < target.length; i += BATCH_SIZE) batches.push(target.slice(i, i + BATCH_SIZE));

  console.log(`Total: ${words.length}, done: ${done.size}, to generate: ${target.length}, batches: ${batches.length}, batch=${BATCH_SIZE}, concurrency=${CONCURRENCY}`);

  const outStream = fs.createWriteStream(OUT_PATH, { flags: "a" });
  let bIdx = 0;
  let ok = 0;
  let fail = 0;
  const failures = [];
  const started = Date.now();

  async function worker() {
    while (true) {
      const my = bIdx++;
      if (my >= batches.length) return;
      const batch = batches[my];
      const { ok: oks, failed } = await genBatch(batch);
      for (const r of oks) outStream.write(JSON.stringify(r) + "\n");
      ok += oks.length;
      fail += failed.length;
      if (failed.length) failures.push(...failed);
      const processed = ok + fail;
      const doneBatches = my + 1;
      if (doneBatches % 10 === 0) {
        const rate = (processed / ((Date.now() - started) / 1000)).toFixed(2);
        console.log(`[batch ${doneBatches}/${batches.length}] words=${processed}/${target.length} ok=${ok} fail=${fail} rate=${rate}/s`);
        fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ processed, total: target.length, ok, fail, rate: parseFloat(rate), failures: failures.slice(-30) }, null, 2));
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  outStream.end();
  console.log(`DONE. ok=${ok} fail=${fail}. Output: ${OUT_PATH}`);
  if (failures.length) console.log("Failures sample:", JSON.stringify(failures.slice(0, 15), null, 2));
  fs.writeFileSync(PROGRESS_PATH, JSON.stringify({ processed: ok + fail, total: target.length, ok, fail, rate: 0, failures: failures.slice(-30), done: true }, null, 2));
})();