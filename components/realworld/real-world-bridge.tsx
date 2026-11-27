"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { logRealWorld } from "@/lib/realworld/server";

const FEELINGS = [
  { value: 5, emoji: "😄", label: "dễ" },
  { value: 4, emoji: "🙂", label: "ok" },
  { value: 3, emoji: "😐", label: "khó" },
  { value: 2, emoji: "😰", label: "run" },
  { value: 1, emoji: "😨", label: "sợ" },
] as const;

type TaskProps = {
  id: string;
  step: number;
  title_vi: string;
  description_vi: string;
};

type Props = {
  task: TaskProps;
  done: boolean;
  isNext: boolean;
};

export function RealWorldBridge({ task, done, isNext }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [stuck, setStuck] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function handleLog(feeling: number) {
    setError(null);
    startTransition(async () => {
      try {
        await logRealWorld({ taskId: task.id, feeling, stuckPoints: stuck });
        setSaved(true);
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi lưu.");
      }
    });
  }

  return (
    <Card className={isNext ? "ring-2 ring-primary" : undefined}>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {task.step}
          </span>
          <div className="min-w-0 flex-1">
            <h3 className="font-medium">{task.title_vi}</h3>
            <p className="text-sm text-muted-foreground">{task.description_vi}</p>
          </div>
          {done && <span className="shrink-0 text-sm text-primary">✓</span>}
        </div>

        {!done && !saved && (
          <>
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs text-primary"
            >
              {expanded ? "Ẩn ghi chú điểm vướng" : "+ Ghi điểm vướng"}
            </button>
            {expanded && (
              <textarea
                value={stuck}
                onChange={(e) => setStuck(e.target.value)}
                placeholder="Chỗ nào thấy khó? (VD: ngại nói, sợ sai ngữ pháp...)"
                className="w-full rounded-lg border bg-background p-2 text-sm"
                rows={2}
              />
            )}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">Làm xong rồi? Cảm thấy thế nào?</span>
              <div className="flex gap-1">
                {FEELINGS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    disabled={pending}
                    onClick={() => handleLog(f.value)}
                    className="rounded-full border px-2 py-1 text-sm hover:bg-muted disabled:opacity-50"
                    title={f.label}
                  >
                    {f.emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {(done || saved) && (
          <p className="text-xs text-primary">
            {done ? "Đã hoàn thành ✓" : "Đã ghi nhận ✓ — làm bài tiếp theo bên dưới"}
          </p>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}
      </CardContent>
    </Card>
  );
}