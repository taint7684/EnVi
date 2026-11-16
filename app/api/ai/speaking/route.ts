import { NextResponse } from "next/server";

import { callGemini } from "@/lib/ai/gemini";
import { callGroqChat } from "@/lib/ai/groq";
import {
  buildSpeakingSystemPrompt,
  buildSpeakingUserPrompt,
  parseSpeakingResult,
  SPEAKING_RESPONSE_SCHEMA,
} from "@/lib/speaking-prompt";
import { createClient } from "@/lib/supabase/server";
import type {
  SpeakingHistoryTurn,
  SpeakingTurnResult,
} from "@/lib/types/speaking";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const { sessionId, currentStep, topic, userMessage } = body as {
    sessionId?: unknown;
    currentStep?: unknown;
    topic?: unknown;
    userMessage?: unknown;
  };

  if (
    typeof sessionId !== "string" ||
    typeof currentStep !== "number" ||
    typeof topic !== "string" ||
    typeof userMessage !== "string"
  ) {
    return NextResponse.json({ error: "Input không hợp lệ" }, { status: 400 });
  }

  if (!Number.isInteger(currentStep) || currentStep < 1 || currentStep > 5) {
    return NextResponse.json(
      { error: "currentStep phải là số nguyên từ 1 đến 5" },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
  }

  const { data: session, error: sessionError } = await supabase
    .from("speaking_sessions")
    .select("id")
    .eq("id", sessionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  if (!session) {
    return NextResponse.json(
      { error: "Không tìm thấy phiên" },
      { status: 404 },
    );
  }

  const { data: history } = await supabase
    .from("speaking_turns")
    .select("step, question, user_answer_text")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(20);

  const systemPrompt = buildSpeakingSystemPrompt(topic, currentStep);
  const userPrompt = buildSpeakingUserPrompt(
    userMessage,
    (history ?? []) as SpeakingHistoryTurn[],
  );

  let result: SpeakingTurnResult | null = null;

  try {
    const geminiText = await callGemini({
      systemPrompt,
      userPrompt,
      responseSchema: SPEAKING_RESPONSE_SCHEMA,
    });
    result = parseSpeakingResult(geminiText);
  } catch {
    // Gemini lỗi hoặc JSON sai → fallback Groq
  }

  if (!result) {
    try {
      const groqText = await callGroqChat({ systemPrompt, userPrompt });
      result = parseSpeakingResult(groqText);
    } catch {
      return NextResponse.json(
        { error: "AI đang bận, thử lại" },
        { status: 502 },
      );
    }
  }

  const { error: insertError } = await supabase.from("speaking_turns").insert({
    session_id: sessionId,
    user_id: user.id,
    step: result.step,
    question: result.ai_response_en,
    user_answer_text: userMessage || null,
    feedback_json: result,
    improved_answer: result.improved_answer || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (result.next_action === "done") {
    await supabase
      .from("speaking_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id);
  }

  return NextResponse.json({ result, sessionId });
}