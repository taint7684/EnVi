"use server";

import { createClient } from "@/lib/supabase/server";
import { MissionSchema, type Mission } from "./schema";
import { loadMissionContent, findMissionContent } from "./content";
import { judgeObjectives } from "./judge";
import { mergeObjectivesDone, missionSucceeded, objectivesProgress } from "./catalog";
import { awardXp } from "@/lib/activity";

function rowToMission(row: Record<string, unknown>): Mission | null {
  try {
    return MissionSchema.parse({
      id: row.id,
      title_vi: row.title_vi,
      title_en: row.title_en,
      category: row.category,
      level: row.level,
      role_relevance: row.role_relevance ?? [],
      scenario_vi: row.scenario_vi,
      ai_persona: row.ai_persona,
      objectives: row.objectives ?? [],
      prep_chunks: row.prep_chunks ?? [],
      strategy_card_id: row.strategy_card_id ?? null,
      max_turns: row.max_turns ?? 10,
      success_rule: row.success_rule ?? ">= objectives-1 done",
      offline_script: row.offline_script ?? [],
    });
  } catch {
    return null;
  }
}

/** Danh sách mission: đọc DB trước, nếu trống thì dùng nội dung repo. */
export async function getMissions(): Promise<Mission[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("missions")
    .select("*")
    .order("sort_order", { ascending: true });
  if (data && data.length > 0) {
    const parsed = data.map((r) => rowToMission(r as Record<string, unknown>)).filter((m): m is Mission => m != null);
    if (parsed.length > 0) return parsed;
  }
  return loadMissionContent();
}

export async function getMission(id: string): Promise<Mission | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("missions").select("*").eq("id", id).maybeSingle();
  if (data) {
    const parsed = rowToMission(data as Record<string, unknown>);
    if (parsed) return parsed;
  }
  return findMissionContent(id);
}

/** Bắt đầu một lượt mission: tạo mission_attempts. */
export async function startMission(missionId: string): Promise<{ attemptId: string; mission: Mission }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const mission = (await getMission(missionId)) ?? findMissionContent(missionId);
  if (!mission) throw new Error("Không tìm thấy mission.");

  const { data, error } = await supabase
    .from("mission_attempts")
    .insert({ user_id: user.id, mission_id: missionId })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  return { attemptId: data.id as string, mission };
}

export type MissionTurnProgress = {
  doneIds: string[];
  newDone: string[];
  total: number;
  done: number;
  remaining: number;
};

/** Ghi một lượt nói: chấm objective bằng AI, cập nhật tiến độ. */
export async function submitMissionTurn(input: {
  attemptId: string;
  learnerTurn: string;
  personaLine: string;
}): Promise<MissionTurnProgress> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data: attempt } = await supabase
    .from("mission_attempts")
    .select("id, mission_id, objectives_done, turns")
    .eq("id", input.attemptId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!attempt) throw new Error("Không tìm thấy lượt mission.");

  const mission =
    (await getMission(attempt.mission_id as string)) ?? findMissionContent(attempt.mission_id as string);
  if (!mission) throw new Error("Không tìm thấy mission.");

  const previousDone = (attempt.objectives_done as string[] | null) ?? [];
  const judge = await judgeObjectives({
    userId: user.id,
    objectives: mission.objectives,
    scenario: mission.scenario_vi,
    personaName: mission.ai_persona.name,
    personaLine: input.personaLine,
    learnerTurn: input.learnerTurn,
  });
  const judgedDone = judge.results.filter((r) => r.achieved).map((r) => r.objective_id);
  const doneIds = mergeObjectivesDone(mission.objectives, previousDone, judgedDone);
  const newDone = doneIds.filter((id) => !previousDone.includes(id));

  const progress = objectivesProgress(mission.objectives, doneIds);
  const turns = ((attempt.turns as number | null) ?? 0) + 1;

  await supabase
    .from("mission_attempts")
    .update({ objectives_done: doneIds, turns })
    .eq("id", input.attemptId)
    .eq("user_id", user.id);

  return { doneIds, newDone, total: progress.total, done: progress.done, remaining: progress.remaining };
}

export type MissionDebrief = {
  success: boolean;
  doneIds: string[];
  total: number;
  done: number;
  objectives: Mission["objectives"];
};

/** Kết thúc mission: tính thành công, cộng XP (idempotent theo attempt). */
export async function finishMission(attemptId: string): Promise<MissionDebrief> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data: attempt } = await supabase
    .from("mission_attempts")
    .select("id, mission_id, objectives_done, completed_at")
    .eq("id", attemptId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!attempt) throw new Error("Không tìm thấy lượt mission.");

  const mission =
    (await getMission(attempt.mission_id as string)) ?? findMissionContent(attempt.mission_id as string);
  if (!mission) throw new Error("Không tìm thấy mission.");

  const doneIds = (attempt.objectives_done as string[] | null) ?? [];
  const success = missionSucceeded(mission.success_rule, mission.objectives.length, doneIds.length);

  if (!attempt.completed_at) {
    await supabase
      .from("mission_attempts")
      .update({ success, completed_at: new Date().toISOString() })
      .eq("id", attemptId)
      .eq("user_id", user.id);
    if (success) {
      await awardXp({ reason: "mission", refId: attemptId, amount: 80 });
    }
  }

  return {
    success,
    doneIds,
    total: mission.objectives.length,
    done: doneIds.length,
    objectives: mission.objectives,
  };
}