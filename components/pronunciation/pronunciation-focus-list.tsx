"use client";

import { ChevronRight, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import type { PronunciationFocus, PronunciationProgress } from "@/lib/pronunciation/types";
import { CATEGORY_LABELS } from "@/lib/pronunciation/types";
import { cn } from "@/lib/utils";

const STATUS_ICONS = {
  new: Circle,
  practicing: Circle,
  mastered: CheckCircle2,
  weak: AlertCircle,
} as const;

const STATUS_LABELS = {
  new: "Mới",
  practicing: "Đang luyện",
  mastered: "Đã thành thạo",
  weak: "Cần luyện thêm",
} as const;

const STATUS_COLORS = {
  new: "text-muted-foreground",
  practicing: "text-amber-600",
  mastered: "text-emerald-600",
  weak: "text-red-600",
} as const;

export function PronunciationFocusList({
  focuses,
  progress,
}: {
  focuses: PronunciationFocus[];
  progress: Record<string, PronunciationProgress>;
}) {
  // Group by category
  const categories = ["consonant", "vowel", "suprasegmental", "connected_speech"] as const;
  const grouped = categories.map((cat) => ({
    category: cat,
    label: CATEGORY_LABELS[cat] ?? cat,
    items: focuses.filter((f) => f.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      {grouped.map((group) => (
        <section key={group.category}>
          <h2 className="mb-3 text-sm font-medium text-muted-foreground uppercase tracking-wide">
            {group.label}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((f) => {
              const p = progress[f.id];
              const status = p?.status ?? "new";
              const StatusIcon = STATUS_ICONS[status];
              return (
                <a
                  key={f.id}
                  href={`/pronunciation?focus=${f.id}`}
                  className={cn(
                    "group flex flex-col rounded-2xl border bg-card p-4 shadow-sm transition-colors",
                    "hover:border-primary/40 hover:bg-accent/30",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                        {f.num}
                      </span>
                      <div>
                        <h3 className="font-medium">{f.title_vi}</h3>
                        <p className="text-xs text-muted-foreground">{f.ipa}</p>
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {f.description_vi}
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <StatusIcon className={cn("size-3.5", STATUS_COLORS[status])} />
                    <span className={cn("text-xs", STATUS_COLORS[status])}>
                      {STATUS_LABELS[status]}
                    </span>
                    {p && p.attempts > 0 && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {p.mastery}% · {p.attempts} lượt
                      </span>
                    )}
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}