import { describe, it, expect } from "vitest";
import { summarizeProgress } from "@/lib/progress";
import type { AssessmentResultRow } from "@/lib/assessment-db";

function row(
  milestone: string,
  total_percent: number,
  estimated_level: string,
  created_at = "2026-01-01T00:00:00Z",
): AssessmentResultRow {
  return {
    milestone,
    level: "A2",
    skills: [],
    total_percent,
    estimated_level,
    notes: null,
    created_at,
  };
}

describe("summarizeProgress", () => {
  it("empty → no baseline, no comparison", () => {
    const s = summarizeProgress([]);
    expect(s.hasBaseline).toBe(false);
    expect(s.hasComparison).toBe(false);
    expect(s.latest).toBeNull();
    expect(s.deltaTotal).toBeNull();
    expect(s.history).toHaveLength(0);
  });

  it("only baseline → has baseline, no comparison, no delta", () => {
    const s = summarizeProgress([row("baseline", 40, "A2")]);
    expect(s.hasBaseline).toBe(true);
    expect(s.hasComparison).toBe(false);
    expect(s.baseline?.totalPercent).toBe(40);
    expect(s.latest?.milestone).toBe("baseline");
    expect(s.deltaTotal).toBeNull();
  });

  it("baseline + day30 → comparison with positive delta", () => {
    const s = summarizeProgress([
      row("baseline", 40, "A2"),
      row("day30", 62, "B1", "2026-02-01T00:00:00Z"),
    ]);
    expect(s.hasComparison).toBe(true);
    expect(s.baseline?.totalPercent).toBe(40);
    expect(s.latest?.milestone).toBe("day30");
    expect(s.deltaTotal).toBe(22);
    expect(s.latest?.estimatedLevel).toBe("B1");
  });

  it("sorts history by milestone order regardless of input order", () => {
    const s = summarizeProgress([
      row("day60", 75, "B1"),
      row("baseline", 40, "A2"),
      row("day30", 60, "B1"),
    ]);
    expect(s.history.map((h) => h.milestone)).toEqual(["baseline", "day30", "day60"]);
    expect(s.latest?.milestone).toBe("day60");
    expect(s.deltaTotal).toBe(35);
  });

  it("ignores unknown milestone rows", () => {
    const s = summarizeProgress([row("baseline", 40, "A2"), row("weird", 10, "A1")]);
    expect(s.history).toHaveLength(1);
    expect(s.latest?.milestone).toBe("baseline");
  });
});