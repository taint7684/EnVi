import { readFileSync } from "node:fs";
import { join } from "node:path";

const data = JSON.parse(readFileSync(join(process.cwd(), "data/shadowing-lessons.json"), "utf-8"));

console.log(`=== Shadowing Verification (${data.length} lessons) ===`);

let validStructure = 0;
let playableYT = 0;
let transcriptOK = 0;
const issues = [];

for (const lesson of data) {
  // 1. Source structure
  const hasFields = lesson.id && lesson.youtubeId && lesson.title && lesson.titleVi &&
    lesson.level && lesson.duration && Array.isArray(lesson.transcript);
  if (!hasFields) { issues.push(`${lesson.id}: missing fields`); continue; }
  if (lesson.youtubeId === "dQw4w9WgXcQ") { issues.push(`${lesson.id}: placeholder YT`); continue; }
  if (lesson.youtubeId.length !== 11) { issues.push(`${lesson.id}: invalid YT id`); continue; }
  validStructure++;

  // 2. Transcript structure (startTime, endTime, text, sequential ids)
  let ok = lesson.transcript.length > 0;
  let prevEnd = 0;
  for (let i = 0; i < lesson.transcript.length; i++) {
    const seg = lesson.transcript[i];
    if (typeof seg.startTime !== "number" || typeof seg.endTime !== "number" ||
        seg.startTime < 0 || seg.startTime >= seg.endTime ||
        !seg.text?.trim() || seg.text.trim().split(/\s+/).length < 2 ||
        seg.id !== i + 1) {
      ok = false; break;
    }
    prevEnd = seg.endTime;
  }
  if (ok) transcriptOK++;
}

console.log(`Valid source structure: ${validStructure}/${data.length}`);
console.log(`Valid transcript:       ${transcriptOK}/${data.length}`);

// 3. Check YouTube playability via oembed (sample 5)
console.log(`\n=== YouTube Playability (sample 5) ===`);
const sample = data.slice(0, 5);
for (const l of sample) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${l.youtubeId}&format=json`);
    if (res.ok) { playableYT++; console.log(`  ${l.id} (${l.youtubeId}): PLAYABLE`); }
    else console.log(`  ${l.id} (${l.youtubeId}): HTTP ${res.status}`);
  } catch (e) { console.log(`  ${l.id}: ERR ${e.message.slice(0,40)}`); }
}

// 4. Level distribution
const levels = {};
for (const l of data) levels[l.level] = (levels[l.level] || 0) + 1;
console.log(`\nLevel distribution:`, JSON.stringify(levels));

const pass = validStructure === 60 && transcriptOK === 60 && issues.length === 0;
console.log(`\nResult: ${pass ? "PASS" : "FAIL"}`);
if (issues.length) console.log(`Issues:`, issues.slice(0, 5));
process.exit(pass ? 0 : 1);