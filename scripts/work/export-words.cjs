// Export words from production backup JSON into data/words.json (committed, reproducible source)
const fs = require("fs");
const path = require("path");

const backupPath = path.join(__dirname, "..", "_backup_production_full_2026-11-23T06-07-56-627Z.json");
const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
const words = backup.tables.words;

// Keep only fields the app/content pipeline needs
const out = words.map((w) => ({
  id: w.id,
  lemma: w.lemma,
  ipa: w.ipa,
  pos: w.pos,
  meaning_vi: w.meaning_vi,
  example_en: w.example_en,
  example_vi: w.example_vi,
  audio_url: w.audio_url,
  cefr_level: w.cefr_level,
  frequency_rank: w.frequency_rank,
  source: w.source,
}));

const outPath = path.join(__dirname, "..", "..", "data", "words.json");
fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log("Wrote", out.length, "words to", outPath);
console.log("Size:", (fs.statSync(outPath).size / 1024).toFixed(0), "KB");