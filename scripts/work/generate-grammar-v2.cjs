// Generate grammar v2 content: translation, error_correction, verb_conjugation questions + mind maps
// Uses Groq (openai/gpt-oss-20b) in batches. Resumable via output file.
//
// Usage: node scripts/work/generate-grammar-v2.cjs [--limit N] [--concurrency N]
const fs = require("fs");
const path = require("path");

function loadEnv() {
  const env = {};
  for (const l of fs.readFileSync(path.join(__dirname, "..", "..", ".env.local"), "utf8").split(/\r?\n/)) {
    const i = l.indexOf("=");
    if (i > 0) { const k = l.slice(0, i).trim(); let v = l.slice(i + 1).trim(); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); env[k] = v; }
  }
  return env;
}
const env = loadEnv();
const GROQ_KEY = env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "openai/gpt-oss-20b";

const args = process.argv.slice(2);
function argVal(name, def) { const i = args.indexOf("--" + name); return i >= 0 && args[i + 1] ? parseInt(args[i + 1], 10) : def; }
const CONCURRENCY = argVal("concurrency", 2);
const LIMIT = argVal("limit", 0);

const ROOT = path.join(__dirname, "..", "..");
const OUT_PATH = path.join(ROOT, "data", "grammar-v2.jsonl");
const TOPICS_PATH = path.join(ROOT, "data", "grammar-exercises.json");

const topics = JSON.parse(fs.readFileSync(TOPICS_PATH, "utf8")).map((t) => ({
  id: t.topicId, name: t.name, nameVi: t.nameVi,
  sampleMcq: t.mcq[0]?.question, sampleFill: t.fill[0]?.question,
}));

console.log(`Loaded ${topics.length} topics`);

const MIN_GAP = 500;
let globalSlot = 0;
async function waitForSlot() { const now = Date.now(); const wait = Math.max(0, globalSlot - now); globalSlot = Math.max(now, globalSlot) + MIN_GAP; if (wait > 0) await new Promise((r) => setTimeout(r, wait)); }

async function callGroq(prompt) {
  await waitForSlot();
  const res = await fetch(GROQ_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_KEY}` },
    body: JSON.stringify({ model: MODEL, messages: [{ role: "user", content: prompt }], temperature: 0.4, max_tokens: 4000, reasoning_effort: "low" }),
    signal: AbortSignal.timeout(90000),
  });
  if (res.status === 429) { const e = new Error("rate-limited"); e.status = 429; throw e; }
  if (!res.ok) { const t = await res.text(); const e = new Error("groq " + res.status + ": " + t.slice(0, 200)); e.status = res.status; throw e; }
  const j = await res.json();
  return j.choices?.[0]?.message?.content || "";
}

function parseJsonArray(content) {
  let c = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = c.indexOf("["); const end = c.lastIndexOf("]");
  if (start < 0 || end <= start) throw new Error("no-json-array");
  const arr = JSON.parse(c.slice(start, end + 1));
  if (!Array.isArray(arr)) throw new Error("not-array");
  return arr;
}
function parseJsonObject(content) {
  let c = content.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  const start = c.indexOf("{"); const end = c.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no-json-object");
  return JSON.parse(c.slice(start, end + 1));
}

const BATCH = 10;

function buildTranslationPrompt(topic, items) {
  const list = items.map((t, i) => `${i}. "${t.name}" (${t.nameVi})`).join("\n");
  return `Bạn là chuyên gia ngữ pháp tiếng Anh. Với mỗi chủ điểm ngữ pháp dưới đây, tạo ${BATCH} câu bài tập DỊCH VIỆT → ANH.

Chủ điểm: ${topic.name} (${topic.nameVi})

Yêu cầu mỗi câu:
- "vi": câu tiếng Việt cần dịch (dùng trong đời sống, công việc IT/BA, A2-B1)
- "hints": 2-3 gợi ý từ/cụm (VD: "work with: làm việc với", "since March: từ tháng Ba")
- "answer": câu tiếng Anh đúng, dùng cấu trúc ngữ pháp của chủ điểm
- "alternatives": 1-2 cách diễn đạt đúng khác (có thể dùng viết tắt)
- "explanation_vi": giải thích bằng tiếng Việt vì sao dùng cấu trúc đó

Danh sách:
${list}

Chỉ trả về JSON array ${BATCH} phần tử, mỗi phần tử có "vi", "hints" (array), "answer", "alternatives" (array), "explanation_vi". Không thêm gì khác.`;
}

function buildErrorCorrectionPrompt(topic, items) {
  const list = items.map((t, i) => `${i}. "${t.name}" (${t.nameVi})`).join("\n");
  return `Bạn là chuyên gia ngữ pháp tiếng Anh. Với mỗi chủ điểm ngữ pháp dưới đây, tạo ${BATCH} câu bài tập PHÁT HIỆN VÀ SỬA LỖI.

Chủ điểm: ${topic.name} (${topic.nameVi})

Yêu cầu mỗi câu:
- "sentence": câu tiếng Anh CÓ LỖI ngữ pháp thuộc chủ điểm này
- "error_part": đúng từ/cụm sai (ngắn gọn)
- "correct_part": từ/cụm đúng thay thế
- "corrected": cả câu đã sửa đúng
- "explanation_vi": giải thích ngắn gọn vì sao sai và cách sửa

Danh sách:
${list}

Chỉ trả về JSON array ${BATCH} phần tử. Không thêm gì khác.`;
}

function buildVerbConjugationPrompt(topic, items) {
  const list = items.map((t, i) => `${i}. "${t.name}" (${t.nameVi})`).join("\n");
  return `Bạn là chuyên gia ngữ pháp tiếng Anh. Với mỗi chủ điểm dưới đây, tạo ${BATCH} câu bài tập CHIA ĐỘNG TỪ TRONG NGOẶC.

Chủ điểm: ${topic.name} (${topic.nameVi})

Yêu cầu mỗi câu:
- "sentence": câu có ___ (hoặc nhiều ___) và động từ gợi ý trong ngoặc, VD: "If I ___ (be) you, I would study."
- "blanks": array các ô, mỗi ô có "word" (động từ gợi ý) và "answer" (dạng đúng)
- "full": cả câu hoàn chỉnh đúng
- "explanation_vi": giải thích vì sao dùng dạng đó

Danh sách:
${list}

Chỉ trả về JSON array ${BATCH} phần tử. Không thêm gì khác.`;
}

function buildMindMapPrompt(topic) {
  return `Bạn là chuyên gia ngữ pháp tiếng Anh. Tạo MIND MAP cho chủ điểm: ${topic.name} (${topic.nameVi}).

Mỗi mind map có các nhánh:
- "meaning": bản chất và cách dùng (giải thích tiếng Việt dễ hiểu, đi từ tình huống đến quy tắc)
- "when": khi nào nên dùng (2-3 tình huống cụ thể)
- "formula": công thức tách khẳng định, phủ định, câu hỏi (nếu phù hợp), giải thích thành phần
- "examples": 3-4 ví dụ tiếng Anh + dịch tiếng Việt
- "confusions": cặp câu gần nghĩa dễ nhầm, cho thấy ý nghĩa thay đổi thế nào
- "common_errors": 3-4 lỗi người Việt hay mắc (câu sai → câu sửa + lý do ngắn)

Chỉ trả về JSON object. Không thêm gì khác.`;
}

function buildMixedPrompt(items) {
  return `Bạn là chuyên gia ngữ pháp tiếng Anh. Tạo ${BATCH} câu bài tập NGỮ PHÁP TỔNG HỢP cho người Việt A2-B1.

Mỗi câu là một dạng bài khác nhau (trộn lẫn 4 dạng):
- "mcq": câu hỏi trắc nghiệm 4 lựa chọn
- "translation": dịch Việt → Anh
- "error_correction": phát hiện và sửa lỗi
- "verb_conjugation": chia động từ trong ngoặc

Yêu cầu mỗi câu:
- "exercise_type": một trong "mcq", "translation", "error_correction", "verb_conjugation"
- "topic_id": chủ điểm ngữ pháp (chọn từ: conditionals, passive, relative-clauses, modal-verbs, gerunds-infinitives, comparatives, present-perfect-vs-past, future-forms, reported-speech, used-to, articles, prepositions, quantifiers, question-forms, conjunctions, word-order)
- Nội dung câu tùy theo exercise_type (xem cấu trúc bên dưới)
- "explanation_vi": giải thích bằng tiếng Việt

Cấu trúc theo exercise_type:
- mcq: {"question": "...", "options": ["A","B","C","D"], "correct": 0, "explanation_vi": "..."}
- translation: {"vi": "...", "hints": ["..."], "answer": "...", "alternatives": ["..."], "explanation_vi": "..."}
- error_correction: {"sentence": "...", "error_part": "...", "correct_part": "...", "corrected": "...", "explanation_vi": "..."}
- verb_conjugation: {"sentence": "... (give) ...", "blanks": [{"word":"give","answer":"gave"}], "full": "...", "explanation_vi": "..."}

Dùng ngữ cảnh đời sống, công việc IT/BA. Trộn đủ 4 dạng trong mỗi batch.

Chỉ trả về JSON array ${BATCH} phần tử. Không thêm gì khác.`;
}

function loadDone() {
  const done = { translation: new Set(), error_correction: new Set(), verb_conjugation: new Set(), mindmap: new Set() };
  if (!fs.existsSync(OUT_PATH)) return done;
  for (const line of fs.readFileSync(OUT_PATH, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); if (r._type && r._topicId && done[r._type]) done[r._type].add(r._topicId); } catch {}
  }
  return done;
}

async function genWithRetry(prompt, parser) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      const content = await callGroq(prompt);
      return parser(content);
    } catch (e) {
      if (e.status === 429) { await new Promise((r) => setTimeout(r, Math.min(30000, 5000 * attempt) + Math.random() * 1000)); continue; }
    }
    await new Promise((r) => setTimeout(r, 800 * attempt));
  }
  return null;
}

(async () => {
  const done = loadDone();
  const tasks = [];

  for (const topic of topics) {
    // Count how many items already exist per type per topic
    const existing = { translation: 0, error_correction: 0, verb_conjugation: 0 };
    if (fs.existsSync(OUT_PATH)) {
      for (const line of fs.readFileSync(OUT_PATH, "utf8").split(/\r?\n/)) {
        if (!line.trim()) continue;
        try {
          const r = JSON.parse(line);
          if (r.topic_id === topic.id && r.exercise_type && existing[r.exercise_type] !== undefined) {
            existing[r.exercise_type]++;
          }
        } catch {}
      }
    }
    // Need 20 per type per topic; each call generates BATCH (10) items
    for (const type of ["translation", "error_correction", "verb_conjugation"]) {
      const needed = Math.max(0, 20 - existing[type]);
      const batchesNeeded = Math.ceil(needed / BATCH);
      for (let b = 0; b < batchesNeeded; b++) {
        tasks.push({ type, topic, items: Array(BATCH).fill(topic), batchIdx: b });
      }
    }
    if (!done.mindmap.has(topic.id)) tasks.push({ type: "mindmap", topic, items: [] });
  }

  // Mixed practice: 320 questions across all topics and types (20 per topic avg)
  const existingMixed = fs.existsSync(OUT_PATH)
    ? fs.readFileSync(OUT_PATH, "utf8").split(/\r?\n/).filter(l => { try { return JSON.parse(l)._type === "mixed"; } catch { return false; } }).length
    : 0;
  const mixedNeeded = Math.max(0, 320 - existingMixed);
  for (let i = 0; i < Math.ceil(mixedNeeded / BATCH); i++) {
    tasks.push({ type: "mixed", topic: null, items: [], batchIdx: i });
  }

  const target = LIMIT > 0 ? tasks.slice(0, LIMIT) : tasks;
  console.log(`Total tasks: ${target.length}, concurrency: ${CONCURRENCY}`);

  const outStream = fs.createWriteStream(OUT_PATH, { flags: "a" });
  let idx = 0;
  let ok = 0, fail = 0;
  const failures = [];
  const started = Date.now();

  async function worker() {
    while (true) {
      const my = idx++;
      if (my >= target.length) return;
      const task = target[my];
      try {
        let result;
        if (task.type === "mindmap") {
          result = await genWithRetry(buildMindMapPrompt(task.topic), parseJsonObject);
          if (result) {
            outStream.write(JSON.stringify({ _type: "mindmap", _topicId: task.topic.id, data: result }) + "\n");
            ok++;
          } else { fail++; failures.push({ type: task.type, topic: task.topic.id, error: "failed" }); }
        } else if (task.type === "mixed") {
          result = await genWithRetry(buildMixedPrompt(task.items), parseJsonArray);
          if (result) {
            for (let i = 0; i < result.length; i++) {
              const item = { _type: "mixed", ...result[i] };
              outStream.write(JSON.stringify(item) + "\n");
              ok++;
            }
          } else { fail++; failures.push({ type: task.type, error: "failed" }); }
        } else {
          let prompt;
          if (task.type === "translation") prompt = buildTranslationPrompt(task.topic, task.items);
          else if (task.type === "error_correction") prompt = buildErrorCorrectionPrompt(task.topic, task.items);
          else prompt = buildVerbConjugationPrompt(task.topic, task.items);
          result = await genWithRetry(prompt, parseJsonArray);
          if (result) {
            for (let i = 0; i < result.length; i++) {
              const item = { ...result[i], topic_id: task.topic.id, topic_name: task.topic.name, topic_name_vi: task.topic.nameVi, exercise_type: task.type, index: i };
              outStream.write(JSON.stringify(item) + "\n");
              ok++;
            }
          } else { fail++; failures.push({ type: task.type, topic: task.topic.id, error: "failed" }); }
        }
      } catch (e) { fail++; failures.push({ type: task.type, topic: task.topic.id, error: String(e.message).slice(0, 100) }); }
      const processed = ok + fail;
      if (processed % 5 === 0) {
        const rate = (processed / ((Date.now() - started) / 1000)).toFixed(1);
        console.log(`[${processed}/${target.length}] ok=${ok} fail=${fail} rate=${rate}/s`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  outStream.end();
  console.log(`DONE. ok=${ok} fail=${fail}. Output: ${OUT_PATH}`);
  if (failures.length) console.log("Failures:", JSON.stringify(failures, null, 2));
})();