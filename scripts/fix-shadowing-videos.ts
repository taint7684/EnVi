/**
 * Replace placeholder YouTube IDs (dQw4w9WgXcQ) in shadowing-lessons.json
 * with real English-learning shadowing videos matched by level.
 *
 * Usage: npx tsx scripts/fix-shadowing-videos.ts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type Lesson = {
  id: string;
  youtubeId: string;
  title: string;
  titleVi: string;
  level: string;
  duration: string;
  transcript: Array<{ id: number; startTime: number; endTime: number; text: string }>;
};

// Real YouTube videos with clear English shadowing content, grouped by level
const VIDEOS_BY_LEVEL: Record<string, string[]> = {
  A2: [
    "RJ8Fo29oVZo", // 5 min shadowing, slow easy English A2-B1
    "baiacRy-4L8", // 99 Small Talk Phrases A2-B1
  ],
  "A2-B1": [
    "YRTjEUH1kHA", // 150 Speak With Me Sentences A2-B1
    "baiacRy-4L8", // 99 Small Talk Phrases A2-B1
  ],
  B1: [
    "cg1MPssk3jY", // B1 English Shadowing Practice
    "nw6e6jgfPi8", // Repeat After Me Twice (A2-B1-B2)
  ],
  "B1-B2": [
    "RGWJp8_gaY8", // Daily Routine Sentences B1-B2
    "gVtqUZRSTlc", // B1 & B2 Shadowing
  ],
  B2: [
    "7bEStwqNPqU", // Shadowing Technique Slow English
    "p89MfEMe2WA", // Shadowing B1 B2 Making Plans
    "xzfd55HiyWE", // 300 Shadowing Sentences A1-C2
  ],
};

function main() {
  const filePath = join(process.cwd(), "data", "shadowing-lessons.json");
  const raw = readFileSync(filePath, "utf-8");
  const lessons: Lesson[] = JSON.parse(raw);

  const levelCounters: Record<string, number> = {};
  let replaced = 0;

  for (const lesson of lessons) {
    if (lesson.youtubeId === "dQw4w9WgXcQ") {
      const videos = VIDEOS_BY_LEVEL[lesson.level];
      if (videos && videos.length > 0) {
        const idx = levelCounters[lesson.level] ?? 0;
        lesson.youtubeId = videos[idx % videos.length];
        levelCounters[lesson.level] = idx + 1;
        replaced++;
      }
    }
  }

  writeFileSync(filePath, JSON.stringify(lessons, null, 2) + "\n", "utf-8");

  console.log(`Replaced ${replaced} placeholder video IDs with real videos.`);
  for (const [level, count] of Object.entries(levelCounters)) {
    console.log(`  ${level}: ${count} lessons mapped`);
  }

  // Verify no placeholders remain
  const remaining = lessons.filter((l) => l.youtubeId === "dQw4w9WgXcQ");
  if (remaining.length > 0) {
    console.error(`WARNING: ${remaining.length} lessons still have placeholder IDs!`);
    process.exit(1);
  }
  console.log("All lessons now have real YouTube video IDs.");
}

main();