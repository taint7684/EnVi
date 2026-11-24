"use client";

import { useState } from "react";
import { Sun, Sunset, Moon, RotateCcw, BookOpen } from "lucide-react";
import { ReflexDrillsSession } from "./reflex-drills-session";
import type { ReflexPhrase, SessionMode } from "@/lib/reflex-drills-types";
import { MODE_LABELS, getDays, getPhrasesByDay, getSessionPhrases } from "@/lib/reflex-drills-types";
import { Button } from "@/components/ui/button";

const MODE_ICONS: Record<SessionMode, typeof Sun> = {
  morning: Sun,
  noon: Sunset,
  evening: Moon,
  review5: RotateCcw,
};

const MODE_DESC: Record<SessionMode, string> = {
  morning: "Học 10 cặp mới · Nghe mẫu → Nói theo → Ẩn mẫu → Tự trả lời",
  noon: "Ôn 10 câu đã học sáng nay",
  evening: "Ôn lại 10 câu theo thứ tự trộn",
  review5: "Ôn tất cả câu đã học trong 5 ngày",
};

export function ReflexDrillsHome({ phrases }: { phrases: ReflexPhrase[] }) {
  const [mode, setMode] = useState<SessionMode | null>(null);
  const [day, setDay] = useState(1);
  const days = getDays(phrases);

  if (mode) {
    const sessionPhrases = getSessionPhrases(phrases, mode, day);
    return (
      <div className="py-4">
        <button
          type="button"
          onClick={() => setMode(null)}
          className="mb-4 text-sm text-muted-foreground hover:text-foreground"
        >
          ← Chọn chế độ
        </button>
        {sessionPhrases.length > 0 ? (
          <ReflexDrillsSession phrases={sessionPhrases} mode={mode} day={day} />
        ) : (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">Chưa có câu hỏi cho ngày này.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="py-4 space-y-6">
      <div className="text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Luyện phản xạ câu giao tiếp
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {days.length} ngày · {phrases.length} cặp câu hỏi–đáp
        </p>
      </div>

      <div className="mx-auto max-w-xl space-y-2">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Chọn ngày học
        </p>
        <div className="flex flex-wrap gap-2">
          {days.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDay(d)}
              className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                day === d
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-muted-foreground hover:bg-accent/40"
              }`}
            >
              Ngày {d} ({getPhrasesByDay(phrases, d).length} câu)
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
        {(["morning", "noon", "evening", "review5"] as SessionMode[]).map((m) => {
          const Icon = MODE_ICONS[m];
          return (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className="rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <Icon className="mb-2 size-6 text-primary" />
              <p className="font-medium text-foreground">{MODE_LABELS[m]}</p>
              <p className="mt-1 text-xs text-muted-foreground">{MODE_DESC[m]}</p>
            </button>
          );
        })}
      </div>

      <div className="mx-auto max-w-xl rounded-xl bg-blue-50 p-4 text-center">
        <p className="text-sm text-blue-800">
          Ba buổi là gợi ý · Bạn có thể gom hoặc làm bù · Không giới hạn thời gian
        </p>
      </div>
    </div>
  );
}