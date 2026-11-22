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

/**
 * Cham diem Reflex voi nhieu cau tra loi dung (en_text + en_alternatives).
 * Neu khop >= 0.75 voi bat ky cau nao -> correct.
 * Neu khong khop nhung du tu khoa -> can AI judge "cung nghia?".
 */
export function evaluateReflexSpeech(input: {
  enText: string;
  alternatives: string[] | null;
  keywords: string[] | null;
  spoken: string;
}): { correct: boolean; ratio: number; needsAiJudge: boolean } {
  const { enText, alternatives, keywords, spoken } = input;
  const candidates = [enText, ...(alternatives ?? []).filter(Boolean)];

  let bestRatio = 0;
  for (const candidate of candidates) {
    const evalResult = evaluateSpeech(candidate, spoken);
    if (evalResult.ratio > bestRatio) bestRatio = evalResult.ratio;
    if (evalResult.correct) {
      return { correct: true, ratio: evalResult.ratio, needsAiJudge: false };
    }
  }

  // Khong khop lexical, kiem tra keywords
  const spokenWords = words(spoken);
  const matchedKeywords = (keywords ?? []).filter((kw) =>
    spokenWords.some((w) => w === kw.toLowerCase() || w.includes(kw.toLowerCase())),
  );
  const needsAiJudge =
    keywords != null && keywords.length > 0 && matchedKeywords.length >= Math.ceil(keywords.length * 0.5);

  return { correct: false, ratio: bestRatio, needsAiJudge };
}

/**
 * Xac dinh muc do prompt ladder cho Reflex dua tren difficulty.
 * L1 (A1/A2): hien tieng Viet, dich sang tieng Anh.
 * L2 (B1): hien tinh huong tieng Anh (situation_en).
 * L3 (B2): hien cau hoi Q&A (situation_en nhu cau hoi).
 */
export function getReflexLevel(difficulty: string | null): "L1" | "L2" | "L3" {
  if (!difficulty) return "L2";
  const d = difficulty.toUpperCase();
  if (d === "A1" || d === "A2") return "L1";
  if (d === "B1") return "L2";
  return "L3";
}