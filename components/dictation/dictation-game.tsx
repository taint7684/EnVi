"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, RotateCcw, Shuffle, Volume2 } from "lucide-react";

import { saveDictationAttempt } from "@/app/actions/dictation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { diffWords } from "diff";
import { DICTATION_LESSONS, type DictationLesson } from "@/lib/dictation-data";
import { speakEnglish, stopSpeaking } from "@/lib/speech";

const LEVELS = ["A2", "B1", "B2"] as const;
type Level = (typeof LEVELS)[number];

const SEEN_KEY = "envi:dictation:seen";

function loadSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    return new Set<string>(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    // ignore
  }
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildQueue(level: Level, seen: Set<string>): DictationLesson[] {
  const pool = DICTATION_LESSONS.filter((l) => l.level === level);
  const unseen = shuffle(pool.filter((l) => !seen.has(l.id)));
  const done = shuffle(pool.filter((l) => seen.has(l.id)));
  return [...unseen, ...done];
}

function DiffResult({ userText, expected }: { userText: string; expected: string }) {
  const diff = diffWords(userText.toLowerCase(), expected.toLowerCase());
  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <p className="mb-2 text-sm font-medium">Kết quả:</p>
      <div className="text-sm leading-relaxed">
        {diff.map((part, i) => (
          <span
            key={i}
            className={cn(
              "rounded px-1",
              part.added
                ? "bg-destructive/10 text-destructive"
                : part.removed
                  ? "bg-green-500/10 text-green-700"
                  : "text-foreground",
            )}
          >
            {part.value}
          </span>
        ))}
      </div>
    </div>
  );
}

export function DictationGame() {
  const [level, setLevel] = useState<Level>("A2");
  const [queue, setQueue] = useState<DictationLesson[]>([]);
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const current = queue[index];

  const rebuild = useCallback((lv: Level) => {
    const seen = loadSeen();
    setQueue(buildQueue(lv, seen));
    setIndex(0);
    setInput("");
    setShowResult(false);
    setSeenCount(seen.size);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    rebuild(level);
  }, [level, rebuild]);

  useEffect(() => {
    if (current) speakEnglish(current.transcript);
    return () => stopSpeaking();
  }, [current]);

  const isCorrect = current
    ? input.trim().toLowerCase() === current.transcript.trim().toLowerCase()
    : false;

  function markSeen(id: string) {
    const seen = loadSeen();
    if (!seen.has(id)) {
      seen.add(id);
      saveSeen(seen);
      setSeenCount(seen.size);
    }
  }

  function handleSubmit() {
    setShowResult(true);
    setSaveError(null);
    setTotal((t) => t + 1);
    const correct = isCorrect;
    if (correct) {
      setScore((s) => s + 1);
      if (current) markSeen(current.id);
    }
    void saveDictationAttempt({ userText: input, correct }).catch((cause) => {
      setSaveError(
        cause instanceof Error ? cause.message : "Có lỗi khi lưu kết quả.",
      );
    });
  }

  function handleNext() {
    const nextIndex = index + 1;
    if (nextIndex >= queue.length) {
      // Hết lượt hiện tại -> trộn lại, ưu tiên bài chưa làm
      rebuild(level);
    } else {
      setIndex(nextIndex);
    }
    setInput("");
    setShowResult(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleSkip() {
    setTotal((t) => t + 1);
    handleNext();
  }

  const poolSize = DICTATION_LESSONS.filter((l) => l.level === level).length;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 rounded-xl bg-muted p-1">
          {LEVELS.map((lv) => (
            <button
              key={lv}
              type="button"
              onClick={() => setLevel(lv)}
              className={cn(
                "rounded-lg px-4 py-1.5 text-sm font-medium transition-colors",
                level === lv
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {lv}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Shuffle className="size-3.5" />
          Ưu tiên bài chưa làm · {seenCount}/{poolSize} đã luyện
        </span>
      </div>

      {!current ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-muted-foreground">Đang chuẩn bị bài nghe...</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Bài {index + 1} · {current.level}
            </span>
            <span className="text-sm text-muted-foreground">
              Điểm: {score}/{total}
            </span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={() => speakEnglish(current.transcript)}
            >
              <Volume2 className="size-4" />
              Nghe
            </Button>
            <span className="text-xs text-muted-foreground">
              Nghe kỹ rồi gõ lại toàn bộ câu.
            </span>
          </div>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key !== "Enter") return;
              if (showResult) handleNext();
              else if (input.trim()) handleSubmit();
            }}
            disabled={showResult}
            placeholder="Gõ lại những gì bạn nghe được..."
            className="mb-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-base outline-none focus-visible:border-primary disabled:opacity-60"
          />

          {showResult ? (
            <DiffResult userText={input} expected={current.transcript} />
          ) : null}

          {saveError ? (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {saveError}
            </p>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {!showResult ? (
              <>
                <Button onClick={handleSubmit} disabled={!input.trim()}>
                  <Check className="size-4" />
                  Kiểm tra
                </Button>
                <Button variant="ghost" onClick={handleSkip}>
                  Bỏ qua
                </Button>
              </>
            ) : (
              <Button onClick={handleNext}>
                Bài tiếp theo
                <ArrowRight className="size-4" />
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => speakEnglish(current.transcript)}
            >
              <RotateCcw className="size-4" />
              Nghe lại
            </Button>
          </div>

          {showResult ? (
            <p
              className={cn(
                "mt-3 rounded-lg p-3 text-center text-sm font-medium",
                isCorrect
                  ? "bg-green-500/10 text-green-700"
                  : "bg-destructive/10 text-destructive",
              )}
            >
              {isCorrect ? "Chính xác! 🎉" : "Chưa chính xác, nghe lại và thử tiếp nhé."}
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}