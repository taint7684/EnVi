import { fsrs, createEmptyCard, generatorParameters, Rating, State, type Card, type FSRSParameters } from "ts-fsrs";

import type { ReviewGrade } from "@/lib/types";

let _params: FSRSParameters | null = null;
function params(): FSRSParameters {
  if (!_params) _params = generatorParameters({ request_retention: 0.9 });
  return _params;
}

let _fsrs: ReturnType<typeof fsrs> | null = null;
function f(): ReturnType<typeof fsrs> {
  if (!_fsrs) _fsrs = fsrs(params());
  return _fsrs;
}

const GRADE_TO_RATING: Record<ReviewGrade, Rating> = {
  again: Rating.Again,
  hard: Rating.Hard,
  good: Rating.Good,
  easy: Rating.Easy,
};

export type FsrsCard = Card;

export function newCard(now = new Date()): FsrsCard {
  return createEmptyCard(now);
}

export function rowToCard(row: {
  stability?: number;
  difficulty?: number;
  state?: number;
  due_at: string;
  reps?: number;
  lapses?: number;
  elapsed_days?: number;
  scheduled_days?: number;
  learning_steps?: number;
  last_reviewed_at?: string | null;
}): FsrsCard {
  return {
    due: new Date(row.due_at),
    stability: row.stability ?? 0,
    difficulty: row.difficulty ?? 0,
    elapsed_days: row.elapsed_days ?? 0,
    scheduled_days: row.scheduled_days ?? 0,
    reps: row.reps ?? 0,
    lapses: row.lapses ?? 0,
    learning_steps: row.learning_steps ?? 0,
    state: (row.state ?? 0) as State,
    last_review: row.last_reviewed_at ? new Date(row.last_reviewed_at) : undefined,
  };
}

export function repeatCard(card: FsrsCard, grade: ReviewGrade, now = new Date()) {
  const record = f().repeat(card, now) as unknown as Record<string, { card: FsrsCard }>;
  const key = String(GRADE_TO_RATING[grade]);
  return record[key]!.card;
}

export function cardToRow(card: FsrsCard, now = new Date()) {
  return {
    stability: card.stability,
    difficulty: card.difficulty,
    state: card.state,
    elapsed_days: card.elapsed_days,
    scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps,
    interval: Math.round(card.scheduled_days),
    due_at: card.due.toISOString(),
    reps: card.reps,
    lapses: card.lapses,
    last_reviewed_at: card.last_review ? card.last_review.toISOString() : now.toISOString(),
  };
}

export function isPracticeGrade(grade: ReviewGrade): boolean {
  return grade === "again" || grade === "hard";
}

export { Rating, State };