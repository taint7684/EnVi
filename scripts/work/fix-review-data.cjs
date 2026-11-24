// Post-review data fixes:
// 1. grammar-mixed.json: fix "studyed" -> "studied" (and "studys" error token stays as the error).
// 2. grammar-v2.jsonl: clean mindmap answer-explanation pollution ("→ ... là đáp án đúng")
//    from meaning/when/formula/examples, without touching question lines.
//
// Usage: node scripts/work/fix-review-data.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");

// ---------- 1. grammar-mixed.json ----------
const MIXED_PATH = path.join(ROOT, "data", "grammar-mixed.json");
const MIXED_BACKUP = path.join(ROOT, "data", "grammar-mixed.review-backup.json");
const mixed = JSON.parse(fs.readFileSync(MIXED_PATH, "utf8"));
if (!fs.existsSync(MIXED_BACKUP)) fs.writeFileSync(MIXED_BACKUP, JSON.stringify(mixed, null, 2));
let mixedFixed = 0;
for (const q of mixed) {
  if (typeof q.correct_part === "string" && q.correct_part.includes("studyed")) {
    q.correct_part = q.correct_part.replace(/studyed/g, "studied");
    mixedFixed++;
  }
  if (typeof q.corrected === "string" && q.corrected.includes("studyed")) {
    q.corrected = q.corrected.replace(/studyed/g, "studied");
    mixedFixed++;
  }
}
fs.writeFileSync(MIXED_PATH, JSON.stringify(mixed, null, 2) + "\n");

// ---------- 2. grammar-v2.jsonl mindmap cleanup ----------
const V2_PATH = path.join(ROOT, "data", "grammar-v2.jsonl");
const V2_BACKUP = path.join(ROOT, "data", "grammar-v2.review-backup.jsonl");
const raw = fs.readFileSync(V2_PATH, "utf8");
if (!fs.existsSync(V2_BACKUP)) fs.writeFileSync(V2_BACKUP, raw);

const stripAnswer = (s) => {
  if (typeof s !== "string") return s;
  const i = s.indexOf(" → ");
  return i >= 0 ? s.slice(0, i) : s;
};
const stripExample = (s) => {
  if (typeof s !== "string") return s;
  const i = s.indexOf(" — ");
  return i >= 0 ? s.slice(0, i) : s;
};

const lines = raw.split("\n");
let mindmapsCleaned = 0;
const out = lines.map((line) => {
  const trimmed = line.trim();
  if (!trimmed) return line;
  let obj;
  try {
    obj = JSON.parse(trimmed);
  } catch {
    return line; // leave untouched
  }
  if (obj._type !== "mindmap" || !obj.data) return line;
  const d = obj.data;
  d.meaning = stripAnswer(d.meaning);
  if (typeof d.when === "string") {
    let w = stripAnswer(d.when);
    const j = w.indexOf(" | Tình huống");
    if (j >= 0) w = w.slice(0, j);
    d.when = w;
  }
  if (Array.isArray(d.examples)) d.examples = d.examples.map(stripExample);
  if (d.formula && typeof d.formula === "object" && !Array.isArray(d.formula)) {
    const f = {};
    for (const [k, v] of Object.entries(d.formula)) {
      if (k === "Lời giải") continue;
      f[k] = stripAnswer(v);
    }
    d.formula = f;
  } else {
    d.formula = stripAnswer(d.formula);
  }
  mindmapsCleaned++;
  return JSON.stringify(obj);
});

fs.writeFileSync(V2_PATH, out.join("\n"));

// ---------- report ----------
console.log(`grammar-mixed fixed fields: ${mixedFixed}`);
console.log(`mindmaps cleaned: ${mindmapsCleaned}`);
// sanity: show one cleaned mindmap
const sample = JSON.parse(out.find((l) => l.trim().startsWith('{"_type":"mindmap"')) || "{}");
console.log("sample meaning:", JSON.stringify((sample.data && sample.data.meaning) || "").slice(0, 180));
console.log("sample when:", JSON.stringify((sample.data && sample.data.when) || "").slice(0, 120));