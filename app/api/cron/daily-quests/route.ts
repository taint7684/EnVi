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
  const questDate = vnNow.toISOString().split("T")[0];

  // Get all active users who have a gamification profile
  const { data: profiles } = await supabase
    .from("user_gamification_profile")
    .select("user_id");

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: "No users found", generated: 0 });
  }

  // Get active quest templates
  const { data: templates } = await supabase
    .from("daily_quest_templates")
    .select("*")
    .eq("is_active", true);

  if (!templates || templates.length === 0) {
    return NextResponse.json({ message: "No active quest templates", generated: 0 });
  }

  let generated = 0;
  const errors: string[] = [];

  for (const profile of profiles) {
    try {
      // Check if user already has quests for today
      const { data: existing } = await supabase
        .from("user_daily_quests")
        .select("id")
        .eq("user_id", profile.user_id)
        .eq("quest_date", questDate)
        .limit(1);

      if (existing && existing.length > 0) {
        continue; // Already has quests for today
      }

      // Pick 3-4 random templates for the user
      const shuffled = [...templates].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 4);

      const questsToInsert = selected.map((template) => ({
        user_id: profile.user_id,
        quest_date: questDate,
        template_id: template.id,
        target_value: template.target_value,
        current_value: 0,
        is_completed: false,
        xp_earned: 0,
      }));

      const { error } = await supabase
        .from("user_daily_quests")
        .insert(questsToInsert);

      if (error) {
        errors.push(`User ${profile.user_id}: ${error.message}`);
      } else {
        generated += questsToInsert.length;
      }
    } catch (e) {
      errors.push(`User ${profile.user_id}: ${e}`);
    }
  }

  return NextResponse.json({
    message: "Daily quests generated",
    date: questDate,
    generated,
    errors: errors.length > 0 ? errors : undefined,
  });
}