import type { AssessmentResultRow } from "@/lib/assessment-db";
import { MILESTONE_LABEL, type Milestone } from "@/lib/assessment";

export type MilestoneComparison = {
  milestone: Milestone;
  label: string;
  totalPercent: number;
  estimatedLevel: string;
  date: string;
};

export type ProgressSummary = {
  hasBaseline: boolean;
  hasComparison: boolean;
  baseline: MilestoneComparison | null;
  latest: MilestoneComparison | null;
  deltaTotal: number | null;
  history: MilestoneComparison[];
};

const ORDER: Milestone[] = ["baseline", "day30", "day60", "day90"];

function isMilestone(value: string): value is Milestone {
  return (ORDER as string[]).includes(value);
}

/**
 * Tổng hợp kết quả đánh giá (assessment_results) thành dữ liệu cho màn Tiến bộ:
 * - So sánh Trước (baseline) – Sau (mốc mới nhất)
 * - deltaTotal = % mốc mới nhất - % baseline (null nếu chưa có baseline)
 * Không phụ thuộc framework, dễ unit test.
 */
export function summarizeProgress(
  rows: AssessmentResultRow[],
): ProgressSummary {
  const sorted = [...rows].sort(
    (a, b) => ORDER.indexOf(a.milestone as Milestone) - ORDER.indexOf(b.milestone as Milestone),
  );

  const history: MilestoneComparison[] = sorted
    .filter((r) => isMilestone(r.milestone))
    .map((r) => ({
      milestone: r.milestone as Milestone,
      label: MILESTONE_LABEL[r.milestone as Milestone],
      totalPercent: r.total_percent,
      estimatedLevel: r.estimated_level,
      date: r.created_at,
    }));

  const baselineRow = history.find((h) => h.milestone === "baseline") ?? null;
  const latest = history.length > 0 ? history[history.length - 1]! : null;
  const hasComparison = baselineRow != null && latest != null && latest.milestone !== "baseline";
  const deltaTotal =
    hasComparison && baselineRow && latest
      ? latest.totalPercent - baselineRow.totalPercent
      : null;

  return {
    hasBaseline: baselineRow != null,
    hasComparison,
    baseline: baselineRow,
    latest,
    deltaTotal,
    history,
  };
}