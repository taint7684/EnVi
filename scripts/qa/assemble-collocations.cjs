// Assemble data/word-collocations.jsonl -> data/word-collocations.json (object keyed by word id)
// and validate coverage against data/words.json.
// Reports: total words, complete entries, missing list.
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const WORDS_PATH = path.join(ROOT, "data", "words.json");
const JSONL_PATH = path.join(ROOT, "data", "word-collocations.jsonl");
const OUT_PATH = path.join(ROOT, "data", "word-collocations.json");

const words = JSON.parse(fs.readFileSync(WORDS_PATH, "utf8"));

const byId = {};
if (fs.existsSync(JSONL_PATH)) {
  for (const line of fs.readFileSync(JSONL_PATH, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      byId[r.id] = r;
    } catch {}
  }
}

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
}

// Collocation tokens must appear in the example as an in-order subsequence (accepts "accuse ... of").
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

const out = {};
const complete = [];
const missing = [];
const invalid = [];

for (const w of words) {
  const r = byId[w.id];
  if (!r) {
    missing.push({ id: w.id, lemma: w.lemma });
    continue;
  }
  const col = (r.collocation || "").trim();
  const ex = (r.example_en || "").trim();
  const exvi = (r.example_vi || "").trim();
  let reason = null;
  if (!col) reason = "no-collocation";
  else if (!ex) reason = "no-example";
  else if (!exvi) reason = "no-example-vi";
  else if (!exampleHasCollocation(ex, col)) reason = "example-missing-collocation";
  if (reason) {
    invalid.push({ id: w.id, lemma: w.lemma, reason, collocation: col });
    continue;
  }
  out[w.id] = { collocation: col, example_en: ex, example_vi: exvi };
  complete.push(w.id);
}

fs.writeFileSync(OUT_PATH, JSON.stringify(out));

const total = words.length;
const okCount = complete.length;
const missingCount = missing.length;
const invalidCount = invalid.length;

console.log("=== Collocation coverage ===");
console.log(`Total words:          ${total}`);
console.log(`Complete (all fields): ${okCount}`);
console.log(`Missing (no entry):    ${missingCount}`);
console.log(`Invalid (bad content): ${invalidCount}`);
console.log(`Coverage: ${((okCount / total) * 100).toFixed(2)}%`);
if (missing.length) {
  console.log("\n-- Missing (no entry) --");
  for (const m of missing.slice(0, 50)) console.log(`  ${m.lemma}`);
  if (missing.length > 50) console.log(`  ... and ${missing.length - 50} more`);
}
if (invalid.length) {
  console.log("\n-- Invalid --");
  for (const m of invalid.slice(0, 50)) console.log(`  ${m.lemma} [${m.reason}]`);
  if (invalid.length > 50) console.log(`  ... and ${invalid.length - 50} more`);
}

// Write missing/invalid lists to files for resumable re-runs
fs.writeFileSync(path.join(__dirname, "missing-ids.json"), JSON.stringify(missing, null, 2));
fs.writeFileSync(path.join(__dirname, "invalid-ids.json"), JSON.stringify(invalid, null, 2));

process.exit(missingCount === 0 && invalidCount === 0 ? 0 : 2);