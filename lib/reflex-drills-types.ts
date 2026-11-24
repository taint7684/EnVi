export type ReflexPhrase = {
  id: string;
  day: number;
  vi_text: string;
  en_text: string;
  situation_en: string;
  keywords: string[];
  level: string;
  topic: string;
};

export type SessionMode = "morning" | "noon" | "evening" | "review5";

export type ReflexGrade = "got_it" | "slow" | "forgot";

export const MODE_LABELS: Record<SessionMode, string> = {
  morning: "Sáng · Học mới",
  noon: "Trưa · Ôn bài",
  evening: "Tối · Ôn nhanh",
  review5: "Ôn 5 ngày",
};

export const GRADE_LABELS: Record<ReflexGrade, string> = {
  got_it: "Bật ra được",
  slow: "Còn chậm",
  forgot: "Chưa nhớ",
};

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function getPhrasesByDay(phrases: ReflexPhrase[], day: number): ReflexPhrase[] {
  return phrases.filter((p) => p.day === day);
}

export function getDays(phrases: ReflexPhrase[]): number[] {
  return [...new Set(phrases.map((p) => p.day))].sort((a, b) => a - b);
}

export function getSessionPhrases(
  phrases: ReflexPhrase[],
  mode: SessionMode,
  day: number,
): ReflexPhrase[] {
  if (mode === "morning" || mode === "noon") return getPhrasesByDay(phrases, day);
  if (mode === "evening") return shuffle([...getPhrasesByDay(phrases, day)]);
  // review5: all phrases from the last 5 days
  const days = getDays(phrases);
  const dayIndex = days.indexOf(day);
  const startDay = Math.max(0, dayIndex - 4);
  const relevantDays = days.slice(startDay, dayIndex + 1);
  return shuffle(phrases.filter((p) => relevantDays.includes(p.day)));
}