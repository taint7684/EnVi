"use server";

import { createClient } from "@/lib/supabase/server";

export type GrammarAttemptInput = {
  topicId: string;
  questionId: string;
  correct: boolean;
  answer?: string;
};

/** Lưu 1 lượt làm bài ngữ pháp; cập nhật mastery (động) theo tỉ lệ đúng gần đây. */
export async function saveGrammarAttempt(
  input: GrammarAttemptInput,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("grammar_attempts")
    .insert({
      user_id: user.id,
      topic_id: input.topicId,
      question_id: input.questionId,
      correct: input.correct,
      answer: input.answer?.slice(0, 500) ?? null,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const { data: recent } = await supabase
    .from("grammar_attempts")
    .select("correct")
    .eq("user_id", user.id)
    .eq("topic_id", input.topicId)
    .order("created_at", { ascending: false })
    .limit(20);
  const rows = recent ?? [];
  if (rows.length > 0) {
    const correct = rows.filter((r) => r.correct).length;
    const mastery = Math.round((correct / rows.length) * 100);
    await supabase.from("grammar_mastery").upsert(
      { user_id: user.id, topic_id: input.topicId, mastery, updated_at: new Date().toISOString() },
      { onConflict: "user_id,topic_id" },
    );
  }

  return { id: data.id as string };
}

export type GrammarMasteryRow = { topic_id: string; mastery: number };

export async function getGrammarMastery(): Promise<GrammarMasteryRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data } = await supabase
    .from("grammar_mastery")
    .select("topic_id, mastery")
    .eq("user_id", user.id);
  return (data ?? []) as GrammarMasteryRow[];
}