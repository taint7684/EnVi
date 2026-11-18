"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Lightbulb, RotateCcw, X } from "lucide-react";

import { reviewPhrase } from "@/app/actions/phrase-review";
import { Button } from "@/components/ui/button";
import { speakEnglish, stopSpeaking } from "@/lib/speech";
import { evaluateSpeech, type SpeechEval } from "@/lib/speech-eval";
import type { DuePhrase, ReviewGrade } from "@/lib/types";
import { cn } from "@/lib/utils";

const AudioButton = dynamic(() =>
  import("./audio-button").then((m) => m.AudioButton),
);
const MicButton = dynamic(() =>
  import("./mic-button").then((m) => m.MicButton),
);

type Mode = "shadowing" | "reflex" | "dictation";

const MODES: { id: Mode; label: string; short: string }[] = [
  { id: "shadowing", label: "Nghe & Nói đuổi", short: "Shadowing" },
  { id: "reflex", label: "Dịch & Nói", short: "Reflex" },
  { id: "dictation", label: "Điền từ", short: "Dictation" },
];

export function ReflexSession({ phrases }: { phrases: DuePhrase[] }) {
  const [queue] = useState<DuePhrase[]>(phrases);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("reflex");
  const [result, setResult] = useState<SpeechEval | null>(null);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const gradedIndex = useRef<number | null>(null);

  const current = queue[index];
  const done = index >= queue.length;

  // Tự động phát audio khi đổi câu (chỉ Shadowing & Dictation)
  useEffect(() => {
    if (!current) return;
    if (mode === "shadowing" || mode === "dictation") {
      speakEnglish(current.phrase.en_text, current.phrase.audio_url);
    }
    return () => stopSpeaking();
  }, [current, mode]);

  const record = useCallback(
    (grade: ReviewGrade) => {
      if (!current) return;
      if (gradedIndex.current === index) return;
      gradedIndex.current = index;
      void reviewPhrase(current.phrase.id, grade)
        .then(() => {
          window.dispatchEvent(new Event("envi:xp-refresh"));
        })
        .catch((cause) => {
          setError(
            cause instanceof Error ? cause.message : "Có lỗi khi lưu kết quả.",
          );
        });
    },
    [current, index],
  );

  const advance = useCallback(() => {
    setResult(null);
    setInput("");
    setAttempts(0);
    setError(null);
    setIndex((i) => i + 1);
    if (typeof document !== "undefined") {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    }
  }, []);

  function changeMode(next: Mode) {
    if (next === mode) return;
    setMode(next);
    setResult(null);
    setInput("");
    setAttempts(0);
    setError(null);
  }

  function handleSpeech(spoken: string) {
    if (!current) return;
    const evaluation = evaluateSpeech(current.phrase.en_text, spoken);
    setResult(evaluation);
    if (mode === "reflex") {
      if (evaluation.correct) {
        record(attempts === 0 ? "easy" : "good");
      } else {
        setAttempts((a) => a + 1);
      }
    }
  }

  function handleDictationSubmit() {
    if (!current || !input.trim()) return;
    const evaluation = evaluateSpeech(current.phrase.en_text, input);
    setResult(evaluation);
    if (evaluation.correct) {
      record(attempts === 0 ? "easy" : "good");
    } else {
      setAttempts((a) => a + 1);
    }
  }

  function handleNext() {
    if (mode === "shadowing") record("good");
    advance();
  }

  function handleSkip() {
    record("again");
    advance();
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          Hoàn thành phiên luyện phản xạ!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn đã luyện {queue.length} câu. Hẹn gặp lại ở lượt sau.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/reflex">
            <Button variant="outline">Luyện tiếp</Button>
          </Link>
          <Link href="/dashboard">
            <Button>Về tổng quan</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { phrase } = current;
  const correct = result?.correct ?? false;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Câu {index + 1}/{queue.length}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          {phrase.topic}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(index / queue.length) * 100}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-muted p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => changeMode(m.id)}
            className={cn(
              "rounded-xl px-2 py-2 text-sm font-medium transition-colors",
              mode === m.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="hidden sm:inline">{m.label}</span>
            <span className="sm:hidden">{m.short}</span>
          </button>
        ))}
      </div>

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
        {mode === "reflex" ? (
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Dịch câu này sang tiếng Anh rồi nói
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {phrase.vi_text}
            </h2>
          </div>
        ) : (
          <div className="text-center">
            <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {phrase.en_text}
            </h2>
            <div className="mt-4 flex justify-center">
              <AudioButton
                text={phrase.en_text}
                audioUrl={phrase.audio_url}
                label="Nghe"
              />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {mode === "shadowing"
                ? "Nghe rồi nói theo (shadowing)"
                : "Nghe và gõ lại câu tiếng Anh"}
            </p>
          </div>
        )}

        <div className="mt-8">
          {mode === "dictation" ? (
            <div className="mx-auto max-w-md">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  if (correct) handleNext();
                  else handleDictationSubmit();
                }}
                disabled={correct}
                placeholder="Gõ lại câu tiếng Anh..."
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-center text-lg outline-none focus-visible:border-primary disabled:opacity-60"
              />
              {!correct ? (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={handleDictationSubmit}
                    disabled={!input.trim()}
                  >
                    <Check className="size-4" />
                    Kiểm tra
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="flex justify-center">
              <MicButton onTranscript={handleSpeech} onError={setError} />
            </div>
          )}
        </div>

        {result ? (
          <div
            className={cn(
              "mt-6 rounded-2xl p-4 text-center",
              correct
                ? "bg-green-500/10 text-green-700"
                : "bg-red-500/10 text-red-700",
            )}
          >
            <p className="flex items-center justify-center gap-2 text-lg font-semibold">
              {correct ? (
                <>
                  <Check className="size-5" /> Chính xác! +15 XP
                </>
              ) : (
                <>
                  <X className="size-5" /> Chưa đúng, thử lại nhé
                </>
              )}
            </p>

            {!correct ? (
              <div className="mt-2 text-sm">
                <p className="flex items-center justify-center gap-1 text-muted-foreground">
                  <Lightbulb className="size-4" /> Đáp án đúng:
                </p>
                <p className="mt-1 text-base font-medium text-foreground">
                  {phrase.en_text}
                </p>
                <div className="mt-2 flex justify-center">
                  <AudioButton
                    text={phrase.en_text}
                    audioUrl={phrase.audio_url}
                    label="Nghe đáp án"
                  />
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-center gap-3">
          {correct ? (
            <Button onClick={handleNext} size="lg">
              Tiếp theo
              <ArrowRight className="size-4" />
            </Button>
          ) : mode === "shadowing" ? (
            <Button onClick={handleNext} size="lg">
              {attempts > 0 ? "Tiếp theo" : "Bỏ qua câu này"}
              <ArrowRight className="size-4" />
            </Button>
          ) : result && !correct ? (
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setResult(null);
                  setInput("");
                }}
                variant="outline"
              >
                <RotateCcw className="size-4" />
                Nói lại
              </Button>
              <Button onClick={handleSkip} variant="ghost">
                Bỏ qua
                <ArrowRight className="size-4" />
              </Button>
            </div>
          ) : null}

          {mode === "reflex" && !result ? (
            <Button
              onClick={() => speakEnglish(phrase.en_text, phrase.audio_url)}
              variant="ghost"
            >
              <Lightbulb className="size-4" />
              Nghe gợi ý
            </Button>
          ) : null}
        </div>

        {mode === "dictation" && !result ? (
          <div className="mt-3 flex justify-center">
            <AudioButton
              text={phrase.en_text}
              audioUrl={phrase.audio_url}
              label="Phát lại"
            />
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Mẹo: nói tự nhiên cả câu, không dịch từng từ trong đầu.
      </p>
    </div>
  );
}