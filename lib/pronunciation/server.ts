"use server";

import { createClient } from "@/lib/supabase/server";
import { loadPronunciationFocuses, type PronunciationFocus } from "./content";

export async function getPronunciationFocuses(): Promise<PronunciationFocus[]> {
  return loadPronunciationFocuses();
}

export type PronunciationAttemptInput = {
  focusId: string;
  itemType: "pair" | "word" | "sentence" | "passage";
  targetText: string;
  transcript: string;
  wordResults: Array<{ word: string; ok: boolean }>;
  score: number;
  audioPath?: string | null;
  scorer?: string;
};

/** Lưu một lượt luyện phát âm (đã chấm ở client bằng lib/speech/scoring). */
export async function savePronunciationAttempt(
  input: PronunciationAttemptInput,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("pronunciation_attempts")
    .insert({
      user_id: user.id,
      focus_id: input.focusId,
      item_type: input.itemType,
      target_text: input.targetText.slice(0, 1000),
      transcript: input.transcript.slice(0, 2000),
      word_results: input.wordResults,
      score: input.score,
      scorer: input.scorer ?? "whisper",
      audio_path: input.audioPath ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  // Cập nhật mastery trung bình động (làm tròn) theo focus.
  const { data: rows } = await supabase
    .from("pronunciation_attempts")
    .select("score")
    .eq("user_id", user.id)
    .eq("focus_id", input.focusId)
    .order("created_at", { ascending: false })
    .limit(10);
  const scores = (rows ?? []).map((r) => Number(r.score ?? 0));
  if (scores.length > 0) {
    const mastery = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    await supabase.from("pronunciation_progress").upsert(
      { user_id: user.id, focus_id: input.focusId, mastery, updated_at: new Date().toISOString() },
      { onConflict: "user_id,focus_id" },
    );
  }

  return { id: data.id as string };
}