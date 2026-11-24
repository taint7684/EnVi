"use server";

import { createClient } from "@/lib/supabase/server";

export type ReflexDrillResult = { phraseId: string; grade: "got_it" | "slow" | "forgot" };

export type ReflexDrillProgress = {
  day: number;
  mode: "morning" | "noon" | "evening" | "review5";
  completedIds: string[];
  results: ReflexDrillResult[];
  queuePosition: number;
  totalCount: number;
};

export async function saveReflexDrillProgress(
  day: number,
  mode: ReflexDrillProgress["mode"],
  completedIds: string[],
  results: ReflexDrillResult[],
  queuePosition: number,
  totalCount: number,
): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.from("reflex_drill_progress").upsert(
    {
      user_id: user.id,
      day,
      mode,
      completed_ids: completedIds,
      results,
      queue_position: queuePosition,
      total_count: totalCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,day,mode" },
  );
}

export async function getReflexDrillProgress(
  day: number,
  mode: ReflexDrillProgress["mode"],
): Promise<ReflexDrillProgress | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("reflex_drill_progress")
    .select("day, mode, completed_ids, results, queue_position, total_count")
    .eq("user_id", user.id)
    .eq("day", day)
    .eq("mode", mode)
    .maybeSingle();

  if (!data) return null;
  const row = data as {
    day: number;
    mode: ReflexDrillProgress["mode"];
    completed_ids: string[] | null;
    results: ReflexDrillResult[] | null;
    queue_position: number;
    total_count: number;
  };
  return {
    day: row.day,
    mode: row.mode,
    completedIds: row.completed_ids ?? [],
    results: row.results ?? [],
    queuePosition: row.queue_position,
    totalCount: row.total_count,
  };
}

export async function resetReflexDrillProgress(day: number, mode: ReflexDrillProgress["mode"]): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from("reflex_drill_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("day", day)
    .eq("mode", mode);
}