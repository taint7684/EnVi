import { NextResponse } from "next/server";

import { callGemini } from "@/lib/ai/gemini";
import { callGroqChat } from "@/lib/ai/groq";
import { callOllamaChat } from "@/lib/ai/ollama";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SPELL_CHECK_SCHEMA = {
  type: "OBJECT",
  properties: {
    misspelled: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          word: { type: "STRING" },
          position: { type: "NUMBER" },
          suggestions: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
        required: ["word", "position", "suggestions"],
      },
    },
    corrected_text: { type: "STRING" },
    summary: { type: "STRING" },
  },
  required: ["misspelled", "corrected_text", "summary"],
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const { text } = body as { text?: unknown };
  if (typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json({ error: "Văn bản không hợp lệ" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const systemPrompt = `Bạn là công cụ kiểm tra chính tả tiếng Anh. Nhiệm vụ: phát hiện các từ bị sai chính tả trong đoạn văn sau và gợi ý từ thay thế.

QUY TẮC:
- Chỉ đánh dấu từ thực sự sai chính tả (không đánh dấu tên riêng, từ kỹ thuật, từ marca).
- Mỗi từ sai cần: từ gốc, vị trí (index bắt đầu trong văn bản), 1-3 gợi ý từ đúng.
- Trả về corrected_text: văn bản đã sửa tất cả lỗi chính tả.
- Trả về summary: tóm tắt ngắn bằng tiếng Việt về số lỗi tìm thấy.
- Trả DUY NHẤT một object JSON hợp lệ. Không markdown.`;

  const userPrompt = `VĂN BẢN CẦN KIỂM TRA:\n"""\n${text}\n"""`;

  let result: {
    misspelled: { word: string; position: number; suggestions: string[] }[];
    corrected_text: string;
    summary: string;
  } | null = null;

  if (!result) {
    try {
      const ollamaText = await callOllamaChat({
        systemPrompt,
        userPrompt,
        responseSchema: SPELL_CHECK_SCHEMA,
      });
      result = JSON.parse(stripFences(ollamaText));
    } catch {
      // Ollama lỗi → Groq
    }
  }

  if (!result) {
    try {
      const groqText = await callGroqChat({ systemPrompt, userPrompt });
      result = JSON.parse(stripFences(groqText));
    } catch {
      // Groq lỗi → Gemini
    }
  }

  if (!result) {
    try {
      const geminiText = await callGemini({
        systemPrompt,
        userPrompt,
        responseSchema: SPELL_CHECK_SCHEMA,
      });
      result = JSON.parse(stripFences(geminiText));
    } catch {
      return NextResponse.json(
        { error: "AI đang bận, thử lại sau" },
        { status: 502 },
      );
    }
  }

  await supabase.from("ai_usage_log").insert({
    user_id: user.id,
    feature: "spell_check",
    model: "ollama/groq/gemini",
  });

  return NextResponse.json({ result });
}

function stripFences(input: string): string {
  return input
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}
