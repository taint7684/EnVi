// Fix shadowing data:
// 1. Replace sh-morning with real video (aQ0w2I0Eb9I) + real synced transcript
// 2. Assign unique topic-relevant videos to lessons where found
// 3. Add videoSynced flag (true only for verified real transcripts)
// 4. TTS mode remains the authoritative synced audio for all lessons
//
// Usage: node scripts/work/fix-shadowing-videos.cjs
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "..");
const DATA_PATH = path.join(ROOT, "data", "shadowing-lessons.json");
const BACKUP_PATH = path.join(ROOT, "data", "shadowing-lessons.backup.json");

const lessons = JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));

// Backup original
if (!fs.existsSync(BACKUP_PATH)) {
  fs.writeFileSync(BACKUP_PATH, JSON.stringify(lessons, null, 2));
}

// Real video IDs found via YouTube search (topic-matched)
// Only sh-morning gets a fully synced real transcript; others get unique video + TTS fallback
const REAL_VIDEOS = {
  "sh-morning": { youtubeId: "aQ0w2I0Eb9I", videoSynced: true },
  "sh-cafe": { youtubeId: "6Mcn4k1EtZA", videoSynced: false },
  "sh-food2": { youtubeId: "5zSmbWz4354", videoSynced: false },
  "sh-shopping": { youtubeId: "I6CRtpSZ67c", videoSynced: false },
  "sh-directions": { youtubeId: "thfcha1WpKQ", videoSynced: false },
};

// Real synced transcript for sh-morning (from video aQ0w2I0Eb9I - Listening Time)
const MORNING_TRANSCRIPT = [
  { id: 1, startTime: 0, endTime: 25, text: "So, I normally wake up at about 6 or 6:15 AM." },
  { id: 2, startTime: 25, endTime: 36, text: "When I wake up, the first thing I do is read my bible." },
  { id: 3, startTime: 36, endTime: 48, text: "I like to study in the morning, because I feel motivated." },
  { id: 4, startTime: 48, endTime: 53, text: "Other people prefer studying in the evening." },
  { id: 5, startTime: 53, endTime: 65, text: "So, after I study, I usually eat some fruit. This is my first food of the day." },
  { id: 6, startTime: 65, endTime: 70, text: "I usually start working at 7:30 AM." },
];

let updated = 0;
let syncedCount = 0;

for (const lesson of lessons) {
  // Apply real video if found
  if (REAL_VIDEOS[lesson.id]) {
    lesson.youtubeId = REAL_VIDEOS[lesson.id].youtubeId;
    lesson.videoSynced = REAL_VIDEOS[lesson.id].videoSynced;
    updated++;
  } else {
    // Keep existing video but mark as not synced (TTS is authoritative)
    lesson.videoSynced = false;
  }

  // Replace sh-morning transcript with real synced content
  if (lesson.id === "sh-morning") {
    lesson.transcript = MORNING_TRANSCRIPT;
    lesson.title = "My Morning Routine";
    lesson.titleVi = "Thói Quen Buổi Sáng";
    lesson.duration = "1:10";
    syncedCount++;
  }
}

fs.writeFileSync(DATA_PATH, JSON.stringify(lessons, null, 2));

// Report
const uniqueVideos = new Set(lessons.map((l) => l.youtubeId));
const syncedLessons = lessons.filter((l) => l.videoSynced);
console.log(`Updated ${updated} lessons with real videos`);
console.log(`Fully synced transcripts: ${syncedCount}`);
console.log(`Total lessons: ${lessons.length}`);
console.log(`Unique videos: ${uniqueVideos.size}`);
console.log(`Lessons with videoSynced=true: ${syncedLessons.length}`);
console.log(`Backup saved: ${BACKUP_PATH}`);