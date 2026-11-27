import { FSRS, type CardInput, type FSRSParameters, type Grade } from "ts-fsrs";

type ReviewGrade = "again" | "hard" | "good" | "easy";

interface CardState {
  due: Date;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 0 | 1 | 2 | 3;
  last_review: Date | null;
}

export interface DbCardState {
  due: string;
  stability: number;
  difficulty: number;
  elapsed_days: number;
  scheduled_days: number;
  reps: number;
  lapses: number;
  state: 0 | 1 | 2 | 3;
  last_review: string | null;
}

interface SchedulerInput {
  phraseId: string;
  currentState: CardState | null;
  grade: ReviewGrade;
  latencyMs: number;
  meaningScore: number;
  now?: Date;
}

interface SchedulerOutput {
  nextState: CardState;
  intervalDays: number;
  nextReview: Date;
}

/**
 * FSRS Scheduler for Reflex Review
 * Combines FSRS algorithm with latency-based adjustments
 * 
 * Grade mapping:
 * - "again" (0) -> Grade.Again (1)
 * - "hard" (1) -> Grade.Hard (2)  
 * - "good" (2) -> Grade.Good (3)
 * - "easy" (3) -> Grade.Easy (4)
 */

const GRADE_TO_GRADE: Record<ReviewGrade, Grade> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4,
};

// Default FSRS parameters (will be optimized per user over time)
const DEFAULT_FSRS_PARAMS: Partial<FSRSParameters> = {
  w: [
    0.4, 0.6, 2.4, 5.8, 4.93, 0.94, 0.86, 0.01, 1.49, 0.14,
    0.94, 2.18, 0.05, 0.34, 1.26, 0.29, 2.61,
  ],
};

const fsrs = new FSRS(DEFAULT_FSRS_PARAMS);

function createInitialState(now: Date): CardState {
  return {
    due: now,
    stability: 0,
    difficulty: 0,
    elapsed_days: 0,
    scheduled_days: 0,
    reps: 0,
    lapses: 0,
    state: 0,
    last_review: null,
  };
}

function cardStateToFsrsCard(state: CardState): CardInput {
  return {
    due: state.due,
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsed_days,
    scheduled_days: state.scheduled_days,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state,
    last_review: state.last_review,
    learning_steps: 0,
  };
}

/**
 * Calculate latency factor based on response time
 * Faster responses get a boost, slower get a penalty
 */
function calculateLatencyFactor(latencyMs: number, grade: ReviewGrade): number {
  const latencySec = latencyMs / 1000;
  
  // Base thresholds for reflex responses
  const FAST_THRESHOLD = 2;    // 2 seconds = fast reflex
  const GOOD_THRESHOLD = 4;    // 4 seconds = good
  const SLOW_THRESHOLD = 6;    // 6 seconds = slow
  
  let factor = 1.0;
  
  if (latencySec <= FAST_THRESHOLD) {
    // Fast reflex: boost stability gain
    factor = 1.2;
  } else if (latencySec <= GOOD_THRESHOLD) {
    // Good speed: slight boost
    factor = 1.1;
  } else if (latencySec <= SLOW_THRESHOLD) {
    // Slow: slight penalty
    factor = 0.95;
  } else {
    // Very slow: penalty
    factor = 0.85;
  }
  
  // If user got it wrong, latency doesn't help
  if (grade === "again") {
    factor = Math.min(factor, 0.9);
  }
  
  return factor;
}

/**
 * Calculate meaning score factor
 * meaningScore: 0 = wrong meaning, 1 = correct meaning
 */
function calculateMeaningFactor(meaningScore: number, grade: ReviewGrade): number {
  if (meaningScore >= 1) {
    // Meaning correct: boost
    return 1.1;
  }
  // Meaning incorrect: penalty, especially if user thought they got it right
  if (grade === "easy" || grade === "good") {
    return 0.7; // User confident but meaning wrong
  }
  return 0.9;
}

/**
 * Main scheduler function
 * Returns next review state and interval
 */
export function scheduleReflexReview(input: SchedulerInput): SchedulerOutput {
  const { currentState, grade, latencyMs, meaningScore, now = new Date() } = input;
  
  // Get or create card state
  const card = currentState ? { ...currentState } : createInitialState(now);
  
  // Convert to FSRS card format
  const fsrsCard = cardStateToFsrsCard(card);
  
  // Get base FSRS scheduling
  const fsrsGrade = GRADE_TO_GRADE[grade];
  const { card: nextCard } = fsrs.next(fsrsCard, now, fsrsGrade);
  
  // Apply latency and meaning factors to stability
  const latencyFactor = calculateLatencyFactor(latencyMs, grade);
  const meaningFactor = calculateMeaningFactor(meaningScore, grade);
  const combinedFactor = latencyFactor * meaningFactor;
  
  // Adjust stability based on factors
  const adjustedStability = nextCard.stability * combinedFactor;
  
  // Calculate next interval in days
  const intervalDays = Math.max(1, Math.round(adjustedStability));
  const nextReview = new Date(now);
  nextReview.setDate(nextReview.getDate() + intervalDays);
  
  // Build next state
  const nextState: CardState = {
    due: nextReview,
    stability: adjustedStability,
    difficulty: nextCard.difficulty,
    elapsed_days: nextCard.elapsed_days,
    scheduled_days: intervalDays,
    reps: nextCard.reps,
    lapses: nextCard.lapses,
    state: nextCard.state,
    last_review: now,
  };
  
  return {
    nextState,
    intervalDays,
    nextReview,
  };
}

/**
 * Get initial review state for a new phrase
 */
export function getInitialReflexState(phraseId: string, now = new Date()): CardState {
  return createInitialState(now);
}

/**
 * Convert database stored state to CardState
 */
export function dbToCardState(data: DbCardState | null): CardState | null {
  if (!data) return null;
  return {
    due: new Date(data.due),
    stability: data.stability,
    difficulty: data.difficulty,
    elapsed_days: data.elapsed_days,
    scheduled_days: data.scheduled_days,
    reps: data.reps,
    lapses: data.lapses,
    state: data.state,
    last_review: data.last_review ? new Date(data.last_review) : null,
  };
}

/**
 * Convert CardState to database format
 */
export function cardStateToDb(state: CardState): DbCardState {
  return {
    due: state.due.toISOString(),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: state.elapsed_days,
    scheduled_days: state.scheduled_days,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state,
    last_review: state.last_review?.toISOString() ?? null,
  };
}

/**
 * Convert PhraseReviewRow to DbCardState
 */
export function phraseReviewRowToDbCardState(row: { due_at: string; stability?: number; difficulty?: number; elapsed_days?: number; scheduled_days?: number; reps: number; lapses: number; ease?: number; interval?: number; last_reviewed_at: string | null }): DbCardState {
  // Map PhraseReviewRow fields to DbCardState
  // PhraseReviewRow uses ease/interval, DbCardState uses stability/difficulty
  const stability = row.stability ?? (row.ease ? (row.ease - 1.3) * 10 : 25);
  const difficulty = row.difficulty ?? (row.ease ? 10 - row.ease : 5);
  
  return {
    due: row.due_at,
    stability,
    difficulty,
    elapsed_days: row.elapsed_days ?? (row.interval || 0),
    scheduled_days: row.scheduled_days ?? (row.interval || 0),
    reps: row.reps,
    lapses: row.lapses,
    state: 0, // Default to new
    last_review: row.last_reviewed_at,
  };
}

/**
 * Get phrases due for review
 */
export function getDuePhrases(phrases: Array<{ id: string; fsrs_state: DbCardState }>, now = new Date()): string[] {
  return phrases
    .filter(p => {
      const state = dbToCardState(p.fsrs_state);
      if (!state) return true; // New phrase, due for review
      return state.due <= now;
    })
    .map(p => p.id);
}

/**
 * Calculate review priority for sorting
 * Lower = higher priority
 */
export function calculateReviewPriority(state: CardState, now = new Date()): number {
  const overdueDays = Math.max(0, (now.getTime() - state.due.getTime()) / (1000 * 60 * 60 * 24));
  const stabilityFactor = state.stability > 0 ? 1 / state.stability : 10;
  return overdueDays * 10 + stabilityFactor;
}

export type { CardState, ReviewGrade, SchedulerInput, SchedulerOutput };