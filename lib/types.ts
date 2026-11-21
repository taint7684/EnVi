export type ReviewGrade = "again" | "hard" | "good" | "easy";

export type WordRow = {
  id: string;
  lemma: string;
  ipa: string | null;
  pos: string | null;
  meaning_vi: string;
  example_en: string | null;
  example_vi: string | null;
  image_url: string | null;
  audio_url: string | null;
  topic: string | null;
  frequency_rank: number | null;
  source: string | null;
  needs_review: boolean;
  created_at: string;
  cefr_level?: string | null;
};

export type CardReviewRow = {
  id: string;
  user_id: string;
  word_id: string;
  ease: number;
  interval: number;
  due_at: string;
  reps: number;
  lapses: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CardReviewRowInsert = {
  user_id: string;
  word_id: string;
  ease: number;
  interval: number;
  due_at: string;
  reps: number;
  lapses: number;
  last_reviewed_at: string;
};

export type DueCard = {
  word: WordRow;
  review: CardReviewRow | null;
};

export type DueCount = {
  due: number;
  new: number;
  total: number;
};

export type PhraseRow = {
  id: string;
  vi_text: string;
  en_text: string;
  audio_url: string | null;
  topic: string;
  difficulty: string;
  created_at: string;
};

export type PhraseReviewRow = {
  id: string;
  user_id: string;
  phrase_id: string;
  ease: number;
  interval: number;
  due_at: string;
  reps: number;
  lapses: number;
  last_reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PhraseReviewRowInsert = {
  user_id: string;
  phrase_id: string;
  ease: number;
  interval: number;
  due_at: string;
  reps: number;
  lapses: number;
  last_reviewed_at: string;
};

export type DuePhrase = {
  phrase: PhraseRow;
  review: PhraseReviewRow | null;
};

export type StudyTaskType =
  | "vocab"
  | "reflex"
  | "speaking"
  | "writing"
  | "dictation"
  | "grammar"
  | "progress-test"
  | "streak";

export type StudyTask = {
  id: StudyTaskType;
  title: string;
  type: StudyTaskType;
  url: string;
  estimatedMinutes: number;
  isUrgent: boolean;
};

export type DailyStudyPlan = {
  priority: string[];
  targetMinutes: number;
  tasks: StudyTask[];
  completedTaskIds: string[];
  bonusAwarded: boolean;
};

export type LearningSnapshot = {
  wordsLearned: number;
  totalWords: number;
  wordsCompletion: number;
  reflexLearned: number;
  totalPhrases: number;
  reflexAccuracy: number;
  lastTestPercent: number | null;
  testTrend: "up" | "down" | "same" | "none";
  streak: number;
  xp: number;
  level: number;
  weakAreas: string[];
  summaryText: string;
};

export type WritingFeedback = {
  overall_vi: string;
  errors: { error: string; correction: string; explanation_vi: string }[];
  improved_version: string;
  key_phrases: string[];
};

export type WritingDraftRow = {
  id: string;
  user_id: string;
  prompt_id: string;
  level: string;
  draft_text: string;
  revised_text: string | null;
  feedback_json: WritingFeedback | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
};