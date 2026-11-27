/**
 * Chấm điểm bài nói/nghe dựa trên văn bản (không cần framework) — dùng chung cho
 * Dictation (8.9), Shadowing (8.8), Pronunciation (8.10).
 */

const CONTRACTIONS: Record<string, string> = {
  "i'm": "i am",
  "you're": "you are",
  "we're": "we are",
  "they're": "they are",
  "he's": "he is",
  "she's": "she is",
  "it's": "it is",
  "that's": "that is",
  "what's": "what is",
  "let's": "let us",
  "i've": "i have",
  "i'll": "i will",
  "don't": "do not",
  "doesn't": "does not",
  "didn't": "did not",
  "can't": "cannot",
  "won't": "will not",
  "isn't": "is not",
  "aren't": "are not",
  "wasn't": "was not",
  "weren't": "were not",
};

export function normalizeWords(text: string): string[] {
  const lowered = text.toLowerCase().replace(/[’‘]/g, "'");
  const expanded = lowered.replace(/\b[a-z']+\b/g, (w) => CONTRACTIONS[w] ?? w);
  return expanded
    .replace(/[^a-z0-9'\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 0);
}

export type WordResult = {
  word: string;
  ok: boolean;
};

export type DictationScore = {
  score: number; // 0..100
  correct: number;
  total: number;
  percent: number; // 0..1
  results: WordResult[];
};

/** Chấm Dictation: so khớp từng từ theo đúng thứ tự (target là đáp án). */
export function scoreDictation(userText: string, targetText: string): DictationScore {
  const target = normalizeWords(targetText);
  const spoken = normalizeWords(userText);
  const total = target.length;
  const results: WordResult[] = [];
  let correct = 0;
  for (let i = 0; i < total; i++) {
    const ok = (spoken[i] ?? "") === target[i]!;
    if (ok) correct += 1;
    results.push({ word: target[i]!, ok });
  }
  const percent = total > 0 ? correct / total : 0;
  return {
    score: Math.round(percent * 100),
    correct,
    total,
    percent: Math.round(percent * 1000) / 1000,
    results,
  };
}

export type ShadowingScore = {
  score: number; // 0..1
  accuracy: number; // 0..1
  timing: number; // 0..1
};

/**
 * Chấm Shadowing: 0.7 × accuracy (khớp từ) + 0.3 × (1 − lệch thời lượng).
 * refDurationSec/userDurationSec để đánh giá nhịp điệu.
 */
export function scoreShadowing(
  spokenText: string,
  targetText: string,
  userDurationSec: number,
  refDurationSec: number,
): ShadowingScore {
  const accuracy = scoreDictation(spokenText, targetText).percent;
  let timing = 1;
  if (refDurationSec > 0 && userDurationSec > 0) {
    const diff = Math.abs(userDurationSec - refDurationSec) / refDurationSec;
    timing = Math.max(0, 1 - Math.min(diff, 1));
  }
  const score = 0.7 * accuracy + 0.3 * timing;
  return {
    score: Math.round(score * 1000) / 1000,
    accuracy: Math.round(accuracy * 1000) / 1000,
    timing: Math.round(timing * 1000) / 1000,
  };
}

export type IntelligibilityResult = {
  score: number; // 0..100
  percent: number; // 0..1
  total: number;
  correct: number;
  results: WordResult[];
};

/**
 * Chấm phát âm (intelligibility) bằng cách so từ Whisper nhận được với văn bản mục tiêu.
 * Từ bị nhận sai → gợi ý trọng tâm phát âm (ending_s/ed, âm cuối...).
 */
export function scoreIntelligibility(spokenText: string, targetText: string): IntelligibilityResult {
  const d = scoreDictation(spokenText, targetText);
  return {
    score: d.score,
    percent: d.percent,
    total: d.total,
    correct: d.correct,
    results: d.results,
  };
}

/** Map từ bị nhận sai sang trọng tâm phát âm gợi ý. */
export function suggestFocus(missedWord: string): string | null {
  const w = missedWord.toLowerCase();
  if (w.endsWith("ed")) return "ending_ed";
  if (w.endsWith("s") || w.endsWith("es")) return "ending_s";
  if (w.includes("th")) return "th";
  return null;
}