"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateSpeakingProgress(minutes: number, metadata?: { module?: string; phrases?: number; segments?: number }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return { error: "Unauthorized" };

  // Update user_gamification_profile
  const { data: profile } = await supabase
    .from("user_gamification_profile")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const newTotalMinutes = (profile?.total_speaking_minutes || 0) + minutes;
  const newTotalXp = (profile?.total_xp || 0) + minutes * 6; // 6 XP per minute
  const newLevel = Math.floor(newTotalXp / 1000) + 1;
  const xpToNext = (newLevel * 1000) - newTotalXp;

  await supabase
    .from("user_gamification_profile")
    .upsert({
      user_id: user.id,
      total_xp: newTotalXp,
      current_level: newLevel,
      xp_to_next_level: xpToNext > 0 ? xpToNext : 1000,
      total_speaking_minutes: newTotalMinutes,
      updated_at: new Date().toISOString(),
    });

  // Check and unlock achievements
  await checkAchievements(user.id, { total_speaking_min: newTotalMinutes });

  // Update daily quests progress
  await updateDailyQuestsProgress(user.id, "speaking_minutes", minutes);

  // Log to curriculum_daily_log
  const today = new Date().toISOString().split("T")[0];
  await supabase
    .from("curriculum_daily_log")
    .upsert({
      user_id: user.id,
      study_date: today,
      speaking_minutes: minutes,
      modules_completed: metadata?.module ? [metadata.module] : [],
      xp_earned: minutes * 6,
    }, { onConflict: "user_id,study_date" });

  return { success: true, xp_earned: minutes * 6, new_total_xp: newTotalXp, new_level: newLevel };
}

export async function updateReflexProgress(phrases: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateDailyQuestsProgress(user.id, "reflex_phrases", phrases);
  return { success: true };
}

export async function updateShadowingProgress(segments: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateDailyQuestsProgress(user.id, "shadowing_segments", segments);
  await checkAchievements(user.id, { shadowing_segments: segments });
  return { success: true };
}

export async function updatePictureTalkProgress(images: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateDailyQuestsProgress(user.id, "picture_talk_images", images);
  await checkAchievements(user.id, { picture_talk_images: images });
  return { success: true };
}

export async function updateChunksProgress(mastered: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateDailyQuestsProgress(user.id, "chunks_mastered", mastered);
  return { success: true };
}

export async function updateVoiceDiaryProgress(entries: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateDailyQuestsProgress(user.id, "voice_diary_entries", entries);
  await checkAchievements(user.id, { voice_diary_total: entries });
  return { success: true };
}

export async function updateMirrorProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateDailyQuestsProgress(user.id, "mirror_recordings", 1);
  await checkAchievements(user.id, { mirror_recordings: 1 });
  return { success: true };
}

export async function updateRealWorldProgress() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  await updateDailyQuestsProgress(user.id, "real_world_tasks", 1);
  await checkAchievements(user.id, { real_world_tasks: 1 });
  return { success: true };
}

async function updateDailyQuestsProgress(userId: string, metric: string, increment: number) {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: quests } = await supabase
    .from("user_daily_quests")
    .select("*")
    .eq("user_id", userId)
    .eq("quest_date", today)
    .eq("is_completed", false);

  if (!quests || quests.length === 0) return;

  for (const quest of quests) {
    if (quest.target_metric === metric) {
      const newValue = quest.current_value + increment;
      const isCompleted = newValue >= quest.target_value;
      
      const updateData: any = { current_value: newValue };
      if (isCompleted) {
        updateData.is_completed = true;
        updateData.completed_at = new Date().toISOString();
        updateData.xp_earned = quest.xp_reward;
        
        // Award XP to profile
        const { data: profile } = await supabase
          .from("user_gamification_profile")
          .select("*")
          .eq("user_id", userId)
          .single();
        
        const newTotalXp = (profile?.total_xp || 0) + quest.xp_reward;
        const newLevel = Math.floor(newTotalXp / 1000) + 1;
        
        await supabase
          .from("user_gamification_profile")
          .upsert({
            user_id: userId,
            total_xp: newTotalXp,
            current_level: newLevel,
            xp_to_next_level: (newLevel * 1000) - newTotalXp,
            total_quests_completed: (profile?.total_quests_completed || 0) + 1,
          });
      }
      
      await supabase
        .from("user_daily_quests")
        .update(updateData)
        .eq("id", quest.id);
    }
  }
}

async function checkAchievements(userId: string, metrics: Record<string, number>) {
  const supabase = await createClient();
  
  // Get all achievements user hasn't earned yet
  const { data: earned } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);
  
  const earnedIds = new Set(earned?.map(e => e.achievement_id) || []);
  
  const { data: allAchievements } = await supabase
    .from("achievements")
    .select("*")
    .not("id", "in", `(${Array.from(earnedIds).map(id => `'${id}'`).join(",") || "''"})`);

  if (!allAchievements || allAchievements.length === 0) return;

  for (const achievement of allAchievements) {
    const req = achievement.requirement_json as Record<string, number>;
    let met = true;
    
    for (const [key, requiredValue] of Object.entries(req)) {
      const currentValue = metrics[key] || 0;
      if (currentValue < requiredValue) {
        met = false;
        break;
      }
    }
    
    if (met) {
      await supabase
        .from("user_achievements")
        .insert({
          user_id: userId,
          achievement_id: achievement.id,
          progress_json: metrics,
        });
      
      // Award XP
      const { data: profile } = await supabase
        .from("user_gamification_profile")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      const newTotalXp = (profile?.total_xp || 0) + achievement.xp_reward;
      const newLevel = Math.floor(newTotalXp / 1000) + 1;
      
      await supabase
        .from("user_gamification_profile")
        .upsert({
          user_id: userId,
          total_xp: newTotalXp,
          current_level: newLevel,
          xp_to_next_level: (newLevel * 1000) - newTotalXp,
          achievements_unlocked: (profile?.achievements_unlocked || 0) + 1,
        });
    }
  }
}