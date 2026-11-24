export type ReadingQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: number;
};

export type ReadingVocabularyItem = {
  word: string;
  ipa?: string;
  meaning: string;
  pos?: string;
};

export type ReadingExercise = {
  id: number;
  type: "fill_blank" | "synonym" | "error_correction";
  instruction: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
};

export type ReadingPassage = {
  id: string;
  level: string;
  title: string;
  titleVi: string;
  wordCount: number;
  text: string;
  questions: ReadingQuestion[];
  translation?: string;
  vocabulary?: ReadingVocabularyItem[];
  exercises?: ReadingExercise[];
  sentences?: string[];
};

export type ReadingProgress = {
  passageId: string;
  readAloud: boolean;
  comprehension: boolean;
  exercises: boolean;
  quizScore: number;
  totalQuestions: number;
  completedAt: string | null;
  status: "new" | "in_progress" | "completed";
};

export type DailyReadingAssignment = {
  date: string;
  passageIds: string[];
};

export const READING_LEVELS = ["A2", "B1", "B2"] as const;

export const READING_TAB_LABELS = {
  read_aloud: "Đọc to",
  comprehension: "Đọc hiểu + Bài tập",
} as const;