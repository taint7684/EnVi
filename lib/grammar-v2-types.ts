export type TranslationQuestion = {
  id: string;
  topic_id: string;
  topic_name: string;
  topic_name_vi: string;
  exercise_type: "translation";
  vi: string;
  hints: string[];
  answer: string;
  alternatives: string[];
  explanation_vi: string;
  index: number;
};

export type ErrorCorrectionQuestion = {
  id: string;
  topic_id: string;
  topic_name: string;
  topic_name_vi: string;
  exercise_type: "error_correction";
  sentence: string;
  error_part: string;
  correct_part: string;
  corrected: string;
  explanation_vi: string;
  index: number;
};

export type VerbConjugationQuestion = {
  id: string;
  topic_id: string;
  topic_name: string;
  topic_name_vi: string;
  exercise_type: "verb_conjugation";
  sentence: string;
  blanks: { word: string; answer: string }[];
  full: string;
  explanation_vi: string;
  index: number;
};

export type MindMapBranch = {
  meaning: string;
  when: string;
  formula: Record<string, string>;
  examples: string[];
  confusions: string[];
  common_errors: string[];
};

export type MindMap = {
  topic_id: string;
  data: MindMapBranch;
};

export type GrammarV2Question = TranslationQuestion | ErrorCorrectionQuestion | VerbConjugationQuestion;

// Answer checking for translation
export function checkTranslation(userAnswer: string, correctAnswer: string, alternatives: string[]): { correct: boolean; needsReview: boolean } {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
  const user = normalize(userAnswer);
  const correct = normalize(correctAnswer);
  const allCorrect = [correctAnswer, ...alternatives].map(normalize);

  if (user === correct || allCorrect.some((a) => user === a)) return { correct: true, needsReview: false };

  const userWords = user.split(" ");
  const correctWords = correct.split(" ");
  if (Math.abs(userWords.length - correctWords.length) <= 2) {
    const commonWords = userWords.filter((w) => correctWords.includes(w)).length;
    if (commonWords / Math.max(userWords.length, correctWords.length) > 0.7) {
      return { correct: false, needsReview: true };
    }
  }

  return { correct: false, needsReview: false };
}

// Answer checking for error correction
export function checkErrorCorrection(userAnswer: string, correctAnswer: string): { correct: boolean } {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
  return { correct: normalize(userAnswer) === normalize(correctAnswer) };
}

// Answer checking for verb conjugation
export function checkVerbConjugation(userAnswers: string[], blanks: { answer: string }[]): { correct: boolean; perBlank: boolean[] } {
  const normalize = (s: string) => s.toLowerCase().trim();
  const perBlank = blanks.map((b, i) => normalize(userAnswers[i] ?? "") === normalize(b.answer));
  return { correct: perBlank.every(Boolean), perBlank };
}