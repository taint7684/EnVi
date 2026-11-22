import { describe, it, expect } from "vitest";
import { lemmatize, lookupCandidates } from "@/lib/reading/lemmatize";

describe("lemmatize", () => {
  it("plural -s", () => {
    expect(lemmatize("cats")).toBe("cat");
    expect(lemmatize("boxes")).toBe("box");
    expect(lemmatize("watches")).toBe("watch");
    expect(lemmatize("studies")).toBe("study");
  });
  it("past -ed", () => {
    expect(lemmatize("worked")).toBe("work");
    expect(lemmatize("studied")).toBe("study");
  });
  it("gerund -ing", () => {
    expect(lemmatize("running")).toBe("runn");
  });
  it("comparatives", () => {
    expect(lemmatize("faster")).toBe("fast");
    expect(lemmatize("fastest")).toBe("fast");
  });
  it("leaves short words unchanged", () => {
    expect(lemmatize("is")).toBe("is");
    expect(lemmatize("go")).toBe("go");
  });
});

describe("lookupCandidates", () => {
  it("returns original + lemma, deduped", () => {
    expect(lookupCandidates("requirements")).toEqual(["requirements", "requirement"]);
    expect(lookupCandidates("run")).toEqual(["run"]);
  });
});