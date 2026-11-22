import { describe, it, expect } from "vitest";
import { studyDateKey, computeStreak, tomorrowKey } from "@/lib/gamification/streak";

describe("studyDateKey", () => {
  it("00:00-02:59 belongs to previous day (VN 03:00 rule)", () => {
    // 2026-01-10T02:00:00+07:00 (VN) => lùi 3h => 2026-01-09 23:00 UTC => ngày 09
    expect(studyDateKey("2026-01-10T02:00:00+07:00")).toBe("2026-01-09");
  });
  it("after 03:00 stays same day", () => {
    expect(studyDateKey("2026-01-10T09:00:00+07:00")).toBe("2026-01-10");
  });
});

describe("computeStreak", () => {
  const today = "2026-01-10";

  it("consecutive days → streak equals count", () => {
    const r = computeStreak(["2026-01-08", "2026-01-09", "2026-01-10"], today);
    expect(r.current).toBe(3);
  });

  it("today not studied → counts from yesterday", () => {
    const r = computeStreak(["2026-01-08", "2026-01-09"], today);
    expect(r.current).toBe(2);
  });

  it("gap uses freeze when available", () => {
    // Học 08, trống 09 (freeze), học 10
    const r = computeStreak(["2026-01-08", "2026-01-10"], today);
    expect(r.current).toBe(3);
    expect(r.freezesUsed).toBe(1);
    expect(r.freezesLeft).toBe(1);
  });

  it("no freeze left → streak breaks at gap", () => {
    // Học 07, trống 08, trống 09, học 10; chỉ 0 freeze
    const r = computeStreak(["2026-01-07", "2026-01-10"], today, 0);
    expect(r.current).toBe(1);
    expect(r.freezesUsed).toBe(0);
  });

  it("no study at all → 0", () => {
    expect(computeStreak([], today).current).toBe(0);
  });
});

describe("tomorrowKey", () => {
  it("increments day", () => {
    expect(tomorrowKey("2026-01-10")).toBe("2026-01-11");
  });
});