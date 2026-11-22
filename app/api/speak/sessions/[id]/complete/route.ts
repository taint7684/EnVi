import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity, awardXp } from "@/lib/activity";
import { todayStrVN } from "@/lib/date-vn";

export const runtime = "nodejs";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await request.json().catch(() => ({}))) as {
      summaryJson?: unknown;
      courageAfter?: number;
      offline?: boolean;
    };

    const { error: updError } = await supabase
      .from("speaking_sessions")
      .update({
        ended_at: new Date().toISOString(),
        summary_json: body.summaryJson ?? null,
        courage_after: body.courageAfter ?? null,
        offline: body.offline ?? false,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updError) throw new Error(updError.message);

    // Tinh toan tong hop fluency cua phien
    const { data: turns } = await supabase
      .from("speaking_turns")
      .select("duration_ms, latency_ms, wpm, mlr, pause_count, kind")
      .eq("session_id", id)
      .eq("user_id", user.id);

    const turnList = turns ?? [];
    const speechTurns = turnList.filter((t) => t.kind === "answer" && t.latency_ms !== null);
    const totalLatencyMs = speechTurns.reduce((s, t) => s + Number(t.latency_ms ?? 0), 0);
    const avgLatency = speechTurns.length > 0 ? totalLatencyMs / speechTurns.length : null;
    const speechSec = turnList.reduce((s, t) => s + Number(t.duration_ms ?? 0), 0) / 1000;

    const studyDate = todayStrVN();

    // Ghi su kien hoan thanh phien
    await logActivity({
      type: "speaking_session_complete",
      blockType: "speaking",
      refId: id,
      durationSec: Math.round(speechSec),
      speechSec: Math.round(speechSec),
      meta: {
        session_id: id,
        avg_latency_ms: avgLatency,
        turn_count: turnList.length,
        offline: body.offline ?? false,
        study_date: studyDate,
      },
    });

    // XP hoan thanh phien (idempotent qua award_xp)
    await awardXp({ reason: "speaking_session_complete", refId: id, amount: 50 });

    // Cap nhat daily_summary (phut noi hien tai)
    const { data: summary } = await supabase
      .from("daily_summary")
      .select("speech_minutes")
      .eq("user_id", user.id)
      .eq("study_date", studyDate)
      .maybeSingle();

    if (summary) {
      await supabase
        .from("daily_summary")
        .update({ speech_minutes: (Number(summary.speech_minutes) ?? 0) + Math.round(speechSec / 60) })
        .eq("user_id", user.id)
        .eq("study_date", studyDate);
    } else {
      await supabase
        .from("daily_summary")
        .insert({
          user_id: user.id,
          study_date: studyDate,
          minutes: 0,
          speech_minutes: Math.round(speechSec / 60),
          xp: 0,
        });
    }

    return NextResponse.json({
      ok: true,
      summary: {
        sessionId: id,
        avgLatencyMs: avgLatency,
        speechSec,
        turnCount: turnList.length,
        xpAwarded: 50,
      },
    });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Loi khi ket thuc phien.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
