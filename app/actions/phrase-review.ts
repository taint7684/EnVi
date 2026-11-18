"use server";

import { createClient } from "@/lib/supabase/server";
import { createNewCard, reviewCard, rowToCard } from "@/lib/srs";
import type {
  PhraseReviewRow,
  PhraseReviewRowInsert,
  ReviewGrade,
} from "@/lib/types";

export async function reviewPhrase(
  phraseId: string,
  grade: ReviewGrade,
): Promise<{ ok: true; dueAt: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error: fetchError } = await supabase
    .from("phrase_reviews")
    .select("*")
    .eq("user_id", user.id)
    .eq("phrase_id", phraseId)
    .maybeSingle();

  if (fetchError) throw new Error(fetchError.message);

  const existing = (data ?? null) as PhraseReviewRow | null;
  const prevLapses = existing?.lapses ?? 0;
  const now = new Date();
  const card = existing ? rowToCard(existing) : createNewCard(now);
  const { card: next } = reviewCard(card, grade, now);

  const row: PhraseReviewRowInsert = {
    user_id: user.id,
    phrase_id: phraseId,
    ease: next.EF,
    interval: next.I,
    due_at: next.due.toISOString(),
    reps: next.n,
    lapses: prevLapses + (grade === "again" ? 1 : 0),
    last_reviewed_at: now.toISOString(),
  };

  const { error } = await supabase
    .from("phrase_reviews")
    .upsert(row, { onConflict: "user_id,phrase_id" });

  if (error) throw new Error(error.message);

  // Phrase Reflex: người học nói đúng 1 câu = 15 XP.
  if (grade === "good" || grade === "easy") {
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_amount: 15,
    });
  }

  return { ok: true, dueAt: next.due.toISOString() };
}