import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("user_gamification_profile")
    .select("*")
    .eq("user_id", user.id)
    .single();

  // Get user achievements
  const { data: achievements } = await supabase
    .from("user_achievements")
    .select(`
      *,
      achievements (*)
    `)
    .eq("user_id", user.id);

  // Get today's quests
  const today = new Date().toISOString().split("T")[0];
  const { data: quests } = await supabase
    .from("user_daily_quests")
    .select(`
      *,
      daily_quest_templates (*)
    `)
    .eq("user_id", user.id)
    .eq("quest_date", today);

  // Get weekly leaderboard (current week)
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.ceil((now.getTime() - startOfYear.getTime()) / (7 * 24 * 60 * 60 * 1000));
  
  const { data: leaderboard } = await supabase
    .from("weekly_leaderboard")
    .select(`
      *,
      user_gamification_profile (display_name, avatar_url)
    `)
    .eq("week_num", weekNum)
    .eq("year", now.getFullYear())
    .order("rank", { ascending: true })
    .limit(10);

  // Get user's rank
  const { data: userRank } = await supabase
    .from("weekly_leaderboard")
    .select("rank")
    .eq("week_num", weekNum)
    .eq("year", now.getFullYear())
    .eq("user_id", user.id)
    .single();

  return NextResponse.json({
    profile: profile || {
      display_name: user.user_metadata?.full_name || "Learner",
      avatar_url: user.user_metadata?.avatar_url || null,
      total_xp: 0,
      current_level: 1,
      xp_to_next_level: 1000,
      current_streak: 0,
      longest_streak: 0,
      total_speaking_minutes: 0,
      total_quests_completed: 0,
      achievements_unlocked: 0,
      quest_streak: 0,
    },
    achievements: achievements || [],
    quests: quests || [],
    leaderboard: leaderboard || [],
    user_rank: userRank?.rank || null,
    current_week: weekNum,
  });
}