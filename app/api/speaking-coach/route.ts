import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiRouter } from "@/lib/ai/router";
import { z } from "zod";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      transcript,
      step,
      topicId,
      layer,
      scenarioId,
      conversationHistory,
    } = body;

    if (!transcript || !topicId || !layer) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const systemPrompt = buildSystemPrompt(step, topicId, layer, scenarioId);
    const userPrompt = buildUserPrompt(transcript, step, conversationHistory);

    const result = await aiRouter.generate({
      task: "speaking_coach",
      schema: z.object({
        text: z.string(),
        feedback: z.object({
          praise: z.string(),
          natural_alternative: z.string(),
          chunk_to_reuse: z.string(),
          errors: z.array(z.string()),
          scores: z.object({
            fluency: z.number(),
            accuracy: z.number(),
            prosody: z.number(),
          }),
        }).optional(),
      }),
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      userId: user.id,
      maxTokens: 500,
    });

    const feedback = result.data.feedback ?? null;
    const text = result.data.text;

    await supabase.from("speech_metrics").insert({
      user_id: user.id,
      module: "speaking",
      ref_id: scenarioId,
      transcript,
      reference_text: "",
      ai_feedback: feedback,
      fluency_score: feedback?.scores?.fluency ?? null,
      accuracy_score: feedback?.scores?.accuracy ?? null,
      prosody_score: feedback?.scores?.prosody ?? null,
    });

    return NextResponse.json({ text, feedback });
  } catch (error) {
    console.error("Speaking coach error:", error);
    return NextResponse.json(
      { text: "Xin lỗi, tôi đang gặp sự cố. Bạn nói lại nhé?", feedback: null },
      { status: 200 }
    );
  }
}

function buildSystemPrompt(step: string, topicId: string, layer: string, scenarioId: string): string {
  const layerGuides: Record<string, string> = {
    L1: "Người học ở trình độ L1 (Describe/Answer): Dùng hiện tại đơn, câu ngắn, từ vựng cơ bản. Hãy hỏi câu đơn giản, khuyến khích trả lời.",
    L2: "Người học ở trình độ L2 (Story/Experience): Dùng quá khứ, tương lai, so sánh. Hãy hỏi để kéo dài câu chuyện, yêu cầu chi tiết.",
    L3: "Người học ở trình độ L3 (Opinion/Argument): Dùng ý kiến, lập luận, giả định. Hãy thách thức quan điểm, yêu cầu giải thích vì sao.",
  };

  const stepGuides: Record<string, string> = {
    warmup: "Bước Khởi động: Chào hỏi, hỏi 1 câu Reflex đơn giản về chủ đề. Trả lời ngắn gọn, tự nhiên.",
    openers: "Bước Câu mở đầu: Khuyến khích người học dùng 1 trong 3 câu mở đầu gợi ý để bắt đầu chủ đề.",
    main: "Bước Trò chuyện chính: Duy trì cuộc trò chuyện tự nhiên về chủ đề. Hỏi theo, chia sẻ quan điểm, tạo không gian nói.",
    rescues: "Bước Câu cứu cánh: Người học đang kẹt. Hãy gợi ý nhẹ hoặc hỏi câu đơn giản để họ dùng câu cứu cánh.",
    chunks: "Bước Cụm từ: Yêu cầu người học nói 5 cụm từ chủ đề trong câu hoàn chỉnh.",
    freestyle: "Bước Tự do: Người học nói bất cứ điều gì về chủ đề trong 3 phút. Lắng nghe, khen ngợi, không ngắt quãng.",
  };

  return `Bạn là AI Speaking Coach cho người học tiếng Anh Việt Nam.
Chủ đề: ${topicId} | Layer: ${layer} | Bước: ${step}

${layerGuides[layer] || layerGuides.L1}
${stepGuides[step] || stepGuides.main}

QUY TẮC QUAN TRỌNG:
1. Luôn trả lời bằng TIẾNG ANH tự nhiên, thân thiện, tốc độ vừa phải.
2. KHÔNG bao giờ dịch sang tiếng Việt trừ khi người học dùng lifeline "translate".
3. Mỗi lượt trả lời: 2-4 câu, kết thúc bằng câu hỏi mở để kéo dài hội thoại.
4. Nếu người học sai ngữ pháp/từ vựng: SỬA NHẸ trong phản hồi tự nhiên (recast), không chỉ ra lỗi trực tiếp.
5. Luôn khen nỗ lực trước, sau đó gợi ý 1 cách nói tự nhiên hơn (natural alternative) và 1 chunk để tái sử dụng.
6. Tuyệt đối KHÔNG đưa ra feedback JSON trong tin nhắn chat — chỉ trả về text hội thoại.

ĐỊNH DẠNG TRẢ VỀ (chỉ text, KHÔNG markdown, KHÔNG JSON):
[Phản hồi tự nhiên của AI Coach]

---
FEEDBACK_JSON:
{
  "praise": "Khen nỗ lực cụ thể",
  "natural_alternative": "1 cách nói tự nhiên hơn",
  "chunk_to_reuse": "1 cụm từ để học viên dùng lại",
  "errors": ["Lỗi 1", "Lỗi 2"],
  "scores": {"fluency": 0-100, "accuracy": 0-100, "prosody": 0-100}
}`;
}

function buildUserPrompt(transcript: string, step: string, history: string): string {
  return `Người học vừa nói (bước ${step}): "${transcript}"

Lịch sử hội thoại gần đây:
${history || "(chưa có)"}

Hãy trả lời tự nhiên như một người bạn nói chuyện, kết thúc bằng câu hỏi mở.`;
}