"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, GripVertical, X, Volume2, Mic, Image, MessageSquare, Hash, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DayBlock, DayPlan } from "@/lib/curriculum";

type BlockWithStatus = DayBlock & { done: boolean };

const BLOCK_ICONS: Record<string, React.ReactNode> = {
  shadowing: <Volume2 className="size-5 text-blue-600" />,
  reflex: <Mic className="size-5 text-emerald-600" />,
  picture_talk: <Image className="size-5 text-amber-600" />,
  speaking: <MessageSquare className="size-5 text-purple-600" />,
  chunks: <Hash className="size-5 text-indigo-600" />,
  voice_diary: <BookOpen className="size-5 text-rose-600" />,
};

const BLOCK_DESCRIPTIONS: Record<string, string> = {
  shadowing: "Nghe & lặp lại ngay (Shadowing) — 10′",
  reflex: "Luyện phản xạ câu tiếng Anh tức thì — 20′",
  picture_talk: "Mô tả ảnh theo chủ đề tuần — 15′",
  speaking: "Trò chuyện tự do với AI Coach — 30′",
  chunks: "Học & nói các cụm từ sẵn sàng — 10′",
  voice_diary: "Ghi âm nhật ký giọng 60s — 5′",
};

function getDefaultBlocks(plan: DayPlan): BlockWithStatus[] {
  return plan.blocks.map((block) => ({
    ...block,
    done: false,
  }));
}

interface ThreeHourPlanNewProps {
  plan: DayPlan;
}

export function ThreeHourPlanNew({ plan }: ThreeHourPlanNewProps) {
  const [blocks, setBlocks] = useState<BlockWithStatus[]>(() => getDefaultBlocks(plan));
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
    setBlocks(getDefaultBlocks(plan));
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
          Gợi ý học 1h30 (6 block cố định)
        </h2>
        <span className="text-sm text-muted-foreground">
          {completedMinutes}/{totalMinutes} phút
        </span>
      </div>

      <p className="mt-1 text-sm text-muted-foreground">
        Phase {plan.phase} · Tuần {plan.weekNum} · {plan.topicNameVi} ({plan.topicNameEn}) · Layer weights: L1 {plan.layerWeights.L1}% L2 {plan.layerWeights.L2}% L3 {plan.layerWeights.L3}% · Work topic {plan.workTopicPct}%
      </p>

      {allDone ? (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 p-4 text-center">
          <p className="flex items-center justify-center gap-2 font-semibold text-green-700">
            <Check className="size-5" />
            Hoàn thành 6 block! 🎉 +{plan.xpTarget} XP
          </p>
          <p className="mt-1 text-sm text-green-700/80">Mục tiêu nói: {plan.speakingMinutes}′ ({plan.speakingPct}%)</p>
          <Button variant="outline" size="sm" className="mt-3" onClick={resetPlan}>
            Làm lại
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
                isDone ? "border-green-200 bg-green-50/60" : "border-border hover:bg-accent/30",
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
                  isDone ? "border-green-500 bg-green-500 text-white" : "border-border bg-background hover:border-green-500",
                )}
                aria-label={isDone ? "Đánh dấu chưa xong" : "Đánh dấu xong"}
              >
                {isDone ? <Check className="size-3.5" /> : null}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {BLOCK_ICONS[block.id]}
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isDone && "text-muted-foreground line-through",
                    )}
                  >
                    {block.label}
                  </p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    {block.minutes}′
                  </span>
                  {block.speaking && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                      NÓI
                    </span>
                  )}
                  {block.config.layer && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                      {block.config.layer}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{BLOCK_DESCRIPTIONS[block.id]}</p>
              </div>

              <div className="flex items-center gap-1">
                <Button asChild size="sm" variant={isDone ? "ghost" : "outline"}>
                  <Link href={`/${block.module}`}>
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
          Đã bỏ hết block. Bạn vẫn có thể vào thẳng các module.
        </p>
      ) : null}
    </div>
  );
}