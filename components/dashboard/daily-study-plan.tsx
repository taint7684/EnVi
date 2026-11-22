"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, Flame, Loader2, PartyPopper, Target } from "lucide-react";

import { skipBlock } from "@/app/actions/study-plan";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import type { TodayPlanResult } from "@/app/actions/study-plan";
import { cn } from "@/lib/utils";

export function DailyStudyPlan({ plan }: { plan: TodayPlanResult }) {
  const [celebrate, setCelebrate] = useState(false);
  const [pendingSkip, setPendingSkip] = useState<string | null>();
  const [error, setError] = useState<string | null>(null);

  const total = plan.tasks.length;
  const doneCount = plan.tasks.filter((t) => t.done).length;
  const allDone = plan.allDone;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  async function skip(id: string) {
    if (pendingSkip) return;
    setError(null);
    setPendingSkip(id);
    try {
      await skipBlock(id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không thể bỏ qua khối này.");
    } finally {
      setPendingSkip(null);
    }
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      {celebrate ? <Confetti /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          <Target className="size-5 text-primary" />
          Kế hoạch học hôm nay
        </h2>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="size-4" />
          ~{plan.targetMinutes} phút
        </span>
      </div>

      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>
            Hoàn thành {doneCount}/{total} khối
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Nói thành tiếng: {plan.speakingMinutes}/{Math.ceil(plan.totalMinutes * 0.5)} phút (tối thiểu 50%)
        </p>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {total === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Hôm nay không có khối cụ thể — bạn có thể tự chọn hoạt động để luyện tập.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {plan.tasks.map((task) => {
            const defSpeaking = ["warmup", "reflex", "speaking", "fluency", "pronunciation"].includes(
              task.id,
            );
            return (
              <li
                key={task.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                  task.done
                    ? "border-green-200 bg-green-50/60"
                    : "border-border hover:bg-accent/30",
                )}
              >
                <button
                  type="button"
                  onClick={() => skip(task.id)}
                  disabled={pendingSkip === task.id}
                  aria-label="Bỏ qua khối này (không cộng XP)"
                  className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors border-border bg-background hover:border-red-500 hover:text-red-600"
                >
                  {pendingSkip === task.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowRight className="size-3" />
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        task.done && "text-muted-foreground line-through",
                      )}
                    >
                      {task.title}
                    </p>
                    {!task.done && task.isUrgent && defSpeaking ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        Ưu tiên nói
                      </span>
                    ) : null}
                    {task.minutes > 0 ? (
                      <span className="text-xs text-muted-foreground">
                        {task.minutes}′ ({task.speechMinutes}′ nói)
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ~{task.estimatedMinutes} phút
                  </p>
                </div>

                <Button asChild size="sm" variant={task.done ? "ghost" : "outline"}>
                  <Link href={task.url}>
                    {task.done ? "Xem lại" : "Bắt đầu"}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {allDone && plan.enoughMinutes ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="flex items-center justify-center gap-2 font-semibold text-green-700">
            <PartyPopper className="size-5" />
            Chúc mừng! Bạn đã hoàn thành mục tiêu hôm nay 🎉
          </p>
          <p className="mt-1 text-sm text-green-700/80">
            {plan.bonusAwarded
              ? "Bạn nhận được +100 XP cho hôm nay!"
              : "Giữ vững phong độ nhé!"}
          </p>
        </div>
      ) : null}

      {!allDone && plan.enoughMinutes === false && total > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground text-center">
          Lưu ý: ít nhất 50% thời gian kế hoạch phải là nói thành tiếng để tính hoàn thành ngày.
        </p>
      ) : null}
    </div>
  );
}
