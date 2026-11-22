import type { Objective } from "@/lib/missions/schema";

export type SuccessRule =
  | { kind: "objectives-minus"; allowed: number }
  | { kind: "all" }
  | { kind: "ratio"; ratio: number };

/**
 * Parse success_rule dạng ">= objectives-1 done" hoặc ">= 2 done" hoặc "all".
 * Trả về null nếu không nhận diện được (khi đó coi như "all").
 */
export function parseSuccessRule(rule: string): SuccessRule {
  const normalized = rule.trim().toLowerCase();
  if (normalized === "all" || normalized === "all objectives done") {
    return { kind: "all" };
  }
  const minus = normalized.match(/>=\s*objectives\s*-\s*(\d+)/);
  if (minus) {
    return { kind: "objectives-minus", allowed: Number(minus[1]) };
  }
  const fixed = normalized.match(/>=\s*(\d+)\s*done/);
  if (fixed) {
    return { kind: "objectives-minus", allowed: 0 };
  }
  const ratio = normalized.match(/ratio\s*(\d*\.?\d+)/);
  if (ratio) {
    return { kind: "ratio", ratio: Number(ratio[1]) };
  }
  return { kind: "all" };
}

/** Số objective tối thiểu cần đạt để thành công theo success_rule. */
export function requiredDoneCount(rule: string, totalObjectives: number): number {
  const parsed = parseSuccessRule(rule);
  if (parsed.kind === "ratio") {
    return Math.ceil(totalObjectives * parsed.ratio);
  }
  if (parsed.kind === "objectives-minus") {
    return Math.max(0, totalObjectives - parsed.allowed);
  }
  return totalObjectives;
}

export function missionSucceeded(
  successRule: string,
  totalObjectives: number,
  doneCount: number,
): boolean {
  return doneCount >= requiredDoneCount(successRule, totalObjectives);
}

export type ObjectiveProgress = {
  total: number;
  done: number;
  remaining: number;
  doneIds: string[];
};

export function objectivesProgress(
  objectives: Objective[],
  doneIds: string[],
): ObjectiveProgress {
  const doneSet = new Set(doneIds);
  const validIds = new Set(objectives.map((o) => o.id));
  const done = objectives.filter((o) => doneSet.has(o.id)).length;
  const doneIdsFiltered = doneIds.filter((id) => validIds.has(id));
  return {
    total: objectives.length,
    done,
    remaining: Math.max(0, objectives.length - done),
    doneIds: doneIdsFiltered,
  };
}

/** Merge danh sách judge mới vào danh sách đã đạt (union, giữ thứ tự objectives). */
export function mergeObjectivesDone(
  objectives: Objective[],
  previousDone: string[],
  newDone: string[],
): string[] {
  const validIds = new Set(objectives.map((o) => o.id));
  const set = new Set([...previousDone, ...newDone].filter((id) => validIds.has(id)));
  return objectives.filter((o) => set.has(o.id)).map((o) => o.id);
}