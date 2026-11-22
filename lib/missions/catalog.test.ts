import { describe, it, expect } from "vitest";
import {
  parseSuccessRule,
  requiredDoneCount,
  missionSucceeded,
  objectivesProgress,
  mergeObjectivesDone,
} from "@/lib/missions/catalog";
import type { Objective } from "@/lib/missions/schema";

const objectives: Objective[] = [
  { id: "o1", text_vi: "a", check: "c1" },
  { id: "o2", text_vi: "b", check: "c2" },
  { id: "o3", text_vi: "c", check: "c3" },
];

describe("parseSuccessRule", () => {
  it("parses objectives-1", () => {
    expect(parseSuccessRule(">= objectives-1 done")).toEqual({
      kind: "objectives-minus",
      allowed: 1,
    });
  });
  it("parses all", () => {
    expect(parseSuccessRule("all")).toEqual({ kind: "all" });
  });
  it("defaults unknown to all", () => {
    expect(parseSuccessRule("something weird")).toEqual({ kind: "all" });
  });
});

describe("requiredDoneCount", () => {
  it("objectives-1 with 3 objectives → need 2", () => {
    expect(requiredDoneCount(">= objectives-1 done", 3)).toBe(2);
  });
  it("all with 3 objectives → need 3", () => {
    expect(requiredDoneCount("all", 3)).toBe(3);
  });
  it("never negative", () => {
    expect(requiredDoneCount(">= objectives-5 done", 3)).toBe(0);
  });
});

describe("missionSucceeded", () => {
  it("succeeds when done >= required", () => {
    expect(missionSucceeded(">= objectives-1 done", 3, 2)).toBe(true);
    expect(missionSucceeded(">= objectives-1 done", 3, 1)).toBe(false);
  });
  it("all requires every objective", () => {
    expect(missionSucceeded("all", 3, 2)).toBe(false);
    expect(missionSucceeded("all", 3, 3)).toBe(true);
  });
});

describe("objectivesProgress", () => {
  it("counts only valid done ids", () => {
    const p = objectivesProgress(objectives, ["o1", "o3", "zzz"]);
    expect(p.total).toBe(3);
    expect(p.done).toBe(2);
    expect(p.remaining).toBe(1);
    expect(p.doneIds).toEqual(["o1", "o3"]);
  });
});

describe("mergeObjectivesDone", () => {
  it("unions and keeps objective order", () => {
    const merged = mergeObjectivesDone(objectives, ["o2"], ["o1", "o2"]);
    expect(merged).toEqual(["o1", "o2"]);
  });
  it("drops invalid ids", () => {
    const merged = mergeObjectivesDone(objectives, ["o1"], ["oX"]);
    expect(merged).toEqual(["o1"]);
  });
});