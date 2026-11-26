"use server";

import { createClient } from "@/lib/supabase/server";

export type UserStats = {
  currentDay: number;
  currentWeek: number;
  currentPhase: "G1" | "G2" | "G3" | "G4" | "G5";
  baselineLatencyMs: number | null;
  baselineWpm: number | null;
  totalSpeakingMinutes: number;
  streakDays: number;
};

export async function getServerUserStats(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  const { data: progress } = await supabase
    .from("curriculum_progress")
    .select("current_day, current_week, current_phase, total_speaking_minutes, baseline_latency_ms, baseline_wpm, streak")
    .eq("user_id", userId)
    .maybeSingle();

  if (!progress) {
    // Initialize if not exists
    const { data: newProgress, error } = await supabase
      .from("curriculum_progress")
      .insert({ user_id: userId, current_day: 1 })
      .select("current_day, current_week, current_phase, total_speaking_minutes, baseline_latency_ms, baseline_wpm, streak")
      .single();

    if (error || !newProgress) {
      return {
        currentDay: 1,
        currentWeek: 1,
        currentPhase: "G1",
        baselineLatencyMs: null,
        baselineWpm: null,
        totalSpeakingMinutes: 0,
        streakDays: 0,
      };
    }

    return {
      currentDay: newProgress.current_day,
      currentWeek: newProgress.current_week,
      currentPhase: newProgress.current_phase,
      baselineLatencyMs: newProgress.baseline_latency_ms,
      baselineWpm: newProgress.baseline_wpm,
      totalSpeakingMinutes: newProgress.total_speaking_minutes,
      streakDays: newProgress.streak ?? 0,
    };
  }

  return {
    currentDay: progress.current_day,
    currentWeek: progress.current_week,
    currentPhase: progress.current_phase,
    baselineLatencyMs: progress.baseline_latency_ms,
    baselineWpm: progress.baseline_wpm,
    totalSpeakingMinutes: progress.total_speaking_minutes,
    streakDays: progress.streak ?? 0,
  };
}

export async function incrementDayServer(userId: string): Promise<UserStats> {
  const supabase = await createClient();

  const { data: progress, error } = await supabase
    .from("curriculum_progress")
    .select("current_day, current_week, current_phase, total_speaking_minutes, baseline_latency_ms, baseline_wpm, streak")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !progress) {
    return getServerUserStats(userId);
  }

  const newDay = Math.min(180, progress.current_day + 1);
  const newWeek = Math.min(26, Math.ceil(newDay / 7));
  const newPhase = newDay <= 30 ? "G1" : newDay <= 60 ? "G2" : newDay <= 90 ? "G3" : newDay <= 135 ? "G4" : "G5";

  const { data: updated } = await supabase
    .from("curriculum_progress")
    .update({ current_day: newDay })
    .eq("user_id", userId)
    .select("current_day, current_week, current_phase, total_speaking_minutes, baseline_latency_ms, baseline_wpm, streak")
    .single();

  if (!updated) {
    return getServerUserStats(userId);
  }

  return {
    currentDay: updated.current_day,
    currentWeek: updated.current_week,
    currentPhase: updated.current_phase,
    baselineLatencyMs: updated.baseline_latency_ms,
    baselineWpm: updated.baseline_wpm,
    totalSpeakingMinutes: updated.total_speaking_minutes,
    streakDays: updated.streak ?? 0,
  };
}