import "server-only";

import { createClient } from "@/lib/supabase/server";
import { todayStrVN, dateOnlyVN } from "@/lib/date-vn";

export type DashboardStats = {
  streak: number;
  minutesToday: number;
  totalWords: number;
  dueCards: number;
  newCards: number;
};

export type DayData = {
  date: string;
  minutes: number;
  words_reviewed: number;
};

export type WeeklyReport = {
  wordsReviewed: number;
  wordsPerDay: { date: string; label: string; count: number }[];
  minutesThisWeek: number;
  minutesLastWeek: number;
  minutesDelta: number;
  speakingSessions: number;
  reflexPracticed: number;
  insight: string;
  insightType: "reflex" | "speaking" | "vocab" | "streak" | "good";
};

export type NorthStarMetrics = {
  speakingMinutesToday: number;
  speakingMinutesWeek: number;
  speakingSessionsWeek: number;
  avgWpmWeek: number | null;
  avgLatencyMsWeek: number | null;
  viSegmentsWeek: number;
  lifelineUsedWeek: number;
  streak: number;
  speakingMinutesPrevWeek: number;
  speakingSessionsPrevWeek: number;
  avgWpmPrevWeek: number | null;
  avgLatencyPrevWeek: number | null;
  viSegmentsPrevWeek: number;
  lifelineUsedPrevWeek: number;

  // Chart history data (last 7 days)
  wpmHistory: { date: string; value: number }[];
  latencyHistory: { date: string; value: number }[];
  viHistory: { date: string; value: number }[];
  lifelineHistory: { date: string; value: number }[];

  // Computed trends
  wpmTrend: number;
  latencyTrend: number;
  viTrend: number;
  lifelineTrend: number;
  streakTrend: number;
  dailySpeakingTrend: number;
  dailySpeakingMinutes: number;
};

const DAY_MS = 86_400_000;
const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function dateOnly(d: Date): string {
  return dateOnlyVN(d);
}

export async function getWeeklyReport(): Promise<WeeklyReport> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: WeeklyReport = {
    wordsReviewed: 0,
    wordsPerDay: [],
    minutesThisWeek: 0,
    minutesLastWeek: 0,
    minutesDelta: 0,
    speakingSessions: 0,
    reflexPracticed: 0,
    insight: "Chưa có dữ liệu tuần này.",
    insightType: "good",
  };
  if (!user) return empty;

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const last7Start = new Date(today.getTime() - 6 * DAY_MS);
  const prev7Start = new Date(today.getTime() - 13 * DAY_MS);

  const { data: reviewRows } = await supabase
    .from("card_reviews")
    .select("last_reviewed_at")
    .gte("last_reviewed_at", last7Start.toISOString());

  const perDay = new Map<string, number>();
  for (const r of (reviewRows as { last_reviewed_at: string | null }[] | null) ?? []) {
    if (!r.last_reviewed_at) continue;
    const key = dateOnly(new Date(r.last_reviewed_at));
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  const wordsPerDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(last7Start.getTime() + i * DAY_MS);
    const key = dateOnly(d);
    return { date: key, label: WEEKDAY_LABELS[d.getDay()]!, count: perDay.get(key) ?? 0 };
  });
  const wordsReviewed = wordsPerDay.reduce((s, d) => s + d.count, 0);

  const { data: progressRows } = await supabase
    .from("daily_progress")
    .select("date, minutes")
    .gte("date", dateOnly(prev7Start))
    .order("date", { ascending: true });

  let minutesThisWeek = 0;
  let minutesLastWeek = 0;
  for (const p of (progressRows as { date: string; minutes: number }[] | null) ?? []) {
    if (p.date >= dateOnly(last7Start)) minutesThisWeek += p.minutes ?? 0;
    else if (p.date >= dateOnly(prev7Start)) minutesLastWeek += p.minutes ?? 0;
  }
  const minutesDelta = minutesThisWeek - minutesLastWeek;

  const { count: speakingSessions } = await supabase
    .from("speech_metrics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("module", ["speaking", "picture_talk", "real_world"])
    .gte("created_at", last7Start.toISOString());

  const { count: reflexPracticed } = await supabase
    .from("phrase_reviews")
    .select("*", { count: "exact", head: true })
    .gte("last_reviewed_at", last7Start.toISOString());

  const { data: prRows } = await supabase
    .from("phrase_reviews")
    .select("reps, lapses");
  const rows = (prRows as { reps: number; lapses: number }[] | null) ?? [];
  const reps = rows.reduce((s, r) => s + (r.reps ?? 0), 0);
  const lapses = rows.reduce((s, r) => s + (r.lapses ?? 0), 0);
  const accuracy = reps + lapses > 0 ? Math.round((reps / (reps + lapses)) * 100) : 0;

  let insightType: WeeklyReport["insightType"] = "good";
  let insight: string;
  if ((speakingSessions ?? 0) === 0) {
    insightType = "speaking";
    insight = "Tuần này bạn chưa luyện Speaking. Hãy dành 10 phút cho 1 phiên Speaking nhé.";
  } else if (rows.length > 0 && accuracy < 70) {
    insightType = "reflex";
    insight = `Tuần này bạn yếu phần Reflex (độ chính xác ${accuracy}%). Hãy dành thêm 15 phút/ngày luyện câu B1/B2.`;
  } else if (minutesThisWeek === 0) {
    insightType = "streak";
    insight = "Bạn chưa ghi nhận phút học tuần này. Làm 1 hoạt động và check-in để bắt đầu nhé.";
  } else if (minutesDelta < 0) {
    insightType = "streak";
    insight = `Tuần này bạn học ít hơn tuần trước ${Math.abs(minutesDelta)} phút. Cố gắng thêm 15 phút/ngày nhé.`;
  } else {
    insightType = "good";
    insight = "Tuần này bạn học đều và tốt! Duy trì phong độ để giữ streak.";
  }

  return {
    wordsReviewed,
    wordsPerDay,
    minutesThisWeek,
    minutesLastWeek,
    minutesDelta,
    speakingSessions: speakingSessions ?? 0,
    reflexPracticed: reflexPracticed ?? 0,
    insight,
    insightType,
  };
}

export async function getDashboardData(): Promise<{
  stats: DashboardStats;
  weekData: DayData[];
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      stats: { streak: 0, minutesToday: 0, totalWords: 0, dueCards: 0, newCards: 0 },
      weekData: [],
    };
  }

  const todayVn = todayStrVN();
  const sevenDaysAgoVn = dateOnlyVN(new Date(Date.now() - 7 * DAY_MS));

  const { data: progress } = await supabase
    .from("daily_progress")
    .select("date, minutes, words_reviewed")
    .eq("user_id", user.id)
    .gte("date", sevenDaysAgoVn)
    .order("date", { ascending: true });

  const { data: streakData } = await supabase
    .from("daily_progress")
    .select("streak")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1);

  let dueCards = 0;
  let newCards = 0;

  try {
    const { getDueCount } = await import("@/lib/vocab");
    const counts = await getDueCount();
    dueCards = counts.total;
    newCards = counts.new;
  } catch {
    // ignore
  }

  const todayData = progress?.find((d) => d.date === todayVn);

  return {
    stats: {
      streak: (streakData as { streak: number }[])?.[0]?.streak ?? 0,
      minutesToday: (todayData as { minutes: number } | undefined)?.minutes ?? 0,
      totalWords: 0,
      dueCards,
      newCards,
    },
    weekData: (progress as { date: string; minutes: number; words_reviewed: number }[]) ?? [],
  };
}

/**
 * North Star metrics from speech_metrics table (new unified table).
 * - speakingMinutes*: tổng audio_duration_ms của các block nói.
 * - avgWpmWeek: WPM trung bình có trọng số theo thời lượng.
 * - avgLatencyMsWeek: onset_latency_ms trung bình của Reflex.
 * - viSegmentsWeek: số đoạn tiếng Việt phát hiện.
 * - lifelineUsedWeek: số lần dùng lifeline.
 * - streak: chuỗi ngày học liên tiếp (daily_progress.streak).
 */
export async function getNorthStarMetrics(): Promise<NorthStarMetrics> {
  const empty: NorthStarMetrics = {
    speakingMinutesToday: 0,
    speakingMinutesWeek: 0,
    speakingSessionsWeek: 0,
    avgWpmWeek: null,
    avgLatencyMsWeek: null,
    viSegmentsWeek: 0,
    lifelineUsedWeek: 0,
    streak: 0,
    speakingMinutesPrevWeek: 0,
    speakingSessionsPrevWeek: 0,
    avgWpmPrevWeek: null,
    avgLatencyPrevWeek: null,
    viSegmentsPrevWeek: 0,
    lifelineUsedPrevWeek: 0,
    wpmHistory: [],
    latencyHistory: [],
    viHistory: [],
    lifelineHistory: [],
    wpmTrend: 0,
    latencyTrend: 0,
    viTrend: 0,
    lifelineTrend: 0,
    streakTrend: 0,
    dailySpeakingTrend: 0,
    dailySpeakingMinutes: 0,
  };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return empty;

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  const weekStart = new Date(todayStart.getTime() - 6 * DAY_MS);
  const prevWeekStart = new Date(weekStart.getTime() - 7 * DAY_MS);
  const prevWeekEnd = new Date(weekStart.getTime() - 1);

  // Get daily aggregated metrics for the last 14 days (for trends)
  const { data: dailyMetrics } = await supabase
    .from("speech_metrics")
    .select("audio_duration_ms, wpm, onset_latency_ms, vi_segments, lifeline_used, module, created_at")
    .eq("user_id", user.id)
    .gte("created_at", prevWeekStart.toISOString());

  const dailyData = new Map<string, {
    wpmSum: number;
    wpmWeight: number;
    latencySum: number;
    latencyCount: number;
    viSegments: number;
    lifelineCount: number;
    speakingMs: number;
  }>();

  const speakingModules = new Set(["shadowing", "reflex", "picture_talk", "speaking", "chunks", "voice_diary"]);

  for (const m of (dailyMetrics as {
    audio_duration_ms: number | null;
    wpm: number | null;
    onset_latency_ms: number | null;
    vi_segments: number | null;
    lifeline_used: boolean | null;
    module: string;
    created_at: string;
  }[] | null) ?? []) {
    const dur = Number(m.audio_duration_ms ?? 0);
    if (dur <= 0) continue;
    const created = new Date(m.created_at);
    const dateKey = dateOnly(created);
    const w = Number(m.wpm ?? 0);
    const lat = Number(m.onset_latency_ms ?? 0);
    const vi = Number(m.vi_segments ?? 0);
    const lf = m.lifeline_used ?? false;
    const isSpeakingModule = speakingModules.has(m.module);

    const day = dailyData.get(dateKey) || {
      wpmSum: 0,
      wpmWeight: 0,
      latencySum: 0,
      latencyCount: 0,
      viSegments: 0,
      lifelineCount: 0,
      speakingMs: 0,
    };

    if (isSpeakingModule) {
      day.speakingMs += dur;
      if (w > 0) {
        day.wpmSum += w * dur;
        day.wpmWeight += dur;
      }
    }
    if (lat > 0 && m.module === "reflex") {
      day.latencySum += lat;
      day.latencyCount++;
    }
    if (vi > 0) day.viSegments += vi;
    if (lf) day.lifelineCount++;

    dailyData.set(dateKey, day);
  }

  // Build history arrays for last 7 days
  const wpmHistory: { date: string; value: number }[] = [];
  const latencyHistory: { date: string; value: number }[] = [];
  const viHistory: { date: string; value: number }[] = [];
  const lifelineHistory: { date: string; value: number }[] = [];

  let todayMs = 0;
  let weekMs = 0;
  let prevWeekMs = 0;
  let wpmWeighted = 0;
  let wpmWeightMs = 0;
  let prevWpmWeighted = 0;
  let prevWpmWeightMs = 0;
  let latencyWeekSum = 0;
  let latencyWeekCount = 0;
  let latencyPrevSum = 0;
  let latencyPrevCount = 0;
  let viSegmentsWeek = 0;
  let viSegmentsPrev = 0;
  let lifelineWeek = 0;
  let lifelinePrev = 0;

  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.getTime() + i * DAY_MS);
    const key = dateOnly(d);
    const day = dailyData.get(key);
    
    const wpm = day && day.wpmWeight > 0 ? Math.round((day.wpmSum / day.wpmWeight) * 10) / 10 : 0;
    const latency = day && day.latencyCount > 0 ? Math.round(day.latencySum / day.latencyCount) : 0;
    const vi = day?.viSegments || 0;
    const lifeline = day?.lifelineCount || 0;
    const speakingMin = day ? Math.round(day.speakingMs / 60000) : 0;

    wpmHistory.push({ date: WEEKDAY_LABELS[d.getDay()]!, value: wpm });
    latencyHistory.push({ date: WEEKDAY_LABELS[d.getDay()]!, value: latency });
    viHistory.push({ date: WEEKDAY_LABELS[d.getDay()]!, value: vi });
    lifelineHistory.push({ date: WEEKDAY_LABELS[d.getDay()]!, value: lifeline });

    if (d >= weekStart) {
      if (day?.speakingMs) weekMs += day.speakingMs;
      if (wpm > 0 && day?.wpmWeight) {
        wpmWeighted += day.wpmSum;
        wpmWeightMs += day.wpmWeight;
      }
      if (latency > 0) {
        latencyWeekSum += latency * (day?.latencyCount || 1);
        latencyWeekCount += day?.latencyCount || 1;
      }
      viSegmentsWeek += vi;
      lifelineWeek += lifeline;
    }

    if (d >= todayStart) {
      if (day?.speakingMs) todayMs += day.speakingMs;
    }
  }

  // Previous week data
  for (let i = 0; i < 7; i++) {
    const d = new Date(prevWeekStart.getTime() + i * DAY_MS);
    const key = dateOnly(d);
    const day = dailyData.get(key);
    
    if (day?.speakingMs) prevWeekMs += day.speakingMs;
    if (day?.wpmWeight && day.wpmWeight > 0) {
      prevWpmWeighted += day.wpmSum;
      prevWpmWeightMs += day.wpmWeight;
    }
    if (day?.latencyCount && day.latencyCount > 0) {
      latencyPrevSum += day.latencySum;
      latencyPrevCount += day.latencyCount;
    }
    viSegmentsPrev += day?.viSegments || 0;
    lifelinePrev += day?.lifelineCount || 0;
  }

  const { count: sessionsWeek } = await supabase
    .from("speech_metrics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("module", ["speaking", "picture_talk", "real_world"])
    .gte("created_at", weekStart.toISOString());

  const { count: sessionsPrevWeek } = await supabase
    .from("speech_metrics")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("module", ["speaking", "picture_talk", "real_world"])
    .gte("created_at", prevWeekStart.toISOString())
    .lte("created_at", prevWeekEnd.toISOString());

  const { data: streakData } = await supabase
    .from("daily_progress")
    .select("streak")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .limit(1);

  const streak = (streakData as { streak: number }[] | null)?.[0]?.streak ?? 0;

  // Calculate trends
  const avgWpmWeek = wpmWeightMs > 0 ? Math.round((wpmWeighted / wpmWeightMs) * 10) / 10 : null;
  const avgLatencyMsWeek = latencyWeekCount > 0 ? Math.round(latencyWeekSum / latencyWeekCount) : null;
  const avgWpmPrevWeek = prevWpmWeightMs > 0 ? Math.round((prevWpmWeighted / prevWpmWeightMs) * 10) / 10 : null;
  const avgLatencyPrevWeek = latencyPrevCount > 0 ? Math.round(latencyPrevSum / latencyPrevCount) : null;

  const wpmTrend = avgWpmWeek && avgWpmPrevWeek ? Math.round(((avgWpmWeek - avgWpmPrevWeek) / avgWpmPrevWeek) * 100) : 0;
  const latencyTrend = avgLatencyMsWeek && avgLatencyPrevWeek ? Math.round(((avgLatencyMsWeek - avgLatencyPrevWeek) / avgLatencyPrevWeek) * 100) : 0;
  const viTrend = viSegmentsPrev > 0 ? Math.round(((viSegmentsWeek - viSegmentsPrev) / viSegmentsPrev) * 100) : 0;
  const lifelineTrend = lifelinePrev > 0 ? Math.round(((lifelineWeek - lifelinePrev) / lifelinePrev) * 100) : 0;
  const dailySpeakingTrend = prevWeekMs > 0 ? Math.round(((weekMs - prevWeekMs) / prevWeekMs) * 100) : 0;

  return {
    speakingMinutesToday: Math.round(todayMs / 60000),
    speakingMinutesWeek: Math.round(weekMs / 60000),
    speakingSessionsWeek: sessionsWeek ?? 0,
    avgWpmWeek,
    avgLatencyMsWeek,
    viSegmentsWeek,
    lifelineUsedWeek: lifelineWeek,
    streak,
    speakingMinutesPrevWeek: Math.round(prevWeekMs / 60000),
    speakingSessionsPrevWeek: sessionsPrevWeek ?? 0,
    avgWpmPrevWeek,
    avgLatencyPrevWeek,
    viSegmentsPrevWeek: viSegmentsPrev,
    lifelineUsedPrevWeek: lifelinePrev,
    wpmHistory,
    latencyHistory,
    viHistory,
    lifelineHistory,
    wpmTrend,
    latencyTrend,
    viTrend,
    lifelineTrend,
    streakTrend: 0,
    dailySpeakingTrend,
    dailySpeakingMinutes: Math.round(todayMs / 60000),
  };
}