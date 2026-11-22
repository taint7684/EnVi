"use server";

import { createClient } from "@/lib/supabase/server";
import { lookupCandidates } from "./lemmatize";

export type WordLookup = {
  word: string;
  ipa: string | null;
  meaning: string;
  pos: string | null;
  found: boolean;
};

/** Tra nghĩa một từ trong bảng words (thử cả từ gốc và lemma). */
export async function lookupWord(raw: string): Promise<WordLookup> {
  const supabase = await createClient();
  const candidates = lookupCandidates(raw);
  for (const c of candidates) {
    const { data } = await supabase
      .from("words")
      .select("lemma, ipa, meaning_vi, pos")
      .ilike("lemma", c)
      .limit(1);
    const row = data && data[0];
    if (row) {
      return {
        word: raw,
        ipa: row.ipa ?? null,
        meaning: row.meaning_vi,
        pos: row.pos ?? null,
        found: true,
      };
    }
  }
  return { word: raw, ipa: null, meaning: "", pos: null, found: false };
}

export type ReadingAttemptInput = {
  passageId: string;
  quizScore: number;
  summaryText?: string;
  lookups?: number;
};

/** Lưu một lượt đọc hiểu (điểm quiz + tóm tắt) vào DB (thay localStorage). */
export async function saveReadingAttempt(
  input: ReadingAttemptInput,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("reading_attempts")
    .insert({
      user_id: user.id,
      passage_id: input.passageId,
      quiz_score: input.quizScore,
      summary_text: input.summaryText?.slice(0, 4000) ?? null,
      lookups: input.lookups ?? 0,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}