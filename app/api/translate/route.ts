import { NextResponse } from "next/server";

import { callGemini } from "@/lib/ai/gemini";
import { callGroqChat } from "@/lib/ai/groq";
import { callOllamaChat } from "@/lib/ai/ollama";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const { text } = body as { text?: unknown };
  if (typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Thiếu văn bản cần dịch" }, { status: 400 });
  }

  const systemPrompt =
    "Bạn là một dịch vụ dịch thuật tiếng Việt sang tiếng Anh. Dịch chính xác, tự nhiên, giữ nguyên ý nghĩa. Chỉ trả về bản dịch tiếng Anh, không thêm giải thích hay chú thích nào.";

  let translation: string | null = null;

  // Ollama local chạy đầu tiên (miễn phí, không cần API key)
  try {
    translation = await callOllamaChat({
      systemPrompt,
      userPrompt: `Dịch sang tiếng Anh: ${text}`,
    });
  } catch {
    // Ollama lỗi → tiếp tục Groq
  }

  if (!translation) {
    try {
      const groqText = await callGroqChat({
        systemPrompt,
        userPrompt: `Dịch sang tiếng Anh: ${text}`,
      });
      translation = groqText.trim();
    } catch {
      // Groq lỗi → tiếp tục Gemini
    }
  }

  if (!translation) {
    try {
      const geminiText = await callGemini({
        systemPrompt,
        userPrompt: `Dịch sang tiếng Anh: ${text}`,
        responseSchema: {
          type: "OBJECT",
          properties: {
            translation: { type: "STRING" },
          },
          required: ["translation"],
        },
      });
      const parsed = JSON.parse(geminiText);
      translation = parsed.translation || null;
    } catch {
      return NextResponse.json(
        { error: "Dịch thuật không khả dụng lúc này. Hãy thử lại sau." },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({ translation });
}
