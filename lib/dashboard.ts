import "server-only";

import { createClient } from "@/lib/supabase/server";

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

const DAY_MS = 86_400_000;
const WEEKDAY_LABELS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function dateOnly(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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

  // Từ đã ôn trong 7 ngày (dựa trên card_reviews.last_reviewed_at).
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
    return { date: key, label: WEEKDAY_LABELS[d.getDay()], count: perDay.get(key) ?? 0 };
  });
  const wordsReviewed = wordsPerDay.reduce((s, d) => s + d.count, 0);

  // Phút học: daily_progress (14 ngày để so sánh tuần này vs tuần trước).
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

  // Phiên Speaking trong 7 ngày.
  const { count: speakingSessions } = await supabase
    .from("speaking_sessions")
    .select("*", { count: "exact", head: true })
    .gte("started_at", last7Start.toISOString());

  // Câu reflex đã luyện trong 7 ngày.
  const { count: reflexPracticed } = await supabase
    .from("phrase_reviews")
    .select("*", { count: "exact", head: true })
    .gte("last_reviewed_at", last7Start.toISOString());

  // Độ chính xác reflex (cho insight).
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

  const today = new Date();
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  const { data: progress } = await supabase
    .from("daily_progress")
    .select("date, minutes, words_reviewed")
    .eq("user_id", user.id)
    .gte("date", sevenDaysAgo.toISOString().split("T")[0])
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

  const todayData = progress?.find(
    (d) => d.date === today.toISOString().split("T")[0],
  );

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