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
  it("P4 for 91-180 (bài thật, chưa phải duy trì)", () => {
    expect(phaseForDay(91).phase).toBe("P4");
    expect(phaseForDay(180).phase).toBe("P4");
    expect(phaseForDay(180).viPercent).toBe(0);
  });
  it("maintenance > 180", () => {
    expect(phaseForDay(181).phase).toBe("maintenance");
    expect(isMaintenance(181)).toBe(true);
    expect(isMaintenance(180)).toBe(false);
    expect(isMaintenance(90)).toBe(false);
  });
});

describe("weekForDay", () => {
  it("maps day to week 1..26", () => {
    expect(weekForDay(1)).toBe(1);
    expect(weekForDay(7)).toBe(1);
    expect(weekForDay(8)).toBe(2);
    expect(weekForDay(90)).toBe(13);
    expect(weekForDay(91)).toBe(13); // ngày cuối tuần 13
    expect(weekForDay(92)).toBe(14);
    expect(weekForDay(180)).toBe(26);
    expect(weekForDay(181)).toBeNull();
  });
});

describe("startDayOfWeek", () => {
  it("week 1 -> day 1, week 2 -> day 8", () => {
    expect(startDayOfWeek(1)).toBe(1);
    expect(startDayOfWeek(2)).toBe(8);
  });
});

describe("isCheckpointDay", () => {
  it("detects 30/60/90/120/150/180", () => {
    expect(isCheckpointDay(30)).toBe(true);
    expect(isCheckpointDay(60)).toBe(true);
    expect(isCheckpointDay(90)).toBe(true);
    expect(isCheckpointDay(120)).toBe(true);
    expect(isCheckpointDay(150)).toBe(true);
    expect(isCheckpointDay(180)).toBe(true);
    expect(isCheckpointDay(31)).toBe(false);
  });
});

describe("themeForWeek", () => {
  it("returns theme or last for out of range", () => {
    expect(themeForWeek(1)).toContain("Giới thiệu");
    expect(themeForWeek(26)).toContain("Đánh giá");
    expect(themeForWeek(99)).toBe(themeForWeek(26));
  });
});