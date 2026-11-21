import { describe, it, expect } from "vitest";
import { computeFluencyFromWords, computeLatency } from "./fluency";

describe("Fluency Engine", () => {
  it("computes WPM, MLR, pauses from Whisper word timestamps", () => {
    const words = [
      { word: "Hello", start: 0.0, end: 0.5 },
      { word: "world", start: 0.6, end: 1.0 },
      { word: "this", start: 1.9, end: 2.3 },
      { word: "is", start: 2.4, end: 2.7 },
      { word: "a", start: 2.8, end: 3.0 },
      { word: "test", start: 3.1, end: 3.6 },
    ];

    const result = computeFluencyFromWords(words);

    expect(result.wordCount).toBe(6);
    expect(result.pauseCount).toBe(1);
    expect(result.totalPauseMs).toBeGreaterThan(0);
    expect(result.wpm).toBeGreaterThan(0);
    expect(result.mlr).toBeGreaterThan(0);
    expect(result.speechSec).toBeGreaterThan(0);
    expect(result.latencyMs).toBeNull();
  });

  it("returns nulls for empty word list", () => {
    const result = computeFluencyFromWords([]);
    expect(result.wordCount).toBe(0);
    expect(result.wpm).toBeNull();
    expect(result.mlr).toBeNull();
    expect(result.pauseCount).toBeNull();
    expect(result.totalPauseMs).toBeNull();
    expect(result.speechSec).toBeNull();
  });

  it("computes latency from ask_complete_at and user start", () => {
    const latency = computeLatency(1000, 1500);
    expect(latency).toBe(500);
  });

  it("returns null latency when either timestamp missing", () => {
    expect(computeLatency(null, 1500)).toBeNull();
    expect(computeLatency(1000, null)).toBeNull();
    expect(computeLatency(null, null)).toBeNull();
  });

  it("clamps negative latency to 0", () => {
    expect(computeLatency(2000, 1500)).toBe(0);
  });

  it("handles single word", () => {
    const result = computeFluencyFromWords([
      { word: "Hello", start: 0.0, end: 0.5 },
    ]);
    expect(result.wordCount).toBe(1);
    expect(result.pauseCount).toBe(0);
    expect(result.totalPauseMs).toBe(0);
    expect(result.mlr).toBe(1);
  });
});
