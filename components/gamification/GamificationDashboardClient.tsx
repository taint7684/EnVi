"use client";

import { useEffect, useState } from "react";
import { Trophy, Flame, Target, Crown, Medal, Star, TrendingUp, User, Clock, CheckCircle, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Achievement = {
  id: string;
  category: string;
  name_vi: string;
  name_en: string;
  description_vi: string;
  description_en: string;
  icon: string;
  tier: string;
  xp_reward: number;
  requirement_json: Record<string, number>;
  earned_at?: string;
  progress_json?: Record<string, number>;
};

type Quest = {
  id: number;
  template_id: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  is_completed: boolean;
  xp_reward: number;
  daily_quest_templates: {
    name_vi: string;
    name_en: string;
    description_vi: string;
    category: string;
  };
};

type Profile = {
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  current_level: number;
  xp_to_next_level: number;
  current_streak: number;
  longest_streak: number;
  total_speaking_minutes: number;
  total_quests_completed: number;
  achievements_unlocked: number;
  quest_streak: number;
};

const TIER_COLORS = {
  bronze: "bg-amber-100 text-amber-700 border-amber-300",
  silver: "bg-slate-100 text-slate-700 border-slate-300",
  gold: "bg-yellow-100 text-yellow-700 border-yellow-300",
  platinum: "bg-purple-100 text-purple-700 border-purple-300",
  diamond: "bg-cyan-100 text-cyan-700 border-cyan-300",
};

const TIER_ICONS = {
  bronze: Medal,
  silver: Medal,
  gold: Trophy,
  platinum: Crown,
  diamond: Star,
};

export function GamificationDashboardClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "achievements" | "quests" | "leaderboard">("overview");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await fetch("/api/gamification/profile");
      const data = await res.json();
      setProfile(data.profile);
      setAchievements(data.achievements || []);
      setQuests(data.quests || []);
      setLeaderboard(data.leaderboard || []);
      setUserRank(data.user_rank);
    } catch (e) {
      console.error("Failed to fetch gamification data", e);
    } finally {
      setLoading(false);
    }
  }

  const xpProgress = profile ? ((profile.total_xp % 1000) / 1000) * 100 : 0;
  const currentLevel = profile?.current_level || 1;
  const totalXp = profile?.total_xp || 0;
  const xpToNext = totalXp % 1000;

  if (loading) {
    return <div className="py-12 text-center">Đang tải...</div>;
  }

  return (
    <div className="py-4">
      {/* Profile Header */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.display_name} className="size-20 rounded-full" />
            ) : (
              <div className="size-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="size-10 text-primary" />
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 size-6 rounded-full bg-primary flex items-center justify-center">
              <span className="text-xs font-bold text-primary-foreground">{currentLevel}</span>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="font-serif text-2xl font-semibold">{profile?.display_name}</h2>
            <p className="text-sm text-muted-foreground">Level {currentLevel} · {totalXp.toLocaleString()} XP</p>
            <div className="mt-2 h-2 w-full max-w-xs rounded-full bg-muted overflow-hidden">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${xpProgress}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{xpToNext} / 1000 XP to Level {currentLevel + 1}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Flame className="size-4 text-amber-500" /> {profile?.current_streak} ngày streak
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="size-4" /> {profile?.total_speaking_minutes} phút nói
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="mb-4 flex border-b border-border">
        {[
          { value: "overview", label: "Tổng quan", icon: <TrendingUp className="size-4" /> },
          { value: "achievements", label: "Thành tựu", icon: <Trophy className="size-4" /> },
          { value: "quests", label: "Nhiệm vụ hôm nay", icon: <Target className="size-4" /> },
          { value: "leaderboard", label: "Bảng xếp hạng", icon: <Crown className="size-4" /> },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "default" : "ghost"}
            className={cn(
              "gap-2",
              activeTab === tab.value && "bg-primary text-primary-foreground"
            )}
            onClick={() => setActiveTab(tab.value as typeof activeTab)}
          >
            <span className="flex items-center gap-1">{tab.icon} <span className="hidden sm:inline">{tab.label}</span></span>
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Flame className="size-5 text-amber-500" />} value={profile?.current_streak || 0} label="Streak hiện tại" subtitle={`Best: ${profile?.longest_streak || 0}`} />
          <StatCard icon={<Clock className="size-5 text-blue-500" />} value={`${profile?.total_speaking_minutes || 0}m`} label="Tổng phút nói" subtitle="Mục tiêu: ≥70%/ngày" />
          <StatCard icon={<CheckCircle className="size-5 text-emerald-500" />} value={profile?.total_quests_completed || 0} label="Nhiệm vụ hoàn thành" subtitle={`Streak: ${profile?.quest_streak || 0}`} />
          <StatCard icon={<Trophy className="size-5 text-yellow-500" />} value={profile?.achievements_unlocked || 0} label="Thành tựu" subtitle={`Level ${currentLevel}`} />
        </div>
      )}

      {activeTab === "achievements" && (
        <div className="space-y-3">
          {achievements.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <Lock className="size-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold">Chưa có thành tựu nào</h3>
              <p className="mt-1 text-sm text-muted-foreground">Hoàn thành bài kiểm tra, duy trì streak, hoặc nói nhiều hơn để mở khóa</p>
            </div>
          ) : (
            achievements.map((a) => (
              <AchievementCard key={a.id} achievement={a} earned={!!a.earned_at} />
            ))
          )}
        </div>
      )}

      {activeTab === "quests" && (
        <div className="space-y-3">
          {quests.length === 0 ? (
            <div className="rounded-2xl border border-border bg-card p-10 text-center">
              <Target className="size-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="font-semibold">Chưa có nhiệm vụ hôm nay</h3>
              <p className="mt-1 text-sm text-muted-foreground">Nhiệm vụ sẽ được tạo mới vào 03:00 sáng. Hãy quay lại sau!</p>
            </div>
          ) : (
            quests.map((q) => (
              <QuestCard key={q.id} quest={q} />
            ))
          )}
        </div>
      )}

      {activeTab === "leaderboard" && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted">
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Hạng</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Người chơi</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">XP tuần này</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Phút nói</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Streak</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => {
                  const isCurrentUser = userRank && entry.rank === userRank;
                  return (
                    <tr key={entry.user_id} className={cn("border-b border-border/50 hover:bg-muted/50", isCurrentUser && "bg-primary/5")}>
                      <td className="px-4 py-3 font-semibold">
                        {entry.rank || i + 1}
                        {isCurrentUser && <span className="ml-2 text-xs text-primary">(Bạn)</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="size-4 text-primary" />
                          </div>
                          <span>{entry.user_gamification_profile?.display_name || "Anonymous"}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono">{entry.total_xp?.toLocaleString() || 0}</td>
                      <td className="px-4 py-3 text-right font-mono">{entry.speaking_minutes || 0}m</td>
                      <td className="px-4 py-3 text-right font-mono">
                        <Flame className="size-4 text-amber-500 inline mr-1" /> {entry.streak_days || 0}
                      </td>
                    </tr>
                  );
                })}
                {leaderboard.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                      Chưa có dữ liệu bảng xếp hạng tuần này
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {userRank && (
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
              <p className="text-sm text-primary">Hạng của bạn: <span className="font-bold">#{userRank}</span></p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, subtitle }: { icon: React.ReactNode; value: string | number; label: string; subtitle: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-lg p-2 bg-muted">{icon}</div>
        <div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function AchievementCard({ achievement, earned }: { achievement: Achievement; earned: boolean }) {
  const TierIcon = TIER_ICONS[achievement.tier as keyof typeof TIER_ICONS] || Medal;
  
  return (
    <div className={cn(
      "rounded-xl border p-4 flex items-center gap-4 transition-colors",
      earned ? "bg-card border-border" : "bg-muted/50 border-border/50 opacity-60"
    )}>
      <div className={cn("rounded-lg p-3 flex-shrink-0", TIER_COLORS[achievement.tier as keyof typeof TIER_COLORS])}>
        <TierIcon className="size-6" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{achievement.icon}</span>
          <h3 className={cn("font-semibold", earned ? "text-foreground" : "text-muted-foreground")}>
            {achievement.name_vi}
          </h3>
          {earned && <CheckCircle className="size-4 text-emerald-500" />}
        </div>
        <p className={cn("mt-1 text-sm", earned ? "text-muted-foreground" : "text-muted-foreground/70")}>
          {achievement.description_vi}
        </p>
        {earned && achievement.earned_at && (
          <p className="mt-1 text-xs text-muted-foreground">Đạt: {new Date(achievement.earned_at).toLocaleDateString("vi-VN")}</p>
        )}
      </div>
      <div className="text-right">
        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", TIER_COLORS[achievement.tier as keyof typeof TIER_COLORS])}>
          <TierIcon className="size-3" />
          {achievement.tier}
        </span>
        <p className="mt-1 text-xs text-muted-foreground">+{achievement.xp_reward} XP</p>
      </div>
    </div>
  );
}

function QuestCard({ quest }: { quest: Quest }) {
  const t = quest.daily_quest_templates;
  const progress = Math.min(100, (quest.current_value / quest.target_value) * 100);
  
  return (
    <div className={cn("rounded-xl border p-4 flex items-center gap-4", quest.is_completed ? "bg-emerald-50 border-emerald-200" : "bg-card border-border")}>
      <div className="rounded-lg p-3 bg-primary/10">
        <Target className="size-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium">{t.name_vi}</h3>
        <p className="text-sm text-muted-foreground">{t.description_vi}</p>
        <div className="mt-2 h-2 w-full rounded-full bg-muted overflow-hidden">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">{quest.current_value} / {quest.target_value} {t.category === "speaking" ? "phút" : t.category === "reflex" ? "câu" : "lần"}</p>
      </div>
      <div className="flex flex-col items-end gap-2">
        {quest.is_completed ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm font-medium">
            <CheckCircle className="size-3" /> Hoàn thành
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">Đang làm...</span>
        )}
        <span className="font-semibold text-primary">+{quest.xp_reward} XP</span>
      </div>
    </div>
  );
}