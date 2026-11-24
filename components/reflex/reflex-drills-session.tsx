"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { Volume2, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import type { ReflexPhrase, SessionMode, ReflexGrade } from "@/lib/reflex-drills-types";
import { GRADE_LABELS, MODE_LABELS } from "@/lib/reflex-drills-types";
import { saveReflexDrillProgress } from "@/app/actions/reflex-drills";

function speakEnglish(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

const GRADE_STYLES: Record<ReflexGrade, string> = {
  got_it: "bg-green-500 text-white hover:bg-green-600",
  slow: "bg-amber-500 text-white hover:bg-amber-600",
  forgot: "bg-red-500 text-white hover:bg-red-600",
};

export function ReflexDrillsSession({
  phrases,
  mode,
  day,
  onComplete,
}: {
  phrases: ReflexPhrase[];
  mode: SessionMode;
  day: number;
  onComplete?: (results: { phraseId: string; grade: ReflexGrade }[]) => void;
}) {
  const [queue, setQueue] = useState(phrases);
  const [index, setIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(mode === "morning");
  const [results, setResults] = useState<{ phraseId: string; grade: ReflexGrade }[]>([]);
  const [done, setDone] = useState(false);
  const [uniqueCount, setUniqueCount] = useState(0);
  const requeueCount = useRef<Record<string, number>>({});
  const total = phrases.length;
  const uniqueCompleted = useRef<Set<string>>(new Set());

  const current = queue[index];

  const handleGrade = useCallback((grade: ReflexGrade) => {
    if (!current) return;

    uniqueCompleted.current.add(current.id);
    setUniqueCount(uniqueCompleted.current.size);
    const newResults = [...results, { phraseId: current.id, grade }];
    setResults(newResults);

    // Requeue slow/forgot after 3 other questions
    if (grade !== "got_it") {
      const count = requeueCount.current[current.id] ?? 0;
      if (count < 2) {
        requeueCount.current[current.id] = count + 1;
        const requeue = [...queue];
        const insertAt = Math.min(index + 3, requeue.length);
        requeue.splice(insertAt, 0, current);
        setQueue(requeue);
      }
    }

    const nextIndex = index + 1;
    const completedIds = Array.from(uniqueCompleted.current);
    const doneNow = nextIndex >= queue.length;

    void saveReflexDrillProgress(day, mode, completedIds, newResults, nextIndex, queue.length).catch(() => {});

    if (doneNow) {
      setDone(true);
      onComplete?.(newResults);
    } else {
      setIndex(nextIndex);
      setShowAnswer(mode === "morning");
    }
  }, [current, results, queue, index, mode, onComplete, day]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (done) return;
      if (e.key === " " || e.key === "Enter") {
        if (e.target instanceof HTMLElement && e.target.closest("button, input, textarea")) return;
        e.preventDefault();
        setShowAnswer((p) => !p);
      }
      if (e.key === "1") handleGrade("got_it");
      if (e.key === "2") handleGrade("slow");
      if (e.key === "3") handleGrade("forgot");
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [done, handleGrade]);

  if (done || !current) {
    const gotIt = results.filter((r) => r.grade === "got_it").length;
    const slow = results.filter((r) => r.grade === "slow").length;
    const forgot = results.filter((r) => r.grade === "forgot").length;
    const unique = new Set(results.map((r) => r.phraseId)).size;

    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto size-12 text-green-500" />
        <h2 className="mt-3 font-serif text-xl font-semibold">
          Hoàn thành {MODE_LABELS[mode]}!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {unique}/{total} câu khác nhau đã ôn
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-green-50 p-3">
            <p className="text-2xl font-bold text-green-600">{gotIt}</p>
            <p className="text-xs text-green-700">Bật ra được</p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <p className="text-2xl font-bold text-amber-600">{slow}</p>
            <p className="text-xs text-amber-700">Còn chậm</p>
          </div>
          <div className="rounded-xl bg-red-50 p-3">
            <p className="text-2xl font-bold text-red-600">{forgot}</p>
            <p className="text-xs text-red-700">Chưa nhớ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          {MODE_LABELS[mode]} · Câu {index + 1}/{queue.length}
          {mode === "review5" ? ` · ${uniqueCount}/${total} đã ôn` : ""}
        </span>
        <span className="text-xs text-muted-foreground">
          {current.situation_en}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-xs text-muted-foreground">Nói bằng tiếng Anh:</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-foreground">
          {current.vi_text}
        </h2>

        {showAnswer ? (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <p className="text-lg font-medium text-primary">{current.en_text}</p>
              <button
                type="button"
                onClick={() => speakEnglish(current.en_text)}
                className="rounded-lg bg-primary/10 p-2 text-primary hover:bg-primary/20"
                aria-label="Nghe mẫu"
              >
                <Volume2 className="size-4" />
              </button>
            </div>
            {mode === "morning" ? (
              <button
                type="button"
                onClick={() => setShowAnswer(false)}
                className="mx-auto flex items-center gap-1 text-xs text-muted-foreground underline"
              >
                <EyeOff className="size-3" />
                Ẩn mẫu để tự trả lời
              </button>
            ) : null}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowAnswer(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm font-medium text-foreground hover:bg-muted/70"
          >
            <Eye className="size-4" />
            Hiện đáp án
          </button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {(["got_it", "slow", "forgot"] as ReflexGrade[]).map((grade) => (
          <button
            key={grade}
            type="button"
            onClick={() => handleGrade(grade)}
            className={`rounded-xl px-2 py-3 text-sm font-semibold transition-colors ${GRADE_STYLES[grade]}`}
          >
            {GRADE_LABELS[grade]}
          </button>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Space để hiện/ẩn đáp án · 1/2/3 để chấm
      </p>
    </div>
  );
}