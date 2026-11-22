"use server";

import { createClient } from "@/lib/supabase/server";
import { loadFluencyPrompts, promptsByKind, type FluencyPrompt } from "./content";
import { summarizeDrill } from "./catalog";
import type { DrillKind, DrillRound, DrillSummary } from "./schema";
import { awardXp } from "@/lib/activity";

/** Lấy prompt drill theo loại (one_minute, quick_fire, ...). */
export async function getDrillPrompts(kind: string): Promise<FluencyPrompt[]> {
  return promptsByKind(kind);
}

export async function getAllDrillPrompts(): Promise<FluencyPrompt[]> {
  return loadFluencyPrompts();
}

/** Lưu một buổi drill (các lượt nói) và trả về tổng hợp WPM/MLR. */
export async function saveDrill(input: {
  kind: DrillKind;
  promptId?: string | null;
  rounds: DrillRound[];
}): Promise<{ id: string; summary: DrillSummary }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const summary = summarizeDrill(input.kind, input.rounds);

  const { data, error } = await supabase
    .from("fluency_drills")
    .insert({
      user_id: user.id,
      kind: input.kind,
      prompt_id: input.promptId ?? null,
      rounds: input.rounds,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  await awardXp({ reason: "drill", refId: data.id as string, amount: 30 });

  return { id: data.id as string, summary };
}