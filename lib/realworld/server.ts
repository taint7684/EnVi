"use server";

import { createClient } from "@/lib/supabase/server";
import { REAL_WORLD_TASKS, type RealWorldTask } from "./catalog";

export async function getRealWorldTasks(): Promise<RealWorldTask[]> {
  return REAL_WORLD_TASKS;
}

export type RealWorldLog = { task_id: string; created_at: string };

export async function getDoneTaskIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("real_world_logs")
    .select("task_id")
    .eq("user_id", user.id);
  return Array.from(new Set((data ?? []).map((r) => r.task_id as string)));
}

export async function logRealWorld(input: {
  taskId: string;
  feeling: number;
  stuckPoints?: string;
}): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("real_world_logs")
    .insert({
      user_id: user.id,
      task_id: input.taskId,
      feeling: Math.max(1, Math.min(5, input.feeling)),
      stuck_points: input.stuckPoints?.slice(0, 1000) ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}