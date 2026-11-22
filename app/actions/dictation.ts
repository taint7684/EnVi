"use server";

import { createClient } from "@/lib/supabase/server";

export type DictationAttemptInput = {
  userText: string;
  score: number; // 0..100
  correct: boolean;
  revealedBeforeSubmit?: boolean;
  hintUsed?: boolean;
  itemId?: string | null;
  segmentIdx?: number | null;
};

export async function saveDictationAttempt(
  result: DictationAttemptInput,
): Promise<{ ok: true; xpEarned: number }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  // BR-9.3: xem đáp án trước khi nộp → 0 điểm, 0 XP.
  const finalScore = result.revealedBeforeSubmit ? 0 : Math.max(0, Math.min(100, Math.round(result.score)));

  const { error } = await supabase.from("dictation_attempts").insert({
    user_id: user.id,
    item_id: result.itemId ?? null,
    segment_idx: result.segmentIdx ?? null,
    user_text: result.userText.slice(0, 2000),
    score: finalScore,
    hint_used: Boolean(result.hintUsed),
    revealed_before_submit: Boolean(result.revealedBeforeSubmit),
  });

  if (error) throw new Error(error.message);

  const xpEarned = !result.revealedBeforeSubmit && finalScore >= 90 ? 4 : 0;
  if (xpEarned > 0) {
    await supabase.rpc("award_xp", {
      p_reason: "dictation",
      p_ref_id: `dictation-${user.id}-${Date.now()}`,
      p_amount: xpEarned,
    });
  }

  return { ok: true, xpEarned };
}