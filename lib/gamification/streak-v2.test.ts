import { describe, it, expect } from "vitest";
import {
  computeStreak,
  studyDateKey,
  isSpeakingDayValid,
  getMinSpeakingMinutesForStreak,
} from "./streak-v2";

describe("streak-v2.ts", () => {
  const today = "2026-01-15";

  describe("studyDateKey", () => {
    it("03:00 VN is new day", () => {
      const d = new Date("2026-01-15T03:00:00+07:00");
      expect(studyDateKey(d)).toBe("2026-01-15");
    });

    it("02:59 VN is previous day", () => {
      const d = new Date("2026-01-15T02:59:00+07:00");
      expect(studyDateKey(d)).toBe("2026-01-14");
    });

    it("00:00 UTC = 07:00 VN = same day", () => {
      const d = new Date("2026-01-15T00:00:00Z");
      expect(studyDateKey(d)).toBe("2026-01-15");
    });
  });

  describe("isSpeakingDayValid", () => {
    it("3 minutes is valid", () => {
      expect(isSpeakingDayValid(3)).toBe(true);
    });

    it("2.9 minutes is not valid", () => {
      expect(isSpeakingDayValid(2.9)).toBe(false);
    });

    it("0 minutes is not valid", () => {
      expect(isSpeakingDayValid(0)).toBe(false);
    });

    it("10 minutes is valid", () => {
      expect(isSpeakingDayValid(10)).toBe(true);
    });
  });

  describe("getMinSpeakingMinutesForStreak", () => {
    it("Returns 3", () => {
      expect(getMinSpeakingMinutesForStreak()).toBe(3);
    });
  });

  describe("computeStreak", () => {
    it("0 streak when no days", () => {
      const result = computeStreak([], today);
      expect(result.current).toBe(0);
      expect(result.freezesUsed).toBe(0);
      expect(result.freezesLeft).toBe(2);
    });

    it("1 day streak with 3+ minutes", () => {
      const result = computeStreak([{ dateKey: today, speakingMinutes: 5 }], today);
      expect(result.current).toBe(1);
    });

    it("No streak if today < 3 minutes", () => {
      const result = computeStreak([{ dateKey: today, speakingMinutes: 2 }], today);
      expect(result.current).toBe(0);
    });

    it("Consecutive days with 3+ minutes each", () => {
      const days = [
        { dateKey: "2026-01-13", speakingMinutes: 5 },
        { dateKey: "2026-01-14", speakingMinutes: 4 },
        { dateKey: "2026-01-15", speakingMinutes: 6 },
      ];
      const result = computeStreak(days, today);
      expect(result.current).toBe(3);
    });

    it("Break in streak resets to 0", () => {
      const days = [
        { dateKey: "2026-01-13", speakingMinutes: 5 },
        { dateKey: "2026-01-14", speakingMinutes: 2 }, // < 3 min
        { dateKey: "2026-01-15", speakingMinutes: 6 },
      ];
      const result = computeStreak(days, today);
      expect(result.current).toBe(1);
    });

    it("Freeze bridges one missing day", () => {
      const days = [
        { dateKey: "2026-01-13", speakingMinutes: 5 },
        { dateKey: "2026-01-15", speakingMinutes: 6 }, // 14 missing, but freeze used
      ];
      const result = computeStreak(days, today, 2);
      // Streak: 13 (5min), 14 (frozen), 15 (6min) = 3 days
      expect(result.current).toBe(3);
      expect(result.freezesUsed).toBe(1);
      expect(result.freezesLeft).toBe(1);
    });

    it("Freeze only works if earlier day exists", () => {
      const days = [
        { dateKey: "2026-01-15", speakingMinutes: 6 }, // today only
      ];
      const result = computeStreak(days, today, 2);
      expect(result.current).toBe(1);
      expect(result.freezesUsed).toBe(0);
    });

    it("Two freezes max per month", () => {
      const days = [
        { dateKey: "2026-01-12", speakingMinutes: 5 },
        { dateKey: "2026-01-13", speakingMinutes: 2 }, // < 3
        { dateKey: "2026-01-14", speakingMinutes: 4 },
        { dateKey: "2026-01-15", speakingMinutes: 6 },
      ];
      const result = computeStreak(days, today, 1); // only 1 freeze
      expect(result.current).toBe(2); // 14, 15
      expect(result.freezesUsed).toBe(0); // no earlier day for 13
    });
  });
});