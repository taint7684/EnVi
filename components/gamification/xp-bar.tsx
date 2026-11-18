"use client";

import { useCallback, useEffect, useState } from "react";
import { Flame, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type Profile = {
  xp: number;
  level: number;
  streak: number;
};

const LEVEL_NAMES = [
  "Beginner",
  "Novice",
  "Apprentice",
  "Intermediate",
  "Advanced",
  "Expert",
  "Master",
  "Legend",
];

function getLevelName(level: number): string {
  const index = Math.min(level - 1, LEVEL_NAMES.length - 1);
  return LEVEL_NAMES[index] ?? `Level ${level}`;
}

export function XpBar() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("xp, level")
      .eq("id", user.id)
      .maybeSingle();

    if (data) {
      const { data: streakData } = await supabase
        .from("daily_progress")
        .select("streak")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(1);

      setProfile({
        xp: (data as { xp: number }).xp,
        level: (data as { level: number }).level,
        streak: (streakData as { streak: number }[])?.[0]?.streak ?? 0,
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadProfile();

    function handleRefresh() {
      loadProfile();
    }
    window.addEventListener("envi:xp-refresh", handleRefresh);
    return () => window.removeEventListener("envi:xp-refresh", handleRefresh);
  }, [loadProfile]);

  if (loading || !profile) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Flame className="h-4 w-4" />
        Đang tải...
      </div>
    );
  }

  const currentLevel = profile.level;
  const nextLevelXp = currentLevel * 1000;
  const progress = (profile.xp % 1000) / 10;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
          <Trophy className="size-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">
            {getLevelName(currentLevel)}
          </p>
          <p className="text-sm font-semibold">Level {currentLevel}</p>
        </div>
      </div>

      <div className="flex-1">
        <div className="h-2 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{profile.xp} XP</span>
          <span>{nextLevelXp} XP</span>
        </div>
      </div>

      {profile.streak > 0 && (
        <div className="flex items-center gap-1 rounded-full bg-orange-100 px-2 py-1 text-xs font-medium text-orange-700">
          <Flame className="size-3" />
          {profile.streak}
        </div>
      )}
    </div>
  );
}