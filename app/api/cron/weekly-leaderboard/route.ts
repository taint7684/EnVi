import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  
  // VN timezone (UTC+7)
  const vnOffset = 7 * 60;
  const vnNow = new Date(now.getTime() + vnOffset * 60 * 1000);
  
  const startOfYear = new Date(vnNow.getFullYear(), 0, 1);
  const weekNum = Math.ceil((vnNow.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
  const year = vnNow.getFullYear();

  // Get all users with their weekly stats
  const { data: profiles } = await supabase
    .from("user_gamification_profile")
    .select("user_id, total_xp, current_streak, total_speaking_minutes, total_quests_completed");

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: "No users found", updated: 0 });
  }

  // Calculate weekly XP (from daily quests completed this week)
  const weekStart = new Date(vnNow);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Sunday
  weekStart.setHours(0, 0, 0, 0);
  const weekStartStr = weekStart.toISOString().split("T")[0];

  let updated = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    try {
      // Get quests completed this week
      const { data: quests } = await supabase
        .from("user_daily_quests")
        .select("xp_earned")
        .eq("user_id", profile.user_id)
        .eq("is_completed", true)
        .gte("completed_at", weekStartStr);

      const weeklyXp = quests?.reduce((sum, q) => sum + (q.xp_earned || 0), 0) || 0;
      const questsCompleted = quests?.length || 0;

      // Get speaking minutes this week (from speech_metrics)
      const { data: speechMetrics } = await supabase
        .from("speech_metrics")
        .select("speaking_seconds")
        .eq("user_id", profile.user_id)
        .gte("created_at", weekStartStr);

      const speakingMinutes = Math.round((speechMetrics?.reduce((sum, m) => sum + (m.speaking_seconds || 0), 0) || 0) / 60);

      // Upsert weekly leaderboard entry
      const { error } = await supabase
        .from("weekly_leaderboard")
        .upsert({
          week_num: weekNum,
          year: year,
          user_id: profile.user_id,
          total_xp: weeklyXp,
          speaking_minutes: speakingMinutes,
          streak_days: profile.current_streak,
          quests_completed: questsCompleted,
        }, {
          onConflict: "week_num,year,user_id"
        });

      if (error) {
        errors.push(`User ${profile.user_id}: ${error.message}`);
      } else {
        updated++;
      }
    } catch (e) {
      errors.push(`User ${profile.user_id}: ${e}`);
    }
  }

  // Calculate ranks
  const { data: leaderboard } = await supabase
    .from("weekly_leaderboard")
    .select("user_id")
    .eq("week_num", weekNum)
    .eq("year", year)
    .order("total_xp", { ascending: false });

  if (leaderboard) {
    for (let i = 0; i < leaderboard.length; i++) {
      await supabase
        .from("weekly_leaderboard")
        .update({ rank: i + 1 })
        .eq("week_num", weekNum)
        .eq("year", year)
        .eq("user_id", leaderboard[i].user_id);
    }
  }

  return NextResponse.json({
    message: "Weekly leaderboard updated",
    week: weekNum,
    year,
    updated,
    errors: errors.length > 0 ? errors : undefined,
  });
}