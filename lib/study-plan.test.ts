import { describe, it, expect } from "vitest";
import { allocateBlocks } from "./daily-plan";

function total(budget: number) {
  return allocateBlocks(budget).reduce((s, b) => s + b.minutes, 0);
}

function speaking(budget: number) {
  return allocateBlocks(budget)
    .filter((b) => b.speaking)
    .reduce((s, b) => s + b.minutes, 0);
}

describe("buildDailyPlan allocateBlocks", () => {
  it("budget 60: tong khong vuot budget va phan noi >= 50%", () => {
    const blocks = allocateBlocks(60);
    const t = total(60);
    const s = speaking(60);
    expect(t).toBeLessThanOrEqual(60);
    expect(s).toBeGreaterThanOrEqual(Math.ceil(60 * 0.5));
  });

  it("budget 15 (ngay ban): tong khong vuot budget", () => {
    expect(total(15)).toBeLessThanOrEqual(15);
  });

  it("budget 180: tong khong vuot 180", () => {
    expect(total(180)).toBeLessThanOrEqual(180);
  });

  it("moi block trong khoang min/max", () => {
    for (const b of allocateBlocks(60)) {
      expect(b.minutes).toBeGreaterThanOrEqual(b.min);
      expect(b.minutes).toBeLessThanOrEqual(b.max);
    }
  });
});
