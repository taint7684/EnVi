import { aiRouter, AiUnavailableError } from "@/lib/ai/router";
import {
  CoachFeedbackSchema,
  RetryEvaluationSchema,
  type CoachFeedback,
  type RetryEvaluation,
} from "./schema";

export async function evaluateCoachFeedback(input: {
  userId: string;
  topic: string;
  level: string;
  question: string;
  transcript: string;
  topPatterns: string[];
}): Promise<{ feedback: CoachFeedback; provider: string; model: string; ms: number }> {
  const systemPrompt = `Ban la EnVi Coach, huong dan vien noi tieng Anh an toi, khuyen khich cho chuyen vien IT/BA Viet Nam (trinh do {level}).
Muc tieu: noi troi chay va tu tin, KHONG phai ngap phap hoan toan. Truyen thong ngay dau tien.
Quy tac:
1. Bat dau bang mot cau khen CỤ THỂ tieng Viet (diem tot thuc su cua nguoi hoc).
2. Sua TOI DA 2 loi, uu tien: loi nghia > loi gay kho hieu > loi biet danh cua Viet Nam > loi khac. Bo qua loi van phong neu cau da tu nhien va ro nghia.
3. Tra cau natural_version: giu y tuong cua nguoi hoc, dung tu thuong dung (top 3000), tieng Anh noi tu nhien (co the rut gon), toi da 500 tu.
4. Giai thich tieng Viet, ngan, an toi, khong thuat ngu.
5. Khong bao gio tam cam. Chi xuat JSON theo schema.
Nghe de: topic={topic}; cau hoi="{question}"; tra loi cua nguoi hoc="{transcript}"; loi lap lai cua nguoi hoc={JSON.stringify(topPatterns)}.`;

  const userPrompt = JSON.stringify({
    topic: input.topic,
    level: input.level,
    question: input.question,
    transcript: input.transcript,
    top_patterns: input.topPatterns,
  });

  const result = await aiRouter.generate<CoachFeedback>({
    task: "coach_feedback",
    schema: CoachFeedbackSchema,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    userId: input.userId,
    timeoutMs: 12000,
  });

  return {
    feedback: result.data,
    provider: result.provider,
    model: result.model,
    ms: result.ms,
  };
}

export async function evaluateRetry(input: {
  userId: string;
  original: string;
  naturalVersion: string;
  retryTranscript: string;
  keywords: string[];
}): Promise<{ eval: RetryEvaluation; provider: string; model: string; ms: number }> {
  const systemPrompt = `Ban la EnVi Coach. Xem xét lại lượt noi KHONG NHIN MAU cua nguoi hoc.
Quy tac:
1. Cham do tuong dong nghia (0-1) so voi cau muon phat.
2. Tinh le tu khoa da sua xuat hien.
3. Khong phat phai cach noi khac nhung van chinh nghia.
4. Xuat JSON theo schema.
Nghe de: cau goc="{original}"; cau mau="{naturalVersion}"; tra loi lai="{retryTranscript}"; tu khoa={JSON.stringify(keywords)}.`;

  const userPrompt = JSON.stringify({
    original: input.original,
    naturalVersion: input.naturalVersion,
    retryTranscript: input.retryTranscript,
    keywords: input.keywords,
  });

  const result = await aiRouter.generate<RetryEvaluation>({
    task: "retry_eval",
    schema: RetryEvaluationSchema,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    userId: input.userId,
    timeoutMs: 4000,
  });

  return { eval: result.data, provider: result.provider, model: result.model, ms: result.ms };
}

export function isAiUnavailable(err: unknown): err is AiUnavailableError {
  return err instanceof AiUnavailableError;
}
