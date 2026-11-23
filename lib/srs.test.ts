import { describe, it, expect } from "vitest";
import {
  newCard,
  rowToCard,
  repeatCard,
  cardToRow,
  isPracticeGrade,
  Rating,
  State,
} from "./srs";
import type { CardReviewRow } from "./types";

describe("FSRS SRS Algorithm", () => {
  describe("newCard", () => {
    it("creates a new card in state New with zero stability", () => {
      const card = newCard();
      expect(card.state).toBe(State.New);
      expect(card.stability).toBe(0);
      expect(card.difficulty).toBe(0);
      expect(card.reps).toBe(0);
      expect(card.lapses).toBe(0);
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
        stability: 0,
        difficulty: 0,
        state: 0,
      };

      const card = rowToCard(row);
      expect(card.reps).toBe(0);
      expect(card.stability).toBe(0);
      expect(card.state).toBe(0);
    });

    it("handles missing optional FSRS fields gracefully", () => {
      const row = {
        due_at: new Date().toISOString(),
      };
      const card = rowToCard(row);
      expect(card.stability).toBe(0);
      expect(card.difficulty).toBe(0);
      expect(card.state).toBe(0);
    });
  });

  describe("repeatCard - AGAIN", () => {
    it("creates a card in Learning state with low stability", () => {
      const card = newCard();
      const now = new Date();
      const next = repeatCard(card, "again", now);
      expect(next.state).toBe(State.Learning);
      expect(next.stability).toBeLessThan(1);
      expect(next.due.getTime()).toBeLessThanOrEqual(now.getTime() + 60_000);
    });
  });

  describe("repeatCard - GOOD", () => {
    it("creates a card in Learning/Review with positive stability", () => {
      const card = newCard();
      const now = new Date();
      const next = repeatCard(card, "good", now);
      expect(next.stability).toBeGreaterThan(0);
      expect(next.due.getTime()).toBeGreaterThan(now.getTime());
    });

    it("increases stability on subsequent reviews", () => {
      let card = newCard();
      const now = new Date();
      const r1 = repeatCard(card, "good", now);
      card = r1;

      const nextReview = new Date(card.due);
      const r2 = repeatCard(card, "good", nextReview);
      expect(r2.stability).toBeGreaterThanOrEqual(r1.stability);
    });
  });

  describe("repeatCard - EASY", () => {
    it("gives higher stability than 'good' for new card", () => {
      const card = newCard();
      const now = new Date();
      const goodResult = repeatCard(card, "good", now);
      const easyResult = repeatCard(card, "easy", now);
      expect(easyResult.stability).toBeGreaterThanOrEqual(goodResult.stability);
    });
  });

  describe("cardToRow", () => {
    it("converts a Card to a database row with FSRS fields", () => {
      const card = newCard();
      const now = new Date();
      const next = repeatCard(card, "good", now);
      const row = cardToRow(next, now);

      expect(row.stability).toBeGreaterThan(0);
      expect(row.state).toBe(next.state);
      expect(row.due_at).toBe(next.due.toISOString());
      expect(row.reps).toBe(next.reps);
    });
  });

  describe("isPracticeGrade", () => {
    it("returns true for again and hard", () => {
      expect(isPracticeGrade("again")).toBe(true);
      expect(isPracticeGrade("hard")).toBe(true);
    });

    it("returns false for good and easy", () => {
      expect(isPracticeGrade("good")).toBe(false);
      expect(isPracticeGrade("easy")).toBe(false);
    });
  });

  describe("Rating enum", () => {
    it("maps to 1-4", () => {
      expect(Rating.Again).toBe(1);
      expect(Rating.Hard).toBe(2);
      expect(Rating.Good).toBe(3);
      expect(Rating.Easy).toBe(4);
    });
  });

  describe("Full review cycle simulation", () => {
    it("simulates multiple reviews with increasing stability", () => {
      let card = newCard();
      const stabilities: number[] = [];

      for (let i = 0; i < 3; i++) {
        const now = i === 0 ? new Date() : new Date(card.due);
        const next = repeatCard(card, "good", now);
        card = next;
        stabilities.push(card.stability);
      }

      for (let i = 1; i < stabilities.length; i++) {
        expect(stabilities[i]).toBeGreaterThanOrEqual(stabilities[i - 1]);
      }
    });
  });
});