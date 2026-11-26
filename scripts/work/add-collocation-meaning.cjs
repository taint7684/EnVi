// Add a short Vietnamese gloss (meaning_vi) to every collocation in
// data/word-collocations.json. Batched + resumable. Uses Groq.
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
      if (k && !k.startsWith("#")) env[k] = v;
    }
  }
  return env;
}

const ROOT = path.join(__dirname, "..", "..");
const DATA_PATH = path.join(ROOT, "data", "word-collocations.json");
const env = loadEnv();
const GROQ_KEY = env.GROQ_API_KEY;
if (!GROQ_KEY) { console.error("Missing GROQ_API_KEY"); process.exit(1); }

const BATCH = 30;
const CONCURRENCY = 2;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

async function glossBatch(items) {
  const list = items.map((it) => it.collocation);
  const prompt =
    "Translate each English collocation/phrase in the JSON array into a SHORT Vietnamese gloss " +
    "that captures its meaning (a few words, not a full sentence). " +
    "Return ONLY a JSON array of Vietnamese strings in the SAME order, no extra text.\n" +
    JSON.stringify(list);
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + GROQ_KEY },
    body: JSON.stringify({
      model: MODEL,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error("groq " + res.status + ": " + t.slice(0, 120));
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "";
  const m = content.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("no json array in response");
  const arr = JSON.parse(m[0]);
  if (!Array.isArray(arr) || arr.length !== items.length) {
    throw new Error("length mismatch: got " + (Array.isArray(arr) ? arr.length : "?") + " want " + items.length);
  }
  return arr;
}

function save(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

async function pool(items, size, fn) {
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: size }, () => worker()));
}

(async () => {
  const data = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  const entries = Object.entries(data);
  const todo = entries.filter(([, v]) => !v.meaning_vi);
  console.log(`Total ${entries.length}, need meaning_vi: ${todo.length}`);

  const batches = [];
  for (let i = 0; i < todo.length; i += BATCH) batches.push(todo.slice(i, i + BATCH));
  let done = 0;
  let failed = 0;

  await pool(batches, CONCURRENCY, async (batch) => {
    try {
      const glosses = await glossBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        const [id, val] = batch[j];
        val.meaning_vi = glosses[j];
        data[id] = val;
      }
      done += batch.length;
      save(data);
      console.log(`  ${done}/${todo.length} done`);
    } catch (e) {
      failed += batch.length;
      console.log("  batch failed:", e.message.slice(0, 80));
    }
  });

  save(data);
  const remaining = Object.values(data).filter((v) => !v.meaning_vi).length;
  console.log(`Finished. done=${done} failed=${failed} remaining=${remaining}`);
})().catch((e) => { console.error("FATAL", e); process.exit(1); });