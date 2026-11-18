"use client";

import { useState } from "react";
import { Check, RotateCcw, Trophy, X } from "lucide-react";

import {
  saveProgressTest,
  type ProgressTestAnswer,
} from "@/app/actions/progress-test";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ProgressTestQuestion = {
  key: string;
  topicId: string;
  topicName: string;
  kind: "mcq" | "fill";
  prompt: string;
  options?: string[];
  answer: number | string;
};

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isCorrect(q: ProgressTestQuestion, chosen: string | undefined) {
  if (chosen === undefined || chosen === "") return false;
  return q.kind === "mcq"
    ? Number(chosen) === q.answer
    : norm(chosen) === norm(String(q.answer));
}

export function ProgressTest({ questions }: { questions: ProgressTestQuestion[] }) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [xpEarned, setXpEarned] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const total = questions.length;
  const answeredCount = questions.filter((q) => answers[q.key] !== undefined && answers[q.key] !== "").length;
  const correctCount = questions.filter((q) => isCorrect(q, answers[q.key])).length;

  function reset() {
    setAnswers({});
    setSubmitted(false);
    setSaving(false);
    setXpEarned(null);
    setError(null);
  }

  async function submit() {
    setSaving(true);
    setError(null);
    const details: ProgressTestAnswer[] = questions.map((q) => ({
      key: q.key,
      topicId: q.topicId,
      kind: q.kind,
      correct: isCorrect(q, answers[q.key]),
    }));
    try {
      const res = await saveProgressTest({
        score: correctCount,
        total,
        details,
      });
      setXpEarned(res.xpEarned);
      window.dispatchEvent(new Event("envi:xp-refresh"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Có lỗi khi lưu kết quả.");
    } finally {
      setSubmitted(true);
      setSaving(false);
    }
  }

  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  if (submitted) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-3xl border border-border bg-card p-8 text-center shadow-sm">
          <Trophy className="mx-auto size-10 text-amber-500" />
          <h2 className="mt-3 font-serif text-2xl font-semibold text-foreground">
            Kết quả bài kiểm tra
          </h2>
          <p className="mt-2 text-4xl font-bold text-foreground">
            {correctCount}/{total}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Đạt {percent}%{xpEarned !== null ? ` · +${xpEarned} XP` : ""}
          </p>
          {error ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4" />
              Làm lại
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          {questions.map((q, idx) => {
            const ok = isCorrect(q, answers[q.key]);
            return (
              <div
                key={q.key}
                className={cn(
                  "flex items-start gap-2 rounded-lg border p-3 text-sm",
                  ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50",
                )}
              >
                {ok ? (
                  <Check className="mt-0.5 size-4 shrink-0 text-green-600" />
                ) : (
                  <X className="mt-0.5 size-4 shrink-0 text-red-600" />
                )}
                <div>
                  <p className="font-medium">
                    {idx + 1}. {q.prompt}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Đáp án:{" "}
                    {q.kind === "mcq"
                      ? q.options?.[q.answer as number]
                      : String(q.answer)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Đã trả lời {answeredCount}/{total}
        </span>
        <span>Đúng {correctCount}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(answeredCount / total) * 100}%` }}
        />
      </div>

      <div className="mt-5 space-y-4">
        {questions.map((q, idx) => {
          const chosen = answers[q.key];
          return (
            <div
              key={q.key}
              className="rounded-lg border border-border bg-card p-4"
            >
              <p className="mb-2 text-sm font-medium">
                {idx + 1}. {q.prompt}
              </p>
              <p className="mb-2 text-xs text-muted-foreground">
                {q.topicName}
              </p>

              {q.kind === "mcq" ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {q.options?.map((opt, oi) => {
                    const selected = chosen === String(oi);
                    return (
                      <button
                        key={oi}
                        type="button"
                        onClick={() =>
                          setAnswers((a) => ({ ...a, [q.key]: String(oi) }))
                        }
                        className={cn(
                          "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          selected
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80",
                        )}
                      >
                        {String.fromCharCode(65 + oi)}. {opt}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <input
                  value={chosen ?? ""}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                  }
                  placeholder="Điền từ còn thiếu..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary"
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">
          {answeredCount < total
            ? `Còn ${total - answeredCount} câu chưa trả lời`
            : "Bạn đã trả lời hết. Nộp bài để xem kết quả."}
        </span>
        <Button onClick={submit} disabled={saving || answeredCount === 0} size="lg">
          {saving ? "Đang chấm..." : "Nộp bài"}
        </Button>
      </div>
    </div>
  );
}