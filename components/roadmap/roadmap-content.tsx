"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Circle, Flame, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type DayStatus = {
  day: number;
  completed: boolean;
  date: string;
};

function getDateForDay(day: number): string {
  const start = new Date();
  start.setDate(start.getDate() - day + 1);
  return start.toISOString().split("T")[0];
}

export function RoadmapContent() {
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [currentDay, setCurrentDay] = useState(1);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  useEffect(() => {
    loadProgress();
  }, []);

  async function loadProgress() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("daily_progress")
      .select("date, streak")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(90);

    if (data) {
      const completed = data
        .filter((d) => (d as { date: string; streak: number }).streak > 0)
        .map((d) => {
          const date = new Date((d as { date: string }).date);
          const diff = Math.floor(
            (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24),
          );
          return 90 - diff;
        })
        .filter((d) => d >= 1 && d <= 90);
      setCompletedDays(completed);
      setCurrentDay(Math.min(90, completed.length + 1));
      setStreak((data[0] as { streak: number })?.streak ?? 0);
    }
    setLoading(false);
  }

  async function handleCheckIn() {
    if (checkingIn) return;
    setCheckingIn(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { data: existing } = await supabase
      .from("daily_progress")
      .select("streak")
      .eq("user_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (existing) {
      setStreak(existing.streak);
      setCheckingIn(false);
      return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const { data: yesterdayData } = await supabase
      .from("daily_progress")
      .select("streak")
      .eq("user_id", user.id)
      .eq("date", yesterdayStr)
      .maybeSingle();

    const newStreak = yesterdayData ? yesterdayData.streak + 1 : 1;

    await supabase.from("daily_progress").upsert({
      user_id: user.id,
      date: today,
      minutes: 3,
      words_reviewed: 0,
      speaking_minutes: 0,
      streak: newStreak,
    });

    setCompletedDays((prev) => [...prev, currentDay]);
    setCurrentDay((prev) => Math.min(90, prev + 1));
    setStreak(newStreak);
    setCheckingIn(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Đang tải lộ trình...
      </div>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const alreadyCheckedIn = completedDays.includes(currentDay);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold">
              Lộ trình 90 ngày
            </h2>
            <p className="text-sm text-muted-foreground">
              Ngày {currentDay}/90 · Streak: {streak} ngày
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Flame className="h-6 w-6 text-orange-500" />
            <span className="text-2xl font-bold">{streak}</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${(completedDays.length / 90) * 100}%` }}
            />
          </div>
        </div>

        <div className="mt-4">
          <Button
            onClick={handleCheckIn}
            disabled={checkingIn || alreadyCheckedIn}
            className="w-full"
          >
            {alreadyCheckedIn ? (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Đã check-in hôm nay
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Check-in hôm nay
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-medium">Lịch 90 ngày</h3>
        <div className="grid grid-cols-10 gap-2">
          {Array.from({ length: 90 }, (_, i) => {
            const day = i + 1;
            const isCompleted = completedDays.includes(day);
            const isToday = day === currentDay;

            return (
              <div
                key={day}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-lg text-xs font-medium transition-colors",
                  isCompleted
                    ? "bg-primary text-primary-foreground"
                    : isToday
                      ? "border-2 border-primary bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  day
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-2 font-medium">Gợi ý hôm nay</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Học 20 từ mới với flashcard SRS
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Luyện Speaking với AI 15 phút
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Shadowing hoặc Dictation 10 phút
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-0.5 text-primary">•</span>
            Đọc to một đoạn văn ngắn
          </li>
        </ul>
      </div>
    </div>
  );
}