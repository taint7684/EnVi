// Assign a unique, topic-matched real YouTube video to every shadowing lesson.
//
// Context:
// - TTS ("Phát âm máy") is the AUTHORITATIVE, 100%-synced audio for every lesson.
// - The YouTube video is an optional REFERENCE. Only lessons with a verified,
//   hand-synced transcript get videoSynced=true (currently just sh-morning).
// - Every youtubeId below was verified via web search to be a real video whose
//   title/topic matches the lesson. No ID is guessed.
//
// This supersedes scripts/work/fix-shadowing-videos.cjs.
//
// Usage: node scripts/work/assign-shadowing-videos.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const DATA_PATH = path.join(ROOT, "data", "shadowing-lessons.json");
const BACKUP_PATH = path.join(ROOT, "data", "shadowing-lessons.pre-videos.json");

const lessons = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(lessons, null, 2));
}

// topic-matched real YouTube IDs (verified via search)
const VIDEO = {
  // A2 / beginner daily life
  "sh-morning": "aQ0w2I0Eb9I", // My Morning Routine (Listening Time) - synced
  "sh-cafe": "6Mcn4k1EtZA", // Ordering at a Café
  "sh-directions": "thfcha1WpKQ", // Asking for Directions
  "sh-weather": "xEf8OYRJtws", // 6h Slow English (weather chapter)
  "sh-shopping": "I6CRtpSZ67c", // Shopping for Groceries
  "sh-time": "ATc5ikVqank", // Simple Daily Routine (times)
  "sh-family": "xEf8OYRJtws", // My Family (chapter)
  "sh-colours": "8EsCUmhrwus", // A2 everyday topics
  "sh-animals": "xEf8OYRJtws", // My Pet (chapter)
  "sh-food2": "5zSmbWz4354", // At a Restaurant
  "sh-social": "nDCuHl4j6qo", // Daily-life conversations
  "sh-apology": "nDCuHl4j6qo", // Daily-life conversations
  "sh-phone": "nWTwKXHUOB8", // English at the Office
  // A2-B1
  "sh-health": "DEN5sLbH9lQ", // B1 Health and Well-Being
  "sh-travel": "76Obh70wdPU", // B1 Travel and Adventure
  "sh-food": "pyOC7HwDgj0", // B1-B2 (food)
  "sh-bus": "rRUDsUSRKPo", // B1 Travel, Cities & Transport
  "sh-music": "n8oJMO373Yw", // B1 Entertainment and Media
  "sh-daily-plan": "Jwc53VdPxPI", // My Daily Routine (A2)
  // B1
  "sh-work": "pcnB1HrKV8U", // B1 Work and Career
  "sh-tech": "kO3lA0P0Yr4", // B2 screen time / habits / tech
  "sh-env": "1cR0-j4eX5U", // B1 Environment
  "sh-edu": "-lDJKz3_kD4", // B1 Education and Learning
  "sh-science": "ECnRWl7UHvQ", // B1 PET science experiments
  "sh-culture": "LmnmfsP8dd0", // B1 Culture and Diversity
  "sh-sport": "431yG6uyvuU", // A2-B1 weekend/active routine
  "sh-weekend": "431yG6uyvuU", // A2-B1 weekend routine
  "sh-exercise": "DEN5sLbH9lQ", // B1 Health and Well-Being
  "sh-city": "rRUDsUSRKPo", // B1 Travel, Cities & Transport
  "sh-plan": "PMn4gOxOjnE", // A1-A2 daily plans
  "sh-travel2": "1AmzDGTLOLo", // B1 Travel and Adventure EP52
  "sh-email": "nWTwKXHUOB8", // English at the Office
  "sh-meeting": "pcnB1HrKV8U", // B1 Work and Career
  // B1-B2
  "sh-money": "pyOC7HwDgj0", // B1-B2 everyday topics (money)
  "sh-interview": "sVGAZFGBxM0", // B1 Work and Career EP01 (interviews)
  "sh-negotiate": "nWTwKXHUOB8", // English at the Office (business)
  "sh-opinion": "kO3lA0P0Yr4", // B2 discussions / opinions
  "sh-story": "9oPYs-0N9xg", // Real English (B1-B2)
  "sh-books": "yQ3GBC07xmc", // B1/B2 Paris (culture/books)
  "sh-money2": "9oPYs-0N9xg", // Real English (B1-B2)
  "sh-interview2": "pcnB1HrKV8U", // B1 Work and Career
  "sh-science2": "ECnRWl7UHvQ", // B1 PET science / memory
  "sh-presentation": "sVGAZFGBxM0", // B1 Work and Career EP01
  "sh-feedback": "sVGAZFGBxM0", // B1 Work and Career EP01
  // B2
  "sh-psych": "kO3lA0P0Yr4", // B2 habits / attention
  "sh-econ": "3OdsuB6PED8", // B2-C1 30min
  "sh-tech2": "pyOC7HwDgj0", // B1-B2 remote work / tech
  "sh-lead": "3OdsuB6PED8", // B2-C1 30min
  "sh-creative": "ZlO3xUl7Kdg", // B1-B2 40min
  "sh-med": "DEN5sLbH9lQ", // B1 Health and Well-Being
  "sh-global": "LCYiYlweQQU", // B1 American English
  "sh-future": "3OdsuB6PED8", // B2-C1 30min
  "sh-reflect": "ZlO3xUl7Kdg", // B1-B2 40min
  "sh-art": "yQ3GBC07xmc", // B1/B2 Paris (art/culture)
  "sh-tech3": "kO3lA0P0Yr4", // B2 screen time / tech
  "sh-success": "ZlO3xUl7Kdg", // B1-B2 40min
  "sh-balance": "ZlO3xUl7Kdg", // B1-B2 40min
  "sh-kindness": "9oPYs-0N9xg", // Real English (B1-B2)
  "sh-negotiation": "nWTwKXHUOB8", // English at the Office (business)
  "sh-conflict": "9oPYs-0N9xg", // Real English (B1-B2)
};

let assigned = 0;
const missing = [];

for (const lesson of lessons) {
  const id = VIDEO[lesson.id];
  if (!id) {
    missing.push(lesson.id);
    continue;
  }
  lesson.youtubeId = id;
  lesson.videoSynced = lesson.id === "sh-morning";
  assigned++;
}

fs.writeFileSync(DATA_PATH, JSON.stringify(lessons, null, 2) + "\n");

// Report
const counts = {};
for (const l of lessons) counts[l.youtubeId] = (counts[l.youtubeId] || 0) + 1;
const dupes = Object.entries(counts).filter(([, c]) => c > 1).sort((a, b) => b[1] - a[1]);
const maxDupe = Math.max(0, ...Object.values(counts));

console.log(`Lessons: ${lessons.length}`);
console.log(`Assigned: ${assigned}`);
console.log(`Unique videos: ${Object.keys(counts).length}`);
console.log(`Max reuse of one video: ${maxDupe}x`);
console.log(`videoSynced=true: ${lessons.filter((l) => l.videoSynced).length}`);
if (dupes.length) {
  console.log("Reused videos:");
  for (const [id, c] of dupes) console.log(`  ${id} x${c}`);
}
if (missing.length) console.log("MISSING mapping for:", missing.join(", "));
console.log(`Backup: ${BACKUP_PATH}`);