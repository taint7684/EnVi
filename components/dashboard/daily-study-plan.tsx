"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Clock,
  Flame,
  Loader2,
  PartyPopper,
  Target,
} from "lucide-react";

import { toggleStudyTask } from "@/app/actions/study-plan";
import { Button } from "@/components/ui/button";
import { Confetti } from "@/components/ui/confetti";
import type { DailyStudyPlan as Plan } from "@/lib/types";
import { cn } from "@/lib/utils";

export function DailyStudyPlan({ plan }: { plan: Plan }) {
  const [completed, setCompleted] = useState<Set<string>>(
    () => new Set(plan.completedTaskIds),
  );
  const [bonusAwarded, setBonusAwarded] = useState(plan.bonusAwarded);
  const [celebrate, setCelebrate] = useState(false);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = plan.tasks.length;
  const doneCount = plan.tasks.filter((t) => completed.has(t.id)).length;
  const allDone = total > 0 && doneCount === total;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  async function toggle(id: string) {
    if (pending) return;
    setError(null);
    setPending(id);

    // optimistic
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

    try {
      const res = await toggleStudyTask(id);
      setCompleted(new Set(res.completedTaskIds));
      if (res.bonusAwarded && !bonusAwarded) {
        setBonusAwarded(true);
        setCelebrate(true);
        window.dispatchEvent(new Event("envi:xp-refresh"));
        setTimeout(() => setCelebrate(false), 4000);
      }
    } catch (cause) {
      // revert
      setCompleted(new Set(plan.completedTaskIds));
      setError(cause instanceof Error ? cause.message : "Có lỗi khi lưu.");
    } finally {
      setPending(null);
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
            Hoàn thành {doneCount}/{total} mục
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {total === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Hôm nay không có task cụ thể — bạn có thể tự chọn hoạt động để luyện
          tập.
        </p>
      ) : (
        <ul className="mt-4 space-y-2">
          {plan.tasks.map((task) => {
            const done = completed.has(task.id);
            return (
              <li
                key={task.id}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-3 transition-colors",
                  done
                    ? "border-green-200 bg-green-50/60"
                    : "border-border hover:bg-accent/30",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggle(task.id)}
                  disabled={pending !== null}
                  aria-label={done ? "Bỏ đánh dấu hoàn thành" : "Đánh dấu hoàn thành"}
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    done
                      ? "border-green-500 bg-green-500 text-white"
                      : "border-border bg-background hover:border-primary",
                  )}
                >
                  {pending === task.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : done ? (
                    <Check className="size-3.5" />
                  ) : null}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        done && "text-muted-foreground line-through",
                      )}
                    >
                      {task.title}
                    </p>
                    {task.isUrgent && !done ? (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                        Ưu tiên
                      </span>
                    ) : null}
                    {task.type === "streak" ? (
                      <Flame className="size-3.5 text-orange-500" />
                    ) : null}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    ~{task.estimatedMinutes} phút
                  </p>
                </div>

                <Button asChild size="sm" variant={done ? "ghost" : "outline"}>
                  <Link href={task.url}>
                    {done ? "Xem lại" : "Bắt đầu"}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {allDone ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="flex items-center justify-center gap-2 font-semibold text-green-700">
            <PartyPopper className="size-5" />
            Chúc mừng! Bạn đã hoàn thành mục tiêu hôm nay 🎉
          </p>
          <p className="mt-1 text-sm text-green-700/80">
            {bonusAwarded
              ? "Bạn nhận được +100 XP cho hôm nay!"
              : "Giữ vững phong độ nhé!"}
          </p>
        </div>
      ) : null}
    </div>
  );
}