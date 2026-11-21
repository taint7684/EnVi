import DICTATION_LESSONS from "@/data/dictation-lessons.json";
import READING_PASSAGES from "@/data/reading-passages.json";

export type Milestone = "baseline" | "day30" | "day60" | "day90";

export const MILESTONE_LABEL: Record<Milestone, string> = {
  baseline: "Đánh giá đầu kỳ (Ngày 1)",
  day30: "Đánh giá mốc Ngày 30",
  day60: "Đánh giá mốc Ngày 60",
  day90: "Đánh giá mốc Ngày 90",
};

export const MILESTONE_LEVEL: Record<Milestone, "A2" | "B1" | "B2"> = {
  baseline: "A2",
  day30: "A2",
  day60: "B1",
  day90: "B2",
};

export type SkillResult = {
  skill: "listening" | "reading" | "speaking" | "writing";
  score: number; // 0..5 for listening/reading; rubric total for speaking/writing
  maxScore: number;
  percent: number;
  detail: string[];
};

export type AssessmentResult = {
  milestone: Milestone;
  date: string;
  level: "A2" | "B1" | "B2";
  skills: SkillResult[];
  totalPercent: number;
  estimatedLevel: "A1" | "A2" | "B1" | "B2" | "C1";
  notes: string;
};

export type AssessmentInput = {
  listeningAnswers: Record<number, number>; // question index -> option index
  readingAnswers: Record<number, number>;
  speakingRatings: Record<string, number>; // criterion -> 1..5
  speakingNote: string;
  writingText: string;
  writingRatings: Record<string, number>; // criterion -> 1..5
  writingNote: string;
};

// ---------- Listening questions (from dictation transcripts) ----------
function buildListeningQuestions(level: "A2" | "B1" | "B2") {
  const pool = DICTATION_LESSONS as Array<{
    id: string; title: string; titleVi?: string; level: string;
    transcript?: string; videoUrl?: string;
  }>;
  const filtered = pool.filter((l) => l.level === level);
  // pick 5 distinct lessons
  const picked: typeof filtered = [];
  const seen = new Set<string>();
  for (const l of filtered) {
    if (picked.length >= 5) break;
    if (!l.transcript || seen.has(l.id)) continue;
    seen.add(l.id);
    picked.push(l);
  }
  return picked.map((lesson, i) => {
    const words = lesson.transcript!.split(/\s+/);
    const target = words[Math.floor(Math.random() * words.length)].replace(/[.,!?]/g, "");
    const distractors = words
      .filter((w) => w !== target && w.length > 3)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const options = [target, ...distractors].sort(() => 0.5 - Math.random());
    return {
      key: `listening-${i}`,
      prompt: lesson.titleVi || lesson.title,
      options,
      answer: options.indexOf(target),
      audioUrl: lesson.videoUrl,
      transcript: lesson.transcript,
    };
  });
}

// ---------- Reading questions (from reading passages) ----------
function buildReadingQuestions(level: "A2" | "B1" | "B2") {
  const pool = READING_PASSAGES as Array<{
    id: string; title: string; titleVi?: string; level: string; text: string;
    questions: Array<{ id: number; question: string; options: string[]; answer: number }>;
  }>;
  const filtered = pool.filter((p) => p.level === level);
  const picked: typeof filtered = [];
  const seen = new Set<string>();
  for (const p of filtered) {
    if (picked.length >= 5) break;
    if (!p.questions?.length || seen.has(p.id)) continue;
    seen.add(p.id);
    picked.push(p);
  }
  return picked.map((passage, i) => {
    const q = passage.questions[0];
    return {
      key: `reading-${i}`,
      prompt: `${passage.titleVi || passage.title}\n${q.question}`,
      options: q.options,
      answer: q.answer,
      passage: passage.text,
    };
  });
}

// ---------- Rubrics ----------
export const SPEAKING_CRITERIA = [
  { id: "pronunciation", label: "Độ rõ phát âm", hint: "Nghe dễ hiểu, không mum đều" },
  { id: "fluency", label: "Mạch nói", hint: "Nói liền mạch, ít ngắt quãng" },
  { id: "interaction", label: "Tương tác / hỏi lại", hint: "Có hỏi ngược, xác nhận lại thông tin" },
  { id: "paraphrase", label: "Diễn đạt lại", hint: "Có thể diễn đạt ý bằng từ khác khi cần" },
  { id: "confidence", label: "Tự tin, ít sợ sai", hint: "Nói tiếp dù chưa chắc cú pháp" },
] as const;

export const WRITING_CRITERIA = [
  { id: "content", label: "Đủ ý, đạt yêu cầu", hint: "Trả lời hết các phần của đề" },
  { id: "organization", label: "Bố cục, mạch lạc", hint: "Có mở đầu, nội dung, kết thúc rõ ràng" },
  { id: "clarity", label: "Độ rõ, dễ hiểu", hint: "Ý nghĩa truyền đạt được, ít bị hiểu nhầm" },
  { id: "language", label: "Cách dùng ngôn ngữ", hint: "Từ vựng, ngữ pháp phù hợp người nhận" },
] as const;

export function ratingStars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

export function buildAssessment(milestone: Milestone) {
  const level = MILESTONE_LEVEL[milestone];
  const listening = buildListeningQuestions(level);
  const reading = buildReadingQuestions(level);
  return { milestone, level, listening, reading };
}

export function scoreAssessment(
  milestone: Milestone,
  input: AssessmentInput,
  listening: ReturnType<typeof buildListeningQuestions>,
  reading: ReturnType<typeof buildReadingQuestions>,
): AssessmentResult {
  const listeningScore = listening.reduce((acc, q, i) => {
    const chosen = input.listeningAnswers[i];
    return acc + (chosen !== undefined && chosen === q.answer ? 1 : 0);
  }, 0);
  const readingScore = reading.reduce((acc, q, i) => {
    const chosen = input.readingAnswers[i];
    return acc + (chosen !== undefined && chosen === q.answer ? 1 : 0);
  }, 0);

  const speakingTotal = SPEAKING_CRITERIA.reduce(
    (acc, c) => acc + (input.speakingRatings[c.id] ?? 0),
    0,
  );
  const writingTotal = WRITING_CRITERIA.reduce(
    (acc, c) => acc + (input.writingRatings[c.id] ?? 0),
    0,
  );

  const skills: SkillResult[] = [
    {
      skill: "listening",
      score: listeningScore,
      maxScore: listening.length,
      percent: Math.round((listeningScore / listening.length) * 100),
      detail: listening.map((q, i) => {
        const ok =
          input.listeningAnswers[i] !== undefined &&
          input.listeningAnswers[i] === q.answer;
        return `${ok ? "✅" : "❌"} ${q.prompt}`;
      }),
    },
    {
      skill: "reading",
      score: readingScore,
      maxScore: reading.length,
      percent: Math.round((readingScore / reading.length) * 100),
      detail: reading.map((q, i) => {
        const ok =
          input.readingAnswers[i] !== undefined &&
          input.readingAnswers[i] === q.answer;
        return `${ok ? "✅" : "❌"} ${q.prompt.split("\n").pop()}`;
      }),
    },
    {
      skill: "speaking",
      score: speakingTotal,
      maxScore: SPEAKING_CRITERIA.length * 5,
      percent: Math.round((speakingTotal / (SPEAKING_CRITERIA.length * 5)) * 100),
      detail: SPEAKING_CRITERIA.map(
        (c) => `${ratingStars(input.speakingRatings[c.id] ?? 0)} ${c.label}`,
      ),
    },
    {
      skill: "writing",
      score: writingTotal,
      maxScore: WRITING_CRITERIA.length * 5,
      percent: Math.round((writingTotal / (WRITING_CRITERIA.length * 5)) * 100),
      detail: WRITING_CRITERIA.map(
        (c) => `${ratingStars(input.writingRatings[c.id] ?? 0)} ${c.label}`,
      ),
    },
  ];

  const totalPercent = Math.round(
    skills.reduce((sum, s) => sum + s.percent, 0) / skills.length,
  );

  let estimatedLevel: AssessmentResult["estimatedLevel"] = "A1";
  if (totalPercent >= 90) estimatedLevel = "C1";
  else if (totalPercent >= 75) estimatedLevel = "B2";
  else if (totalPercent >= 60) estimatedLevel = "B1";
  else if (totalPercent >= 40) estimatedLevel = "A2";
  else estimatedLevel = "A1";

  const weakSkill = skills
    .filter((s) => s.skill !== "listening" && s.skill !== "reading")
    .sort((a, b) => a.percent - b.percent)[0];
  const notes =
    input.speakingNote || input.writingNote
      ? `Ghi chú: ${input.speakingNote} | ${input.writingNote}`.slice(0, 300)
      : weakSkill
        ? `Nên luyện thêm: ${weakSkill.skill} (${weakSkill.percent}%).`
        : "Tất cả kỹ năng đã đạt mức ổn định.";

  return {
    milestone,
    date: new Date().toISOString().split("T")[0],
    level: MILESTONE_LEVEL[milestone],
    skills,
    totalPercent,
    estimatedLevel,
    notes,
  };
}

export function levelLabel(l: AssessmentResult["estimatedLevel"]) {
  return {
    A1: "A1 - Người bắt đầu",
    A2: "A2 - Nguyên tố",
    B1: "B1 - Trung cấp",
    B2: "B2 - Trung cấp nâng cao",
    C1: "C1 - Thành thạo",
  }[l];
}

export const STORAGE_KEY = (milestone: Milestone) =>
  `envi_assessment_${milestone}`;

export function loadAssessment(milestone: Milestone): AssessmentResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY(milestone));
    return raw ? (JSON.parse(raw) as AssessmentResult) : null;
  } catch {
    return null;
  }
}

export function saveAssessment(result: AssessmentResult) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY(result.milestone), JSON.stringify(result));
}
