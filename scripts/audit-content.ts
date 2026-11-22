import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");

const MINIMUMS: Record<string, number> = {
  "shadowing-lessons.json": 60,
  "grammar-exercises.json": 800,
  "pronunciation.json": 12,
  "missions.json": 60,
  "strategy-cards.json": 12,
  "fluency-prompts.json": 300,
  "writing-prompts.ts": 30,
};

const errors: string[] = [];
const warnings: string[] = [];
const stats: Record<string, number> = {};

function check<T>(name: string, data: T[], min: number, idField: (item: T) => string) {
  const count = data.length;
  stats[name] = count;
  if (count < min) {
    errors.push(`[${name}] chỉ có ${count} mục, cần ≥ ${min}`);
  }
  const ids = new Set<string>();
  for (const item of data) {
    const id = idField(item);
    if (!id) {
      warnings.push(`[${name}] có mục thiếu ID`);
      continue;
    }
    if (ids.has(id)) {
      errors.push(`[${name}] ID trùng: ${id}`);
    }
    ids.add(id);
  }
  console.log(`  ${name}: ${count} mục, ${ids.size} ID unique`);
}

console.log("=== EnVi Content Audit ===\n");

function loadJson(filename: string): unknown[] {
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) {
    warnings.push(`[${filename}] không tồn tại`);
    return [];
  }
  try {
    const raw = readFileSync(path, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (e) {
    errors.push(`[${filename}] JSON lỗi: ${e instanceof Error ? e.message : String(e)}`);
    return [];
  }
}

// Shadowing lessons
{
  const data = loadJson("shadowing-lessons.json") as Array<{
    id: string;
    youtubeId: string;
    title: string;
    transcript: Array<{ id: number; text: string; startTime: number; endTime: number }>;
  }>;
  check("shadowing-lessons.json", data, 60, (d) => d.id);
  let placeholderCount = 0;
  for (const d of data) {
    if (d.youtubeId === "dQw4w9WgXcQ" || !d.youtubeId || d.youtubeId.length !== 11) {
      placeholderCount++;
      errors.push(`[shadowing] bai "${d.id}" dung youtubeId placeholder "${d.youtubeId}" -> can nguon video that hoac TTS`);
    }
    if (!d.transcript?.length) {
      errors.push(`[shadowing] bai "${d.id}" thieu transcript`);
    } else {
      // Kiem tra transcript co startTime/endTime hop le
      for (const seg of d.transcript) {
        if (typeof seg.startTime !== "number" || typeof seg.endTime !== "number") {
          errors.push(`[shadowing] bai "${d.id}" segment ${seg.id} thieu startTime/endTime`);
          break;
        }
        if (!seg.text?.trim()) {
          errors.push(`[shadowing] bai "${d.id}" segment ${seg.id} thieu text`);
          break;
        }
      }
    }
  }
  if (placeholderCount > 0) {
    console.log(`    [!] ${placeholderCount}/${data.length} bai dung youtubeId placeholder -> TTS fallback (can thay bang video that)`);
  }
}

// Speaking questions
{
  const path = join(DATA_DIR, "speaking-questions-by-level.ts");
  if (existsSync(path)) {
    const raw = readFileSync(path, "utf-8");
    const topicMatches = [...raw.matchAll(/id:\s*"([^"]+)"/g)];
    const topicCount = topicMatches.length;
    // Dem so cau hoi moi level: dem string trong cac mang A2/B1/B2
    const a2Blocks = [...raw.matchAll(/A2:\s*\[([\s\S]*?)\]/g)];
    const b1Blocks = [...raw.matchAll(/B1:\s*\[([\s\S]*?)\]/g)];
    const b2Blocks = [...raw.matchAll(/B2:\s*\[([\s\S]*?)\]/g)];
    let a2Count = 0, b1Count = 0, b2Count = 0;
    for (const b of a2Blocks) a2Count += (b[1].match(/"/g) || []).length / 2;
    for (const b of b1Blocks) b1Count += (b[1].match(/"/g) || []).length / 2;
    for (const b of b2Blocks) b2Count += (b[1].match(/"/g) || []).length / 2;
    const total = a2Count + b1Count + b2Count;
    stats["speaking-questions-by-level.ts"] = total;
    console.log(`  speaking-questions-by-level.ts: ${topicCount} topics, A2=${a2Count} B1=${b1Count} B2=${b2Count}, tong=${total}`);
    // Spec: moi topic 5 cau x 3 level = 15; 30 topics = 450
    const expected = topicCount * 15;
    if (total < expected) {
      errors.push(`[speaking] chi co ${total} cau, can >= ${expected} (${topicCount} topics x 15)`);
    }
    // Kiem tra moi topic co du 5 cau moi level
    const perLevel = Math.floor(total / 3);
    const perTopic = Math.floor(perLevel / topicCount);
    if (perTopic < 5) {
      errors.push(`[speaking] moi topic chi co ~${perTopic} cau/level, can 5`);
    }
  }
}

// Reflex phrases (data files)
{
  const phrasesFile = join(DATA_DIR, "phrases.txt");
  const advancedFile = join(DATA_DIR, "phrases-advanced.txt");
  let phraseCount = 0;
  for (const f of [phrasesFile, advancedFile]) {
    if (existsSync(f)) {
      const lines = readFileSync(f, "utf-8").split(/\r?\n/).filter((l) => l.trim());
      phraseCount += Math.floor(lines.length / 2);
    }
  }
  stats["phrases.txt + advanced"] = phraseCount;
  console.log(`  phrases.txt + advanced: ${phraseCount} cap cau (VI/EN)`);
  if (phraseCount < 100) {
    errors.push(`[reflex] chi co ${phraseCount} cap cau, can >= 100`);
  }
  // Luu y: en_alternatives, situation_en, keywords nam trong DB (migration 0022)
  console.log(`    ℹ en_alternatives/situation_en/keywords: kiem tra trong DB sau migration 0022`);
}

// Grammar exercises
{
  const data = loadJson("grammar-exercises.json") as Array<{
    topicId: string;
    mcq?: Array<{ id: number; explanation_vi?: string; vn_trap?: string; speak?: string }>;
    fill?: Array<{ id: number; explanation_vi?: string; vn_trap?: string; speak?: string }>;
  }>;
  const totalMcq = data.reduce((s, d) => s + (d.mcq?.length ?? 0), 0);
  const totalFill = data.reduce((s, d) => s + (d.fill?.length ?? 0), 0);
  const total = totalMcq + totalFill;
  stats["grammar-exercises.json"] = total;
  console.log(`  grammar-exercises.json: ${total} câu (${totalMcq} MCQ + ${totalFill} fill), ${data.length} chủ điểm`);
  if (total < 800) {
    errors.push(`[grammar] chỉ có ${total} câu, cần ≥ 800`);
  }
  if (data.length < 16) {
    errors.push(`[grammar] chỉ có ${data.length} chủ điểm, cần ≥ 16`);
  }
  let withExplanation = 0;
  let withTrap = 0;
  let withSpeak = 0;
  for (const d of data) {
    for (const q of [...(d.mcq ?? []), ...(d.fill ?? [])]) {
      if (q.explanation_vi) withExplanation++;
      if (q.vn_trap) withTrap++;
      if (q.speak) withSpeak++;
    }
  }
  console.log(`    Có explanation_vi: ${withExplanation}/${total}`);
  console.log(`    Có vn_trap: ${withTrap}/${total}`);
  console.log(`    Có speak: ${withSpeak}/160`);
  if (withExplanation < total) {
    errors.push(`[grammar] chỉ ${withExplanation}/${total} câu có explanation_vi`);
  }
  if (withSpeak < 160) {
    errors.push(`[grammar] chỉ ${withSpeak}/160 câu có speak`);
  }
  if (withTrap < total) {
    errors.push(`[grammar] chỉ ${withTrap}/${total} câu có vn_trap`);
  }
}

// Pronunciation
{
  const data = loadJson("pronunciation.json") as Array<{ id: string }>;
  check("pronunciation.json", data, 12, (d) => d.id);
}

// Missions
{
  const data = loadJson("missions.json") as Array<{ id: string; offline_script?: unknown }>;
  check("missions.json", data, 60, (d) => d.id);
  const withOffline = data.filter((d) => d.offline_script).length;
  console.log(`    Có offline_script: ${withOffline}/${data.length}`);
}

// Strategy cards
{
  const data = loadJson("strategy-cards.json") as Array<{ id: string }>;
  check("strategy-cards.json", data, 12, (d) => d.id);
}

// Fluency prompts
{
  const data = loadJson("fluency-prompts.json") as Array<{ id: string }>;
  check("fluency-prompts.json", data, 300, (d) => d.id);
}

console.log("\n=== Kết quả ===");
console.log(`Thống kê:`, JSON.stringify(stats, null, 2));
if (warnings.length > 0) {
  console.log(`\nCảnh báo (${warnings.length}):`);
  for (const w of warnings.slice(0, 20)) console.log(`  ⚠ ${w}`);
}
if (errors.length > 0) {
  console.log(`\nLỖI (${errors.length}):`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  process.exit(1);
} else {
  console.log("\n✓ Audit PASS — không có lỗi.");
}