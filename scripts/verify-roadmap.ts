import { DAILY_LESSONS, getDailyLesson } from "../data/daily-lessons";
import {
  isCheckpointDay,
  isMaintenance,
  phaseForDay,
  weekForDay,
} from "../lib/roadmap/catalog";

const VALID_ROUTES = [
  "/vocab", "/grammar", "/reflex", "/dictation",
  "/shadowing", "/reading", "/writing", "/speaking",
];

let errors = 0;
function check(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    errors++;
  }
}

// 1) Du 180 ngay
check(DAILY_LESSONS.length === 180, `Co du 180 ngay (hien: ${DAILY_LESSONS.length})`);

// 2) Moi ngay co muc tieu, tasks, output, totalMinutes > 0
for (const lesson of DAILY_LESSONS) {
  check(!!lesson.goal && lesson.goal.length > 0, `Ngay ${lesson.day}: co muc tieu`);
  check(lesson.tasks.length > 0, `Ngay ${lesson.day}: co it nhat 1 task`);
  check(!!lesson.output && !!lesson.output.type, `Ngay ${lesson.day}: co output voi type`);
  check(lesson.totalMinutes > 0, `Ngay ${lesson.day}: totalMinutes > 0 (${lesson.totalMinutes})`);
  for (const t of lesson.tasks) {
    check(VALID_ROUTES.includes(t.href), `Ngay ${lesson.day}: task "${t.label}" href hop le (${t.href})`);
    check(t.minutes > 0, `Ngay ${lesson.day}: task "${t.label}" minutes > 0`);
  }
  check(
    lesson.output.href === "/speaking" || lesson.output.href === "/writing",
    `Ngay ${lesson.day}: output href hop le (${lesson.output.href})`
  );
  check(lesson.output.minutes > 0, `Ngay ${lesson.day}: output minutes > 0`);
  check(
    lesson.output.type === "speaking" || lesson.output.type === "writing",
    `Ngay ${lesson.day}: output type la speaking/writing`
  );
}

// 3) Muc 1, 30, 31, 60, 61, 90, 91, 180
for (const m of [1, 30, 31, 60, 61, 90, 91, 180]) {
  const l = getDailyLesson(m);
  check(!!l, `Muc ngay ${m}: ton tai`);
  if (l) {
    check(
      l.level === (m <= 30 ? "A2" : m <= 60 ? "B1" : "B2"),
      `Muc ngay ${m}: cap do dung (${l.level})`
    );
    check(l.tasks.some((t) => t.href === "/reflex"), `Muc ngay ${m}: co Reflex`);
    check(l.tasks.some((t) => t.href === "/reading"), `Muc ngay ${m}: co Reading`);
    check(
      l.output.type === "speaking" || l.output.type === "writing",
      `Muc ngay ${m}: co dau ra noi/viet (${l.output.label})`
    );
  }
}

// 4) Phan bo cap do (A2=30, B1=30, B2=120)
const a2Count = DAILY_LESSONS.filter((l) => l.level === "A2").length;
const b1Count = DAILY_LESSONS.filter((l) => l.level === "B1").length;
const b2Count = DAILY_LESSONS.filter((l) => l.level === "B2").length;
check(a2Count === 30, `A2: 30 ngay (hien ${a2Count})`);
check(b1Count === 30, `B1: 30 ngay (hien ${b1Count})`);
check(b2Count === 120, `B2: 120 ngay (hien ${b2Count})`);

// 5) Roadmap catalog: 180 ngay, maintenance sau 180, checkpoint 30..180
check(phaseForDay(91).phase === "P4", "Ngay 91 la P4 (bai that)");
check(phaseForDay(180).phase === "P4", "Ngay 180 la P4");
check(phaseForDay(181).phase === "maintenance", "Ngay 181 la maintenance");
check(isMaintenance(180) === false, "Ngay 180 chua maintenance");
check(isMaintenance(181) === true, "Ngay 181 maintenance");
check(weekForDay(180) === 26, "Tuan 26 cho ngay 180");
check(weekForDay(181) === null, "Sau 180 khong co tuan");
for (const d of [30, 60, 90, 120, 150, 180]) {
  check(isCheckpointDay(d), `Ngay ${d} la checkpoint`);
}
check(isCheckpointDay(31) === false, "Ngay 31 khong phai checkpoint");

// 6) Moi ngay co it nhat 1 dau ra tieng Anh
for (const lesson of DAILY_LESSONS) {
  check(
    lesson.output.type === "speaking" || lesson.output.type === "writing",
    `Ngay ${lesson.day}: co it nhat 1 dau ra tieng Anh`
  );
}

console.log(`\n${errors === 0 ? "TAT CA KIEM TRA 180 NGAY PASS" : `${errors} LOI`}`);
process.exit(errors === 0 ? 0 : 1);