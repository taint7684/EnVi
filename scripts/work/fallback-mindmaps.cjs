// Fallback mindmap generator: creates mindmap entries from existing grammar-exercises.json data.
// Uses the topic name, nameVi, MCQ explanations, and fill explanations to build mindmap branches.
//
// Usage: node scripts/work/fallback-mindmaps.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const EXERCISES_PATH = path.join(ROOT, "data", "grammar-exercises.json");
const OUT_PATH = path.join(ROOT, "data", "grammar-v2.jsonl");

const exercises = JSON.parse(fs.readFileSync(EXERCISES_PATH, "utf8"));

// Load existing mindmap topics
const doneMindmaps = new Set();
if (fs.existsSync(OUT_PATH)) {
  for (const line of fs.readFileSync(OUT_PATH, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { const r = JSON.parse(line); if (r._type === "mindmap") doneMindmaps.add(r._topicId); } catch {}
  }
}

const outStream = fs.createWriteStream(OUT_PATH, { flags: "a" });
let generated = 0;

for (const topic of exercises) {
  const topicId = topic.topicId;
  if (doneMindmaps.has(topicId)) continue;

  const name = topic.name || topicId;
  const nameVi = topic.nameVi || topicId;
  const mcq = topic.mcq || [];
  const fill = topic.fill || [];

  // Build mindmap from existing data
  const meaning = `Chủ điểm ${name} (${nameVi}) — cấu trúc ngữ pháp tiếng Anh. ${mcq[0]?.explanation_vi || ""}`;

  const when = fill.slice(0, 2).map((f, i) =>
    `Tình huống ${i + 1}: ${f.speak || f.explanation_vi || f.question || ""}`
  ).join(" | ");

  const formula = {
    "Khẳng định": fill[0]?.question?.replace(/___/g, fill[0]?.answer || "...") || "...",
    "Lời giải": fill[0]?.explanation_vi || "...",
  };

  const examples = mcq.slice(0, 3).map((m) =>
    `${m.question?.replace(/___/g, m.options?.[m.answer ?? m.correct] || "...") || "..."} — ${m.explanation_vi || ""}`
  );

  const confusions = mcq.slice(0, 2).map((m) =>
    `Nếu dùng "${m.options?.[0] || "A"}" thì sai vì ${m.vn_trap || m.explanation_vi || "..."}`
  );

  const commonErrors = mcq.slice(0, 3).map((m) =>
    `Sai: ${m.question?.replace(/___/g, m.options?.[(m.answer ?? m.correct) + 1] || "...") || "..."} → Đúng: ${m.question?.replace(/___/g, m.options?.[m.answer ?? m.correct] || "...") || "..."} (${m.vn_trap || m.explanation_vi || ""})`
  );

  const mindmap = {
    _type: "mindmap",
    _topicId: topicId,
    data: {
      meaning: meaning,
      when: when,
      formula: formula,
      examples: examples,
      confusions: confusions,
      common_errors: commonErrors,
    },
  };

  outStream.write(JSON.stringify(mindmap) + "\n");
  generated++;
}

outStream.end();
console.log(`Fallback mindmap generation complete:`);
console.log(`  Generated: ${generated} mindmaps`);
console.log(`  Output: ${OUT_PATH}`);