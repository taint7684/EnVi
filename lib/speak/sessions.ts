"use server";

import { createClient } from "@/lib/supabase/server";

export async function startSpeakingSession(input: {
  topicId: string;
  level: string;
  mode?: "coach" | "mission" | "drill" | "call";
}): Promise<{
  sessionId: string;
  questions: Array<{
    id: string;
    question_en: string;
    question_vi?: string;
    level: string;
    sample_answer_a2?: string;
    sample_answer_b1?: string;
    sample_answer_b2?: string;
    key_phrases: string[];
  }>;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Ban can dang nhap.");

  const mode = input.mode ?? "coach";

  const { data: session, error: sessionError } = await supabase
    .from("speaking_sessions")
    .insert({
      user_id: user.id,
      mode,
      topic_id: input.topicId,
      level: input.level,
      feedback_mode: "safe",
      offline: false,
    })
    .select("id")
    .single();

  if (sessionError) throw new Error(sessionError.message);
  const sessionId = session.id as string;

  const { data: questions, error: qError } = await supabase
    .from("speaking_questions")
    .select("id, question_en, question_vi, level, sample_answer_a2, sample_answer_b1, sample_answer_b2, key_phrases")
    .eq("topic_id", input.topicId)
    .eq("level", input.level)
    .order("created_at", { ascending: true })
    .limit(5);

  if (qError) throw new Error(qError.message);

  const qs = (questions ?? []).map((q) => ({
    id: q.id,
    question_en: q.question_en,
    question_vi: q.question_vi,
    level: q.level,
    sample_answer_a2: q.sample_answer_a2,
    sample_answer_b1: q.sample_answer_b1,
    sample_answer_b2: q.sample_answer_b2,
    key_phrases: q.key_phrases ?? [],
  }));

  if (qs.length === 0) {
    throw new Error("Chua cau hoi cho chu de/cap do nay. Vui long noi dung chuyen vien sinh du lieu.");
  }

  return { sessionId, questions: qs };
}
