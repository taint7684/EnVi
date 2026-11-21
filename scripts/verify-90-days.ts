import { DAILY_LESSONS, getDailyLesson } from "../data/daily-lessons";

const VALID_ROUTES = [
  "/vocab", "/grammar", "/reflex", "/dictation",
  "/shadowing", "/reading", "/writing", "/speaking",
];

let errors = 0;
function check(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    errors++;
  } else {
    console.log("OK:", msg);
  }
}

// 1) Đủ 90 ngày
check(DAILY_LESSONS.length === 90, `Có đủ 90 ngày (hiện: ${DAILY_LESSONS.length})`);

// 2) Mỗi ngày có mục tiêu, tasks, output, totalMinutes > 0
for (const lesson of DAILY_LESSONS) {
  check(!!lesson.goal && lesson.goal.length > 0, `Ngày ${lesson.day}: có mục tiêu`);
  check(lesson.tasks.length > 0, `Ngày ${lesson.day}: có ít nhất 1 task`);
  check(!!lesson.output && !!lesson.output.type, `Ngày ${lesson.day}: có output với type`);
  check(lesson.totalMinutes > 0, `Ngày ${lesson.day}: totalMinutes > 0 (${lesson.totalMinutes})`);
  for (const t of lesson.tasks) {
    check(VALID_ROUTES.includes(t.href), `Ngày ${lesson.day}: task "${t.label}" href hợp lệ (${t.href})`);
    check(t.minutes > 0, `Ngày ${lesson.day}: task "${t.label}" minutes > 0`);
  }
  check(
    lesson.output.href === "/speaking" || lesson.output.href === "/writing",
    `Ngày ${lesson.day}: output href hợp lệ (${lesson.output.href})`
  );
  check(lesson.output.minutes > 0, `Ngày ${lesson.day}: output minutes > 0`);
  check(
    lesson.output.type === "speaking" || lesson.output.type === "writing",
    `Ngày ${lesson.day}: output type là speaking/writing`
  );
}

// 3) Mốc 1, 30, 31, 60, 61, 90
for (const m of [1, 30, 31, 60, 61, 90]) {
  const l = getDailyLesson(m);
  check(!!l, `Mốc ngày ${m}: tồn tại`);
  if (l) {
    check(l.level === (m <= 30 ? "A2" : m <= 60 ? "B1" : "B2"), `Mốc ngày ${m}: cấp độ đúng (${l.level})`);
    check(l.tasks.some((t) => t.href === "/reflex"), `Mốc ngày ${m}: có Reflex`);
    check(
      l.tasks.some((t) => t.href === "/reading"),
      `Mốc ngày ${m}: có Reading`
    );
    check(
      l.output.type === "speaking" || l.output.type === "writing",
      `Mốc ngày ${m}: có đầu ra nói/viết (${l.output.label})`
    );
  }
}

// 4) Phân bố cấp độ
const a2Count = DAILY_LESSONS.filter((l) => l.level === "A2").length;
const b1Count = DAILY_LESSONS.filter((l) => l.level === "B1").length;
const b2Count = DAILY_LESSONS.filter((l) => l.level === "B2").length;
check(a2Count === 30, `A2: 30 ngày (hiện ${a2Count})`);
check(b1Count === 30, `B1: 30 ngày (hiện ${b1Count})`);
check(b2Count === 30, `B2: 30 ngày (hiện ${b2Count})`);

// 5) Mỗi ngày có ít nhất 1 đầu ra tiếng Anh (speaking hoặc writing)
for (const lesson of DAILY_LESSONS) {
  check(
    lesson.output.type === "speaking" || lesson.output.type === "writing",
    `Ngày ${lesson.day}: có ít nhất 1 đầu ra tiếng Anh`
  );
}

console.log(`\n${errors === 0 ? "TẤT CẢ KIỂM TRA 90 NGÀY PASS" : `${errors} LỖI`}`);
process.exit(errors === 0 ? 0 : 1);
