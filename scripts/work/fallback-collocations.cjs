// Fallback collocation generator: extracts a 2-word collocation from the existing example_en.
// For words that don't have a Groq-generated collocation yet.
// This ensures 100% coverage without needing any API calls.
//
// Usage: node scripts/work/fallback-collocations.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const WORDS_PATH = path.join(ROOT, "data", "words.json");
const JSONL_PATH = path.join(ROOT, "data", "word-collocations.jsonl");

const words = JSON.parse(fs.readFileSync(WORDS_PATH, "utf8"));

// Load existing done IDs
const done = new Set();
if (fs.existsSync(JSONL_PATH)) {
  for (const line of fs.readFileSync(JSONL_PATH, "utf8").split(/\r?\n/)) {
    if (!line.trim()) continue;
    try { done.add(JSON.parse(line).id); } catch {}
  }
}

// Common English stop words to avoid as collocations
const STOP_WORDS = new Set([
  "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "must", "can", "shall", "to", "of", "in",
  "on", "at", "by", "for", "with", "about", "as", "into", "through",
  "during", "before", "after", "above", "below", "from", "up", "down",
  "out", "off", "over", "under", "again", "then", "once", "here", "there",
  "when", "where", "why", "how", "all", "any", "both", "each", "few",
  "more", "most", "other", "some", "such", "no", "nor", "not", "only",
  "own", "same", "so", "than", "too", "very", "just", "but", "and",
  "or", "if", "because", "while", "although", "though", "unless",
  "i", "you", "he", "she", "it", "we", "they", "me", "him", "her",
  "us", "them", "my", "your", "his", "its", "our", "their", "this",
  "that", "these", "those", "am", "s", "t", "ll", "re", "ve", "m", "d",
]);

function normalize(s) {
  return (s || "").toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
}

function lemmaMatches(token, lemma) {
  const t = token.toLowerCase();
  const l = lemma.toLowerCase();
  if (t === l) return true;
  // Simple stemming: check if token starts with lemma or lemma starts with token
  if (t.length >= 4 && l.length >= 4 && t.slice(0, 4) === l.slice(0, 4)) return true;
  // Handle -s, -ed, -ing
  if (t === l + "s" || t === l + "es" || t === l + "ed" || t === l + "d") return true;
  if (t === l + "ing" || t === l + "ing") return true;
  if (l.endsWith("e") && (t === l.slice(0, -1) + "ing" || t === l.slice(0, -1) + "ed")) return true;
  return false;
}

function extractCollocation(word) {
  const lemma = word.lemma.toLowerCase();
  const example = word.example_en || "";
  if (!example) return null;

  const tokens = normalize(example).split(" ").filter(Boolean);
  if (tokens.length < 2) return null;

  // Find the lemma token in the example
  let lemmaIdx = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (lemmaMatches(tokens[i], word.lemma)) { lemmaIdx = i; break; }
  }

  if (lemmaIdx < 0) {
    // Lemma not found in example — use first two non-stop words
    const candidates = tokens.filter(t => !STOP_WORDS.has(t) && t.length > 2);
    if (candidates.length >= 2) return candidates[0] + " " + candidates[1];
    return null;
  }

  // Try to find a content word adjacent to the lemma
  const adjacent = [];
  if (lemmaIdx > 0) adjacent.push(lemmaIdx - 1);
  if (lemmaIdx < tokens.length - 1) adjacent.push(lemmaIdx + 1);

  // Prefer the adjacent word that's not a stop word
  for (const idx of adjacent) {
    const t = tokens[idx];
    if (!STOP_WORDS.has(t) && t.length > 2 && !lemmaMatches(t, word.lemma)) {
      // Order: put lemma first if it's a verb, otherwise content word first
      if (word.pos && word.pos.toLowerCase().includes("verb")) {
        return word.lemma + " " + t;
      }
      return t + " " + word.lemma;
    }
  }

  // Fallback: lemma + next word (even if stop word)
  if (lemmaIdx < tokens.length - 1) {
    return word.lemma + " " + tokens[lemmaIdx + 1];
  }
  if (lemmaIdx > 0) {
    return tokens[lemmaIdx - 1] + " " + word.lemma;
  }

  return word.lemma;
}

function exampleHasCollocation(example, collocation) {
  const ex = normalize(example).split(" ").filter(Boolean);
  const col = normalize(collocation).split(" ").filter(Boolean);
  if (col.length === 0) return false;
  let ei = 0;
  for (const ct of col) {
    let found = -1;
    for (let j = ei; j < ex.length; j++) {
      const a = ex[j], b = ct;
      if (a === b || (a.length >= 4 && b.length >= 4 && a.slice(0, 4) === b.slice(0, 4))) { found = j; break; }
    }
    if (found < 0) return false;
    ei = found + 1;
  }
  return true;
}

const outStream = fs.createWriteStream(JSONL_PATH, { flags: "a" });
let generated = 0;
let skipped = 0;
let failed = 0;

for (const w of words) {
  if (done.has(w.id)) { skipped++; continue; }

  const collocation = extractCollocation(w);
  if (!collocation) { failed++; continue; }

  // Use the existing example as the collocation example
  const exampleEn = w.example_en || "";
  const exampleVi = w.example_vi || "";

  // Verify collocation is in example
  if (exampleEn && !exampleHasCollocation(exampleEn, collocation)) {
    // Try just the lemma as collocation
    const fallback = w.lemma;
    if (exampleHasCollocation(exampleEn, fallback)) {
      outStream.write(JSON.stringify({
        id: w.id, lemma: w.lemma, pos: w.pos || null, meaning_vi: w.meaning_vi || null,
        collocation: fallback, example_en: exampleEn, example_vi: exampleVi,
      }) + "\n");
      generated++;
    } else {
      failed++;
    }
    continue;
  }

  outStream.write(JSON.stringify({
    id: w.id, lemma: w.lemma, pos: w.pos || null, meaning_vi: w.meaning_vi || null,
    collocation: collocation, example_en: exampleEn, example_vi: exampleVi,
  }) + "\n");
  generated++;
}

outStream.end();
console.log(`Fallback collocation generation complete:`);
console.log(`  Generated: ${generated}`);
console.log(`  Skipped (already done): ${skipped}`);
console.log(`  Failed: ${failed}`);
console.log(`  Total: ${words.length}`);