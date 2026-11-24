"use server";

import { createClient } from "@/lib/supabase/server";
import { loadPronunciationFocuses } from "./content";
import type { PronunciationFocus, PronunciationProgress } from "./types";

export async function getPronunciationFocuses(): Promise<PronunciationFocus[]> {
  return loadPronunciationFocuses();
}

export async function getPronunciationProgress(): Promise<Record<string, PronunciationProgress>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: progress } = await supabase
    .from("pronunciation_progress")
    .select("focus_id, mastery, updated_at")
    .eq("user_id", user.id);

  if (!progress || progress.length === 0) return {};

  const { data: attempts } = await supabase
    .from("pronunciation_attempts")
    .select("focus_id")
    .eq("user_id", user.id);

  const attemptCounts: Record<string, number> = {};
  for (const a of attempts ?? []) {
    attemptCounts[a.focus_id] = (attemptCounts[a.focus_id] ?? 0) + 1;
  }

  const result: Record<string, PronunciationProgress> = {};
  for (const p of progress) {
    const attemptsCount = attemptCounts[p.focus_id] ?? 0;
    const mastery = Number(p.mastery ?? 0);
    let status: "new" | "practicing" | "mastered" | "weak";
    if (attemptsCount === 0) status = "new";
    else if (mastery >= 80) status = "mastered";
    else if (mastery < 50) status = "weak";
    else status = "practicing";

    result[p.focus_id] = {
      focusId: p.focus_id,
      mastery,
      attempts: attemptsCount,
      lastPracticed: p.updated_at ?? null,
      status,
    };
  }
  return result;
}

export type PronunciationAttemptInput = {
  focusId: string;
  itemType: "pair" | "word" | "sentence" | "passage" | "quick_test";
  targetText: string;
  transcript: string;
  wordResults: Array<{ word: string; ok: boolean }>;
  score: number;
  audioPath?: string | null;
  scorer?: string;
};

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