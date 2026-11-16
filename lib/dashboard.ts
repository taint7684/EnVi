import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DueCount } from "@/lib/types";

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