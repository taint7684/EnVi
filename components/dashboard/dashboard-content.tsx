"use client";

import { Flame, Clock, Layers, Mic, ArrowRight, TrendingUp } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DailyStudyPlan } from "@/components/dashboard/daily-study-plan";
import { WeeklyReport } from "@/components/dashboard/weekly-report";
import type { DashboardStats, DayData, WeeklyReport as Report } from "@/lib/dashboard";
import type { TodayPlanResult } from "@/app/actions/study-plan";

type Props = {
  stats: DashboardStats;
  weekData: DayData[];
  plan: TodayPlanResult;
  report: Report;
};

export function DashboardContent({ stats, weekData, plan, report }: Props) {
  const maxMinutes = Math.max(...weekData.map((d) => d.minutes), 60);

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Chào mừng trở lại 👋</h1>
        <p className="mt-1 text-muted-foreground">
          Hôm nay là một ngày tốt để luyện nói. Bắt đầu với 35 phút Speaking nhé.
        </p>
      </div>

      <DailyStudyPlan plan={plan} />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
            <Flame className="size-4" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {stats.streak} ngày
          </p>
          <p className="text-sm text-muted-foreground">Streak</p>
        </div>

        <div
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Clock className="size-4" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {stats.minutesToday}
          </p>
          <p className="text-sm text-muted-foreground">Phút hôm nay</p>
        </div>

        <div
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
            <Layers className="size-4" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {stats.dueCards}
          </p>
          <p className="text-sm text-muted-foreground">Thẻ đến hạn</p>
        </div>

        <div
          className="rounded-2xl border border-border bg-card p-5 shadow-sm"
        >
          <div className="flex size-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <Mic className="size-4" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground">
            {report.speakingSessions}
          </p>
          <p className="text-sm text-muted-foreground">Phiên speaking (7N)</p>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
          <TrendingUp className="size-5" />
          Phút học theo ngày
        </h2>
        <div className="flex h-32 items-end justify-between gap-2">
          {Array.from({ length: 7 }, (_, i) => {
            const days = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
            const today = new Date();
            const dayOfWeek = today.getDay();
            const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            const dayIndex = (adjustedDay - 6 + i + 7) % 7;
            const data = weekData.find((d) => {
              const dDay = new Date(d.date).getDay();
              const dAdjusted = dDay === 0 ? 6 : dDay - 1;
              return dAdjusted === dayIndex;
            });

            return (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-primary/20"
                  style={{
                    height: `${Math.max(
                      8,
                      ((data?.minutes ?? 0) / maxMinutes) * 100,
                    )}%`,
                  }}
                >
                  <div className="flex h-full items-end justify-center pb-1">
                    {data && data.minutes > 0 && (
                      <span className="text-xs text-primary">
                        {data.minutes}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-xs text-muted-foreground">
                  {days[i]}
                </span>
              </div>
            );
          })}
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/roadmap">Xem lộ trình chi tiết</Link>
          </Button>
        </div>
      </div>

      <WeeklyReport report={report} />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-lg font-semibold">Bắt đầu nhanh</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/speaking", label: "Luyện nói với AI", desc: "Speaking coach 5 bước" },
            { href: "/writing", label: "Viết với AI", desc: "Email, báo cáo, tóm tắt" },
            { href: "/vocab", label: "Học từ hôm nay", desc: "Flashcard + SRS" },
            { href: "/roadmap", label: "Lộ trình 90 ngày", desc: "Check-in hôm nay" },
          ].map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="group rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <p className="flex items-center justify-between font-medium text-foreground">
                {q.label}
                <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{q.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}