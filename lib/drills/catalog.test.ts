import { describe, it, expect } from "vitest";
import { summarizeDrill, totalSpeechSeconds } from "@/lib/drills/catalog";
import type { DrillRound } from "@/lib/drills/schema";

function round(wpm: number | null, durationMs = 60000): DrillRound {
  return { duration_ms: durationMs, words: 0, wpm };
}

describe("summarizeDrill", () => {
  it("empty rounds → na trend, null wpms", () => {
    const s = summarizeDrill("one_minute", []);
    expect(s.rounds).toBe(0);
    expect(s.avgWpm).toBeNull();
    expect(s.trend).toBe("na");
  });

  it("4/3/2 improving wpm → up trend", () => {
    const s = summarizeDrill("four_three_two", [round(90), round(110), round(135)]);
    expect(s.trend).toBe("up");
    expect(s.bestWpm).toBe(135);
    expect(s.worstWpm).toBe(90);
    expect(s.avgWpm).toBe(111.7);
  });

  it("declining wpm → down trend", () => {
    const s = summarizeDrill("four_three_two", [round(140), round(110)]);
    expect(s.trend).toBe("down");
  });

  it("flat wpm within threshold → flat", () => {
    const s = summarizeDrill("one_minute", [round(100), round(101)]);
    expect(s.trend).toBe("flat");
  });

  it("ignores null wpm in averages", () => {
    const s = summarizeDrill("quick_fire", [round(100), round(null), round(120)]);
    expect(s.rounds).toBe(3);
    expect(s.avgWpm).toBe(110);
  });
});

describe("totalSpeechSeconds", () => {
  it("sums durations", () => {
    const secs = totalSpeechSeconds([
      { duration_ms: 4000, words: 0 },
      { duration_ms: 3000, words: 0 },
      { duration_ms: 2000, words: 0 },
    ]);
    expect(secs).toBe(9);
  });
});