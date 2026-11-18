"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Clock,
  Layers,
  Lightbulb,
  MessageCircle,
  Minus,
} from "lucide-react";

import type { WeeklyReport as Report } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

const INSIGHT_STYLES: Record<Report["insightType"], string> = {
  reflex: "border-violet-200 bg-violet-50 text-violet-800",
  speaking: "border-sky-200 bg-sky-50 text-sky-800",
  vocab: "border-emerald-200 bg-emerald-50 text-emerald-800",
  streak: "border-orange-200 bg-orange-50 text-orange-800",
  good: "border-green-200 bg-green-50 text-green-800",
};

export function WeeklyReport({ report }: { report: Report }) {
  const maxWords = Math.max(...report.wordsPerDay.map((d) => d.count), 1);
  const delta = report.minutesDelta;
  const DeltaIcon = delta > 0 ? ArrowUpRight : delta < 0 ? ArrowDownRight : Minus;
  const deltaColor =
    delta > 0 ? "text-green-600" : delta < 0 ? "text-red-600" : "text-muted-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2 font-serif text-lg font-semibold">
        <Layers className="size-5 text-primary" />
        Tuần này của bạn
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Từ đã ôn (7 ngày)</p>
          <p className="mt-1 text-2xl font-semibold">{report.wordsReviewed}</p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Phút học (7 ngày)</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-2xl font-semibold">{report.minutesThisWeek}</span>
            <span className={cn("flex items-center gap-0.5 text-xs", deltaColor)}>
              <DeltaIcon className="size-3.5" />
              {Math.abs(delta)} so với tuần trước
            </span>
          </div>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-xs text-muted-foreground">Speaking · Reflex</p>
          <p className="mt-1 flex items-center gap-3 text-2xl font-semibold">
            <span className="flex items-center gap-1">
              <MessageCircle className="size-4 text-sky-500" />
              {report.speakingSessions}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="size-4 text-violet-500" />
              {report.reflexPracticed}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-5">
        <p className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="size-3.5" /> Từ đã ôn theo ngày
        </p>
        <div className="flex h-28 items-end justify-between gap-2">
          {report.wordsPerDay.map((d) => (
            <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
              <div className="flex h-20 w-full items-end">
                <div
                  className="w-full rounded-t-md bg-primary/30"
                  style={{ height: `${Math.max(4, (d.count / maxWords) * 100)}%` }}
                  title={`${d.count} từ`}
                />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {d.count > 0 ? d.count : ""}
              </span>
              <span className="text-[11px] text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className={cn(
          "mt-5 flex items-start gap-2 rounded-xl border p-3 text-sm",
          INSIGHT_STYLES[report.insightType],
        )}
      >
        <Lightbulb className="mt-0.5 size-4 shrink-0" />
        <p>{report.insight}</p>
      </div>
    </div>
  );
}