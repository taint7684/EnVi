"use server";

import { createClient } from "@/lib/supabase/server";
import { todayStrVN } from "@/lib/date-vn";
import { asArray } from "@/lib/result";
import { allocateBlocks, BLOCK_DEFS, blockLabel, type BlockId } from "@/lib/daily-plan";
import type { DailyStudyPlan, StudyTask, StudyTaskType } from "@/lib/types";

const DAILY_BONUS_XP = 100;

export type TodayTask = StudyTask & {
  done: boolean;
  minutes: number;
  speechMinutes: number;
};

export type TodayPlanResult = {
  priority: string[];
  targetMinutes: number;
  tasks: TodayTask[];
  completedTaskIds: string[];
  bonusAwarded: boolean;
  totalMinutes: number;
  speakingMinutes: number;
  allDone: boolean;
  enoughMinutes: boolean;
  studyDate: string;
};

function todayString(): string {
  return todayStrVN();
}

async function getProfileBudget(supabase: Awaited<ReturnType<typeof createClient>>): Promise<{
  budget: number;
  userId: string;
}> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data: profile } = await supabase
    .from("profiles")
    .select("minutes_per_day")
    .eq("id", user.id)
    .maybeSingle();

  const budget = Math.max(15, Math.min(180, (profile?.minutes_per_day ?? 60)));
  return { budget, userId: user.id };
}

async function getBlockProgress(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  studyDate: string,
  blockId: BlockId,
): Promise<{ done: boolean; minutes: number; speechMinutes: number }> {
  const { data: events } = await supabase
    .from("activity_events")
    .select("duration_sec, speech_sec, meta")
    .eq("user_id", userId)
    .eq("study_date", studyDate)
    .eq("block_type", blockId);

  const evs = asArray<{ duration_sec: number; speech_sec: number; meta: unknown }>(events);
  const minutes = Math.round(
    evs.reduce((s, e) => s + Number(e.duration_sec ?? 0), 0) / 60,
  );
  const speechMinutes = Math.round(
    evs.reduce((s, e) => s + Number(e.speech_sec ?? 0), 0) / 60,
  );

  const def = BLOCK_DEFS[blockId];
  const targetMinutes = def ? def.ideal : 10;
  const done = minutes >= targetMinutes;

  return { done, minutes, speechMinutes };
}

export async function getTodayPlan(): Promise<TodayPlanResult> {
  const supabase = await createClient();
  const { budget, userId } = await getProfileBudget(supabase);
  const studyDate = todayString();

  let { data: planRow } = await supabase
    .from("daily_plans")
    .select("blocks, completed_at")
    .eq("user_id", userId)
    .eq("study_date", studyDate)
    .maybeSingle();

  if (!planRow) {
    const blocks = allocateBlocks(budget);
    const { data: inserted, error: insertError } = await supabase
      .from("daily_plans")
      .insert({
        user_id: userId,
        study_date: studyDate,
        budget,
        blocks,
      })
      .select("blocks")
      .single();
    if (insertError) throw new Error(insertError.message);
    planRow = { blocks: inserted?.blocks ?? blocks, completed_at: null };
  }

  const planBlocks = asArray<{ id: BlockId; minutes: number }>(planRow.blocks);

  const tasks: TodayTask[] = [];
  for (const b of planBlocks) {
    const progress = await getBlockProgress(supabase, userId, studyDate, b.id);
    tasks.push({
      id: b.id,
      title: blockLabel(b.id),
      type: b.id as StudyTaskType,
      url: `/practice/${b.id}`,
      estimatedMinutes: b.minutes,
      isUrgent: !progress.done && (BLOCK_DEFS[b.id]?.speaking ?? false),
      done: progress.done,
      minutes: progress.minutes,
      speechMinutes: progress.speechMinutes,
    });
  }

  const totalMinutes = tasks.reduce((s, b) => s + b.estimatedMinutes, 0);
  const speakingMinutes = tasks
    .filter((b) => BLOCK_DEFS[b.id as BlockId]?.speaking)
    .reduce((s, b) => s + b.estimatedMinutes, 0);
  const allDone = tasks.every((b) => b.done);
  const enoughMinutes = totalMinutes > 0 && speakingMinutes >= totalMinutes * 0.5;

  const { data: summary } = await supabase
    .from("daily_summary")
    .select("bonus_awarded")
    .eq("user_id", userId)
    .eq("study_date", studyDate)
    .maybeSingle();

  return {
    priority: tasks.map((b) => b.title),
    targetMinutes: budget,
    tasks,
    completedTaskIds: tasks.filter((b) => b.done).map((b) => b.id),
    bonusAwarded: Boolean(summary?.bonus_awarded),
    totalMinutes,
    speakingMinutes,
    allDone,
    enoughMinutes,
    studyDate,
  };
}

export async function regenerateTodayPlan(budget: number): Promise<TodayPlanResult> {
  const supabase = await createClient();
  const { userId } = await getProfileBudget(supabase);
  const studyDate = todayString();
  const safeBudget = Math.max(15, Math.min(180, budget));

  const blocks = allocateBlocks(safeBudget).map((b) => ({
    id: b.id,
    minutes: b.minutes,
    min: b.min,
    ideal: b.ideal,
    max: b.max,
    speaking: b.speaking,
  }));

  const { error } = await supabase
    .from("daily_plans")
    .upsert(
      {
        user_id: userId,
        study_date: studyDate,
        budget: safeBudget,
        blocks,
        completed_at: null,
      },
      { onConflict: "user_id,study_date" },
    );
  if (error) throw new Error(error.message);

  return getTodayPlan();
}

export async function skipBlock(blockId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  await supabase.rpc("log_activity", {
    p_type: "block_skip",
    p_block_type: blockId,
    p_ref_id: null,
    p_duration_sec: 0,
    p_speech_sec: 0,
    p_meta: { skipped: true, study_date: todayString() },
  });
}

export async function getDailyStudyPlan(): Promise<DailyStudyPlan> {
  const today = await getTodayPlan();
  return {
    priority: today.priority,
    targetMinutes: today.targetMinutes,
    tasks: today.tasks as StudyTask[],
    completedTaskIds: today.completedTaskIds,
    bonusAwarded: today.bonusAwarded,
  } as DailyStudyPlan;
}
