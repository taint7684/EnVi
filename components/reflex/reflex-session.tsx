"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { ArrowRight, Check, Lightbulb, RotateCcw, X } from "lucide-react";

import { reviewPhrase } from "@/app/actions/phrase-review";
import { Button } from "@/components/ui/button";
import { speakEnglish, stopSpeaking } from "@/lib/speech";
import { evaluateSpeech, evaluateReflexSpeech, getReflexLevel, type SpeechEval } from "@/lib/speech-eval";
import { evaluateMeaning, recordReflexResult } from "@/lib/reflex/judge";
import type { ReflexMeaning } from "@/lib/reflex/schema";
import type { DuePhrase, ReviewGrade } from "@/lib/types";
import { cn } from "@/lib/utils";

const AudioButton = dynamic(() =>
  import("./audio-button").then((m) => m.AudioButton),
);
const MicButton = dynamic(() =>
  import("./mic-button").then((m) => m.MicButton),
);

type Mode = "pure" | "shadowing" | "reflex" | "dictation";

const MODES: { id: Mode; label: string; short: string }[] = [
  { id: "pure", label: "Phản xạ thuần", short: "Thuần" },
  { id: "shadowing", label: "Nghe & Nói đuổi", short: "Shadowing" },
  { id: "reflex", label: "Dịch & Nói", short: "Reflex" },
  { id: "dictation", label: "Điền từ", short: "Dictation" },
];

const LEVEL_LABEL: Record<string, string> = {
  L1: "L1 - Cơ bản",
  L2: "L2 - Trung cấp",
  L3: "L3 - Nâng cao",
};

export function ReflexSession({
  phrases,
  sessionMode = "learn",
  level = "all",
}: {
  phrases: DuePhrase[];
  sessionMode?: "learn" | "review";
  level?: string;
}) {
  const [queue] = useState<DuePhrase[]>(phrases);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState<Mode>("pure");
  const [result, setResult] = useState<SpeechEval | null>(null);
  const [judgment, setJudgment] = useState<{
    meaning: ReflexMeaning;
    aiUsed: boolean;
  } | null>(null);
  const [input, setInput] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [pureRevealed, setPureRevealed] = useState(false);
  const [pureTranscript, setPureTranscript] = useState("");
  const gradedIndex = useRef<number | null>(null);
  const startRef = useRef<number>(0);

  const current = queue[index];
  const done = index >= queue.length;

  useEffect(() => {
    if (!current) return;
    startRef.current = performance.now();
    if (mode === "pure") {
      const q = current.phrase.situation_en || current.phrase.en_text;
      speakEnglish(q, current.phrase.audio_url);
    } else if (mode === "shadowing" || mode === "dictation") {
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
    setJudgment(null);
    setLatencyMs(null);
    setInput("");
    setAttempts(0);
    setError(null);
    setPureRevealed(false);
    setPureTranscript("");
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
    setJudgment(null);
    setLatencyMs(null);
    setInput("");
    setAttempts(0);
    setError(null);
    setPureRevealed(false);
    setPureTranscript("");
  }

  async function handleSpeech(spoken: string) {
    if (!current) return;
    const latency = Math.round(performance.now() - startRef.current);
    setLatencyMs(latency);

    // Pure reflex: capture what the learner said, reveal answer, self-grade.
    if (mode === "pure") {
      setPureTranscript(spoken);
      setPureRevealed(true);
      return;
    }

    // 1. Cham lexical tren en_text + en_alternatives
    const reflexEval = evaluateReflexSpeech({
      enText: current.phrase.en_text,
      alternatives: current.phrase.en_alternatives,
      keywords: current.phrase.keywords,
      spoken,
    });
    const speechEval: SpeechEval = {
      correct: reflexEval.correct,
      ratio: reflexEval.ratio,
      spoken,
      expected: current.phrase.en_text,
    };
    setResult(speechEval);

    // 2. Neu lexical dat -> correct ngay
    if (reflexEval.correct) {
      await recordReflexResult({
        phraseId: current.phrase.id,
        grade: attempts === 0 ? "easy" : "good",
        meaningScore: 1,
        latencyMs: latency,
      });
      window.dispatchEvent(new Event("envi:xp-refresh"));
      return;
    }

    // 3. Neu chua dat nhung du keywords -> AI judge "cung nghia?"
    if (reflexEval.needsAiJudge) {
      try {
        const judgment = await evaluateMeaning({
          phraseId: current.phrase.id,
          viText: current.phrase.vi_text,
          enText: current.phrase.en_text,
          spoken,
        });
        setJudgment(judgment);
        if (judgment.meaning.meaningCorrect) {
          await recordReflexResult({
            phraseId: current.phrase.id,
            grade: attempts === 0 ? "easy" : "good",
            meaningScore: 1,
            latencyMs: latency,
          });
          window.dispatchEvent(new Event("envi:xp-refresh"));
          return;
        }
      } catch {
        // AI unavailable, fall through to incorrect
      }
    }

    // 4. Khong dat
    setAttempts((a) => a + 1);
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

  function handlePureGrade(grade: "got_it" | "slow" | "forgot") {
    const mapped: ReviewGrade =
      grade === "got_it" ? "good" : grade === "slow" ? "hard" : "again";
    record(mapped);
    advance();
  }

  function handlePureRetry() {
    setPureRevealed(false);
    setPureTranscript("");
    setAttempts((a) => a + 1);
    startRef.current = performance.now();
    const q = current?.phrase.situation_en || current?.phrase.en_text;
    if (q) speakEnglish(q, current?.phrase.audio_url);
  }

  if (done) {
    const reviewHref = (() => {
      const params = new URLSearchParams();
      if (level !== "all") params.set("level", level);
      params.set("mode", "review");
      return `/reflex?${params.toString()}`;
    })();
    const learnHref = (() => {
      const params = new URLSearchParams();
      if (level !== "all") params.set("level", level);
      const qs = params.toString();
      return qs ? `/reflex?${qs}` : "/reflex";
    })();

    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <p className="text-4xl">{sessionMode === "review" ? "✅" : "🎉"}</p>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          {sessionMode === "review"
            ? "Hoàn thành phiên ôn tập!"
            : "Hoàn thành phiên luyện phản xạ!"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {sessionMode === "review"
            ? `Bạn đã ôn ${queue.length} câu. Có thể luyện tiếp không giới hạn.`
            : `Bạn đã luyện ${queue.length} câu. Mỗi ngày học 10 câu mới — muốn luyện thêm thì chuyển sang ôn tập.`}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {sessionMode === "learn" ? (
            <Link href={reviewHref}>
              <Button>Ôn tập thêm</Button>
            </Link>
          ) : (
            <Link href={reviewHref}>
              <Button variant="outline">Luyện tiếp</Button>
            </Link>
          )}
          <Link href={learnHref}>
            <Button variant={sessionMode === "review" ? "outline" : "ghost"}>
              {sessionMode === "review" ? "Về chế độ học" : "Luyện tiếp"}
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="ghost">Về tổng quan</Button>
          </Link>
        </div>
      </div>
    );
  }

  const { phrase } = current;
  const correct = result?.correct ?? false;
  const meaningCorrect = judgment?.meaning.meaningCorrect ?? false;
  const reflexLevel = getReflexLevel(phrase.difficulty);
  const levelLabel =
    LEVEL_LABEL[judgment?.meaning.level ?? phrase.level ?? reflexLevel] ?? reflexLevel;

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {sessionMode === "review" ? "Ôn tập · " : ""}Câu {index + 1}/{queue.length}
        </span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          {phrase.topic}
        </span>
        {latencyMs != null && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {latencyMs} ms
          </span>
        )}
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(index / queue.length) * 100}%` }}
        />
      </div>

      <div className="mt-5 grid grid-cols-4 gap-1 rounded-2xl bg-muted p-1">
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
        {mode === "pure" ? (
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Phản xạ thuần · Nghe rồi nói ngay, không nhìn chữ
            </p>
            <div className="mt-4 flex justify-center">
              <AudioButton
                text={phrase.situation_en || phrase.en_text}
                audioUrl={phrase.audio_url}
                label="Nghe câu hỏi"
              />
            </div>

            {!pureRevealed ? (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  Nghe câu hỏi rồi nói câu trả lời bạn đã học. Không nhìn chữ.
                </p>
                <div className="mt-6 flex justify-center">
                  <MicButton onTranscript={handleSpeech} onError={setError} />
                </div>
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => setPureRevealed(true)}
                    variant="ghost"
                  >
                    <Lightbulb className="size-4" />
                    Xem đáp án
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="mt-5 rounded-2xl bg-muted p-4 text-left">
                  <p className="text-xs font-semibold text-muted-foreground">
                    Câu mẫu (transcript):
                  </p>
                  <p className="mt-1 text-lg font-medium text-foreground">
                    {phrase.en_text}
                  </p>
                  {phrase.vi_text ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {phrase.vi_text}
                    </p>
                  ) : null}
                  <div className="mt-2 flex justify-start">
                    <AudioButton
                      text={phrase.en_text}
                      audioUrl={phrase.audio_url}
                      label="Nghe đáp án"
                    />
                  </div>
                </div>

                {pureTranscript ? (
                  <div className="mt-3 rounded-2xl bg-sky-50 p-3 text-left">
                    <p className="text-xs font-semibold text-sky-700">Bạn đã nói:</p>
                    <p className="mt-1 text-sm text-sky-900">{pureTranscript}</p>
                  </div>
                ) : null}

                <div className="mt-5">
                  <p className="text-sm font-medium text-foreground">Tự chấm:</p>
                  <div className="mt-2 flex flex-wrap justify-center gap-2">
                    <Button onClick={() => handlePureGrade("got_it")} size="lg">
                      Bật ra được
                    </Button>
                    <Button
                      onClick={() => handlePureGrade("slow")}
                      variant="outline"
                      size="lg"
                    >
                      Còn chậm
                    </Button>
                    <Button
                      onClick={() => handlePureGrade("forgot")}
                      variant="outline"
                      size="lg"
                    >
                      Chưa nhớ
                    </Button>
                  </div>
                  <div className="mt-3 flex justify-center">
                    <Button onClick={handlePureRetry} variant="ghost">
                      <RotateCcw className="size-4" />
                      Nói lại
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <>
        {mode === "reflex" ? (
          <div className="text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {reflexLevel === "L1"
                ? `Dịch câu này sang tiếng Anh rồi nói · ${levelLabel}`
                : reflexLevel === "L2"
                  ? `Đọc tình huống rồi trả lời bằng tiếng Anh · ${levelLabel}`
                  : `Trả lời câu hỏi bằng tiếng Anh · ${levelLabel}`}
            </p>
            <h2 className="mt-3 font-serif text-3xl font-semibold text-foreground sm:text-4xl">
              {reflexLevel === "L1"
                ? phrase.vi_text
                : phrase.situation_en || phrase.vi_text}
            </h2>
            {reflexLevel === "L1" && phrase.en_alternatives && phrase.en_alternatives.length > 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                (Chấp nhận nhiều cách nói khác nhau)
              </p>
            ) : null}
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
                  <Check className="size-5" />
                  {meaningCorrect
                    ? "Ý nghĩa đúng! +15 XP"
                    : "Câu đúng, ý nghĩa cần refine"}
                </>
              ) : (
                <>
                  <X className="size-5" /> Chưa đúng, thử lại nhé
                </>
              )}
            </p>

            {judgment?.meaning.explanationVi && (
              <p className="mt-2 text-sm text-muted-foreground italic">
                {judgment.meaning.explanationVi}
              </p>
            )}

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

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
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
            <>
              <Button
                onClick={() => {
                  setResult(null);
                  setJudgment(null);
                  setLatencyMs(null);
                  setInput("");
                }}
                variant="outline"
              >
                <RotateCcw className="size-4" />
                Nói lại
              </Button>
              <Button onClick={handleSkip}>
                Bỏ qua, xem câu tiếp
                <ArrowRight className="size-4" />
              </Button>
            </>
          ) : (
            <Button onClick={handleSkip} variant="outline">
              Bỏ qua câu này
              <ArrowRight className="size-4" />
            </Button>
          )}

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
          </>
        )}
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Mẹo: nói tự nhiên cả câu, không dịch từng từ trong đầu.
      </p>
    </div>
  );
}
