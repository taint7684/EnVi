import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUserLearningSnapshot } from "@/app/actions/learning-snapshot";
import { callGemini } from "@/lib/ai/gemini";
import { callGroqChat } from "@/lib/ai/groq";
import { callOllamaChat } from "@/lib/ai/ollama";

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid messages" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const snapshot = await getUserLearningSnapshot();

    const systemPrompt = `Bạn là một gia sư tiếng Anh của user. Trả lời ngắn gọn, rõ ràng.
- Ưu tiên giải thích bằng tiếng Việt khi người dùng hỏi về ngữ pháp hoặc từ vựng.
- Khi người dùng muốn luyện nói, hãy đặt câu hỏi bằng tiếng Anh.
- Luôn chính xác và thân thiện.
- Nếu người dùng hỏi về cách phát âm, hãy dùng IPA.
- Giới hạn câu trả lời trong 120 từ.

Dữ liệu học tập thực tế của user:
${snapshot.summaryText}

Khi user hỏi "Tôi nên học gì tiếp?", hãy phân tích dữ liệu trên và đưa ra lời khuyên CỤ THỂ:
- Nếu còn thẻ từ đến hạn hoặc chưa học hết từ -> ưu tiên ôn flashcard.
- Nếu độ chính xác reflex thấp (<70%) -> gợi ý luyện reflex, đặc biệt câu B1/B2.
- Nếu đã >= 14 ngày chưa làm Progress Test -> đề xuất làm bài test 20 câu.
- Gợi ý chủ đề Speaking tiếp theo phù hợp trình độ.
- Nếu streak <= 1 -> nhắc giữ đà, đề xuất 1 hoạt động ngắn.
Đưa lời khuyên dạng gạch đầu dòng ngắn gọn, ưu tiên hành động ngay hôm nay.

Khi user hỏi "Gợi ý chủ đề Speaking cho tôi", hãy đề xuất 2-3 chủ đề Speaking phù hợp trình độ A2-B1, ví dụ: Daily Routine, Hobbies, Food & Cooking, Work & Office. Nêu lý do ngắn gọn bằng tiếng Việt.

Khi user hỏi "Tôi đang yếu phần nào?", hãy phân tích dữ liệu học tập thực tế trên và trả lời chính xác về điểm yếu (từ vựng, reflex, streak, test). Nếu dữ liệu quá ít để đánh giá, hãy nói rõ và đề xuất làm bài kiểm tra hoặc học thêm từ vựng.`;

    const lastMessage = messages[messages.length - 1];

    let response: string;

    // Ollama local chạy đầu tiên (miễn phí, không cần API key)
    try {
      response = await callOllamaChat({
        systemPrompt,
        userPrompt: lastMessage.content,
      });
    } catch {
      try {
        response = await callGroqChat({
          systemPrompt,
          userPrompt: lastMessage.content,
        });
      } catch {
        try {
          response = await callGemini({
            systemPrompt,
            userPrompt: lastMessage.content,
            responseSchema: {
              type: "object",
              properties: {
                reply: { type: "string" },
              },
              required: ["reply"],
            },
          });
          const parsed = JSON.parse(response);
          response = parsed.reply || response;
        } catch {
          response =
            "Xin lỗi, AI hiện đang bận. Hãy thử lại sau hoặc đặt câu hỏi khác.";
        }
      }
    }

    await supabase.from("ai_usage_log").insert({
      user_id: user.id,
      feature: "assistant",
      model: "gemini/groq",
    });

    return NextResponse.json({ reply: response });
  } catch (error) {
    console.error("Assistant error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}