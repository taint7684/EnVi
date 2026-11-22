import { NextResponse } from "next/server";
import { startSpeakingSession } from "@/lib/speak/sessions";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as {
      topicId?: string;
      level?: string;
      mode?: "coach" | "mission" | "drill" | "call";
    };

    if (!body.topicId || !body.level) {
      return NextResponse.json(
        { ok: false, error: "Thiếu topicId hoặc level" },
        { status: 400 },
      );
    }

    const { sessionId, questions } = await startSpeakingSession({
      topicId: body.topicId,
      level: body.level,
      mode: body.mode,
    });

    return NextResponse.json({ ok: true, sessionId, questions });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Loi khi tao phien.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
