import { NextResponse } from "next/server";

import { callGemini } from "@/lib/ai/gemini";
import { callGroqChat } from "@/lib/ai/groq";
import { callOllamaChat } from "@/lib/ai/ollama";
import {
  buildFreeSpeakSystemPrompt,
  buildSpeakingSystemPrompt,
  buildSpeakingUserPrompt,
  parseSpeakingResult,
  SPEAKING_RESPONSE_SCHEMA,
} from "@/lib/speaking-prompt";
import { createClient } from "@/lib/supabase/server";
import type { Level } from "@/data/speaking-questions-by-level";
import type {
  SpeakingHistoryTurn,
  SpeakingMode,
  SpeakingTurnResult,
} from "@/lib/types/speaking";

export const runtime = "nodejs";

const TOTAL_QUESTIONS = 5;

const VALID_NEXT_ACTIONS = [
  "ask_question",
  "request_retry",
  "wrap_up",
  "done",
];

function normalizeOllamaResult(
  result: SpeakingTurnResult,
): SpeakingTurnResult {
  const normalized = { ...result };

  if (
    !VALID_NEXT_ACTIONS.includes(normalized.next_action)
  ) {
    normalized.next_action = "ask_question";
  }

  if (!Array.isArray(normalized.top_errors)) {
    normalized.top_errors = [];
  }
  if (!Array.isArray(normalized.key_phrases)) {
    normalized.key_phrases = [];
  }
  if (!Array.isArray(normalized.reflex_questions)) {
    normalized.reflex_questions = [];
  }
  if (!Array.isArray(normalized.errors)) {
    normalized.errors = [];
  }

  return normalized as SpeakingTurnResult;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const { sessionId, currentStep, topic, userMessage, mode, questionIndex, level } = body as {
    sessionId?: unknown;
    currentStep?: unknown;
    topic?: unknown;
    userMessage?: unknown;
    mode?: unknown;
    questionIndex?: unknown;
    level?: unknown;
  };

  const speakingMode: SpeakingMode =
    mode === "freespeak" ? "freespeak" : "topic";

  const speakingLevel: Level =
    level === "A2" || level === "B1" || level === "B2" ? level : "A2";

  if (typeof sessionId !== "string" || typeof userMessage !== "string") {
    return NextResponse.json({ error: "Input không hợp lệ" }, { status: 400 });
  }

  const qIndex = speakingMode === "topic" && typeof questionIndex === "number" ? questionIndex : 0;

  if (speakingMode === "topic") {
    if (
      typeof currentStep !== "number" ||
      typeof topic !== "string" ||
      !Number.isInteger(currentStep) ||
      currentStep < 1 ||
      currentStep > 5
    ) {
      return NextResponse.json(
        { error: "currentStep phải là số nguyên từ 1 đến 5" },
        { status: 400 },
      );
    }
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

  const aiStart = Date.now();

  const systemPrompt =
    speakingMode === "freespeak"
      ? buildFreeSpeakSystemPrompt(speakingLevel)
      : buildSpeakingSystemPrompt(
          topic as string,
          currentStep as number,
          qIndex,
          TOTAL_QUESTIONS,
          speakingLevel,
        );
  const userPrompt = buildSpeakingUserPrompt(
    userMessage,
    (history ?? []) as SpeakingHistoryTurn[],
    qIndex,
    TOTAL_QUESTIONS,
  );

  let result: SpeakingTurnResult | null = null;
  let ollamaSchemaError: string | null = null;

  // Ollama local chạy đầu tiên (miễn phí, không cần API key)
  if (!result) {
    try {
      const ollamaText = await callOllamaChat({
        systemPrompt,
        userPrompt,
        responseSchema: SPEAKING_RESPONSE_SCHEMA,
      });
      const parsed = parseSpeakingResult(ollamaText);
      result = normalizeOllamaResult(parsed);
    } catch (cause) {
      const msg = cause instanceof Error ? cause.message : String(cause);
      ollamaSchemaError = msg;
      // Ollama lỗi hoặc sai schema → tiếp tục Groq
    }
  }

  if (!result) {
    try {
      const groqText = await callGroqChat({ systemPrompt, userPrompt });
      result = parseSpeakingResult(groqText);
    } catch {
      // Groq lỗi → tiếp tục Gemini
    }
  }

  if (!result) {
    try {
      const geminiText = await callGemini({
        systemPrompt,
        userPrompt,
        responseSchema: SPEAKING_RESPONSE_SCHEMA,
      });
      result = parseSpeakingResult(geminiText);
    } catch {
      const lastErr = ollamaSchemaError
        ? `Ollama sai schema: ${ollamaSchemaError}. `
        : "";
      return NextResponse.json(
        { error: `${lastErr}AI đang bận, thử lại` },
        { status: 502 },
      );
    }
  }

  const aiMs = Date.now() - aiStart;

  if (!result.mode) {
    result.mode = speakingMode;
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

  return NextResponse.json({ result, sessionId, aiMs });
}