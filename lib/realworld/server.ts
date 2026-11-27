"use server";

import { createClient } from "@/lib/supabase/server";

export type RealWorldWeeklyTask = {
  id: string;
  week_num: number;
  template_id: string;
  title_vi: string;
  title_en: string;
  scenario_vi: string;
  scenario_en: string;
  ai_persona: any;
  prep_openers: string[];
  prep_rescues: string[];
  success_criteria: any;
  xp_reward: number;
  status: string;
  completed_at: string | null;
  courage_before: number | null;
  courage_after: number | null;
  hardest_part: string | null;
};

export async function getRealWorldWeeklyTasks(): Promise<RealWorldWeeklyTask[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  // Get all weekly tasks for this user
  const { data, error } = await supabase
    .from("real_world_weekly_tasks")
    .select(`
      *,
      template:real_world_task_templates(*)
    `)
    .eq("user_id", user.id)
    .order("week_num", { ascending: true });

  if (error) throw error;

  // If no tasks exist, generate them for all weeks (1-26)
  if (!data || data.length === 0) {
    return generateAllWeeklyTasks(user.id);
  }

  // Check for missing weeks and generate
  const existingWeeks = new Set(data.map(t => t.week_num));
  const missingWeeks: number[] = [];
  for (let w = 1; w <= 26; w++) {
    if (!existingWeeks.has(w)) missingWeeks.push(w);
  }

  if (missingWeeks.length > 0) {
    for (const week of missingWeeks) {
      await supabase.rpc("generate_weekly_real_world_tasks", {
        p_user_id: user.id,
        p_week_num: week,
      });
    }
    // Re-fetch
    const { data: refreshed } = await supabase
      .from("real_world_weekly_tasks")
      .select(`
        *,
        template:real_world_task_templates(*)
      `)
      .eq("user_id", user.id)
      .order("week_num", { ascending: true });
    return (refreshed ?? []).map(mapTask);
  }

  return data.map(mapTask);
}

async function generateAllWeeklyTasks(userId: string): Promise<RealWorldWeeklyTask[]> {
  const supabase = await createClient();
  
  // Generate all 26 weeks
  for (let week = 1; week <= 26; week++) {
    await supabase.rpc("generate_weekly_real_world_tasks", {
      p_user_id: userId,
      p_week_num: week,
    });
  }

  const { data } = await supabase
    .from("real_world_weekly_tasks")
    .select(`
      *,
      template:real_world_task_templates(*)
    `)
    .eq("user_id", userId)
    .order("week_num", { ascending: true });

  return (data ?? []).map(mapTask);
}

function mapTask(row: any): RealWorldWeeklyTask {
  const t = row.template;
  return {
    id: row.id.toString(),
    week_num: row.week_num,
    template_id: row.template_id,
    title_vi: t?.title_vi ?? row.template_id,
    title_en: t?.title_en ?? "",
    scenario_vi: t?.scenario_vi ?? "",
    scenario_en: t?.scenario_en ?? "",
    ai_persona: t?.ai_persona ?? {},
    prep_openers: t?.prep_openers ?? [],
    prep_rescues: t?.prep_rescues ?? [],
    success_criteria: t?.success_criteria ?? {},
    xp_reward: t?.xp_reward ?? 20,
    status: row.status,
    completed_at: row.completed_at,
    courage_before: row.courage_before,
    courage_after: row.courage_after,
    hardest_part: row.hardest_part,
  };
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

export async function getNextTask(): Promise<RealWorldWeeklyTask | null> {
  const tasks = await getRealWorldWeeklyTasks();
  const doneIds = await getDoneTaskIds();
  const done = new Set(doneIds);
  return tasks.find(t => !done.has(t.template_id) && t.status !== "skipped") ?? null;
}