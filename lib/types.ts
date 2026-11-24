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
  chunk_index: number | null;
  triage_status: string | null;
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
  stability?: number;
  difficulty?: number;
  state?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  learning_steps?: number;
  last_review?: string | null;
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
  stability?: number;
  difficulty?: number;
  state?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  learning_steps?: number;
  last_review?: string | null;
};

export type VocabSessionState = {
  new_words_count: number;
  group_size: number;
  current_position: number;
  group_started_at: string | null;
  difficult_word_ids: string[];
  practice_queue: string[];
};

export type CollocationInfo = {
  collocation: string;
  example_en: string;
  example_vi: string;
};

export type DueCard = {
  word: WordRow;
  review: CardReviewRow | null;
  collocation?: CollocationInfo | null;
};

export type DueCount = {
  due: number;
  new: number;
  total: number;
};

export type DueSessionState =
  | { status: "has_due"; dueCount: number; newCount: number }
  | { status: "has_new_only"; newCount: number }
  | { status: "exhausted"; newCount: number };

export type PhraseRow = {
  id: string;
  vi_text: string;
  en_text: string;
  audio_url: string | null;
  topic: string;
  difficulty: string;
  level: string | null;
  en_alternatives: string[] | null;
  situation_en: string | null;
  keywords: string[] | null;
  reflex_reviewed: boolean;
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
  | "streak"
  | "warmup"
  | "makeup"
  | "fluency"
  | "srs"
  | "listen"
  | "vocab_new"
  | "pronunciation"
  | "rotate";

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

export type ActivityEvent = {
  id: string;
  user_id: string;
  type: string;
  block_type?: string;
  ref_id?: string;
  duration_sec: number;
  speech_sec: number;
  meta: Json;
  study_date: string;
  created_at: string;
};

export type XpLedgerRow = {
  id: string;
  user_id: string;
  amount: number;
  reason: string;
  ref_id: string;
  created_at: string;
};

export type StreakRow = {
  user_id: string;
  current: number;
  longest: number;
  last_study_date: string | null;
  freezes_used_month: number;
  updated_at: string;
};

export type DailyPlanRow = {
  user_id: string;
  study_date: string;
  budget: number;
  blocks: Json;
  completed_at: string | null;
};

export type DailySummaryRow = {
  user_id: string;
  study_date: string;
  minutes: number;
  speech_minutes: number;
  xp: number;
};

export type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
