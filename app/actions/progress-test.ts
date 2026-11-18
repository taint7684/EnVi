"use server";

import { createClient } from "@/lib/supabase/server";

export type ProgressTestAnswer = {
  key: string;
  topicId: string;
  kind: "mcq" | "fill";
  correct: boolean;
};

export type ProgressTestResult = {
  score: number;
  total: number;
  level?: string;
  details: ProgressTestAnswer[];
};

export async function saveProgressTest(
  result: ProgressTestResult,
): Promise<{ ok: true; xpEarned: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  const total = Math.max(1, result.total);
  const score = Math.max(0, Math.min(total, result.score));

  const { error } = await supabase.from("progress_tests").insert({
    user_id: user.id,
    score,
    total,
    level: result.level ?? null,
    details: result.details,
  });

  if (error) throw new Error(error.message);

  const xpEarned = score * 5;
  if (xpEarned > 0) {
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_amount: xpEarned,
    });
  }

  return { ok: true, xpEarned };
}