import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logActivity, awardXp } from "@/lib/activity";
import { todayStrVN } from "@/lib/date-vn";

export const runtime = "nodejs";

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
      lessonId?: string;
    };

    // Neu co lessonId: cap nhat makeup_lessons row (idempotent)
    if (body.lessonId) {
      const { data: lesson, error: lessonError } = await supabase
        .from("makeup_lessons")
        .select("id, status, user_id")
        .eq("id", body.lessonId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (lessonError) throw new Error(lessonError.message);

      if (!lesson) {
        return NextResponse.json({ ok: false, error: "Bài bù không tồn tại" }, { status: 404 });
      }

      if (lesson.status === "done") {
        return NextResponse.json({ ok: true, alreadyDone: true, xpAwarded: 0 });
      }

      const { error: updError } = await supabase
        .from("makeup_lessons")
        .update({ status: "done", completed_at: new Date().toISOString() })
        .eq("id", body.lessonId)
        .eq("user_id", user.id)
        .eq("status", "ready");

      if (updError) throw new Error(updError.message);

      const studyDate = todayStrVN();
      await logActivity({
        type: "makeup_lesson_complete",
        blockType: "makeup",
        refId: body.lessonId,
        meta: { study_date: studyDate },
      });

      // XP idempotent: award_xp check da co cung (reason, ref_id) chua
      await awardXp({ reason: "makeup_lesson_complete", refId: body.lessonId, amount: 20 });

      return NextResponse.json({ ok: true, xpAwarded: 20 });
    }

    // Khong co lessonId (demo mode): van award nhung idempotent qua reason khac
    await logActivity({
      type: "makeup_lesson_complete",
      blockType: "makeup",
      meta: { study_date: todayStrVN() },
    });
    await awardXp({ reason: "makeup_lesson_complete_demo", refId: user.id, amount: 20 });

    return NextResponse.json({ ok: true, xpAwarded: 20 });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Loi khi hoan thanh bai bu.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}