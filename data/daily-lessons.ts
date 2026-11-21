export type DayLevel = "A2" | "B1" | "B2";

export type DayTask = {
  id: string;
  label: string;
  href: string;
  minutes: number;
};

export type DailyLesson = {
  day: number;
  level: DayLevel;
  goal: string;
  tasks: DayTask[];
  output: {
    type: "speaking" | "writing" | "summary";
    label: string;
    href: string;
    minutes: number;
  };
  totalMinutes: number;
};

const A2_VOCAB = (unit: number) => ({
  id: `vocab-unit-${unit}`,
  label: `Flashcard NGSL đơn vị ${unit}`,
  href: "/vocab",
  minutes: 20,
});

const A2_GRAMMAR = (topic: string, name: string) => ({
  id: `grammar-${topic}`,
  label: `Ngữ pháp: ${name}`,
  href: "/grammar",
  minutes: 20,
});

const A2_READING = (passageId: string, title: string) => ({
  id: `reading-${passageId}`,
  label: `Đọc hiểu: ${title}`,
  href: "/reading",
  minutes: 15,
});

const REFLEX_5 = () => ({
  id: "reflex-5",
  label: "Reflex: 5 câu giao tiếp",
  href: "/reflex",
  minutes: 15,
});

const SPEAKING_1 = (label: string) => ({
  id: `speaking-${label}`,
  label,
  href: "/speaking",
  minutes: 10,
});

const WRITING_1 = (label: string) => ({
  id: `writing-${label}`,
  label,
  href: "/writing",
  minutes: 10,
});

const DICTATION_1 = () => ({
  id: "dictation-1",
  label: "Dictation: nghe gõ 1 câu",
  href: "/dictation",
  minutes: 8,
});

const SHADOWING_1 = () => ({
  id: "shadowing-1",
  label: "Shadowing: nói đuổi theo",
  href: "/shadowing",
  minutes: 10,
});

// Grammar topic names from grammar-exercises.json
const GRAMMAR_TOPICS = [
  { id: "conditionals", name: "Câu Điều Kiện" },
  { id: "passive", name: "Câu Bị Động" },
  { id: "relative-clauses", name: "Mệnh Đề Quan Hệ" },
  { id: "modal-verbs", name: "Động Từ Khuyết Thiếu" },
  { id: "gerunds-infinitives", name: "Danh Động Từ & Nguyên Mẫu" },
  { id: "comparatives", name: "So Sánh Hơn & Nhất" },
  { id: "present-perfect-vs-past", name: "Hiện Tại Hoàn Thành vs Quá Khứ Đơn" },
  { id: "future-forms", name: "Các Dạng Tương Lai" },
  { id: "reported-speech", name: "Câu Gián Tiếp" },
  { id: "used-to", name: "Thói Quen Trong Quá Khứ" },
  { id: "articles", name: "Mạo Từ" },
  { id: "prepositions", name: "Giới Từ" },
  { id: "quantifiers", name: "Lượng Từ" },
  { id: "question-forms", name: "Dạng Câu Hỏi" },
  { id: "conjunctions", name: "Liên Từ" },
  { id: "word-order", name: "Trật Tự Từ" },
];

// Reading passage IDs from reading-passages.json
const A2_READINGS = [
  "read-a2-1", "read-a2-2", "read-a2-3", "read-a2-4", "read-a2-5",
  "read-a2-6", "read-a2-7", "read-a2-8", "read-a2-9", "read-a2-10",
];
const A2_READING_TITLES = [
  "My New Job", "A Rainy Day", "My Best Friend", "At the Supermarket", "A Trip to the Beach",
  "Learning to Cook", "The Lost Dog", "My Family", "The School Trip", "My Hobby",
];
const B1_READINGS = [
  "read-b1-1", "read-b1-2", "read-b1-3", "read-b1-4", "read-b1-5",
  "read-b1-6", "read-b1-7", "read-b1-8", "read-b1-9", "read-b1-10",
];
const B1_READING_TITLES = [
  "The Value of Reading", "Remote Work", "Healthy Habits", "Learning Languages", "The Sharing Economy",
  "Social Media", "The Importance of Sleep", "Travel and Culture", "The Gig Economy", "The Power of Small Habits",
];
const B2_READINGS = [
  "read-b2-1", "read-b2-2", "read-b2-3", "read-b2-4", "read-b2-5",
  "read-b2-6", "read-b2-7", "read-b2-8", "read-b2-9", "read-b2-10",
];
const B2_READING_TITLES = [
  "The Future of Work", "Climate and Responsibility", "The Psychology of Habits", "Digital Privacy", "The Art of Conversation",
  "Financial Independence", "The Future of Cities", "The Science of Happiness", "The Ethics of AI", "The Power of Stories",
];

const DAILY_LESSONS: DailyLesson[] = [];

// Phase 1: Days 1-30 (A2) - Xây nền tảng
for (let day = 1; day <= 30; day++) {
  const unit = ((day - 1) % 14) + 1; // 14 vocab units cycled
  const grammarIdx = (day - 1) % GRAMMAR_TOPICS.length;
  const readingIdx = (day - 1) % A2_READINGS.length;
  const isWritingDay = day % 3 === 0; // Writing every 3rd day
  const isDictationDay = day % 3 === 1; // Dictation on days 1,4,7...
  const isShadowingDay = day % 3 === 2; // Shadowing on days 2,5,8...

  const tasks: DayTask[] = [
    A2_VOCAB(unit),
    A2_GRAMMAR(GRAMMAR_TOPICS[grammarIdx].id, GRAMMAR_TOPICS[grammarIdx].name),
    REFLEX_5(),
  ];

  if (isDictationDay) tasks.push(DICTATION_1());
  if (isShadowingDay) tasks.push(SHADOWING_1());
  tasks.push(A2_READING(A2_READINGS[readingIdx], A2_READING_TITLES[readingIdx]));

  const output = isWritingDay
    ? { type: "writing" as const, label: `Viết email/tóm tắt ngày ${day}`, href: "/writing", minutes: 10 }
    : { type: "speaking" as const, label: `Nói 1 phiên ngày ${day}`, href: "/speaking", minutes: 10 };

  DAILY_LESSONS.push({
    day,
    level: "A2",
    goal: `Ngày ${day}: Nắm vững 20 từ vựng A2 + ${GRAMMAR_TOPICS[grammarIdx].name} + 5 câu reflex`,
    tasks,
    output,
    totalMinutes: tasks.reduce((s, t) => s + t.minutes, 0) + output.minutes,
  });
}

// Phase 2: Days 31-60 (B1) - Bứt phá
for (let day = 31; day <= 60; day++) {
  const relDay = day - 30;
  const unit = ((relDay - 1) % 14) + 1;
  const grammarIdx = (relDay - 1) % GRAMMAR_TOPICS.length;
  const readingIdx = (relDay - 1) % B1_READINGS.length;
  const isWritingDay = relDay % 3 === 0;
  const isDictationDay = relDay % 3 === 1;
  const isShadowingDay = relDay % 3 === 2;

  const tasks: DayTask[] = [
    { id: `vocab-oxford-${unit}`, label: `Flashcard Oxford 5k đơn vị ${unit}`, href: "/vocab", minutes: 20 },
    A2_GRAMMAR(GRAMMAR_TOPICS[grammarIdx].id, GRAMMAR_TOPICS[grammarIdx].name),
    REFLEX_5(),
  ];

  if (isDictationDay) tasks.push(DICTATION_1());
  if (isShadowingDay) tasks.push(SHADOWING_1());
  tasks.push(A2_READING(B1_READINGS[readingIdx], B1_READING_TITLES[readingIdx]));

  const output = isWritingDay
    ? { type: "writing" as const, label: `Viết email IT/BA ngày ${day}`, href: "/writing", minutes: 10 }
    : { type: "speaking" as const, label: `Nói hội thoại AI ngày ${day}`, href: "/speaking", minutes: 10 };

  DAILY_LESSONS.push({
    day,
    level: "B1",
    goal: `Ngày ${day}: Oxford 5k từ vựng B1 + ${GRAMMAR_TOPICS[grammarIdx].name} + reflex B1`,
    tasks,
    output,
    totalMinutes: tasks.reduce((s, t) => s + t.minutes, 0) + output.minutes,
  });
}

// Phase 3: Days 61-90 (B2) - Thực chiến
for (let day = 61; day <= 90; day++) {
  const relDay = day - 60;
  const unit = ((relDay - 1) % 14) + 1;
  const grammarIdx = (relDay - 1) % GRAMMAR_TOPICS.length;
  const readingIdx = (relDay - 1) % B2_READINGS.length;
  const isWritingDay = relDay % 3 === 0;
  const isDictationDay = relDay % 3 === 1;
  const isShadowingDay = relDay % 3 === 2;

  const tasks: DayTask[] = [
    { id: `vocab-adv-${unit}`, label: `Flashcard từ nâng cao đơn vị ${unit}`, href: "/vocab", minutes: 20 },
    A2_GRAMMAR(GRAMMAR_TOPICS[grammarIdx].id, GRAMMAR_TOPICS[grammarIdx].name),
    REFLEX_5(),
  ];

  if (isDictationDay) tasks.push(DICTATION_1());
  if (isShadowingDay) tasks.push(SHADOWING_1());
  tasks.push(A2_READING(B2_READINGS[readingIdx], B2_READING_TITLES[readingIdx]));

  const output = isWritingDay
    ? { type: "writing" as const, label: `Viết báo cáo/tóm tắt ngày ${day}`, href: "/writing", minutes: 10 }
    : { type: "speaking" as const, label: `Nói tự do với AI ngày ${day}`, href: "/speaking", minutes: 10 };

  DAILY_LESSONS.push({
    day,
    level: "B2",
    goal: `Ngày ${day}: Từ vựng nâng cao + ${GRAMMAR_TOPICS[grammarIdx].name} + reflex B2`,
    tasks,
    output,
    totalMinutes: tasks.reduce((s, t) => s + t.minutes, 0) + output.minutes,
  });
}

// Phase 4: Days 91-120 (B2+) - Củng cố thực chiến
for (let day = 91; day <= 120; day++) {
  const relDay = day - 90;
  const unit = ((relDay - 1) % 14) + 1;
  const grammarIdx = (relDay - 1) % GRAMMAR_TOPICS.length;
  const readingIdx = (relDay - 1) % B2_READINGS.length;
  const isWritingDay = relDay % 3 === 0;
  const isDictationDay = relDay % 3 === 1;
  const isShadowingDay = relDay % 3 === 2;

  const tasks: DayTask[] = [
    { id: `vocab-b2p-${unit}`, label: `Flashcard từ B2+ đơn vị ${unit}`, href: "/vocab", minutes: 25 },
    A2_GRAMMAR(GRAMMAR_TOPICS[grammarIdx].id, GRAMMAR_TOPICS[grammarIdx].name),
    REFLEX_5(),
  ];

  if (isDictationDay) tasks.push(DICTATION_1());
  if (isShadowingDay) tasks.push(SHADOWING_1());
  tasks.push(A2_READING(B2_READINGS[readingIdx], B2_READING_TITLES[readingIdx]));

  const output = isWritingDay
    ? { type: "writing" as const, label: `Viết phân tích IT/BA ngày ${day}`, href: "/writing", minutes: 15 }
    : { type: "speaking" as const, label: `Nói trình bày B2+ ngày ${day}`, href: "/speaking", minutes: 15 };

  DAILY_LESSONS.push({
    day,
    level: "B2",
    goal: `Ngày ${day}: Từ vựng B2+ + ngữ pháp cao cấp + reflexB2 + viết/ngoại ngữ`,
    tasks,
    output,
    totalMinutes: tasks.reduce((s, t) => s + t.minutes, 0) + output.minutes,
  });
}

// Phase 5: Days 121-180 (B2) - Ứng dụng thế giới thực
for (let day = 121; day <= 180; day++) {
  const relDay = day - 120;
  const unit = ((relDay - 1) % 14) + 1;
  const grammarIdx = (relDay - 1) % GRAMMAR_TOPICS.length;
  const readingIdx = (relDay - 1) % B2_READINGS.length;
  const isWritingDay = relDay % 3 === 0;
  const isDictationDay = relDay % 3 === 1;
  const isShadowingDay = relDay % 3 === 2;

  const tasks: DayTask[] = [
    { id: `vocab-real-${unit}`, label: `Flashcard thế giới thực đơn vị ${unit}`, href: "/vocab", minutes: 30 },
    A2_GRAMMAR(GRAMMAR_TOPICS[grammarIdx].id, GRAMMAR_TOPICS[grammarIdx].name),
    REFLEX_5(),
  ];

  if (isDictationDay) tasks.push(DICTATION_1());
  if (isShadowingDay) tasks.push(SHADOWING_1());
  tasks.push(A2_READING(B2_READINGS[readingIdx], B2_READING_TITLES[readingIdx]));

  const output = isWritingDay
    ? { type: "writing" as const, label: `Viết báo cáo chuyên ngành ngày ${day}`, href: "/writing", minutes: 20 }
    : { type: "speaking" as const, label: `Nói thuyết trình B2 ngày ${day}`, href: "/speaking", minutes: 20 };

  DAILY_LESSONS.push({
    day,
    level: "B2",
    goal: `Ngày ${day}: Từ vựng thực tế + ngữ pháp ứng dụng + reflex B2 + viết/ngoại ngữ`,
    tasks,
    output,
    totalMinutes: tasks.reduce((s, t) => s + t.minutes, 0) + output.minutes,
  });
}

export function getDailyLesson(day: number): DailyLesson | undefined {
  return DAILY_LESSONS.find((l) => l.day === day);
}

export { DAILY_LESSONS };
