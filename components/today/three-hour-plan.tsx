"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, GripVertical, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type StudyBlock = {
  id: string;
  title: string;
  minutes: number;
  href: string;
  icon: string;
  description: string;
};

const DEFAULT_BLOCKS: StudyBlock[] = [
  {
    id: "vocab",
    title: "Từ vựng",
    minutes: 20,
    href: "/vocab",
    icon: "📚",
    description: "Ôn thẻ đến hạn + học từ mới (SM-2)",
  },
  {
    id: "reflex",
    title: "Phản xạ",
    minutes: 35,
    href: "/reflex",
    icon: "⚡",
    description: "Luyện phản xạ câu tiếng Anh tức thì",
  },
  {
    id: "speaking",
    title: "Speaking",
    minutes: 40,
    href: "/speaking",
    icon: "🎤",
    description: "Speaking Coach AI 6 bước",
  },
  {
    id: "listen",
    title: "Nghe & Nhại",
    minutes: 35,
    href: "/shadowing",
    icon: "🎧",
    description: "Shadowing video + nghe hội thoại",
  },
  {
    id: "readwrite",
    title: "Đọc / Viết",
    minutes: 30,
    href: "/reading",
    icon: "✍️",
    description: "Đọc hiểu hoặc viết email/Slack",
  },
  {
    id: "errors",
    title: "Ôn lỗi",
    minutes: 20,
    href: "/error-log",
    icon: "🔁",
    description: "Sửa lỗi đã mắc (Error Log + Bài bù)",
  },
];

export function ThreeHourPlan() {
  const [blocks, setBlocks] = useState<StudyBlock[]>(DEFAULT_BLOCKS);
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const totalMinutes = blocks.reduce((s, b) => s + b.minutes, 0);
  const completedMinutes = blocks
    .filter((b) => completed.has(b.id))
    .reduce((s, b) => s + b.minutes, 0);
  const allDone = completed.size === blocks.length && blocks.length > 0;

  function toggleComplete(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function skipBlock(id: string) {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
    setCompleted((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function resetPlan() {
    setBlocks(DEFAULT_BLOCKS);
    setCompleted(new Set());
  }

  function moveBlock(fromId: string, toId: string) {
    if (fromId === toId) return;
    setBlocks((prev) => {
      const from = prev.findIndex((b) => b.id === fromId);
      const to = prev.findIndex((b) => b.id === toId);
      if (from === -1 || to === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
          <span className="text-xl">⏱️</span>
          Gợi ý học 3 tiếng
        </h2>
        <span className="text-sm text-muted-foreground">
          {completedMinutes}/{totalMinutes} phút
        </span>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Ưu tiên nói &amp; phản xạ cho A2–B1 giao tiếp đời sống + công việc IT/BA.
        Chọn bài, đổi thứ tự hoặc bỏ qua — học tiếp sau khi xong vẫn được.
      </p>

      {allDone ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="flex items-center justify-center gap-2 font-semibold text-green-700">
            <Check className="size-5" />
            Hoàn thành gợi ý 3 tiếng! 🎉
          </p>
          <p className="mt-1 text-sm text-green-700/80">
            Bạn vẫn có thể học tiếp bất kỳ bài nào — không giới hạn.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={resetPlan}
          >
            <RotateCcw className="mr-1 size-3.5" />
            Làm lại gợi ý
          </Button>
        </div>
      ) : null}

      <ul className="mt-4 space-y-2">
        {blocks.map((block, idx) => {
          const isDone = completed.has(block.id);
          return (
            <li
              key={block.id}
              draggable
              onDragStart={() => setDraggedId(block.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedId) moveBlock(draggedId, block.id);
                setDraggedId(null);
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                isDone
                  ? "border-green-200 bg-green-50/60"
                  : "border-border hover:bg-accent/30",
                draggedId === block.id && "opacity-50",
              )}
            >
              <div className="flex items-center gap-1 cursor-grab text-muted-foreground">
                <GripVertical className="size-4" />
                <span className="text-xs">{idx + 1}</span>
              </div>

              <button
                type="button"
                onClick={() => toggleComplete(block.id)}
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                  isDone
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-border bg-background hover:border-green-500",
                )}
                aria-label={isDone ? "Đánh dấu chưa xong" : "Đánh dấu xong"}
              >
                {isDone ? <Check className="size-3.5" /> : null}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-lg">{block.icon}</span>
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isDone && "text-muted-foreground line-through",
                    )}
                  >
                    {block.title}
                  </p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {block.minutes}′
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {block.description}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Button asChild size="sm" variant={isDone ? "ghost" : "outline"}>
                  <Link href={block.href}>
                    {isDone ? "Xem lại" : "Học"}
                    <ArrowRight className="size-3.5" />
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => skipBlock(block.id)}
                  className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:text-red-600"
                  aria-label="Bỏ qua mục này"
                >
                  <X className="size-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {blocks.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground text-center">
          Đã bỏ hết mục. Bạn vẫn có thể vào thẳng{" "}
          <Link href="/vocab" className="text-primary underline">Từ vựng</Link>,{" "}
          <Link href="/reflex" className="text-primary underline">Phản xạ</Link>,{" "}
          <Link href="/speaking" className="text-primary underline">Speaking</Link>{" "}
          hoặc bất kỳ bài nào khác.
        </p>
      ) : null}
    </div>
  );
}