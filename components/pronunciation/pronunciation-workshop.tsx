"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/use-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { scoreIntelligibility, type WordResult } from "@/lib/speech/scoring";
import { savePronunciationAttempt } from "@/lib/pronunciation/server";
import type {
  PronunciationFocus,
  MinimalPair,
  PronunciationProgress,
} from "@/lib/pronunciation/types";
import { STEP_LABELS } from "@/lib/pronunciation/types";
import { cn } from "@/lib/utils";

async function transcribe(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "pron.webm");
  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) return "";
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}

type Props = {
  focus: PronunciationFocus;
  progress?: PronunciationProgress;
};

type StepId = 1 | 2 | 3 | 4 | 5;

export function PronunciationWorkshop({ focus, progress }: Props) {
  const [step, setStep] = useState<StepId>(1);
  const [stepComplete, setStepComplete] = useState<Record<number, boolean>>({});

  function goToStep(s: StepId) {
    setStep(s);
  }

  function markComplete(s: StepId) {
    setStepComplete((prev) => ({ ...prev, [s]: true }));
  }

  const allDone = stepComplete[5] === true;

  return (
    <div className="space-y-5">
      {/* Progress bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {STEP_LABELS.map((s) => (
          <button
            key={s.id}
            onClick={() => goToStep(s.id as StepId)}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap",
              step === s.id
                ? "bg-primary text-primary-foreground"
                : stepComplete[s.id]
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {stepComplete[s.id] && step !== s.id ? (
              <Check className="size-3" />
            ) : (
              <span className="flex size-4 items-center justify-center rounded-full border border-current text-[10px]">
                {s.id}
              </span>
            )}
            {s.title}
          </button>
        ))}
      </div>

      {progress && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
          <span>
            Tiến độ: <strong>{progress.mastery}%</strong> · {progress.attempts} lượt luyện
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-medium",
              progress.status === "mastered" && "bg-emerald-100 text-emerald-700",
              progress.status === "weak" && "bg-red-100 text-red-700",
              progress.status === "practicing" && "bg-amber-100 text-amber-700",
              progress.status === "new" && "bg-muted text-muted-foreground",
            )}
          >
            {progress.status === "mastered" && "Đã thành thạo"}
            {progress.status === "weak" && "Cần luyện thêm"}
            {progress.status === "practicing" && "Đang luyện"}
            {progress.status === "new" && "Mới"}
          </span>
        </div>
      )}

      {step === 1 && (
        <Step1Learn focus={focus} onComplete={() => markComplete(1)} onNext={() => goToStep(2)} />
      )}
      {step === 2 && (
        <Step2MinimalPairs focus={focus} onComplete={() => markComplete(2)} onNext={() => goToStep(3)} />
      )}
      {step === 3 && (
        <Step3WordsPhrases focus={focus} onComplete={() => markComplete(3)} onNext={() => goToStep(4)} />
      )}
      {step === 4 && (
        <Step4Sentences focus={focus} onComplete={() => markComplete(4)} onNext={() => goToStep(5)} />
      )}
      {step === 5 && (
        <Step5QuickTest focus={focus} onComplete={() => markComplete(5)} onFinish={allDone} />
      )}
    </div>
  );
}

/* ─── Step 1: Học âm ─── */
function Step1Learn({
  focus,
  onComplete,
  onNext,
}: {
  focus: PronunciationFocus;
  onComplete: () => void;
  onNext: () => void;
}) {
  const { speak } = useSpeechSynthesis();
  const [played, setPlayed] = useState(false);

  function handleListen() {
    speak(focus.words.slice(0, 3).join(", "));
    setPlayed(true);
    onComplete();
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold">
            {focus.ipa} — {focus.title_vi}
          </h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            {focus.category === "consonant" && "Phụ âm"}
            {focus.category === "vowel" && "Nguyên âm"}
            {focus.category === "suprasegmental" && "Trọng âm"}
            {focus.category === "connected_speech" && "Nối âm"}
          </span>
        </div>
        <p className="text-sm text-muted-foreground">{focus.description_vi}</p>
      </div>

      {/* Mouth guide */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h4 className="mb-3 font-medium">Hướng dẫn đặt miệng</h4>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Lưỡi</p>
            <p className="mt-1 text-sm">{focus.mouth_guide.tongue}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Môi</p>
            <p className="mt-1 text-sm">{focus.mouth_guide.lips}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Cổ họng</p>
            <p className="mt-1 text-sm">{focus.mouth_guide.throat}</p>
          </div>
          <div className="rounded-xl bg-muted/50 p-3">
            <p className="text-xs font-medium text-muted-foreground">Luồng hơi</p>
            <p className="mt-1 text-sm">{focus.mouth_guide.airflow}</p>
          </div>
        </div>
      </div>

      {/* Tip */}
      <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
        <strong>Mẹo:</strong> {focus.tip_vi}
      </div>

      {/* Example words */}
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h4 className="mb-3 font-medium">Từ ví dụ</h4>
        <div className="flex flex-wrap gap-2">
          {focus.words.map((w, i) => (
            <button
              key={i}
              onClick={() => speak(w)}
              className="rounded-full border bg-background px-3 py-1.5 text-sm hover:border-primary hover:bg-primary/5"
            >
              <Volume2 className="mr-1 inline size-3 text-primary" />
              {w}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleListen} variant={played ? "outline" : "default"}>
          <Volume2 className="mr-1 size-4" />
          {played ? "Nghe lại" : "Nghe phát âm mẫu"}
        </Button>
        {played && (
          <Button onClick={onNext}>
            Tiếp: Cặp từ tối thiểu
            <ArrowRight className="ml-1 size-4" />
          </Button>
        )}
      </div>
    </div>
  );
}

/* ─── Step 2: Minimal pairs ─── */
function Step2MinimalPairs({
  focus,
  onComplete,
  onNext,
}: {
  focus: PronunciationFocus;
  onComplete: () => void;
  onNext: () => void;
}) {
  const { speak } = useSpeechSynthesis();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="mb-1 font-serif text-lg font-semibold">Cặp từ tối thiểu (Minimal pairs)</h3>
        <p className="text-sm text-muted-foreground">
          Nghe từng cặp, nhấn nút loa để nghe cả hai từ. Cố gắng phân biệt sự khác biệt.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {focus.minimal_pairs.map((pair, i) => (
          <MinimalPairCard key={i} pair={pair} onSpeak={(w) => speak(w)} />
        ))}
      </div>

      <div className="flex gap-2">
        <Button
          onClick={() => {
            onComplete();
            onNext();
          }}
        >
          Đã luyện xong cặp từ
          <ArrowRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}

function MinimalPairCard({
  pair,
  onSpeak,
}: {
  pair: MinimalPair;
  onSpeak: (w: string) => void;
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center justify-between">
        <button
          onClick={() => onSpeak(pair.word1)}
          className="rounded-lg px-3 py-2 text-left hover:bg-muted"
        >
          <span className="font-medium">{pair.word1}</span>
          <span className="ml-2 text-xs text-muted-foreground">{pair.ipa1}</span>
          <Volume2 className="ml-1 inline size-3 text-primary" />
        </button>
        <span className="text-xs text-muted-foreground">vs</span>
        <button
          onClick={() => onSpeak(pair.word2)}
          className="rounded-lg px-3 py-2 text-left hover:bg-muted"
        >
          <span className="font-medium">{pair.word2}</span>
          <span className="ml-2 text-xs text-muted-foreground">{pair.ipa2}</span>
          <Volume2 className="ml-1 inline size-3 text-primary" />
        </button>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{pair.vi}</p>
    </div>
  );
}

/* ─── Step 3: Words & phrases ─── */
function Step3WordsPhrases({
  focus,
  onComplete,
  onNext,
}: {
  focus: PronunciationFocus;
  onComplete: () => void;
  onNext: () => void;
}) {
  const recorder = useRecorder();
  const { speak } = useSpeechSynthesis();
  const [mode, setMode] = useState<"word" | "phrase">("word");
  const [items, setItems] = useState<string[]>(focus.words);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<WordResult[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());

  const current = items[index] ?? "";

  function switchMode(m: "word" | "phrase") {
    setMode(m);
    setItems(m === "word" ? focus.words : focus.phrases);
    setIndex(0);
    reset();
  }

  function reset() {
    setTranscript("");
    setResults(null);
    setScore(null);
    setError(null);
  }

  async function handleRecord() {
    if (recorder.isRecording) {
      const blob = await recorder.stop();
      setBusy(true);
      setError(null);
      try {
        const text = await transcribe(blob);
        setTranscript(text);
        const scored = scoreIntelligibility(text, current);
        setResults(scored.results);
        setScore(scored.score);
        await savePronunciationAttempt({
          focusId: focus.id,
          itemType: mode === "word" ? "word" : "passage",
          targetText: current,
          transcript: text,
          wordResults: scored.results,
          score: scored.score,
        });
        setDone((prev) => new Set([...prev, index]));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi chấm.");
      } finally {
        setBusy(false);
      }
      return;
    }
    setError(null);
    await recorder.start();
  }

  function next() {
    reset();
    if (index + 1 < items.length) {
      setIndex(index + 1);
    }
  }

  function prev() {
    reset();
    if (index > 0) setIndex(index - 1);
  }

  const allDone = done.size >= items.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="mb-1 font-serif text-lg font-semibold">Luyện từ & cụm từ</h3>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => switchMode("word")}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              mode === "word"
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted",
            )}
          >
            Từ ({focus.words.length})
          </button>
          <button
            onClick={() => switchMode("phrase")}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              mode === "phrase"
                ? "bg-primary text-primary-foreground border-primary"
                : "hover:bg-muted",
            )}
          >
            Cụm từ ({focus.phrases.length})
          </button>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase text-muted-foreground">
            {mode === "word" ? "Từ" : "Cụm"} {index + 1}/{items.length}
          </span>
          <button onClick={() => speak(current)} className="text-sm text-primary">
            <Volume2 className="mr-1 inline size-4" />
            Nghe mẫu
          </button>
        </div>
        <p className="mt-2 text-2xl font-medium">{current}</p>
        <div className="mt-1 flex gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full",
                i === index ? "bg-primary" : done.has(i) ? "bg-emerald-400" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {score != null && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">{score}%</div>
            <div className="text-sm text-muted-foreground">
              Độ rõ — {score >= 80 ? "rất rõ" : score >= 50 ? "khá rõ" : "cần luyện thêm"}.
            </div>
          </div>
          {results && (
            <div className="mt-2 flex flex-wrap gap-1">
              {results.map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded px-1 text-sm",
                    r.ok ? "text-foreground" : "bg-destructive/10 text-destructive line-through",
                  )}
                >
                  {r.word}
                </span>
              ))}
            </div>
          )}
          {transcript && (
            <p className="mt-2 text-xs text-muted-foreground">Máy nghe được: &ldquo;{transcript}&rdquo;</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={prev} disabled={index === 0}>
          <ArrowLeft className="size-4" />
        </Button>
        <Button variant="outline" onClick={handleRecord} disabled={busy}>
          {recorder.isRecording ? "Dừng & chấm" : "Đọc"}
        </Button>
        <Button onClick={next} disabled={busy || index + 1 >= items.length}>
          Tiếp theo
        </Button>
      </div>
      {recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {allDone && (
        <div className="flex gap-2">
          <Button onClick={onComplete} variant="outline">
            <Check className="mr-1 size-4" />
            Đã luyện xong
          </Button>
          <Button onClick={onNext}>
            Tiếp: Luyện trong câu
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Step 4: Sentences ─── */
function Step4Sentences({
  focus,
  onComplete,
  onNext,
}: {
  focus: PronunciationFocus;
  onComplete: () => void;
  onNext: () => void;
}) {
  const recorder = useRecorder();
  const { speak } = useSpeechSynthesis();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<WordResult[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<Set<number>>(new Set());

  const current = focus.sentences[index] ?? "";

  function reset() {
    setTranscript("");
    setResults(null);
    setScore(null);
    setError(null);
  }

  async function handleRecord() {
    if (recorder.isRecording) {
      const blob = await recorder.stop();
      setBusy(true);
      setError(null);
      try {
        const text = await transcribe(blob);
        setTranscript(text);
        const scored = scoreIntelligibility(text, current);
        setResults(scored.results);
        setScore(scored.score);
        await savePronunciationAttempt({
          focusId: focus.id,
          itemType: "sentence",
          targetText: current,
          transcript: text,
          wordResults: scored.results,
          score: scored.score,
        });
        setDone((prev) => new Set([...prev, index]));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi chấm.");
      } finally {
        setBusy(false);
      }
      return;
    }
    setError(null);
    await recorder.start();
  }

  function next() {
    reset();
    if (index + 1 < focus.sentences.length) setIndex(index + 1);
  }

  const allDone = done.size >= focus.sentences.length;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="mb-1 font-serif text-lg font-semibold">Luyện trong câu</h3>
        <p className="text-sm text-muted-foreground">
          Đọc to từng câu chứa âm đang học. Ghi âm và so sánh với mẫu.
        </p>
      </div>

      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase text-muted-foreground">
            Câu {index + 1}/{focus.sentences.length}
          </span>
          <button onClick={() => speak(current)} className="text-sm text-primary">
            <Volume2 className="mr-1 inline size-4" />
            Nghe mẫu
          </button>
        </div>
        <p className="mt-2 text-xl font-medium leading-relaxed">{current}</p>
        <div className="mt-2 flex gap-1">
          {focus.sentences.map((_, i) => (
            <span
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full",
                i === index ? "bg-primary" : done.has(i) ? "bg-emerald-400" : "bg-muted",
              )}
            />
          ))}
        </div>
      </div>

      {score != null && (
        <div className="rounded-2xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold">{score}%</div>
            <div className="text-sm text-muted-foreground">
              Độ rõ — {score >= 80 ? "rất rõ" : score >= 50 ? "khá rõ" : "cần luyện thêm"}.
            </div>
          </div>
          {results && (
            <div className="mt-2 flex flex-wrap gap-1">
              {results.map((r, i) => (
                <span
                  key={i}
                  className={cn(
                    "rounded px-1 text-sm",
                    r.ok ? "text-foreground" : "bg-destructive/10 text-destructive line-through",
                  )}
                >
                  {r.word}
                </span>
              ))}
            </div>
          )}
          {transcript && (
            <p className="mt-2 text-xs text-muted-foreground">Máy nghe được: &ldquo;{transcript}&rdquo;</p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={next} disabled={index + 1 >= focus.sentences.length}>
          Câu tiếp
        </Button>
        <Button variant="outline" onClick={handleRecord} disabled={busy}>
          {recorder.isRecording ? "Dừng & chấm" : "Đọc"}
        </Button>
      </div>
      {recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}

      {allDone && (
        <div className="flex gap-2">
          <Button onClick={onComplete} variant="outline">
            <Check className="mr-1 size-4" />
            Đã luyện xong câu
          </Button>
          <Button onClick={onNext}>
            Tiếp: Kiểm tra nhanh
            <ArrowRight className="ml-1 size-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Step 5: Quick test ─── */
function Step5QuickTest({
  focus,
  onComplete,
  onFinish,
}: {
  focus: PronunciationFocus;
  onComplete: () => void;
  onFinish: boolean;
}) {
  const recorder = useRecorder();
  const { speak } = useSpeechSynthesis();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tests = focus.quick_test;
  const current = tests[index];
  const isLast = index + 1 >= tests.length;
  const allAnswered = Object.keys(answers).length >= tests.length;

  function answer(idx: number, opt: number) {
    setAnswers((a) => ({ ...a, [idx]: opt }));
  }

  async function handleSpeakTest() {
    if (recorder.isRecording) {
      const blob = await recorder.stop();
      setBusy(true);
      setError(null);
      try {
        const text = await transcribe(blob);
        setTranscript(text);
        const scored = scoreIntelligibility(text, current?.target ?? "");
        setScore(scored.score);
        await savePronunciationAttempt({
          focusId: focus.id,
          itemType: "quick_test",
          targetText: current?.target ?? "",
          transcript: text,
          wordResults: scored.results,
          score: scored.score,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi chấm.");
      } finally {
        setBusy(false);
      }
      return;
    }
    setError(null);
    await recorder.start();
  }

  function next() {
    setTranscript("");
    setScore(null);
    setError(null);
    if (!isLast) setIndex(index + 1);
  }

  // Calculate correct count
  let correctCount = 0;
  for (const [idx, ans] of Object.entries(answers)) {
    const t = tests[Number(idx)];
    if (t?.type === "listen-choose" && ans === t.answer) correctCount++;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border bg-card p-5 shadow-sm">
        <h3 className="mb-1 font-serif text-lg font-semibold">Kiểm tra nhanh</h3>
        <p className="text-sm text-muted-foreground">
          {tests.length} câu hỏi: nghe chọn từ và nói lại câu.
        </p>
      </div>

      {current && (
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase text-muted-foreground">
              Câu {index + 1}/{tests.length}
            </span>
            {current.type === "listen-choose" && (
              <button
                onClick={() => speak(current.audio_text ?? "")}
                className="text-sm text-primary"
              >
                <Volume2 className="mr-1 inline size-4" />
                Nghe
              </button>
            )}
          </div>

          <p className="mt-2 font-medium">{current.prompt}</p>

          {current.type === "listen-choose" && current.options && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {current.options.map((opt, oi) => {
                const selected = answers[index] === oi;
                const answered = answers[index] != null;
                const isCorrect = oi === current.answer;
                return (
                  <button
                    key={oi}
                    onClick={() => answer(index, oi)}
                    disabled={answered}
                    className={cn(
                      "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                      answered && isCorrect
                        ? "border-green-400 bg-green-50 text-green-700"
                        : answered && selected && !isCorrect
                          ? "border-red-400 bg-red-50 text-red-700"
                          : selected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/40",
                    )}
                  >
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-xs">
                      {answered && isCorrect ? (
                        <Check className="size-3.5" />
                      ) : answered && selected && !isCorrect ? (
                        <X className="size-3.5" />
                      ) : (
                        String.fromCharCode(65 + oi)
                      )}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          )}

          {current.type === "speak-sentence" && (
            <div className="mt-3">
              <p className="rounded-lg bg-muted/50 p-3 text-lg font-medium">{current.target}</p>
              <div className="mt-3 flex gap-2">
                <Button variant="outline" onClick={handleSpeakTest} disabled={busy}>
                  {recorder.isRecording ? "Dừng & chấm" : "Đọc"}
                </Button>
                {score != null && (
                  <span className="self-center text-sm text-muted-foreground">
                    Độ rõ: <strong>{score}%</strong>
                  </span>
                )}
              </div>
              {transcript && (
                <p className="mt-2 text-xs text-muted-foreground">Máy nghe: &ldquo;{transcript}&rdquo;</p>
              )}
              {recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
              {error && <p className="text-xs text-destructive">{error}</p>}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {index > 0 && (
          <Button variant="outline" onClick={() => setIndex(index - 1)}>
            <ArrowLeft className="size-4" />
          </Button>
        )}
        {answers[index] != null || (current?.type === "speak-sentence" && score != null) ? (
          <Button onClick={next} disabled={isLast && !allAnswered}>
            {isLast && allAnswered ? "Xem kết quả" : "Tiếp"}
          </Button>
        ) : null}
      </div>

      {allAnswered && (
        <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
          <p className="text-lg font-semibold">
            Kết quả: {correctCount}/{tests.length} câu đúng
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {correctCount === tests.length
              ? "Xuất sắc! Bạn đã nắm âm này."
              : "Luyện thêm ở bước 2-4 để cải thiện."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAnswers({});
                setIndex(0);
                setTranscript("");
                setScore(null);
                setError(null);
              }}
            >
              <RotateCcw className="size-4" />
              Làm lại
            </Button>
            <Button
              onClick={() => {
                onComplete();
              }}
              disabled={onFinish}
            >
              {onFinish ? (
                <>
                  <CheckCircle2 className="mr-1 size-4" />
                  Hoàn thành
                </>
              ) : (
                "Hoàn thành bước này"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}