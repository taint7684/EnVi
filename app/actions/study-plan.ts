"use server";

import { createClient } from "@/lib/supabase/server";
import { getDueCount } from "@/lib/vocab";
import { getDuePhraseCount } from "@/lib/phrases";
import type { DailyStudyPlan, StudyTask } from "@/lib/types";

const TEST_REMIND_DAYS = 14;
const DAILY_BONUS_XP = 100;

function todayString(): string {
  return new Date().toISOString().split("T")[0];
}

function daysSince(iso: string | null): number {
  if (!iso) return Number.POSITIVE_INFINITY;
  const then = new Date(iso).getTime();
  return Math.floor((Date.now() - then) / 86_400_000);
}

async function computePlan(): Promise<{
  priority: string[];
  targetMinutes: number;
  tasks: StudyTask[];
}> {
  const supabase = await createClient();

  const [cardCounts, phraseCounts] = await Promise.all([
    getDueCount().catch(() => ({ due: 0, new: 0, total: 0 })),
    getDuePhraseCount().catch(() => ({ due: 0, new: 0, total: 0 })),
  ]);

  const { data: streakRow } = await supabase
    .from("daily_progress")
    .select("streak")
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lastTest } = await supabase
    .from("progress_tests")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const streak = (streakRow as { streak: number } | null)?.streak ?? 0;
  const sinceTest = daysSince(
    (lastTest as { created_at: string } | null)?.created_at ?? null,
  );

  const tasks: StudyTask[] = [];

  // 1) Flashcard đến hạn / từ mới
  if (cardCounts.total > 0) {
    tasks.push({
      id: "vocab",
      type: "vocab",
      title: `Ôn ${cardCounts.due} thẻ đến hạn · học ${cardCounts.new} từ mới`,
      url: "/vocab",
      estimatedMinutes: Math.max(1, Math.round(cardCounts.total * 0.5)),
      isUrgent: cardCounts.due > 0,
    });
  }

  // 2) Câu reflex đến hạn
  if (phraseCounts.total > 0) {
    tasks.push({
      id: "reflex",
      type: "reflex",
      title: `Luyện ${phraseCounts.due} câu reflex đến hạn · ${phraseCounts.new} câu mới`,
      url: "/reflex",
      estimatedMinutes: Math.max(1, Math.round(phraseCounts.total * 0.75)),
      isUrgent: phraseCounts.due > 0,
    });
  }

  // 3) Progress Test nếu >= 14 ngày chưa làm
  if (sinceTest >= TEST_REMIND_DAYS) {
    tasks.push({
      id: "progress-test",
      type: "progress-test",
      title:
        sinceTest === Number.POSITIVE_INFINITY
          ? "Làm bài kiểm tra tiến độ đầu tiên (20 câu)"
          : `Đã ${sinceTest} ngày chưa test — làm bài kiểm tra 20 câu`,
      url: "/progress-test",
      estimatedMinutes: 15,
      isUrgent: true,
    });
  }

  // 4) Streak nhắc nhở
  if (streak <= 1) {
    tasks.push({
      id: "streak",
      type: "streak",
      title: "Đừng để mất Streak! Học ít nhất 1 hoạt động hôm nay",
      url: "/vocab",
      estimatedMinutes: 5,
      isUrgent: true,
    });
  }

  // 5) Speaking 1 phiên
  tasks.push({
    id: "speaking",
    type: "speaking",
    title: "Luyện Speaking 1 phiên với AI",
    url: "/speaking",
    estimatedMinutes: 10,
    isUrgent: false,
  });

  // 6) Dictation 1 bài
  tasks.push({
    id: "dictation",
    type: "dictation",
    title: "Nghe chép chính tả 1 bài",
    url: "/dictation",
    estimatedMinutes: 8,
    isUrgent: false,
  });

  // 7) Grammar 1 bài
  tasks.push({
    id: "grammar",
    type: "grammar",
    title: "Học & luyện tập 1 chủ điểm ngữ pháp",
    url: "/grammar",
    estimatedMinutes: 10,
    isUrgent: false,
  });

  // Ưu tiên: urgent trước, giữ nguyên thứ tự còn lại.
  const ordered = [...tasks].sort(
    (a, b) => Number(b.isUrgent) - Number(a.isUrgent),
  );

  const targetMinutes = Math.min(
    240,
    Math.max(60, ordered.reduce((sum, t) => sum + t.estimatedMinutes, 0)),
  );

  return {
    priority: ordered.map((t) => t.title),
    targetMinutes,
    tasks: ordered,
  };
}

export async function getDailyStudyPlan(): Promise<DailyStudyPlan> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      priority: [],
      targetMinutes: 0,
      tasks: [],
      completedTaskIds: [],
      bonusAwarded: false,
    };
  }

  const plan = await computePlan();

  const { data: row } = await supabase
    .from("study_plan_progress")
    .select("completed_task_ids, bonus_awarded")
    .eq("user_id", user.id)
    .eq("plan_date", todayString())
    .maybeSingle();

  const record = row as
    | { completed_task_ids: string[]; bonus_awarded: boolean }
    | null;

  return {
    ...plan,
    completedTaskIds: record?.completed_task_ids ?? [],
    bonusAwarded: record?.bonus_awarded ?? false,
  };
}

export async function toggleStudyTask(
  taskId: string,
): Promise<{ completedTaskIds: string[]; bonusAwarded: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  const planDate = todayString();

  const { data: existing } = await supabase
    .from("study_plan_progress")
    .select("completed_task_ids, bonus_awarded")
    .eq("user_id", user.id)
    .eq("plan_date", planDate)
    .maybeSingle();

  const record = existing as
    | { completed_task_ids: string[]; bonus_awarded: boolean }
    | null;

  const current = record?.completed_task_ids ?? [];
  const next = current.includes(taskId)
    ? current.filter((t) => t !== taskId)
    : [...current, taskId];

  // Tính lại plan để biết tổng số task hợp lệ hôm nay.
  const plan = await computePlan();
  const allIds = plan.tasks.map((t) => t.id);
  const allDone = allIds.every((id) => next.includes(id));

  let bonusAwarded = record?.bonus_awarded ?? false;
  if (allDone && !bonusAwarded) {
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_amount: DAILY_BONUS_XP,
    });
    bonusAwarded = true;
  }

  const { error } = await supabase.from("study_plan_progress").upsert(
    {
      user_id: user.id,
      plan_date: planDate,
      completed_task_ids: next,
      bonus_awarded: bonusAwarded,
    },
    { onConflict: "user_id,plan_date" },
  );

  if (error) throw new Error(error.message);

  return { completedTaskIds: next, bonusAwarded };
}