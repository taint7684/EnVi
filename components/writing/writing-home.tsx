"use client";

import { useState } from "react";
import { WritingEditor } from "./writing-editor";
import {
  WRITING_PROMPTS,
  WRITING_LEVEL_LABELS,
  type WritingLevel,
  type WritingPrompt,
} from "@/data/writing-prompts";
import type { WritingDraftRow } from "@/lib/types";

type Props = {
  drafts: WritingDraftRow[];
  userId: string;
};

export function WritingHome({ drafts, userId }: Props) {
  const [level, setLevel] = useState<WritingLevel>("A2");
  const [activePrompt, setActivePrompt] = useState<WritingPrompt | null>(null);

  const prompts = WRITING_PROMPTS.filter((p) => p.level === level);

  function draftFor(promptId: string): WritingDraftRow | null {
    return (
      drafts.find(
        (d) => d.prompt_id === promptId && d.level === level,
      ) ?? null
    );
  }

  if (activePrompt) {
    return (
      <WritingEditor
        key={activePrompt.id}
        prompt={activePrompt}
        draft={draftFor(activePrompt.id)}
        userId={userId}
        onBack={() => setActivePrompt(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Writing Coach
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Viết email, báo cáo, tóm tắt — nhận góp ý từ AI
        </p>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Cấp độ
        </span>
        <div className="flex rounded-lg border border-border">
          {(Object.keys(WRITING_LEVEL_LABELS) as WritingLevel[]).map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setLevel(lv)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                level === lv
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {WRITING_LEVEL_LABELS[lv]}
            </button>
          ))}
        </div>
      </div>

      <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
        {prompts.length} đề viết — {WRITING_LEVEL_LABELS[level]}
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        {prompts.map((p) => {
          const draft = draftFor(p.id);
          const status = draft?.completed
            ? "done"
            : draft?.feedback_json
              ? "feedback"
              : draft?.draft_text
                ? "draft"
                : "new";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setActivePrompt(p)}
              className="group flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40"
            >
              <div className="flex w-full items-start justify-between gap-2">
                <span className="font-medium text-foreground">{p.title}</span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    status === "done"
                      ? "bg-green-100 text-green-700"
                      : status === "feedback"
                        ? "bg-blue-100 text-blue-700"
                        : status === "draft"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {status === "done"
                    ? "✓ xong"
                    : status === "feedback"
                      ? "có góp ý"
                      : status === "draft"
                        ? "nháp"
                        : "mới"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {p.situation_vi}
              </p>
              <span className="text-[11px] text-muted-foreground">
                {p.category === "it-ba" ? "💼 IT/BA" : "🏠 Đời sống"} · ~
                {p.minWords} từ
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}