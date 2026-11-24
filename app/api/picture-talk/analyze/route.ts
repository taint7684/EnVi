import { NextResponse } from "next/server";

import { callGeminiVision, GeminiError } from "@/lib/ai/gemini";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are helping Vietnamese learners at B1 level practice speaking with everyday English (around 3000 common words).
Analyze the image and return ONLY valid JSON in this exact format:
{
  "vocabulary": [
    {"word": "drawing the curtains", "type": "action", "example": "She is drawing the curtains."},
    {"word": "still in bed", "type": "state", "example": "Father is still in bed."}
  ],
  "opinion_questions": [
    "Do you think this family looks happy? Why?",
    "What do you think the little boy will wear?"
  ],
  "story_starters": [
    "David is looking at his clothes and thinking about what to wear...",
    "The baby is trying to get out of the cot..."
  ]
}
Rules:
- Use only simple, common words (A2-B1 level).
- Maximum 22 vocabulary items.
- Focus on actions and visible things.
- Questions must be natural and easy to answer.
- Return ONLY the JSON, no extra text.`;

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu ảnh" }, { status: 400 });
  }

  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Ảnh quá lớn (tối đa 10MB)" }, { status: 413 });
  }

  const type = file.type || "";
  if (!type.startsWith("image/")) {
    return NextResponse.json({ error: "Định dạng không hỗ trợ" }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();
    const imageBase64 = Buffer.from(buffer).toString("base64");

    const text = await callGeminiVision({
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: "Analyze this image for English speaking practice.",
      imageBase64,
      mimeType: type,
    });

    // Parse the JSON response
    let parsed: unknown;
    try {
      parsed = JSON.parse(text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, ""));
    } catch {
      return NextResponse.json(
        { error: "AI trả về dữ liệu không hợp lệ", raw: text.slice(0, 500) },
        { status: 502 },
      );
    }

    return NextResponse.json({ data: parsed });
  } catch (error) {
    if (error instanceof GeminiError) {
      const status = error.status === 429 ? 429 : 502;
      return NextResponse.json(
        { error: `Gemini Vision: ${error.message.slice(0, 200)}`, fallback: true },
        { status },
      );
    }
    console.error("Picture talk analyze error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}