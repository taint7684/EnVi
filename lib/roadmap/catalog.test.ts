import { describe, it, expect } from "vitest";
import {
  phaseForDay,
  weekForDay,
  isMaintenance,
  isCheckpointDay,
  themeForWeek,
  startDayOfWeek,
} from "@/lib/roadmap/catalog";

describe("phaseForDay", () => {
  it("P1 for 1-30", () => {
    expect(phaseForDay(1).phase).toBe("P1");
    expect(phaseForDay(30).phase).toBe("P1");
    expect(phaseForDay(30).viPercent).toBe(70);
  });
  it("P2 for 31-60", () => {
    expect(phaseForDay(31).phase).toBe("P2");
    expect(phaseForDay(60).viPercent).toBe(30);
  });
  it("P3 for 61-90", () => {
    expect(phaseForDay(61).phase).toBe("P3");
    expect(phaseForDay(90).viPercent).toBe(0);
  });
  it("maintenance > 90", () => {
    expect(phaseForDay(91).phase).toBe("maintenance");
    expect(isMaintenance(120)).toBe(true);
    expect(isMaintenance(90)).toBe(false);
  });
});

describe("weekForDay", () => {
  it("maps day to week 1..13", () => {
    expect(weekForDay(1)).toBe(1);
    expect(weekForDay(7)).toBe(1);
    expect(weekForDay(8)).toBe(2);
    expect(weekForDay(90)).toBe(13);
    expect(weekForDay(91)).toBeNull();
  });
});

describe("startDayOfWeek", () => {
  it("week 1 -> day 1, week 2 -> day 8", () => {
    expect(startDayOfWeek(1)).toBe(1);
    expect(startDayOfWeek(2)).toBe(8);
  });
});

describe("isCheckpointDay", () => {
  it("detects 30/60/90", () => {
    expect(isCheckpointDay(30)).toBe(true);
    expect(isCheckpointDay(60)).toBe(true);
    expect(isCheckpointDay(90)).toBe(true);
    expect(isCheckpointDay(31)).toBe(false);
  });
});

describe("themeForWeek", () => {
  it("returns theme or last for out of range", () => {
    expect(themeForWeek(1)).toContain("Giới thiệu");
    expect(themeForWeek(99)).toBe(themeForWeek(13));
  });
});