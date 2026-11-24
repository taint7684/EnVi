import { describe, it, expect } from "vitest";
import {
  applyGrade,
  continueGroup,
  enterPractice,
  initialGradeState,
  isDifficult,
  shouldRequeue,
  MAX_REQUEUE,
  type GradeState,
} from "./vocab-session";
import type { DueCard, ReviewGrade } from "./types";

function newCard(id: string): DueCard {
  return {
    word: { id, lemma: id, ipa: null, pos: null, meaning_vi: "", example_en: null, example_vi: null, image_url: null, audio_url: null, topic: null, frequency_rank: null, source: null, needs_review: false, created_at: "", chunk_index: null, triage_status: null, cefr_level: null },
    review: null,
    collocation: null,
  };
}
function dueCard(id: string): DueCard {
  return {
    word: { id, lemma: id, ipa: null, pos: null, meaning_vi: "", example_en: null, example_vi: null, image_url: null, audio_url: null, topic: null, frequency_rank: null, source: null, needs_review: false, created_at: "", chunk_index: null, triage_status: null, cefr_level: null },
    review: { id: "r", user_id: "u", word_id: id, ease: 2.5, interval: 0, due_at: "", reps: 0, lapses: 0, last_reviewed_at: null, created_at: "", updated_at: "", stability: 1, difficulty: 5, state: 2 },
    collocation: null,
  };
}

describe("vocab-session machine", () => {
  describe("initialGradeState", () => {
    it("starts in official mode, empty counter", () => {
      const s = initialGradeState(20);
      expect(s.mode).toBe("official");
      expect(s.newWordsInGroup).toBe(0);
      expect(s.groupSize).toBe(20);
      expect(s.groupFinished).toBe(false);
      expect(s.countedWordIds).toEqual([]);
    });
  });

  describe("group counting (20 new words)", () => {
    it("does not finish before 20", () => {
      let s = initialGradeState(20);
      for (let i = 0; i < 19; i++) {
        const r = applyGrade(s, newCard("w" + i), "good", 0);
        s = r.state;
        expect(r.reachedGroupEnd).toBe(false);
      }
      expect(s.newWordsInGroup).toBe(19);
      expect(s.groupFinished).toBe(false);
    });

    it("finishes exactly at the 20th distinct new word", () => {
      let s = initialGradeState(20);
      let last;
      for (let i = 0; i < 20; i++) {
        last = applyGrade(s, newCard("w" + i), "good", 0);
        s = last.state;
      }
      expect(last!.reachedGroupEnd).toBe(true);
      expect(s.groupFinished).toBe(true);
      expect(s.newWordsInGroup).toBe(20);
    });
  });

  describe("requeued repeats do NOT increase the counter", () => {
    it("a new word graded 'again' then regraded counts once", () => {
      let s = initialGradeState(20);
      const card = newCard("w1");
      const r1 = applyGrade(s, card, "again", 0);
      expect(r1.requeue).toBe(true);
      expect(r1.countedAsNew).toBe(true);
      expect(r1.state.newWordsInGroup).toBe(1);
      s = r1.state;

      // same card object (review still null) graded again after requeue
      const r2 = applyGrade(s, card, "good", 1);
      expect(r2.countedAsNew).toBe(false);
      expect(r2.state.newWordsInGroup).toBe(1);
    });
  });

  describe("requeue limits", () => {
    it("only requeues 'again' in official mode up to MAX_REQUEUE", () => {
      const s = initialGradeState(20);
      expect(shouldRequeue("again", "official", 0)).toBe(true);
      expect(shouldRequeue("again", "official", 1)).toBe(true);
      expect(shouldRequeue("again", "official", MAX_REQUEUE)).toBe(false);
      expect(shouldRequeue("again", "practice", 0)).toBe(false);
      expect(shouldRequeue("good", "official", 0)).toBe(false);
      expect(shouldRequeue("hard", "official", 0)).toBe(false);
    });

    it("stops requeuing after MAX_REQUEUE repeats", () => {
      let s = initialGradeState(20);
      const card = newCard("w1");
      const r1 = applyGrade(s, card, "again", 0);
      expect(r1.requeue).toBe(true);
      s = r1.state;
      const r2 = applyGrade(s, card, "again", 1);
      expect(r2.requeue).toBe(true);
      s = r2.state;
      const r3 = applyGrade(s, card, "again", 2);
      expect(r3.requeue).toBe(false);
    });
  });

  describe("practice mode", () => {
    it("never requeues and never counts toward the group", () => {
      let s = enterPractice(initialGradeState(20), 25);
      expect(s.mode).toBe("practice");
      const card = newCard("w1");
      const r1 = applyGrade(s, card, "again", 0);
      expect(r1.requeue).toBe(false);
      expect(r1.countedAsNew).toBe(false);
      expect(r1.state.newWordsInGroup).toBe(0);
      expect(r1.state.groupFinished).toBe(false);
    });
  });

  describe("due words never count as new", () => {
    it("a card with a review is not counted", () => {
      const s = initialGradeState(20);
      const r = applyGrade(s, dueCard("w1"), "good", 0);
      expect(r.countedAsNew).toBe(false);
      expect(r.state.newWordsInGroup).toBe(0);
    });
  });

  describe("continueGroup resets", () => {
    it("resets counter and counted set, back to official", () => {
      let s = initialGradeState(20);
      for (let i = 0; i < 20; i++) s = applyGrade(s, newCard("w" + i), "good", 0).state;
      expect(s.groupFinished).toBe(true);
      const next = continueGroup(s, 20);
      expect(next.mode).toBe("official");
      expect(next.newWordsInGroup).toBe(0);
      expect(next.countedWordIds).toEqual([]);
      expect(next.groupFinished).toBe(false);
      expect(next.queueIndex).toBe(0);
    });
  });

  describe("isDifficult", () => {
    it("again and hard are difficult; good and easy are not", () => {
      expect(isDifficult("again")).toBe(true);
      expect(isDifficult("hard")).toBe(true);
      expect(isDifficult("good")).toBe(false);
      expect(isDifficult("easy")).toBe(false);
    });
  });

  describe("full flow: 20 -> remind -> practice -> continue -> 41", () => {
    it("reaches group end, practices without counting, then continues past word 20", () => {
      let s = initialGradeState(20);
      // learn 20 new words
      for (let i = 0; i < 20; i++) s = applyGrade(s, newCard("w" + i), "good", 0).state;
      expect(s.groupFinished).toBe(true);

      // practice the group (no counter change, group end flag reset)
      const p = enterPractice(s, 20);
      for (let i = 0; i < 20; i++) s = applyGrade(p, newCard("w" + i), "again", 0).state;
      expect(s.newWordsInGroup).toBe(20); // practice did not change the counter
      expect(s.groupFinished).toBe(false); // enterPractice reset it

      // continue to next 20
      s = continueGroup(s, 20);
      for (let i = 20; i < 40; i++) s = applyGrade(s, newCard("w" + i), "good", 0).state;
      expect(s.newWordsInGroup).toBe(20);
      expect(s.groupFinished).toBe(true); // 40 total -> second group of 20 done
    });
  });
});