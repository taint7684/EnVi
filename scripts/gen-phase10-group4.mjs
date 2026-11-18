// Phase 10 Group 4: generate 500 advanced phrases (250 B1 + 250 B2).
// Deterministic (seeded) template-based generation with parallel EN/VI slots.
import { writeFileSync } from "node:fs";

// mulberry32 seeded RNG
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function seededShuffle(arr, seed) {
  const rand = rng(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
const lc = (s) => s.charAt(0).toLowerCase() + s.slice(1);

const subjects = [
  ["We", "Chúng tôi"],
  ["You", "Bạn"],
  ["They", "Họ"],
  ["My friends", "Các bạn của tôi"],
  ["The students", "Các học sinh"],
  ["Our team", "Đội của chúng tôi"],
  ["The volunteers", "Các tình nguyện viên"],
  ["Many people", "Nhiều người"],
];
const verbs = [
  ["finish", "hoàn thành"],
  ["prepare", "chuẩn bị"],
  ["discuss", "thảo luận"],
  ["review", "ôn tập"],
  ["organize", "tổ chức"],
  ["improve", "cải thiện"],
  ["practice", "luyện tập"],
  ["share", "chia sẻ"],
  ["complete", "hoàn tất"],
];
const objects = [
  ["the report", "báo cáo"],
  ["the project", "dự án"],
  ["the lesson", "bài học"],
  ["the plan", "kế hoạch"],
  ["the presentation", "bài thuyết trình"],
  ["the schedule", "lịch trình"],
  ["the details", "các chi tiết"],
];

// B1 frames (simple present / modal / future)
const framesB1 = [
  (s, v, o) => ({
    en: `${s[0]} usually ${v[0]} ${o[0]} in the morning.`,
    vi: `${s[1]} thường ${v[1]} ${o[1]} vào buổi sáng.`,
  }),
  (s, v, o) => ({
    en: `Do you think ${lc(s[0])} should ${v[0]} ${o[0]} soon?`,
    vi: `Bạn có nghĩ ${lc(s[1])} nên ${v[1]} ${o[1]} sớm không?`,
  }),
  (s, v, o) => ({
    en: `I believe ${lc(s[0])} will ${v[0]} ${o[0]} next week.`,
    vi: `Tôi tin ${lc(s[1])} sẽ ${v[1]} ${o[1]} tuần tới.`,
  }),
  (s, v, o) => ({
    en: `${s[0]} need to ${v[0]} ${o[0]} carefully.`,
    vi: `${s[1]} cần ${v[1]} ${o[1]} một cách cẩn thận.`,
  }),
  (s, v, o) => ({
    en: `Can you ask ${lc(s[0])} to ${v[0]} ${o[0]} today?`,
    vi: `Bạn có thể nhờ ${lc(s[1])} ${v[1]} ${o[1]} hôm nay không?`,
  }),
];

// B2 frames (conditional / passive-ish / purpose / comparison)
const framesB2 = [
  (s, v, o) => ({
    en: `If ${lc(s[0])} had more time, ${lc(s[0])} would ${v[0]} ${o[0]}.`,
    vi: `Nếu ${lc(s[1])} có thêm thời gian, ${lc(s[1])} sẽ ${v[1]} ${o[1]}.`,
  }),
  (s, v, o) => ({
    en: `Despite the difficulties, ${s[0]} still managed to ${v[0]} ${o[0]}.`,
    vi: `Mặc dù có nhiều khó khăn, ${lc(s[1])} vẫn ${v[1]} được ${o[1]}.`,
  }),
  (s, v, o) => ({
    en: `${s[0]} worked hard so that ${lc(s[0])} could ${v[0]} ${o[0]} on time.`,
    vi: `${s[1]} đã nỗ lực để ${lc(s[1])} có thể ${v[1]} ${o[1]} đúng hạn.`,
  }),
  (s, v, o) => ({
    en: `This method is more effective than the one that ${lc(s[0])} used to ${v[0]} ${o[0]}.`,
    vi: `Phương pháp này hiệu quả hơn cách ${lc(s[1])} từng ${v[1]} ${o[1]}.`,
  }),
  (s, v, o) => ({
    en: `It is important that ${lc(s[0])} ${v[0]} ${o[0]} before the deadline.`,
    vi: `Điều quan trọng là ${lc(s[1])} ${v[1]} ${o[1]} trước hạn chót.`,
  }),
];

function generate(frames, seed, target) {
  const seen = new Set();
  const out = [];
  // iterate deterministically; shuffle subject/verb/object order for variety
  const subs = seededShuffle(subjects, seed);
  const vs = seededShuffle(verbs, seed + 1);
  const os = seededShuffle(objects, seed + 2);
  const framesOrder = seededShuffle(
    frames.map((_, i) => i),
    seed + 3,
  );
  for (const fi of framesOrder) {
    const frame = frames[fi];
    for (const s of subs) {
      for (const v of vs) {
        for (const o of os) {
          const { en, vi } = frame(s, v, o);
          if (seen.has(vi)) continue;
          seen.add(vi);
          out.push({ en, vi });
          if (out.length >= target) return out;
        }
      }
    }
  }
  return out;
}

const b1 = generate(framesB1, 1010, 250);
const b2 = generate(framesB2, 2020, 250);

const blocks = [];
for (const p of b1) blocks.push(`[B1]\n${p.vi}\n${p.en}`);
for (const p of b2) blocks.push(`[B2]\n${p.vi}\n${p.en}`);

writeFileSync("data/phrases-advanced.txt", blocks.join("\n") + "\n", "utf8");
console.log("phrases-advanced: B1 =", b1.length, "B2 =", b2.length, "total =", b1.length + b2.length);