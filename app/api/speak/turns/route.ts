import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { evaluateCoachFeedback, evaluateRetry } from "@/lib/speak/coach";
import { asArray } from "@/lib/result";

export const runtime = "nodejs";

async function getTopPatterns(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<string[]> {
  const { data } = await supabase
    .from("error_patterns")
    .select("pattern_key")
    .eq("user_id", userId)
    .order("count", { ascending: false })
    .limit(5);
  return asArray<{ pattern_key: string }>(data).map((r) => r.pattern_key ?? "");
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as {
      sessionId: string;
      turnClientId: string;
      questionId: string;
      kind?: "answer" | "retry" | "lifeline" | "follow_up";
      attemptNo?: number;
      transcript: string;
      transcriptEdited?: boolean;
      audioPath?: string;
      durationMs?: number;
      latencyMs?: number;
      wpm?: number;
      mlr?: number;
      pauseCount?: number;
      hintsUsed?: number;
      peeked?: boolean;
    };

    if (!body.sessionId || !body.turnClientId || !body.questionId) {
      return NextResponse.json({ ok: false, error: "Thiếu trường bắt buộc" }, { status: 400 });
    }

    const kind = body.kind ?? "answer";

    // Luu turn
    const { data: turn, error: turnError } = await supabase
      .from("speaking_turns")
      .insert({
        session_id: body.sessionId,
        user_id: user.id,
        turn_client_id: body.turnClientId,
        question_id: body.questionId,
        kind,
        attempt_no: body.attemptNo ?? 1,
        step: 1, // se cap nhat boi client
        user_answer_text: body.transcript,
        audio_url: body.audioPath,
        duration_ms: body.durationMs,
        latency_ms: body.latencyMs,
        wpm: body.wpm,
        mlr: body.mlr,
        pause_count: body.pauseCount,
        hints_used: body.hintsUsed ?? 0,
        peeked: body.peeked ?? false,
        transcript_edited: body.transcriptEdited ?? false,
        feedback_json: null,
      })
      .select("id")
      .single();

    if (turnError) throw new Error(turnError.message);
    const turnId = turn.id as string;

    // Lay top patterns cua nguoi hoc
    const topPatterns = await getTopPatterns(supabase, user.id);

    let feedbackJson: unknown = null;
    let retryEvalJson: unknown = null;
    let provider = "none";
    let model = "none";
    let aiMs = 0;

    try {
      if (kind === "retry") {
        // Can lay cau mau cua cau hoi nay de chuan bi evaluateRetry
        const { data: q } = await supabase
          .from("speaking_questions")
          .select("sample_answer_a2, sample_answer_b1, sample_answer_b2")
          .eq("id", body.questionId)
          .maybeSingle();
        const naturalVersion = (q as { sample_answer_a2?: string } | null)?.sample_answer_a2 ?? "";
        const res = await evaluateRetry({
          userId: user.id,
          original: body.transcript,
          naturalVersion,
          retryTranscript: body.transcript,
          keywords: topPatterns,
        });
        retryEvalJson = res.eval;
        provider = res.provider;
        model = res.model;
        aiMs = res.ms;
      } else {
        // Lay cau hoi de coach feedback
        const { data: q } = await supabase
          .from("speaking_questions")
          .select("question_en, question_vi, level")
          .eq("id", body.questionId)
          .maybeSingle();
        const level = (q as { level?: string } | null)?.level ?? "A2";
        const res = await evaluateCoachFeedback({
          userId: user.id,
          topic: "",
          level,
          question: (q as { question_en?: string } | null)?.question_en ?? "",
          transcript: body.transcript,
          topPatterns,
        });
        feedbackJson = res.feedback;
        provider = res.provider;
        model = res.model;
        aiMs = res.ms;
      }
    } catch (cause) {
      // AI loi -> luu turn khong co feedback, client se chuyen Offline Fallback
      console.error("AI coach error:", cause);
    }

    // Cap nhat turn voi feedback
    const { error: updError } = await supabase
      .from("speaking_turns")
      .update({
        feedback_json: feedbackJson,
        retry_eval_json: retryEvalJson,
        provider,
        ai_ms: aiMs,
      })
      .eq("id", turnId);

    if (updError) throw new Error(updError.message);

    return NextResponse.json({
      ok: true,
      turnId,
      kind,
      feedback: feedbackJson,
      retryEval: retryEvalJson,
      provider,
      model,
      aiMs,
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Loi khi luu luot noi.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
