"use server";

import { createClient } from "@/lib/supabase/server";
import { cardToRow, createNewCard, reviewCard, rowToCard } from "@/lib/srs";
import type { CardReviewRow, ReviewGrade } from "@/lib/types";

export async function reviewWord(
  wordId: string,
  grade: ReviewGrade,
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
  const prevLapses = existing?.lapses ?? 0;
  const now = new Date();
  const card = existing ? rowToCard(existing) : createNewCard(now);
  const { card: next } = reviewCard(card, grade, now);
  const row = cardToRow(user.id, wordId, next, prevLapses, grade, now);

  const { error } = await supabase
    .from("card_reviews")
    .upsert(row, { onConflict: "user_id,word_id" });

  if (error) throw new Error(error.message);

  // Award XP for reviewing a card (Good/Easy = 10 XP)
  if (grade === "good" || grade === "easy") {
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_amount: 10,
    });
  }

  return { ok: true, dueAt: next.due.toISOString() };
}