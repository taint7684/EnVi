import { NextResponse } from "next/server";

import { callGemini } from "@/lib/ai/gemini";
import { callGroqChat } from "@/lib/ai/groq";
import { callOllamaChat } from "@/lib/ai/ollama";
import { createClient } from "@/lib/supabase/server";
import { getWritingPrompt } from "@/data/writing-prompts";

export const runtime = "nodejs";

const FEEDBACK_SCHEMA = {
  type: "OBJECT",
  properties: {
    overall_vi: { type: "STRING" },
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
    improved_version: { type: "STRING" },
    key_phrases: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["overall_vi", "errors", "improved_version", "key_phrases"],
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const { promptId, level, draftText } = body as {
    promptId?: unknown;
    level?: unknown;
    draftText?: unknown;
  };

  if (
    typeof promptId !== "string" ||
    typeof level !== "string" ||
    typeof draftText !== "string" ||
    draftText.trim().length < 10
  ) {
    return NextResponse.json({ error: "Input không hợp lệ" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const prompt = getWritingPrompt(promptId);
  if (!prompt) {
    return NextResponse.json({ error: "Không tìm thấy đề" }, { status: 404 });
  }

  const systemPrompt = `Bạn là AI Writing Coach cho người Việt học tiếng Anh (cấp độ ${level}). Nhiệm vụ: góp ý bài viết của người học.

ĐỀ BÀI: ${prompt.instruction_en}
TÌNH HUỐNG: ${prompt.situation_vi}

YÊU CẦU GÓP Ý:
- Đọc bài viết của người học.
- Xác định tối đa 5 lỗi quan trọng NHẤT (ưu tiên lỗi ảnh hưởng đến ý nghĩa trước, sau đó đến ngữ pháp/từ vựng).
- Mỗi lỗi theo format: "Bạn nói → Nên nói → Vì sao" (tiếng Việt).
- Giữ nguyên ý người viết muốn diễn đạt; không thay đổi thông điệp chính.
- Viết lại bài (improved_version) bằng tiếng Anh, tự nhiên, đúng cấp độ ${level}, giữ cấu trúc và ý của người viết.
- Đưa 3-5 cụm từ hữu ích (key_phrases) mà người học có thể dùng lại.
- overall_vi: nhận xét tổng quan ngắn gọn bằng tiếng Việt (1-2 câu), trung thực và khuyến khích.
- Chỉ dùng từ vựng mức ${level}, không dùng từ cao hơn.
- Trả DUY NHẤT một object JSON hợp lệ. Không markdown, không giải thích ngoài JSON.`;

  const userPrompt = `BÀI VIẾT CỦA NGƯỜI HỌC:\n"""\n${draftText}\n"""\n\nHãy góp ý và viết lại theo yêu cầu.`;

  let result: {
    overall_vi: string;
    errors: { error: string; correction: string; explanation_vi: string }[];
    improved_version: string;
    key_phrases: string[];
  } | null = null;

  if (!result) {
    try {
      const ollamaText = await callOllamaChat({
        systemPrompt,
        userPrompt,
        responseSchema: FEEDBACK_SCHEMA,
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
        responseSchema: FEEDBACK_SCHEMA,
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
    feature: "writing",
    model: "ollama/groq/gemini",
  });

  return NextResponse.json({ feedback: result });
}

function stripFences(input: string): string {
  return input
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}