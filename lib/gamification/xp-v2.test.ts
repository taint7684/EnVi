import { describe, it, expect } from "vitest";
import {
  calculateXpFromSpeakingSeconds,
  calculateXpFromSpeakingMinutes,
  calculateXpBreakdown,
  calculateTotalXp,
  getDailyXpTarget,
  getXpPerMinute,
  getXpPer10Seconds,
} from "./xp-v2";

describe("xp-v2.ts", () => {
  describe("calculateXpFromSpeakingSeconds", () => {
    it("0 seconds = 0 XP", () => {
      expect(calculateXpFromSpeakingSeconds(0)).toBe(0);
    });

    it("9 seconds = 0 XP (less than 10s)", () => {
      expect(calculateXpFromSpeakingSeconds(9)).toBe(0);
    });

    it("10 seconds = 1 XP", () => {
      expect(calculateXpFromSpeakingSeconds(10)).toBe(1);
    });

    it("19 seconds = 1 XP", () => {
      expect(calculateXpFromSpeakingSeconds(19)).toBe(1);
    });

    it("20 seconds = 2 XP", () => {
      expect(calculateXpFromSpeakingSeconds(20)).toBe(2);
    });

    it("60 seconds (1 min) = 6 XP", () => {
      expect(calculateXpFromSpeakingSeconds(60)).toBe(6);
    });

    it("300 seconds (5 min) = 30 XP", () => {
      expect(calculateXpFromSpeakingSeconds(300)).toBe(30);
    });

    it("5400 seconds (90 min) = 540 XP", () => {
      expect(calculateXpFromSpeakingSeconds(5400)).toBe(540);
    });
  });

  describe("calculateXpFromSpeakingMinutes", () => {
    it("0 minutes = 0 XP", () => {
      expect(calculateXpFromSpeakingMinutes(0)).toBe(0);
    });

    it("1 minute = 6 XP", () => {
      expect(calculateXpFromSpeakingMinutes(1)).toBe(6);
    });

    it("10 minutes = 60 XP", () => {
      expect(calculateXpFromSpeakingMinutes(10)).toBe(60);
    });

    it("90 minutes = 540 XP", () => {
      expect(calculateXpFromSpeakingMinutes(90)).toBe(540);
    });

    it("Fractional minutes floored", () => {
      expect(calculateXpFromSpeakingMinutes(1.5)).toBe(9); // 90 seconds = 9 XP
      expect(calculateXpFromSpeakingMinutes(1.9)).toBe(11); // 114 seconds = 11 XP
    });
  });

  describe("calculateXpBreakdown", () => {
    it("Single activity", () => {
      const result = calculateXpBreakdown([{ activity: "reflex", speakingSeconds: 120 }]);
      expect(result).toHaveLength(1);
      expect(result[0].activity).toBe("reflex");
      expect(result[0].speakingSeconds).toBe(120);
      expect(result[0].xp).toBe(12);
    });

    it("Multiple activities", () => {
      const result = calculateXpBreakdown([
        { activity: "reflex", speakingSeconds: 120 },
        { activity: "speaking", speakingSeconds: 300 },
        { activity: "shadowing", speakingSeconds: 60 },
      ]);
      expect(result).toHaveLength(3);
      expect(result[0].xp).toBe(12);
      expect(result[1].xp).toBe(30);
      expect(result[2].xp).toBe(6);
    });

    it("Empty array", () => {
      const result = calculateXpBreakdown([]);
      expect(result).toHaveLength(0);
    });
  });

  describe("calculateTotalXp", () => {
    it("Sums breakdown", () => {
      const breakdown = [
        { activity: "reflex", speakingSeconds: 120, xp: 12 },
        { activity: "speaking", speakingSeconds: 300, xp: 30 },
      ];
      expect(calculateTotalXp(breakdown)).toBe(42);
    });

    it("Empty breakdown = 0", () => {
      expect(calculateTotalXp([])).toBe(0);
    });
  });

  describe("getDailyXpTarget", () => {
    it("90 minutes speaking = 540 XP target", () => {
      expect(getDailyXpTarget(90)).toBe(540);
    });

    it("60 minutes speaking = 360 XP target", () => {
      expect(getDailyXpTarget(60)).toBe(360);
    });
  });

  describe("Constants", () => {
    it("XP per 10 seconds = 1", () => {
      expect(getXpPer10Seconds()).toBe(1);
    });

    it("XP per minute = 6", () => {
      expect(getXpPerMinute()).toBe(6);
    });
  });
});