"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveGrammarV2Attempt(input: {
  topicId: string;
  questionId: string;
  exerciseType: string;
  correct: boolean;
  userAnswer: string;
  correctAnswer: string;
  questionText: string;
  explanationVi?: string;
}): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  // Save attempt to grammar_attempts (reuse existing table)
  await supabase.from("grammar_attempts").insert({
    user_id: user.id,
    topic_id: input.topicId,
    question_id: input.questionId,
    correct: input.correct,
    answer: input.userAnswer.slice(0, 500),
  });

  // Save wrong answer for review
  if (!input.correct) {
    await supabase.from("grammar_wrong_answers").insert({
      user_id: user.id,
      topic_id: input.topicId,
      question_id: input.questionId,
      exercise_type: input.exerciseType,
      question_text: input.questionText,
      correct_answer: input.correctAnswer,
      user_answer: input.userAnswer,
      explanation_vi: input.explanationVi ?? null,
    });
  } else {
    // Remove from wrong answers if correct now
    await supabase
      .from("grammar_wrong_answers")
      .delete()
      .eq("user_id", user.id)
      .eq("topic_id", input.topicId)
      .eq("question_id", input.questionId);
  }

  // Recompute mastery
  const { data: recent } = await supabase
    .from("grammar_attempts")
    .select("correct")
    .eq("user_id", user.id)
    .eq("topic_id", input.topicId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (recent && recent.length > 0) {
    const correctCount = recent.filter((a) => (a as { correct: boolean }).correct).length;
    const mastery = Math.round((correctCount / recent.length) * 100);
    await supabase
      .from("grammar_mastery")
      .upsert({ user_id: user.id, topic_id: input.topicId, mastery, updated_at: new Date().toISOString() }, { onConflict: "user_id,topic_id" });
  }

  return { ok: true };
}

export async function getGrammarWrongAnswers(): Promise<{ id: string; topicId: string; questionId: string; exerciseType: string; questionText: string }[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("grammar_wrong_answers")
    .select("id, topic_id, question_id, exercise_type, question_text")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (data ?? []).map((r) => ({
    id: (r as { id: string }).id,
    topicId: (r as { topic_id: string }).topic_id,
    questionId: (r as { question_id: string }).question_id,
    exerciseType: (r as { exercise_type: string }).exercise_type,
    questionText: (r as { question_text: string }).question_text,
  }));
}