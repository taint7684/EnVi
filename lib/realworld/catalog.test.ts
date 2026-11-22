import { describe, it, expect } from "vitest";
import { REAL_WORLD_TASKS, nextTask, RealWorldTaskSchema } from "@/lib/realworld/catalog";

describe("REAL_WORLD_TASKS", () => {
  it("has 6 ascending steps, all valid", () => {
    expect(REAL_WORLD_TASKS).toHaveLength(6);
    const steps = REAL_WORLD_TASKS.map((t) => t.step);
    expect(steps).toEqual([1, 2, 3, 4, 5, 6]);
    for (const t of REAL_WORLD_TASKS) {
      expect(() => RealWorldTaskSchema.parse(t)).not.toThrow();
      expect(t.id).toBeTruthy();
    }
    const ids = new Set(REAL_WORLD_TASKS.map((t) => t.id));
    expect(ids.size).toBe(REAL_WORLD_TASKS.length);
  });
});

describe("nextTask", () => {
  it("returns first task when nothing done", () => {
    expect(nextTask([])?.id).toBe("voice-note");
  });

  it("skips done tasks in order", () => {
    expect(nextTask(["voice-note"])?.id).toBe("daily-sentence");
    expect(nextTask(["voice-note", "daily-sentence", "ask-in-meeting"])?.id).toBe(
      "language-exchange",
    );
  });

  it("returns null when all done", () => {
    const all = REAL_WORLD_TASKS.map((t) => t.id);
    expect(nextTask(all)).toBeNull();
  });

  it("ignores unknown done ids", () => {
    expect(nextTask(["does-not-exist"])?.id).toBe("voice-note");
  });
});