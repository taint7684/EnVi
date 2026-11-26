"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Flame, Loader2, PartyPopper, Target, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import type { DayPlan, DayBlock } from "@/lib/curriculum";
import { cn } from "@/lib/utils";

export function DailyStudyPlanNew({ plan }: { plan: DayPlan }) {
  const [celebrate, setCelebrate] = useState(false);
  const [pendingSkip, setPendingSkip] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = plan.blocks.length;
  const doneCount = plan.blocks.filter((b) => b.id.startsWith("done-")).length;
  const allDone = doneCount === total && total > 0;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const blocksWithStatus = plan.blocks.map((block) => ({
    ...block,
    done: block.id.startsWith("done-"),
  }));

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      {celebrate ? <Confetti /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          <Target className="size-5 text-primary" />
          Kế hoạch học hôm nay (Ngày {plan.dayIndex})
        </h2>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-4" />
          ~{plan.totalMinutes} phút
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Hoàn thành {doneCount}/{total} block</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Nói thành tiếng: {plan.speakingMinutes}/{plan.totalMinutes} phút ({plan.speakingPct}%)
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          XP mục tiêu: {plan.xpTarget} | Phase: {plan.phase} | Tuần {plan.weekNum} | {plan.topicNameVi} ({plan.topicNameEn})
        </p>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      ) : null}

      <ul className="mt-4 space-y-2">
        {blocksWithStatus.map((block) => {
          const isDone = block.done;
          return (
            <li
              key={block.id}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                isDone ? "border-green-200 bg-green-50/60" : "border-border hover:bg-accent/30",
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isDone && "text-muted-foreground line-through",
                    )}
                  >
                    {block.label}
                  </p>
                  {block.speaking && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      NÓI
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{block.minutes}′</span>
                  {block.config.layer && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      {block.config.layer}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Module: {block.module} | Topic: {plan.topicNameVi} | Round {plan.blocks[0].config.round}
                </p>
              </div>

              <Button asChild size="sm" variant={isDone ? "ghost" : "outline"}>
                <Link href={`/${block.module}`}>
                  {isDone ? "Xem lại" : "Bắt đầu"}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>

      {allDone ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="flex items-center justify-center gap-2 font-semibold text-green-700">
            <PartyPopper className="size-5" />
            Chúc mừng! Bạn đã hoàn thành kế hoạch hôm nay 🎉
          </p>
          <p className="mt-1 text-sm text-green-700/80">Nhận được +{plan.xpTarget} XP!</p>
        </div>
      ) : null}
    </div>
  );
}