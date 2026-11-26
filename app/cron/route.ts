import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const config = { schedule: "0 20 * * *" }; // 20:00 UTC = 03:00 VN (UTC+7)

export async function GET(request: Request) {
  const secret = request.headers.get("authorization");
  if (secret !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createClient();
  const now = new Date().toISOString();

  try {
    // 1. Process error events to update patterns (from error log)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://envi-deploy-one.vercel.app";
    const processRes = await fetch(`${siteUrl}/api/errors/process`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${process.env.CRON_SECRET}` },
    });
    const processData = await processRes.json();

    // 2. Update pattern mastery streaks (for patterns without errors today)
    // 03:00 VN = 20:00 UTC
    const todayStart = new Date();
    todayStart.setHours(20, 0, 0, 0);
    if (todayStart > new Date()) todayStart.setDate(todayStart.getDate() - 1);

    const { data: patterns } = await service
      .from("error_patterns")
      .select("*")
      .eq("status", "active");

    let patternsUpdated = 0;
    if (patterns && patterns.length > 0) {
      for (const pattern of patterns) {
        const { data: todayErrors } = await service
          .from("error_events")
          .select("id")
          .eq("user_id", pattern.user_id)
          .gte("created_at", todayStart.toISOString())
          .like("error_type", `${pattern.pattern_type}%`);

        const hadErrorToday = todayErrors && todayErrors.length > 0;

        if (hadErrorToday) {
          await service
            .from("error_patterns")
            .update({ mastery_streak: 0, status: "active", last_seen: now })
            .eq("id", pattern.id);
        } else {
          const newStreak = pattern.mastery_streak + 1;
          let newStatus = "improving";
          let newLevel = pattern.mastery_level;

          if (newStreak >= 1 && newLevel < 1) newLevel = 1;
          if (newStreak >= 3 && newLevel < 2) newLevel = 2;
          if (newStreak >= 7 && newLevel < 3) newLevel = 3;
          if (newStreak >= 14 && newLevel < 4) newLevel = 4;
          if (newStreak >= 30 && newLevel < 5) newLevel = 5;

          if (newStreak >= 14) newStatus = "mastered";

          await service
            .from("error_patterns")
            .update({
              mastery_streak: newStreak,
              mastery_level: newLevel,
              status: newStatus,
            })
            .eq("id", pattern.id);
        }
        patternsUpdated++;
      }
    }

    // 3. Auto-create makeup lessons for critical/open errors
    const { data: criticalErrors } = await service
      .from("error_events")
      .select("*")
      .eq("status", "open")
      .in("severity", ["major", "critical"])
      .is("mastered_at", null);

    let makeupsCreated = 0;
    if (criticalErrors && criticalErrors.length > 0) {
      for (const error of criticalErrors) {
        const { data: existing } = await service
          .from("makeup_lessons")
          .select("id")
          .eq("error_event_id", error.id)
          .maybeSingle();

        if (!existing) {
          await service
            .from("makeup_lessons")
            .insert({
              user_id: error.user_id,
              error_event_id: error.id,
              status: "in_progress",
              step: 1,
            });
          makeupsCreated++;
        }
      }
    }

    return NextResponse.json({ 
      ok: true, 
      processed: processData.processed || 0,
      patternsUpdated,
      makeupsCreated,
    });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}