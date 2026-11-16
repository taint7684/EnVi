import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callGemini } from "@/lib/ai/gemini";
import { callGroqChat } from "@/lib/ai/groq";

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

    const systemPrompt = `Bạn là một trợ lý AI học tiếng Anh. Trả lời ngắn gọn, rõ ràng.
- Ưu tiên giải thích bằng tiếng Việt khi người dùng hỏi về ngữ pháp hoặc từ vựng.
- Khi người dùng muốn luyện nói, hãy đặt câu hỏi bằng tiếng Anh.
- Luôn chính xác và thân thiện.
- Nếu người dùng hỏi về cách phát âm, hãy dùng IPA.
- Giới hạn câu trả lời trong 100 từ.`;

    const lastMessage = messages[messages.length - 1];

    let response: string;

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
      try {
        response = await callGroqChat({
          systemPrompt,
          userPrompt: lastMessage.content,
        });
      } catch {
        response =
          "Xin lỗi, AI hiện đang bận. Hãy thử lại sau hoặc đặt câu hỏi khác.";
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