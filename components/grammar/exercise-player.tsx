"use client";

import { useState, useCallback } from "react";
import { Check, X, RotateCcw, Eye, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkTranslation, checkErrorCorrection, checkVerbConjugation } from "@/lib/grammar-v2-types";
import type { TranslationQuestion, ErrorCorrectionQuestion, VerbConjugationQuestion, GrammarV2Question } from "@/lib/grammar-v2-types";
import type { GrammarMcq, GrammarFill } from "@/lib/grammar-exercises-data";

type ExerciseType = "mcq" | "translation" | "error_correction" | "verb_conjugation";
type ExerciseQuestion = GrammarMcq | GrammarFill | TranslationQuestion | ErrorCorrectionQuestion | VerbConjugationQuestion;

const TYPE_LABELS: Record<ExerciseType, string> = {
  mcq: "Trắc nghiệm",
  translation: "Dịch Việt → Anh",
  error_correction: "Sửa lỗi",
  verb_conjugation: "Chia động từ",
};

const TYPE_COLORS: Record<ExerciseType, string> = {
  mcq: "bg-blue-100 text-blue-700",
  translation: "bg-green-100 text-green-700",
  error_correction: "bg-red-100 text-red-700",
  verb_conjugation: "bg-purple-100 text-purple-700",
};

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ExercisePlayer({
  questions,
  exerciseType,
  onAnswer,
  onNext,
}: {
  questions: ExerciseQuestion[];
  exerciseType: ExerciseType;
  onAnswer?: (questionId: string, correct: boolean) => void;
  onNext?: () => void;
}) {
  const [queue, setQueue] = useState<ExerciseQuestion[]>(() => shuffleArray(questions));
  const [index, setIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [verbAnswers, setVerbAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ correct: boolean; needsReview?: boolean } | null>(null);

  const current = queue[index];
  const done = index >= queue.length;

  const reset = useCallback(() => {
    setUserAnswer("");
    setVerbAnswers([]);
    setSelectedOption(null);
    setSubmitted(false);
    setResult(null);
  }, []);

  function handleSubmit() {
    if (submitted || !current) return;
    setSubmitted(true);

    if (exerciseType === "mcq") {
      const mcq = current as GrammarMcq;
      const correct = selectedOption === mcq.answer;
      setResult({ correct });
      onAnswer?.(String(mcq.id), correct);
    } else if (exerciseType === "translation") {
      const t = current as TranslationQuestion;
      const r = checkTranslation(userAnswer, t.answer, t.alternatives ?? []);
      setResult(r);
      onAnswer?.(t.id ?? "", r.correct);
    } else if (exerciseType === "error_correction") {
      const e = current as ErrorCorrectionQuestion;
      const r = checkErrorCorrection(userAnswer, e.corrected);
      setResult(r);
      onAnswer?.(e.id ?? "", r.correct);
    } else if (exerciseType === "verb_conjugation") {
      const v = current as VerbConjugationQuestion;
      const r = checkVerbConjugation(verbAnswers, v.blanks);
      setResult({ correct: r.correct });
      onAnswer?.(v.id ?? "", r.correct);
    }
  }

  function handleNext() {
    setIndex((i) => i + 1);
    reset();
    onNext?.();
  }

  if (done) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center">
        <p className="text-lg font-semibold text-foreground">Hoàn thành {queue.length} câu!</p>
        <button
          type="button"
          onClick={() => { setQueue(shuffleArray(questions)); setIndex(0); reset(); }}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <RotateCcw className="size-4" />
          Làm lại
        </button>
      </div>
    );
  }

  if (!current) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${TYPE_COLORS[exerciseType]}`}>
          {TYPE_LABELS[exerciseType]}
        </span>
        <span className="text-xs text-muted-foreground">
          Câu {index + 1}/{queue.length}
        </span>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(index / queue.length) * 100}%` }} />
      </div>

      {exerciseType === "mcq" && renderMcq(current as GrammarMcq)}
      {exerciseType === "translation" && renderTranslation(current as TranslationQuestion)}
      {exerciseType === "error_correction" && renderErrorCorrection(current as ErrorCorrectionQuestion)}
      {exerciseType === "verb_conjugation" && renderVerbConjugation(current as VerbConjugationQuestion)}

      {!submitted ? (
        <Button onClick={handleSubmit} className="w-full" disabled={exerciseType === "mcq" ? selectedOption === null : exerciseType === "verb_conjugation" ? verbAnswers.some((a) => !a.trim()) : !userAnswer.trim()}>
          Nộp bài
        </Button>
      ) : (
        <div className="space-y-3">
          {renderResult()}
          <Button onClick={handleNext} className="w-full">
            Câu tiếp theo
            <ArrowRight className="ml-2 size-4" />
          </Button>
        </div>
      )}
    </div>
  );

  function renderMcq(q: GrammarMcq) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{q.question}</p>
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            disabled={submitted}
            onClick={() => setSelectedOption(i)}
            className={`w-full rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
              submitted
                ? i === q.answer
                  ? "border-green-300 bg-green-50 text-green-900"
                  : selectedOption === i
                    ? "border-red-300 bg-red-50 text-red-900"
                    : "border-border bg-card opacity-60"
                : selectedOption === i
                  ? "border-primary bg-primary/5 text-foreground"
                  : "border-border bg-card hover:bg-muted/50"
            }`}
          >
            <span className="mr-2 text-xs text-muted-foreground">{String.fromCharCode(65 + i)}.</span>
            {opt}
            {submitted && i === q.answer ? <Check className="ml-auto inline size-4 text-green-600" /> : null}
            {submitted && selectedOption === i && i !== q.answer ? <X className="ml-auto inline size-4 text-red-600" /> : null}
          </button>
        ))}
      </div>
    );
  }

  function renderTranslation(q: TranslationQuestion) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-muted/40 p-4">
          <p className="text-xs text-muted-foreground">Dịch sang tiếng Anh:</p>
          <p className="mt-1 font-medium text-foreground">{q.vi}</p>
          {q.hints?.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {q.hints.map((h, i) => (
                <span key={i} className="rounded-full bg-background px-2 py-0.5 text-xs text-muted-foreground">{h}</span>
              ))}
            </div>
          ) : null}
        </div>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={submitted}
          placeholder="Nhập câu tiếng Anh..."
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
          rows={2}
        />
      </div>
    );
  }

  function renderErrorCorrection(q: ErrorCorrectionQuestion) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl bg-red-50/50 p-4">
          <p className="text-xs text-red-600">Câu sau có lỗi ngữ pháp:</p>
          <p className="mt-1 font-medium text-foreground">{q.sentence}</p>
        </div>
        <p className="text-xs text-muted-foreground">Gõ lại cả câu đã sửa:</p>
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          disabled={submitted}
          placeholder="Nhập câu đã sửa..."
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:opacity-60"
          rows={2}
        />
      </div>
    );
  }

  function renderVerbConjugation(q: VerbConjugationQuestion) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">
          {q.sentence.split("___").map((part, i) => {
            const blank = q.blanks[i];
            return (
              <span key={i}>
                {part}
                {blank ? (
                  <input
                    type="text"
                    value={verbAnswers[i] ?? ""}
                    onChange={(e) => {
                      const next = [...verbAnswers];
                      next[i] = e.target.value;
                      setVerbAnswers(next);
                    }}
                    disabled={submitted}
                    placeholder={`(${blank.word})`}
                    className="mx-1 inline-block w-24 rounded border border-border bg-card px-2 py-0.5 text-center text-sm focus:border-primary focus:outline-none disabled:opacity-60"
                  />
                ) : null}
              </span>
            );
          })}
        </p>
        {q.blanks.length > 1 ? (
          <p className="text-xs text-muted-foreground">
            Gợi ý: {q.blanks.map((b, i) => `(${i + 1}) ${b.word}`).join(" · ")}
          </p>
        ) : null}
      </div>
    );
  }

  function renderResult() {
    if (!result || !current) return null;
    const q = current;
    let explanation = "";
    let correctAnswer = "";

    if (exerciseType === "mcq") {
      const mcq = q as GrammarMcq;
      correctAnswer = mcq.options[mcq.answer];
      explanation = mcq.explanation_vi ?? "";
      if (mcq.vn_trap) explanation += `\n⚠️ ${mcq.vn_trap}`;
    } else if (exerciseType === "translation") {
      const t = q as TranslationQuestion;
      correctAnswer = t.answer;
      if (t.alternatives?.length) correctAnswer += ` (hoặc: ${t.alternatives.join(" / ")})`;
      explanation = t.explanation_vi ?? "";
    } else if (exerciseType === "error_correction") {
      const e = q as ErrorCorrectionQuestion;
      correctAnswer = `${e.error_part} → ${e.correct_part}`;
      explanation = `${e.explanation_vi}\nCâu đúng: ${e.corrected}`;
    } else if (exerciseType === "verb_conjugation") {
      const v = q as VerbConjugationQuestion;
      correctAnswer = v.full;
      explanation = v.explanation_vi ?? "";
    }

    return (
      <div className={`rounded-xl border p-4 ${result.correct ? "border-green-200 bg-green-50" : result.needsReview ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
        <div className="flex items-center gap-2">
          {result.correct ? <Check className="size-4 text-green-600" /> : result.needsReview ? <Eye className="size-4 text-amber-600" /> : <X className="size-4 text-red-600" />}
          <span className="text-sm font-semibold">
            {result.correct ? "Đúng!" : result.needsReview ? "Cần đối chiếu với lời giải" : "Chưa đúng"}
          </span>
        </div>
        {!result.correct ? (
          <div className="mt-2">
            <p className="text-xs text-muted-foreground">Đáp án đúng:</p>
            <p className="text-sm font-medium text-foreground">{correctAnswer}</p>
          </div>
        ) : null}
        {explanation ? (
          <p className="mt-2 whitespace-pre-line text-sm text-foreground/80">{explanation}</p>
        ) : null}
      </div>
    );
  }
}