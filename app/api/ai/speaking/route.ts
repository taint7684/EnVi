import { NextResponse } from "next/server";

import { aiRouter, AiUnavailableError } from "@/lib/ai/router";
import {
  buildFreeSpeakSystemPrompt,
  buildSpeakingSystemPrompt,
  buildSpeakingUserPrompt,
  speakingResultSchema,
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
const REFLECTION_QUESTIONS = 3;
const TOTAL_TURNS = TOTAL_QUESTIONS + REFLECTION_QUESTIONS;

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

  const systemPrompt =
    speakingMode === "freespeak"
      ? buildFreeSpeakSystemPrompt(speakingLevel)
      : buildSpeakingSystemPrompt(
          topic as string,
          currentStep as number,
          qIndex,
          TOTAL_TURNS,
          speakingLevel,
        );
  const userPrompt = buildSpeakingUserPrompt(
    userMessage,
    (history ?? []) as SpeakingHistoryTurn[],
    qIndex,
    TOTAL_TURNS,
  );

  const aiStart = Date.now();

  let result: Awaited<ReturnType<typeof aiRouter.generate<SpeakingTurnResult>>>;
  try {
    result = await aiRouter.generate<SpeakingTurnResult>({
      task: "speaking_turn",
      schema: speakingResultSchema,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      userId: user.id,
    });
  } catch (cause) {
    if (cause instanceof AiUnavailableError) {
      const chain: string[] = [];
      let node: unknown = cause;
      for (let i = 0; i < 6 && node; i++) {
        if (node instanceof Error) {
          chain.push(node.message);
          node = (node as { cause?: unknown }).cause;
        } else {
          chain.push(String(node));
          break;
        }
      }
      const blob = chain.join(" | ");
      const isRateLimit = /429|rate.?limit|quota|OTPM|tokens per minute|too many requests/i.test(
        blob,
      );
      const isBudget = /Quyen su dung AI hom nay da het/i.test(blob);
      return NextResponse.json(
        {
          error: isRateLimit
            ? "AI đang bận (rate limit)"
            : isBudget
              ? "Bạn đã dùng hết lượt AI hôm nay."
              : "Không thể lấy phản hồi AI.",
          fallback: true,
          fallback_reason: isRateLimit ? "rate_limit" : isBudget ? "budget" : "unavailable",
        },
        { status: isRateLimit ? 429 : isBudget ? 429 : 503 },
      );
    }
    throw cause;
  }

  const aiMs = Date.now() - aiStart;

  const turnResult = { ...result.data, mode: speakingMode } as SpeakingTurnResult;

  // Spec: khong cham diem o buoc noi lai (retry-blind) - ca offline va online
  delete (turnResult as Record<string, unknown>).retry_score;
  delete (turnResult as Record<string, unknown>).retry_passed;

  const { error: insertError } = await supabase.from("speaking_turns").insert({
    session_id: sessionId,
    user_id: user.id,
    step: turnResult.step,
    question: turnResult.ai_response_en,
    user_answer_text: userMessage || null,
    feedback_json: turnResult,
    improved_answer: turnResult.corrected_sentence || null,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  if (turnResult.next_action === "done") {
    await supabase
      .from("speaking_sessions")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", sessionId)
      .eq("user_id", user.id);
  }

  return NextResponse.json({
    result: turnResult,
    sessionId,
    aiMs,
    provider: result.provider,
    model: result.model,
  });
}
