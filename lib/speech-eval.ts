import { diffWords } from "diff";

export type SpeechEval = {
  correct: boolean;
  ratio: number;
  spoken: string;
  expected: string;
};

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function words(text: string): string[] {
  const normalized = normalize(text);
  return normalized ? normalized.split(" ") : [];
}

/**
 * So sánh câu người học nói/gõ với câu gốc.
 * "Đúng" nghĩa là khớp toàn bộ, hoặc khớp >= 75% từ (cho phép nói lắp 1-2 từ).
 */
export function evaluateSpeech(expected: string, spoken: string): SpeechEval {
  const expectedWords = words(expected);
  const expectedNorm = expectedWords.join(" ");
  const spokenNorm = words(spoken).join(" ");

  if (expectedWords.length === 0) {
    return { correct: false, ratio: 0, spoken, expected };
  }

  if (expectedNorm === spokenNorm) {
    return { correct: true, ratio: 1, spoken, expected };
  }

  const parts = diffWords(expectedNorm, spokenNorm);
  let removed = 0;
  for (const part of parts) {
    if (part.removed) removed += words(part.value).length;
  }

  const ratio = Math.max(0, 1 - removed / expectedWords.length);
  const correct = ratio >= 0.75;

  return { correct, ratio, spoken, expected };
}