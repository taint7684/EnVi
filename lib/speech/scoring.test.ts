import { describe, it, expect } from "vitest";
import {
  normalizeWords,
  scoreDictation,
  scoreShadowing,
  scoreIntelligibility,
  suggestFocus,
} from "@/lib/speech/scoring";

describe("normalizeWords", () => {
  it("lowercases, strips punctuation, expands contractions", () => {
    expect(normalizeWords("I'm a BA, right?")).toEqual(["i", "am", "a", "ba", "right"]);
    expect(normalizeWords("It's done!")).toEqual(["it", "is", "done"]);
  });
});

describe("scoreDictation", () => {
  it("perfect match → 100", () => {
    const r = scoreDictation("i am a ba", "I am a BA");
    expect(r.score).toBe(100);
    expect(r.percent).toBe(1);
    expect(r.results.every((w) => w.ok)).toBe(true);
  });

  it("partial match → proportional score", () => {
    const r = scoreDictation("i am developer", "I am a developer");
    // target: [i, am, a, developer]; spoken: [i, am, developer]
    // index0 i=i ok, index1 am=am ok, index2 developer!=a (miss), index3 missing (miss)
    expect(r.correct).toBe(2);
    expect(r.total).toBe(4);
    expect(r.score).toBe(50);
  });

  it("empty target → 0", () => {
    const r = scoreDictation("anything", "");
    expect(r.total).toBe(0);
    expect(r.score).toBe(0);
  });

  it("case and punctuation insensitive", () => {
    const r = scoreDictation("Hello, World!", "hello world");
    expect(r.score).toBe(100);
  });
});

describe("scoreShadowing", () => {
  it("perfect accuracy + matching timing → high score", () => {
    const s = scoreShadowing("good morning", "good morning", 2, 2);
    expect(s.accuracy).toBe(1);
    expect(s.timing).toBe(1);
    expect(s.score).toBe(1);
  });

  it("timing mismatch lowers score", () => {
    const s = scoreShadowing("good morning", "good morning", 6, 2);
    // diff = 4/2 = 2 → min(2,1)=1 → timing 0
    expect(s.timing).toBe(0);
    // score = 0.7*1 + 0.3*0 = 0.7
    expect(s.score).toBeCloseTo(0.7, 2);
  });
});

describe("scoreIntelligibility", () => {
  it("mirrors dictation accuracy", () => {
    const r = scoreIntelligibility("i am a ba", "I am a BA");
    expect(r.score).toBe(100);
  });
});

describe("suggestFocus", () => {
  it("maps endings to focus", () => {
    expect(suggestFocus("worked")).toBe("ending_ed");
    expect(suggestFocus("desks")).toBe("ending_s");
    expect(suggestFocus("think")).toBe("th");
    expect(suggestFocus("hello")).toBeNull();
  });
});