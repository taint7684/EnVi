import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const config = { schedule: "0 3 * * *" };

export async function GET(request: Request) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createClient(); // service role bypasses RLS
  const now = new Date().toISOString();

  // 1. Lay cac pattern can xet lai (new/practicing, den han next_check_at)
  const { data: patterns, error: perr } = await service
    .from("error_patterns")
    .select("user_id, pattern_key, status, mastery_streak")
    .in("status", ["new", "practicing"])
    .or("next_check_at.is.null,next_check_at.lte." + now);

  if (perr) return NextResponse.json({ error: perr.message }, { status: 500 });
  if (!patterns || patterns.length === 0) {
    return NextResponse.json({ ok: true, created: 0 });
  }

  // 2. Nhom theo user
  const byUser = new Map<string, string[]>();
  for (const p of patterns) {
    const keys = byUser.get(p.user_id) ?? [];
    keys.push(p.pattern_key);
    byUser.set(p.user_id, keys);
  }

  let created = 0;
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  for (const [userId, keys] of byUser) {
    // Kiem tra lesson da co trong 30 ngay qua de khong tao trung
    const { data: existing } = await service
      .from("makeup_lessons")
      .select("pattern_key")
      .eq("user_id", userId)
      .in("status", ["ready", "in_progress"])
      .gte("created_at", thirtyDaysAgo);
    const existingKeys = new Set(
      (existing ?? []).map((e: { pattern_key: string }) => e.pattern_key),
    );

    for (const key of keys) {
      if (existingKeys.has(key)) continue;
      const { error: ierr } = await service.from("makeup_lessons").insert({
        user_id: userId,
        pattern_key: key,
        status: "ready",
        content: {},
        progress: {},
      });
      if (!ierr) created += 1;
    }

    // 3. Cap nhat next_check_at (+1 ngay, tang theo mastery_streak)
    const delayDays =
      1 +
      Math.min(
        5,
        Math.floor(
          (patterns.find((p: { user_id: string }) => p.user_id === userId)
            ?.mastery_streak ?? 0) / 2,
        ),
      );
    await service
      .from("error_patterns")
      .update({ next_check_at: new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000).toISOString() })
      .eq("user_id", userId)
      .in("pattern_key", keys);
  }

  return NextResponse.json({ ok: true, created });
}
