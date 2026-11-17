"use client";

import { useState } from "react";
import { MessageSquare, Sparkles } from "lucide-react";

const SUGGESTED_QUESTIONS = [
  "How do I use the present perfect tense?",
  "What's the difference between 'make' and 'do'?",
  "Can you explain conditionals with examples?",
  "How can I improve my pronunciation?",
  "What are some common phrasal verbs?",
];

export function EmptyChat({ onSelect }: { onSelect: (q: string) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="flex h-[400px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
        <MessageSquare className="size-6 text-primary" />
      </div>
      <h3 className="mt-4 font-serif text-lg font-semibold">
        Bắt đầu cuộc trò chuyện
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Đặt câu hỏi về tiếng Anh hoặc chọn gợi ý bên dưới:
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {SUGGESTED_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              hovered === i
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background hover:border-primary/40"
            }`}
          >
            <Sparkles className="mr-1 inline size-3" />
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}