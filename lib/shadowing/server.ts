"use server";

import { createClient } from "@/lib/supabase/server";

export type ShadowingAttemptInput = {
  itemId: string | null;
  segmentIdx: number | null;
  transcript: string;
  accuracy: number;
  timing: number;
  score: number;
};

export async function saveShadowingAttempt(
  input: ShadowingAttemptInput,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("shadowing_attempts")
    .insert({
      user_id: user.id,
      item_id: input.itemId,
      segment_idx: input.segmentIdx,
      transcript: input.transcript.slice(0, 2000),
      accuracy: input.accuracy,
      timing: input.timing,
      score: input.score,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}