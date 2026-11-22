"use server";

import { aiRouter } from "@/lib/ai/router";
import { ReflexMeaningSchema, type ReflexMeaning } from "@/lib/reflex/schema";
import { reviewPhrase } from "@/app/actions/phrase-review";
import { evaluateSpeech } from "@/lib/speech-eval";
import { createClient } from "@/lib/supabase/server";

export async function evaluateMeaning(input: {
  userId?: string;
  phraseId: string;
  viText: string;
  enText: string;
  spoken: string;
}): Promise<{ meaning: ReflexMeaning; aiUsed: boolean }> {
  try {
    const result = await aiRouter.generate<ReflexMeaning>({
      task: "reflex_judge",
      schema: ReflexMeaningSchema,
      userId: input.userId,
      messages: [
        {
          role: "system",
          content:
            "Ban la gia vien tieng Anh. Nhiem vu: xet nghia cua cau nguoi hoc noi so voi cau chuan. Tra ve JSON khong co ma hoa them. Truong: meaningCorrect (boolean), explanationVi (string tieng Viet, de trong neu khong co), level ('L1'|'L2'|'L3'): L1 = nghia hoan toan dung, L2 = nghia dung it sai, L3 = nghia sai troi ngai.",
        },
        {
          role: "user",
          content:
            `Cau goc (Tieng Viet): ${input.viText}\n` +
            `Cau Anh chuan: ${input.enText}\n` +
            `Nguoi hoc noi: ${input.spoken}\n` +
            "Danh gia nghia danh cho duoc khong? Tra ve JSON.",
        },
      ],
    });
    return { meaning: result.data, aiUsed: true };
  } catch {
    const speech = evaluateSpeech(input.enText, input.spoken);
    return {
      meaning: {
        meaningCorrect: speech.correct,
        explanationVi: undefined,
        level: "L2",
      },
      aiUsed: false,
    };
  }
}

export async function recordReflexResult(input: {
  phraseId: string;
  grade: "again" | "hard" | "good" | "easy";
  meaningScore: number | null;
  latencyMs: number | null;
}): Promise<void> {
  await reviewPhrase(input.phraseId, input.grade);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Chua dang nhap.");

  await supabase
    .from("phrase_reviews")
    .update({
      meaning_score: input.meaningScore,
      latency_ms: input.latencyMs,
    })
    .eq("user_id", user.id)
    .eq("phrase_id", input.phraseId);
}
