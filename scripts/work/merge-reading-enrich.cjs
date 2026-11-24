// Merge reading-enrich-1..4.json into data/reading-passages.json (B1/B2 only).
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const PASSAGES = path.join(ROOT, "data", "reading-passages.json");

const raw = JSON.parse(fs.readFileSync(PASSAGES, "utf8"));
const arr = Array.isArray(raw) ? raw : raw.passages;

const enrich = [];
for (const i of [1, 2, 3, 4]) {
  const f = path.join(ROOT, "data", `reading-enrich-${i}.json`);
  const part = JSON.parse(fs.readFileSync(f, "utf8"));
  enrich.push(...part);
}
const map = new Map(enrich.map((e) => [e.id, e]));
console.log("Enrichment entries:", enrich.length, "unique:", map.size);

let applied = 0;
let problems = 0;
for (const p of arr) {
  const e = map.get(p.id);
  if (!e) continue;
  p.translation = e.translation;
  p.vocabulary = e.vocabulary;
  p.exercises = e.exercises;
  applied++;
}

// Validate: every B1/B2 must now have translation + vocab + 3 exercises.
for (const p of arr) {
  const lvl = p.level || p.cefr;
  if (lvl !== "B1" && lvl !== "B2") continue;
  const okTr = p.translation && p.translation.length > 40;
  const okVoc = (p.vocabulary || []).length >= 4;
  const okEx = (p.exercises || []).length === 3;
  if (!okTr || !okVoc || !okEx) {
    problems++;
    console.log(`  STILL MISSING ${p.id}: tr=${!!okTr} voc=${(p.vocabulary||[]).length} ex=${(p.exercises||[]).length}`);
  }
}

// Backup then write.
fs.copyFileSync(PASSAGES, PASSAGES.replace(/\.json$/, ".pre-enrich.json"));
fs.writeFileSync(PASSAGES, JSON.stringify(raw, null, 2));
console.log(`Applied ${applied}. Remaining B1/B2 problems: ${problems}`);

// Final coverage report.
const byLvl = {};
for (const p of arr) {
  const lvl = p.level || p.cefr;
  byLvl[lvl] = byLvl[lvl] || { total: 0, tr: 0, voc: 0, ex: 0 };
  byLvl[lvl].total++;
  if (p.translation) byLvl[lvl].tr++;
  if ((p.vocabulary || []).length) byLvl[lvl].voc++;
  if ((p.exercises || []).length) byLvl[lvl].ex++;
}
console.log("Coverage:", JSON.stringify(byLvl, null, 2));