export type SpeakingStep = 1 | 2 | 3 | 4 | 5;

export type SpeakingNextAction =
  | "ask_question"
  | "request_retry"
  | "wrap_up"
  | "done";

export type SpeakingMode = "topic" | "freespeak";

export type SpeakingError = {
  error: string;
  correction: string;
  explanation_vi: string;
};

export type SpeakingTurnResult = {
  step: SpeakingStep;
  ai_response_en: string;
  feedback_vi: string;
  understood: boolean;
  errors: SpeakingError[];
  improved_answer: string;
  next_action: SpeakingNextAction;
  top_errors: string[];
  key_phrases: string[];
  reflex_questions: string[];
  mode?: SpeakingMode;
};

export type SpeakingHistoryTurn = {
  step: number;
  question: string | null;
  user_answer_text: string | null;
};

export type SpeakingTurnRow = {
  id: string;
  session_id: string;
  user_id: string;
  step: number;
  question: string | null;
  user_answer_text: string | null;
  audio_url: string | null;
  feedback_json: SpeakingTurnResult | null;
  improved_answer: string | null;
  created_at: string;
};

export type SpeakingSessionRow = {
  id: string;
  user_id: string;
  topic_id: string | null;
  started_at: string;
  ended_at: string | null;
  created_at: string;
};