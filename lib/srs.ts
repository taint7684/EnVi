// import "server-only"; // Removed for testing - this is a pure logic module

import { Card, Scheduler } from "@open-spaced-repetition/sm-2";

import type {
  CardReviewRow,
  CardReviewRowInsert,
  ReviewGrade,
} from "@/lib/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export const GRADE_TO_SM2: Record<ReviewGrade, number> = {
  again: 1,
  hard: 4,
  good: 5,
  easy: 5,
};

export function createNewCard(now = new Date()): Card {
  return new Card(Date.now(), 0, 2.5, 0, now, false);
}

export function rowToCard(row: CardReviewRow): Card {
  return new Card(
    Date.now(),
    row.reps,
    row.ease,
    row.interval,
    new Date(row.due_at),
    false,
  );
}

export function reviewCard(card: Card, grade: ReviewGrade, now = new Date()) {
  const result = Scheduler.reviewCard(card, GRADE_TO_SM2[grade], now);

  if (grade === "easy") {
    result.card.I = Math.max(result.card.I + 1, Math.ceil(result.card.I * 1.3));
    result.card.due = new Date(now.getTime() + result.card.I * MS_PER_DAY);
  }

  return result;
}

export function cardToRow(
  userId: string,
  wordId: string,
  card: Card,
  prevLapses: number,
  grade: ReviewGrade,
  now = new Date(),
): CardReviewRowInsert {
  return {
    user_id: userId,
    word_id: wordId,
    ease: card.EF,
    interval: card.I,
    due_at: card.due.toISOString(),
    reps: card.n,
    lapses: prevLapses + (grade === "again" ? 1 : 0),
    last_reviewed_at: now.toISOString(),
  };
}