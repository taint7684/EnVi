"use server";

import { createClient } from "@/lib/supabase/server";
import { cardToRow, newCard, repeatCard, rowToCard, isPracticeGrade } from "@/lib/srs";
import type { CardReviewRow, ReviewGrade } from "@/lib/types";

export async function reviewWord(
  wordId: string,
  grade: ReviewGrade,
  mode: "official" | "practice" = "official",
): Promise<{ ok: true; dueAt: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error: fetchError } = await supabase
    .from("card_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("word_id", wordId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  const existing = (data ?? null) as CardReviewRow | null;
  const now = new Date();
  const card = existing ? rowToCard(existing) : newCard(now);

  let nextCard;
  let row;

  if (mode === "practice") {
    nextCard = repeatCard(card, grade, now);
    row = {
      user_id: user.id,
      word_id: wordId,
      ease: 2.5,
      interval: Math.round(nextCard.scheduled_days),
      due_at: nextCard.due.toISOString(),
      reps: nextCard.reps,
      lapses: nextCard.lapses,
      last_reviewed_at: now.toISOString(),
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      state: nextCard.state,
      elapsed_days: nextCard.elapsed_days,
      scheduled_days: nextCard.scheduled_days,
      learning_steps: nextCard.learning_steps,
      last_review: nextCard.last_review ? nextCard.last_review.toISOString() : null,
    };
  } else {
    nextCard = repeatCard(card, grade, now);
    row = {
      user_id: user.id,
      word_id: wordId,
      ease: 2.5,
      interval: Math.round(nextCard.scheduled_days),
      due_at: nextCard.due.toISOString(),
      reps: nextCard.reps,
      lapses: nextCard.lapses,
      last_reviewed_at: now.toISOString(),
      stability: nextCard.stability,
      difficulty: nextCard.difficulty,
      state: nextCard.state,
      elapsed_days: nextCard.elapsed_days,
      scheduled_days: nextCard.scheduled_days,
      learning_steps: nextCard.learning_steps,
      last_review: nextCard.last_review ? nextCard.last_review.toISOString() : null,
    };
  }

  const { error } = await supabase
    .from("card_reviews")
    .upsert(row, { onConflict: "user_id,word_id" });

  if (error) throw new Error(error.message);

  await supabase.from("vocab_review_log").insert({
    user_id: user.id,
    word_id: wordId,
    grade,
    review_mode: mode,
  });

  if (grade === "good" || grade === "easy") {
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_amount: 10,
    });
  }

  if (mode === "practice") {
    const isDifficult = isPracticeGrade(grade);
    if (isDifficult) {
      await supabase.rpc("add_xp", {
        user_uuid: user.id,
        xp_amount: 2,
      });
    }
  }

  return { ok: true, dueAt: nextCard.due.toISOString() };
}

export async function updateSessionState(input: {
  newWordsCount?: number;
  currentPosition?: number;
  groupStartedAt?: string | null;
  difficultWordIds?: string[];
  practiceQueue?: string[];
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.newWordsCount !== undefined) updates.new_words_count = input.newWordsCount;
  if (input.currentPosition !== undefined) updates.current_position = input.currentPosition;
  if (input.groupStartedAt !== undefined) updates.group_started_at = input.groupStartedAt;
  if (input.difficultWordIds !== undefined) updates.difficult_word_ids = input.difficultWordIds;
  if (input.practiceQueue !== undefined) updates.practice_queue = input.practiceQueue;

  await supabase
    .from("vocab_session_state")
    .upsert({ user_id: user.id, ...updates }, { onConflict: "user_id" });
}