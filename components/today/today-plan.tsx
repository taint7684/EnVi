"use client";

import { useRouter } from "next/navigation";
import { Clock, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DailyStudyPlan as Plan } from "@/lib/types";

export function TodayPlan({ plan }: { plan: Plan }) {
  const router = useRouter();
  const total = plan.tasks.length;
  const doneCount = plan.tasks.filter(
    (t: (typeof plan.tasks)[number]) => plan.completedTaskIds.includes(t.id),
  ).length;
  const percent = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const startSession = () => router.push("/today/session");

  return (
    <div className="mx-auto grid max-w-5xl gap-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold">Hôm nay</h1>
        <p className="mt-1 text-muted-foreground">
          Kế hoạch học của bạn hôm nay. Bắt đầu với một phiên, các khối sẽ chạy liên mạch.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
              <Clock className="size-5" /> Kế hoạch học hôm nay
            </h2>
          </div>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="size-4" /> {plan.targetMinutes} phút
          </span>
        </div>

        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span>Hoàn thành {doneCount}/{total} mục</span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percent}%` }} />
        </div>

        {total === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Hôm nay chưa có task cụ thể. Bạn có thể tự chọn hoạt động để luyện tập.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {(plan.tasks ?? []).map((task: (typeof plan.tasks)[number]) => {
              const done = plan.completedTaskIds.includes(task.id);
              return (
                <li key={task.id} className="flex items-start gap-3 rounded-xl border p-3 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      <span className={done ? "line-through text-muted-foreground" : ""}>
                        {task.title}
                      </span>
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">~{task.estimatedMinutes} phút</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {doneCount === total && total > 0 ? (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <p className="flex items-center justify-center gap-2 font-semibold text-green-700">
              Chúc mừng! Bạn đã hoàn thành mục tiêu hôm nay 🎉
            </p>
          </div>
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="font-serif text-lg font-semibold mb-4">Bắt đầu buổi học</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Session Runner sẽ dẫn bạn qua từng khối liên mạch. Hoàn thành một khối sẽ tự động
          đánh dấu xong trên kế hoạch hôm nay (dựa trên hoạt động thực tế bạn đã làm).
        </p>
        <Button onClick={startSession} size="lg" className="w-full">
          <Play className="mr-1 h-4 w-4" />Bắt đầu buổi học
        </Button>
      </div>
    </div>
  );
}
