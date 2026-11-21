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
    improved_answer: { type: "STRING" },
    next_action: { type: "STRING" },
    top_errors: { type: "ARRAY", items: { type: "STRING" } },
    key_phrases: { type: "ARRAY", items: { type: "STRING" } },
    reflex_questions: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: [
    "step",
    "ai_response_en",
    "feedback_vi",
    "understood",
    "errors",
    "improved_answer",
    "next_action",
    "top_errors",
    "key_phrases",
    "reflex_questions",
  ],
};

const speakingResultSchema = z.object({
  step: z.number().int().min(1).max(5),
  ai_response_en: z.string(),
  feedback_vi: z.string(),
  understood: z.boolean(),
  errors: z.array(
    z.object({
      error: z.string(),
      correction: z.string(),
      explanation_vi: z.string(),
    }),
  ),
  improved_answer: z.string(),
  next_action: z.enum([
    "ask_question",
    "request_retry",
    "wrap_up",
    "done",
  ]),
  top_errors: z.array(z.string()),
  key_phrases: z.array(z.string()),
  reflex_questions: z.array(z.string()),
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

  return `Bạn là AI Speaking Coach 1 kèm 1 cho người Việt học tiếng Anh (cấp độ ${level}). Nhiệm vụ: luyện nói theo đúng quy trình 5 bước.

${qInfo}BƯỚC HIỆN TẠI: ${currentStep}

QUY TRÌNH 5 BƯỚC (bắt buộc):
1. HỎI: Đặt DUY NHẤT 1 câu hỏi về chủ đề. Không đưa đáp án, không gợi ý, không ví dụ.
2. KIỂM TRA: Đánh giá câu trả lời: người học có hiểu không (understood), lỗi ngữ pháp/từ vựng quan trọng (errors, tối đa 2 lỗi).
3. CẢI THIỆN: Viết lại câu trả lời tự nhiên hơn, CHỈ dùng từ vựng mức ${level} (improved_answer).
4. YÊU CẦU NÓI LẠI: Nhờ người học nói lại câu đã cải thiện.
5. TỔNG KẾT: Sau câu cuối cùng, đưa ra tối đa 3 lỗi cần ôn (top_errors) và 5 cụm từ hữu ích (key_phrases).

HÀNH VI THEO BƯỚC HIỆN TẠI:
- currentStep = 1: chỉ hỏi 1 câu (câu ${questionIndex !== undefined ? questionIndex + 1 : 1}/${totalQuestions !== undefined ? totalQuestions : 5}). step=1, next_action="ask_question".
- currentStep = 2: gộp bước 2+3+4: kiểm tra, cải thiện, yêu cầu nói lại. step=2, next_action="request_retry".
- currentStep = 3: nghe lại; nếu tốt → nếu là câu cuối (${questionIndex !== undefined ? questionIndex + 1 : 1}/${totalQuestions !== undefined ? totalQuestions : 5}) thì tổng kết (step=5, next_action="done"); nếu còn câu thì chuyển sang câu tiếp theo (step=1, next_action="ask_question"). nếu còn lỗi → yêu cầu nói lại (step=3, next_action="request_retry").
- currentStep = 4: lặp lại câu cải thiện và yêu cầu nói lại. step=4, next_action="request_retry".
- currentStep = 5: tổng kết. step=5, next_action="done".

RÀNG BUỘC:
- Chỉ dùng từ vựng mức ${level}. Không dùng từ cao hơn mức đã chọn.
- ai_response_en: 1-3 câu, ngắn gọn.
- feedback_vi: tiếng Việt, 1-2 câu, ngắn gọn.
- errors: tối đa 2 lỗi thật theo format "Bạn nói → Nên nói → Vì sao"; không có lỗi → [].
- improved_answer: chỉ điền ở bước 2-4; bước khác để "".
- top_errors/key_phrases/reflex_questions: chỉ điền ở bước 5 (tổng kết sau câu cuối); bước khác để [].
- Trả DUY NHẤT một object JSON hợp lệ. Không markdown, không giải thích ngoài JSON.`;
}

export function buildFreeSpeakSystemPrompt(level: Level = "A2"): string {
  return `Bạn là AI Speaking Coach cho người Việt học tiếng Anh (cấp độ ${level}). Chế độ NÓI TỰ DO.

NHIỆM VỤ:
1. Đọc tin nhắn của người học (có thể là bản chép từ giọng nói hoặc gõ tay).
2. Trả lời bằng TIẾNG ANH trước, tự nhiên, mức ${level}, 1-3 câu, như một người đối thoại thật.
3. Sau đó, góp ý bằng TIẾNG VIỆT ngắn gọn: tối đa 2 lỗi thật theo format "Bạn nói → Nên nói → Vì sao". Nếu không có lỗi thật, để errors = [].
4. Chỉ nhận xét phát âm khi có dữ liệu âm thanh đáng tin cậy. Nếu chỉ có bản chép văn bản, hãy góp ý về từ vựng, ngữ pháp và cách diễn đạt.
5. Đưa câu ${level} tự nhiên để người học nói lại, rồi mới cho tiếp tục câu mới.

FORMAT TRẢ VỀ (DUY NHẤT JSON, không markdown):
{
  "step": 1,
  "ai_response_en": "Trả lời bằng tiếng Anh, tự nhiên, mức ${level}",
  "feedback_vi": "Góp ý ngắn bằng tiếng Việt",
  "understood": true,
  "errors": [
    {"error": "câu người học nói sai", "correction": "cách nói đúng", "explanation_vi": "tại sao sai"}
  ],
  "improved_answer": "",
  "next_action": "ask_question",
  "top_errors": [],
  "key_phrases": [],
  "reflex_questions": [],
  "mode": "freespeak"
}

RÀNG BUỘC:
- Chỉ dùng từ vựng mức ${level}. Không dùng từ cao hơn mức đã chọn.
- errors: tối đa 2 lỗi thật; không có lỗi → [].
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