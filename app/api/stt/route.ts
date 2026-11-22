import { NextResponse } from "next/server";

import { transcribeAudio, WhisperError } from "@/lib/ai/whisper";
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

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const file = formData.get("audio");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Thiếu file audio" }, { status: 400 });
  }

  if (file.size > 25 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File quá lớn (tối đa 25MB)" },
      { status: 413 },
    );
  }

  const type = file.type || "";
  if (!type.startsWith("audio/") && !type.startsWith("video/webm")) {
    return NextResponse.json(
      { error: "Định dạng không hỗ trợ" },
      { status: 400 },
    );
  }

  try {
    const result = await transcribeAudio(file);
    return NextResponse.json({
      text: result.text,
      words: result.words,
      duration_ms: Math.round(result.duration * 1000),
    });
  } catch (error) {
    if (error instanceof WhisperError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    console.error("STT route error:", error);
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 });
  }
}