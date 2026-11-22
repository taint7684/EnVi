"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getGrammarExercises } from "@/lib/grammar-exercises-data";
import { saveGrammarAttempt } from "@/lib/grammar/server";

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed * 9301 + 49297;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

type Mode = "mcq" | "fill";

export function GrammarPractice({ topicId }: { topicId: string }) {
  const exercise = getGrammarExercises(topicId);
  const [mode, setMode] = useState<Mode>("mcq");
  const [seed, setSeed] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const savedRef = useRef<Set<string>>(new Set());

  const mcqSet = useMemo(
    () => (exercise ? seededShuffle(exercise.mcq, seed).slice(0, 10) : []),
    [exercise, seed],
  );
  const fillSet = useMemo(
    () => (exercise ? seededShuffle(exercise.fill, seed).slice(0, 10) : []),
    [exercise, seed],
  );

  useEffect(() => {
    const list = mode === "mcq" ? mcqSet : fillSet;
    for (const q of list) {
      if (!checked[q.id]) continue;
      const key = `${topicId}:${mode}:${q.id}`;
      if (savedRef.current.has(key)) continue;
      const a = answers[q.id];
      if (a === undefined || a === "") continue;
      const isCorrect =
        mode === "mcq"
          ? Number(a) === (q as { answer: number }).answer
          : norm(a) === norm((q as { answer: string }).answer);
      savedRef.current.add(key);
      void saveGrammarAttempt({
        topicId,
        questionId: String(q.id),
        correct: isCorrect,
        answer: a,
      }).catch(() => {});
    }
  }, [checked, answers, mode, mcqSet, fillSet, topicId]);

  if (!exercise) return null;

  const questions = mode === "mcq" ? mcqSet : fillSet;
  const total = questions.length;
  const correctCount = questions.filter((q) => {
    if (!checked[q.id]) return false;
    const a = answers[q.id];
    if (a === undefined || a === "") return false;
    return mode === "mcq"
      ? Number(a) === (q as { answer: number }).answer
      : norm(a) === norm((q as { answer: string }).answer);
  }).length;
  const answeredAll = questions.every((q) => checked[q.id]);

  function newRound() {
    setSeed((s) => s + 1);
    setAnswers({});
    setChecked({});
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-sm font-semibold">Practice Hub</h4>
        <div className="flex gap-1 rounded-lg bg-card p-0.5">
          {(["mcq", "fill"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setAnswers({});
                setChecked({});
              }}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-medium transition-colors",
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground",
              )}
            >
              {m === "mcq" ? "Trắc nghiệm" : "Điền từ"}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((q, idx) => {
          const chosen = answers[q.id];
          const isChecked = checked[q.id];
          const correct =
            mode === "mcq"
              ? Number(chosen) === (q as { answer: number }).answer
              : norm(chosen ?? "") === norm((q as { answer: string }).answer);
          return (
            <div key={q.id} className="rounded-lg border border-border bg-card p-3">
              <p className="mb-2 text-sm font-medium">
                {idx + 1}. {q.question}
              </p>

              {mode === "mcq" ? (
                <div className="grid grid-cols-2 gap-2">
                  {(q as { options: string[] }).options.map((opt, oi) => {
                    const selected = chosen === String(oi);
                    const showCorrect = isChecked && oi === (q as { answer: number }).answer;
                    const showWrong = isChecked && selected && !correct;
                    return (
                      <button
                        key={oi}
                        type="button"
                        disabled={isChecked}
                        onClick={() => setAnswers((a) => ({ ...a, [q.id]: String(oi) }))}
                        className={cn(
                          "rounded-lg px-3 py-2 text-left text-sm transition-colors",
                          showCorrect
                            ? "bg-green-100 text-green-800"
                            : showWrong
                              ? "bg-red-100 text-red-800"
                              : selected
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
                <div className="flex items-center gap-2">
                  <input
                    value={chosen ?? ""}
                    onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                    disabled={isChecked}
                    placeholder="Điền từ còn thiếu..."
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary disabled:opacity-60"
                  />
                  {!isChecked && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!chosen?.trim()}
                      onClick={() => setChecked((c) => ({ ...c, [q.id]: true }))}
                    >
                      <Check className="size-4" />
                    </Button>
                  )}
                </div>
              )}

              {isChecked ? (
                <p
                  className={cn(
                    "mt-2 text-xs font-medium",
                    correct ? "text-green-600" : "text-red-600",
                  )}
                >
                  {correct
                    ? "Chính xác!"
                    : `Chưa đúng. Đáp án: ${
                        mode === "mcq"
                          ? (q as { options: string[] }).options[(q as { answer: number }).answer]
                          : (q as { answer: string }).answer
                      }`}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm text-muted-foreground">
          {checkedCount(checked)}/{total} đã kiểm tra · Đúng {correctCount}/{total}
        </span>
        <div className="flex gap-2">
          {!answeredAll && questions.some((q) => answers[q.id] !== undefined && !checked[q.id]) ? (
            <Button
              size="sm"
              onClick={() =>
                setChecked((c) => {
                  const next = { ...c };
                  for (const q of questions) {
                    if (answers[q.id] !== undefined) next[q.id] = true;
                  }
                  return next;
                })
              }
            >
              <Check className="size-4" />
              Chấm tất cả
            </Button>
          ) : null}
          <Button size="sm" variant="outline" onClick={newRound}>
            <RotateCcw className="size-4" />
            10 câu mới
          </Button>
        </div>
      </div>
    </div>
  );
}

function checkedCount(checked: Record<number, boolean>): number {
  return Object.values(checked).filter(Boolean).length;
}