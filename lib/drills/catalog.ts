import type { DrillKind, DrillRound, DrillSummary } from "@/lib/drills/schema";

/**
 * Tổng hợp các lượt nói của một buổi drill (4/3/2 hoặc các drill nhiều lượt).
 * - avgWpm/bestWpm/worstWpm chỉ tính trên các lượt có wpm != null.
 * - trend so sánh lượt đầu và lượt cuối có wpm (4/3/2 kỳ vọng tăng dần).
 */
export function summarizeDrill(kind: DrillKind, rounds: DrillRound[]): DrillSummary {
  const wpms = rounds
    .map((r) => r.wpm)
    .filter((w): w is number => typeof w === "number" && Number.isFinite(w));

  const avgWpm =
    wpms.length > 0
      ? Math.round((wpms.reduce((a, b) => a + b, 0) / wpms.length) * 10) / 10
      : null;
  const bestWpm = wpms.length > 0 ? Math.max(...wpms) : null;
  const worstWpm = wpms.length > 0 ? Math.min(...wpms) : null;

  let trend: DrillSummary["trend"] = "na";
  if (wpms.length >= 2) {
    const first = wpms[0];
    const last = wpms[wpms.length - 1];
    const delta = last - first;
    const threshold = Math.max(3, first * 0.05);
    if (delta > threshold) trend = "up";
    else if (delta < -threshold) trend = "down";
    else trend = "flat";
  }

  return {
    kind,
    rounds: rounds.length,
    avgWpm,
    bestWpm,
    worstWpm,
    trend,
  };
}

/** Tổng thời lượng nói (giây) của một buổi drill. */
export function totalSpeechSeconds(rounds: DrillRound[]): number {
  return rounds.reduce((sum, r) => sum + r.duration_ms / 1000, 0);
}