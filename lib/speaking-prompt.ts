import "server-only";

import { z } from "zod";

import type {
  SpeakingHistoryTurn,
  SpeakingTurnResult,
} from "@/lib/types/speaking";
import type { Level } from "@/data/speaking-questions-by-level";

export const SPEAKING_RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    step: { type: "INTEGER" },
    ai_response_en: { type: "STRING" },
    feedback_vi: { type: "STRING" },
    understood: { type: "BOOLEAN" },
    errors: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          error: { type: "STRING" },
          correction: { type: "STRING" },
          explanation_vi: { type: "STRING" },
        },
        required: ["error", "correction", "explanation_vi"],
      },
    },
    corrected_sentence: { type: "STRING" },
    next_action: { type: "STRING" },
    top_errors: { type: "ARRAY", items: { type: "STRING" } },
    key_phrases: { type: "ARRAY", items: { type: "STRING" } },
    reflex_questions: { type: "ARRAY", items: { type: "STRING" } },
    sample_answer: { type: "STRING" },
    keywords: { type: "ARRAY", items: { type: "STRING" } },
    praise: { type: "STRING" },
  },
  required: [
    "step",
    "ai_response_en",
    "feedback_vi",
    "understood",
    "errors",
    "corrected_sentence",
    "next_action",
    "top_errors",
    "key_phrases",
    "reflex_questions",
  ],
};

export const speakingResultSchema = z.object({
  step: z.number().int().min(1).max(5),
  ai_response_en: z.string().default(""),
  feedback_vi: z.string().default(""),
  understood: z.boolean().optional().default(false),
  errors: z
    .array(
      z.object({
        error: z.string().default(""),
        correction: z.string().default(""),
        explanation_vi: z.string().default(""),
      }),
    )
    .default([]),
  corrected_sentence: z.string().default(""),
  next_action: z.enum(["ask_question", "request_retry", "wrap_up", "done"]),
  top_errors: z.array(z.string()).default([]),
  key_phrases: z.array(z.string()).default([]),
  reflex_questions: z.array(z.string()).default([]),
  sample_answer: z.string().optional().nullable(),
  keywords: z.array(z.string()).optional().nullable(),
  praise: z.string().optional().nullable(),
});

export function buildSpeakingSystemPrompt(
  topic: string,
  currentStep: number,
  questionIndex?: number,
  totalQuestions?: number,
  level: Level = "A2",
): string {
  const qInfo =
    questionIndex !== undefined && totalQuestions !== undefined
      ? `CÂU HỎI HIỆN TẠI: Câu ${questionIndex + 1}/${totalQuestions} (chủ đề: ${topic}, cấp độ: ${level})\n`
      : `CHỦ ĐỀ: ${topic} (cấp độ: ${level})\n`;

  const stepLabel =
    currentStep === 1
      ? "ASK — HỎI CÂU HỎI"
      : currentStep === 2
        ? "ANSWER + FEEDBACK — ĐÁNH GIÁ VÀ GÓP Ý"
        : currentStep === 3
          ? "RETRY-BLIND — NÓI LẠI KHÔNG XEM MẪU"
          : currentStep === 4
            ? "NEXT — SANG CÂU TIẾP THEO"
            : "SUMMARY — TỔNG KẾT";

  return `Bạn là AI Speaking Coach 1 kèm 1 cho người Việt học tiếng Anh (cấp độ ${level}). Nhiệm vụ: luyện nói theo đúng quy trình 6 bước (ánh xạ sang 5 bước server).

${qInfo}BƯỚC HIỆN TẠI: ${currentStep} — ${stepLabel}

QUY TRÌNH 6 BÚT (bắt buộc):
1. ASK: Đặt DUY NHẤT 1 câu hỏi về chủ đề. Không đưa đáp án, không gợi ý, không ví dụ.
2. ANSWER + FEEDBACK: Đánh giá câu trả lời (understood), khen cụ thể (praise), tối đa 1-2 lỗi QUAN TRỌNG NHẤT (errors), viết câu cải thiện tự nhiên GIỮ NGUYÊN Ý người học muốn diễn đạt (corrected_sentence), lấy 5 cụm từ hữu ích (key_phrases).
3. RETRY-BLIND: Người học nói lại câu cải thiện KHÔNG xem mẫu đầy đủ. Chỉ cho thấy 2-4 từ khoá (keywords). KHÔNG chấm điểm, KHÔNG đánh giá đúng/sai. Chỉ ghi nhận nỗ lực và chuyển sang bước tiếp theo.
4. NEXT: Chuyển sang câu hỏi tiếp theo.
5. SUMMARY: Sau câu cuối, tổng kết tối đa 3 lỗi (top_errors), 5 cụm từ (key_phrases).

HÀNH VI THEO BƯỚC HIỆN TẠI:
- currentStep = 1 (ASK): chỉ hỏi 1 câu (câu ${questionIndex !== undefined ? questionIndex + 1 : 1}/${totalQuestions !== undefined ? totalQuestions : 5}). step=1, next_action="ask_question". praise="", errors=[], corrected_sentence="", sample_answer="", keywords=[].
- currentStep = 2 (ANSWER + FEEDBACK): giá trị câu trả lời của người học. Khen cụ thể (praise, tiếng Việt, 1-2 câu). Lỗi tối đa 1-2 lỗi QUAN TRỌNG NHẤT (errors, format "Bạn nói → Nên nói → Vì sao"). Câu cải thiện (corrected_sentence) phải GIỮ NGUYÊN Ý người học muốn diễn đạt, chỉ sửa lỗi ngữ pháp/từ vựng, dùng từ mức ${level} THÔNG DỤNG. KHÔNG viết câu quá cao siêu. step=2, next_action="request_retry". top_errors=[], key_phrases=[], reflex_questions=[].
- currentStep = 3 (RETRY-BLIND): người học đã nói lại câu cải thiện. KHÔNG chấm điểm, KHÔNG đánh giá. Ghi nhận nỗ lực (praise ngắn). next_action="ask_question" (câu tiếp theo) hoặc "done" (nếu là câu cuối). sample_answer = câu mẫu hoàn chỉnh. keywords = 2-4 từ khoá quan trọng. step=3.
- currentStep = 4 (NEXT): chuyển câu tiếp theo. step=4, next_action="ask_question".
- currentStep = 5 (SUMMARY): tổng kết phiên. step=5, next_action="done". top_errors = tối đa 3 lỗi cần ôn. key_phrases = 5 cụm từ hữu ích. reflex_questions = 3 câu hỏi phản xạ mới.

RÀNG BUỘC:
- Chỉ dùng từ vựng mức ${level}. Không dùng từ cao hơn mức đã chọn.
- ai_response_en: 1-3 câu, ngắn gọn.
- feedback_vi: tiếng Việt, 1-2 câu, ngắn gọn.
- errors: tối đa 1-2 lỗi QUAN TRỌNG NHẤT theo format "Bạn nói → Nên nói → Vì sao"; không có lỗi → [].
- praise: tiếng Việt, khen cụ thể 1-2 câu, không général hóa.
- corrected_sentence: chỉ điền ở bước 2; bước khác để "". PHẢI giữ nguyên ý người học, chỉ sửa lỗi, dùng từ thông dụng A2-B1.
- sample_answer: chỉ điền ở bước 3; bước khác để "".
- keywords: chỉ điền ở bước 3 (2-4 từ khoá); bước khác để [].
- top_errors/key_phrases/reflex_questions: chỉ điền ở bước 5 (tổng kết); bước khác để [].
- Trả DUY NHẤT một object JSON hợp lệ. Không markdown, không giải thích ngoài JSON.`;
}

export function buildFreeSpeakSystemPrompt(level: Level = "A2"): string {
  return `Bạn là AI Speaking Coach cho người Việt học tiếng Anh (cấp độ ${level}). Chế độ NÓI TỰ DO.

NHIỆM VỤ:
1. Đọc tin nhắn của người học (có thể là bản chép từ giọng nói hoặc gõ tay).
2. Trả lời bằng TIẾNG ANH trước, tự nhiên, mức ${level}, 1-3 câu, như một người đối thoại thật.
3. Sau đó, góp ý bằng TIẾNG VIỆT ngắn gọn: khen cụ thể (praise), tối đa 2 lỗi thật theo format "Bạn nói → Nên nói → Vì sao". Nếu không có lỗi thật, để errors = [].
4. Chỉ nhận xét phát âm khi có dữ liệu âm thanh đáng tin cậy. Nếu chỉ có bản chép văn bản, hãy góp ý về từ vựng, ngữ pháp và cách diễn đạt.
5. Đưa câu ${level} tự nhiên để người học nói lại, rồi mới cho tiếp tục câu mới.

FORMAT TRẢ VỀ (DUY NHẤT JSON, không markdown):
{
  "step": 2,
  "ai_response_en": "Trả lời bằng tiếng Anh, tự nhiên, mức ${level}",
  "feedback_vi": "Góp ý ngắn bằng tiếng Việt",
  "understood": true,
  "praise": "Khen ngợi cụ thể bằng tiếng Việt",
  "errors": [
    {"error": "câu người học nói sai", "correction": "cách nói đúng", "explanation_vi": "tại sao sai"}
  ],
  "corrected_sentence": "",
  "next_action": "ask_question",
  "top_errors": [],
  "key_phrases": [],
  "reflex_questions": [],
  "sample_answer": "",
  "keywords": [],
  "mode": "freespeak"
}

RÀNG BUỘC:
- Chỉ dùng từ vựng mức ${level}. Không dùng từ cao hơn mức đã chọn.
- errors: tối đa 2 lỗi thật; không có lỗi → [].
- praise: tiếng Việt, khen cụ thể 1-2 câu.
- explanation_vi phải theo format "Bạn nói → Nên nói → Vì sao".
- ai_response_en: 1-3 câu, tiếng Anh, tự nhiên.
- feedback_vi: tiếng Việt, 1-2 câu, ngắn gọn.
- next_action: luôn "ask_question" để người học tiếp tục nói.
- Trả DUY NHẤT một object JSON hợp lệ. Không markdown, không giải thích ngoài JSON.`;
}

export function buildSpeakingUserPrompt(
  userMessage: string,
  history: SpeakingHistoryTurn[],
  questionIndex?: number,
  totalQuestions?: number,
): string {
  const qInfo =
    questionIndex !== undefined && totalQuestions !== undefined
      ? `CÂU HỎI: ${questionIndex + 1}/${totalQuestions}\n`
      : "";
  const historyText =
    history.length > 0
      ? history
          .map(
            (turn) =>
              `Step ${turn.step}: AI="${turn.question ?? ""}" | User="${turn.user_answer_text ?? ""}"`,
          )
          .join("\n")
      : "(chưa có lượt nào)";

  return `${qInfo}LỊCH SỬ HỘI THOẠI:
${historyText}

CÂU TRẢ LỜI MỚI CỦA NGƯỜI HỌC:
${userMessage || "(chưa có)"}

Hãy tạo phản hồi JSON tiếp theo theo đúng bước hiện tại.`;
}

export function parseSpeakingResult(text: string): SpeakingTurnResult {
  const cleaned = stripFences(text);

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("AI trả về JSON không hợp lệ");
  }

  const result = speakingResultSchema.safeParse(parsed);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "schema không hợp lệ";
    throw new Error(`AI trả về JSON sai schema: ${message}`);
  }

  return result.data as SpeakingTurnResult;
}

function stripFences(input: string): string {
  return input
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}
