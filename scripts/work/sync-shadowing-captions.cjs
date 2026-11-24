// Rebuild shadowing lessons so video + dialogue truly match (cleaned).
// Strategy per lesson:
//  - Fetch the ENGLISH caption track only. If none / too few usable lines:
//      keep authored transcript, set audioSynced=true, videoSynced=false.
//  - Else: clean (drop [Music]/[Applause], strip ">>" and "Speaker N" labels),
//    merge to sentence-level, make segments contiguous & non-overlapping,
//    set videoSynced=true. Then "click sentence -> seek -> play -> stop at end"
//    is genuinely correct (timings come from the video).
//
// Writes a CANDIDATE file; does NOT overwrite live data.

const fs = require("fs");
const path = require("path");
const { YoutubeTranscript } = require("youtube-transcript");

const SRC = path.join(__dirname, "..", "..", "data", "shadowing-lessons.json");
const OUT = path.join(__dirname, "..", "..", "data", "shadowing-lessons.synced.json");

const CONCURRENCY = 3;
const MAX_SENTENCES = 20;
const MIN_SENTENCES = 3;
const MAX_CHARS = 110;
const MAX_DUR_SEC = 9; // seconds

function cleanText(t) {
  let s = (t || "").replace(/\s+/g, " ").trim();
  s = s.replace(/\[(?:music|applause|laughter|silence|noise)\]/gi, " ");
  s = s.replace(/^>>+/g, " ");
  s = s.replace(/\b(?:speaker|spk)\s*[\d一二三]+\b/gi, " ");
  return s.replace(/\s+/g, " ").trim();
}

function isJunk(text) {
  if (!text) return true;
  if (/^\[.*\]$/.test(text)) return true;
  if (!/[a-zA-Z\u00C0-\u024F]/.test(text)) return true; // no latin letters
  if (/^[\d\s\W]+$/.test(text)) return true;
  return false;
}

function mergeToSentences(fragments) {
  const segs = [];
  let cur = null;
  for (const f of fragments) {
    const text = cleanText(f.text);
    if (isJunk(text)) continue;
    const start = (Number(f.offset) || 0) / 1000; // ms -> sec
    const end = start + (Number(f.duration) || 0) / 1000; // ms -> sec
    if (!cur) {
      cur = { start, end, text };
    } else {
      cur.text = (cur.text + " " + text).trim();
      cur.end = Math.max(cur.end, end);
    }
    const endsSentence = /[.?!]["')\]]?$/.test(cur.text);
    if (endsSentence || cur.end - cur.start >= MAX_DUR_SEC || cur.text.length >= MAX_CHARS) {
      segs.push(cur);
      cur = null;
      if (segs.length >= MAX_SENTENCES) break;
    }
  }
  if (cur && segs.length < MAX_SENTENCES) segs.push(cur);

  // Contiguous + non-overlapping (preserve real gaps, remove overlaps).
  let prevEnd = 0;
  const out = [];
  for (const s of segs) {
    let start = Math.max(s.start, prevEnd);
    let end = s.end;
    if (end <= start) end = start + 0.5;
    out.push({ start, end });
    prevEnd = end;
  }
  return out.map((s, i) => ({
    id: i + 1,
    startTime: Math.round(s.start * 10) / 10,
    endTime: Math.round(s.end * 10) / 10,
    text: segs[i].text,
  }));
}

async function fetchEnglish(videoId) {
  try {
    const t = await YoutubeTranscript.fetchTranscript(videoId, { lang: "en" });
    if (t && t.length) return t;
  } catch (_) {
    /* no english */
  }
  return null;
}

async function processOne(lesson) {
  if (lesson.videoSynced === true) {
    return { id: lesson.id, status: "kept-synced", segs: lesson.transcript.length };
  }
  const frags = await fetchEnglish(lesson.youtubeId);
  if (!frags) {
    lesson.videoSynced = false;
    lesson.audioSynced = true;
    return { id: lesson.id, status: "audio-only", segs: lesson.transcript.length };
  }
  const segs = mergeToSentences(frags);
  if (segs.length < MIN_SENTENCES) {
    lesson.videoSynced = false;
    lesson.audioSynced = true;
    return { id: lesson.id, status: "audio-only(few:" + segs.length + ")", segs: lesson.transcript.length };
  }
  lesson.transcript = segs;
  lesson.videoSynced = true;
  lesson.audioSynced = false;
  const lastEnd = segs[segs.length - 1].endTime;
  const m = Math.floor(lastEnd / 60);
  const s = Math.round(lastEnd % 60);
  lesson.duration = `${m}:${s.toString().padStart(2, "0")}`;
  return { id: lesson.id, status: "video-synced", segs: segs.length };
}

async function pool(items, size, fn) {
  const results = [];
  let idx = 0;
  async function worker() {
    while (idx < items.length) {
      const i = idx++;
      results[i] = await fn(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: size }, () => worker()));
  return results;
}

(async () => {
  const lessons = JSON.parse(fs.readFileSync(SRC, "utf8"));
  console.log(`Loaded ${lessons.length} lessons. Fetching EN transcripts (concurrency ${CONCURRENCY})...`);
  const results = await pool(lessons, CONCURRENCY, processOne);

  const counts = {};
  for (const r of results) counts[r.status.split("(")[0]] = (counts[r.status.split("(")[0]] || 0) + 1;
  console.log("Status counts:", counts);

  // Validation: contiguous, non-overlapping, non-empty, latin text.
  let problems = 0;
  for (const l of lessons) {
    let prevEnd = -1;
    for (const seg of l.transcript) {
      const latin = /[a-zA-Z]/.test(seg.text);
      if (!seg.text || seg.endTime <= seg.startTime || seg.startTime < prevEnd - 0.05 || !latin) {
        problems++;
        if (problems <= 20)
          console.log(`  PROBLEM ${l.id} seg ${seg.id}: ${seg.startTime}-${seg.endTime} prevEnd=${prevEnd} latin=${latin} "${seg.text.slice(0, 40)}"`);
      }
      prevEnd = seg.endTime;
    }
  }
  console.log("Timing/text problems:", problems);

  fs.writeFileSync(OUT, JSON.stringify(lessons, null, 2));
  console.log("Wrote candidate:", OUT);

  // Print a few samples for inspection.
  for (const id of ["sh-plan", "sh-daily-plan", "sh-money2", "sh-bus", "sh-tech3"]) {
    const l = lessons.find((x) => x.id === id);
    if (!l) continue;
    console.log(`\n--- ${id} videoSynced=${l.videoSynced} audioSynced=${l.audioSynced} segs=${l.transcript.length}`);
    for (const s of l.transcript.slice(0, 3)) console.log(`   [${s.startTime}-${s.endTime}] ${s.text}`);
  }
})().catch((e) => {
  console.error("FATAL", e);
  process.exit(1);
});