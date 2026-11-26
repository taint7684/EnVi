import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 1. Process new error events to update patterns
    const { data: newErrors } = await supabase
      .from("error_events")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (newErrors && newErrors.length > 0) {
      for (const error of newErrors) {
        const patternKey = `${error.error_type}:${error.module}:${error.topic_id || "general"}`;
        
        await supabase.rpc("process_error_event", {
          p_user_id: user.id,
          p_module: error.module,
          p_error_type: error.error_type,
          p_expected: error.expected || "",
          p_actual: error.actual || "",
          p_pattern_key: patternKey,
        });
      }
    }

    // 2. Update pattern mastery streaks (daily cron at 03:00 VN)
    const { data: patterns } = await supabase
      .from("error_patterns")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (patterns && patterns.length > 0) {
      for (const pattern of patterns) {
        // Check if user had this error today
        const todayStart = new Date();
        todayStart.setHours(3, 0, 0, 0); // 03:00 VN
        if (todayStart > new Date()) todayStart.setDate(todayStart.getDate() - 1);

        const { data: todayErrors } = await supabase
          .from("error_events")
          .select("id")
          .eq("user_id", user.id)
          .gte("created_at", todayStart.toISOString())
          .like("error_type", `${pattern.pattern_type}%`);

        const hadErrorToday = todayErrors && todayErrors.length > 0;

        if (hadErrorToday) {
          // Reset streak, keep active
          await supabase
            .from("error_patterns")
            .update({ mastery_streak: 0, status: "active", last_seen: new Date().toISOString() })
            .eq("id", pattern.id);
        } else {
          // Increment streak
          const newStreak = pattern.mastery_streak + 1;
          let newStatus = "improving";
          let newLevel = pattern.mastery_level;

          if (newStreak >= 1 && newLevel < 1) newLevel = 1;
          if (newStreak >= 3 && newLevel < 2) newLevel = 2;
          if (newStreak >= 7 && newLevel < 3) newLevel = 3;
          if (newStreak >= 14 && newLevel < 4) newLevel = 4;
          if (newStreak >= 30 && newLevel < 5) newLevel = 5;

          if (newStreak >= 14) newStatus = "mastered";

          await supabase
            .from("error_patterns")
            .update({
              mastery_streak: newStreak,
              mastery_level: newLevel,
              status: newStatus,
            })
            .eq("id", pattern.id);
        }
      }
    }

    // 3. Auto-create makeup lessons for critical errors
    const { data: criticalErrors } = await supabase
      .from("error_events")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "open")
      .eq("severity", "critical")
      .is("mastered_at", null);

    if (criticalErrors && criticalErrors.length > 0) {
      for (const error of criticalErrors) {
        // Check if makeup already exists
        const { data: existing } = await supabase
          .from("makeup_lessons")
          .select("id")
          .eq("error_event_id", error.id)
          .maybeSingle();

        if (!existing) {
          await supabase
            .from("makeup_lessons")
            .insert({
              user_id: user.id,
              error_event_id: error.id,
              status: "in_progress",
              step: 1,
            });
        }
      }
    }

    return Response.json({ success: true, processed: newErrors?.length || 0 });
  } catch (error) {
    console.error("Error processing error log:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}