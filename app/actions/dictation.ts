"use server";

import { createClient } from "@/lib/supabase/server";

export type DictationAttemptResult = {
  userText: string;
  correct: boolean;
};

export async function saveDictationAttempt(
  result: DictationAttemptResult,
): Promise<{ ok: true; xpEarned: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  const score = result.correct ? 100 : 0;

  const { error } = await supabase.from("dictation_attempts").insert({
    user_id: user.id,
    item_id: null,
    user_text: result.userText.slice(0, 2000),
    score,
  });

  if (error) throw new Error(error.message);

  const xpEarned = result.correct ? 20 : 0;
  if (xpEarned > 0) {
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_amount: xpEarned,
    });
  }

  return { ok: true, xpEarned };
}