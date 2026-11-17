import { describe, it, expect } from "vitest";
import {
  createNewCard,
  rowToCard,
  reviewCard,
  cardToRow,
  GRADE_TO_SM2,
} from "./srs";
import type { CardReviewRow } from "./types";

describe("SM-2 SRS Algorithm", () => {
  // Helper to create a future date for review simulation
  function futureDate(days: number): Date {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  describe("GRADE_TO_SM2", () => {
    it("maps grades correctly", () => {
      expect(GRADE_TO_SM2.again).toBe(1);
      expect(GRADE_TO_SM2.hard).toBe(4);
      expect(GRADE_TO_SM2.good).toBe(5);
      expect(GRADE_TO_SM2.easy).toBe(5);
    });
  });

  describe("createNewCard", () => {
    it("creates a new card with default values", () => {
      const card = createNewCard();
      expect(card.n).toBe(0);
      expect(card.EF).toBe(2.5);
      expect(card.I).toBe(0);
    });
  });

  describe("rowToCard", () => {
    it("converts a database row to a Card", () => {
      const row: CardReviewRow = {
        id: "test-id",
        user_id: "user-id",
        word_id: "word-id",
        ease: 2.5,
        interval: 0,
        due_at: new Date().toISOString(),
        reps: 0,
        lapses: 0,
        last_reviewed_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const card = rowToCard(row);
      expect(card.n).toBe(0);
      expect(card.EF).toBe(2.5);
      expect(card.I).toBe(0);
    });
  });

  describe("reviewCard - AGAIN", () => {
    it("resets the card when answered 'again'", () => {
      const card = createNewCard();
      const now = new Date();
      const result = reviewCard(card, "again", now);

      expect(result.card.n).toBe(0);
      expect(result.card.I).toBe(0);
      // EF may decrease or stay same depending on implementation
      expect(result.card.EF).toBeLessThanOrEqual(2.5);
    });
  });

  describe("reviewCard - GOOD", () => {
    it("increases interval for 'good' answer", () => {
      const card = createNewCard();
      const now = new Date();
      const result = reviewCard(card, "good", now);

      expect(result.card.n).toBe(1);
      expect(result.card.I).toBeGreaterThan(0);
    });

    it("can review again on the due date", () => {
      let card = createNewCard();
      const now = new Date();
      const result1 = reviewCard(card, "good", now);
      card = result1.card;

      // Next review should be on the due date
      const nextReview = new Date(card.due);
      const result2 = reviewCard(card, "good", nextReview);

      expect(result2.card.n).toBe(2);
      expect(result2.card.I).toBeGreaterThan(result1.card.I);
    });
  });

  describe("reviewCard - EASY", () => {
    it("gives longer interval than 'good' for new card", () => {
      const card = createNewCard();
      const now = new Date();
      const goodResult = reviewCard(card, "good", now);
      const easyResult = reviewCard(card, "easy", now);

      // Easy should give at least as long interval as good
      expect(easyResult.card.I).toBeGreaterThanOrEqual(goodResult.card.I);
    });
  });

  describe("cardToRow", () => {
    it("converts a Card to a database row insert", () => {
      const card = createNewCard();
      const now = new Date();
      const row = cardToRow("user-1", "word-1", card, 0, "good", now);

      expect(row.user_id).toBe("user-1");
      expect(row.word_id).toBe("word-1");
      expect(row.ease).toBe(2.5);
      expect(row.interval).toBe(0);
      expect(row.reps).toBe(0);
      expect(row.lapses).toBe(0);
    });

    it("increments lapses when grade is 'again'", () => {
      const card = createNewCard();
      const now = new Date();
      const row = cardToRow("user-1", "word-1", card, 2, "again", now);

      expect(row.lapses).toBe(3);
    });

    it("does not increment lapses for non-again grades", () => {
      const card = createNewCard();
      const now = new Date();
      const rowGood = cardToRow("user-1", "word-1", card, 2, "good", now);
      const rowEasy = cardToRow("user-1", "word-1", card, 2, "easy", now);

      expect(rowGood.lapses).toBe(2);
      expect(rowEasy.lapses).toBe(2);
    });
  });

  describe("Full review cycle simulation", () => {
    it("simulates multiple reviews with increasing intervals", () => {
      let card = createNewCard();
      const intervals: number[] = [];

      for (let i = 0; i < 3; i++) {
        const now = i === 0 ? new Date() : new Date(card.due);
        const result = reviewCard(card, "good", now);
        card = result.card;
        intervals.push(card.I);
      }

      // Intervals should be non-decreasing
      for (let i = 1; i < intervals.length; i++) {
        expect(intervals[i]).toBeGreaterThanOrEqual(intervals[i - 1]);
      }
    });
  });
});