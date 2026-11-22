import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const DATA_DIR = join(process.cwd(), "data");

const MINIMUMS: Record<string, number> = {
  "shadowing-lessons.json": 20,
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
    transcript: Array<{ id: number; text: string; startTime: number; endTime: number }>;
  }>;
  check("shadowing-lessons.json", data, 20, (d) => d.id);
  for (const d of data) {
    if (d.youtubeId === "dQw4w9WgXcQ") {
      warnings.push(`[shadowing] bài "${d.id}" dùng youtubeId placeholder`);
    }
    if (!d.transcript?.length) {
      errors.push(`[shadowing] bài "${d.id}" thiếu transcript`);
    }
  }
}

// Grammar exercises
{
  const data = loadJson("grammar-exercises.json") as Array<{
    topicId: string;
    mcq?: Array<{ id: number; explanation?: string }>;
    fill?: Array<{ id: number; explanation?: string }>;
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
  for (const d of data) {
    for (const q of [...(d.mcq ?? []), ...(d.fill ?? [])]) {
      if (q.explanation) withExplanation++;
    }
  }
  console.log(`    Có explanation_vi: ${withExplanation}/${total}`);
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