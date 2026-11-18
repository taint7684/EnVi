"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { speakEnglish, stopSpeaking } from "@/lib/speech";
import {
  READING_LEVELS,
  READING_PASSAGES,
  type ReadingPassage,
} from "@/lib/reading-data";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<string, string> = {
  A2: "bg-emerald-100 text-emerald-700",
  B1: "bg-sky-100 text-sky-700",
  B2: "bg-violet-100 text-violet-700",
};

export function ReadingPractice() {
  const [level, setLevel] = useState<string>("A2");
  const [selected, setSelected] = useState<ReadingPassage | null>(null);

  const list = useMemo(
    () => READING_PASSAGES.filter((p) => p.level === level),
    [level],
  );

  if (selected) {
    return (
      <PassageDetail
        passage={selected}
        onBack={() => {
          stopSpeaking();
          setSelected(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {READING_LEVELS.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => setLevel(lv)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              level === lv
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {lv}
          </button>
        ))}
        <span className="ml-auto self-center text-sm text-muted-foreground">
          {list.length} bài đọc
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p)}
            className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
          >
            <div className="mb-2 flex items-center justify-between">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-xs font-medium",
                  LEVEL_STYLES[p.level] ?? "bg-muted text-muted-foreground",
                )}
              >
                {p.level}
              </span>
              <span className="text-xs text-muted-foreground">
                {p.wordCount} từ
              </span>
            </div>
            <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
              <BookOpen className="size-4 text-primary" />
              {p.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">{p.titleVi}</p>
            <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
              {p.text}
            </p>
            <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
              Bắt đầu
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function PassageDetail({
  passage,
  onBack,
}: {
  passage: ReadingPassage;
  onBack: () => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const correctCount = passage.questions.filter(
    (q) => checked[q.id] && answers[q.id] === q.answer,
  ).length;
  const allChecked = passage.questions.every((q) => checked[q.id]);

  function choose(qid: number, option: number) {
    if (checked[qid]) return;
    setAnswers((a) => ({ ...a, [qid]: option }));
    setChecked((c) => ({ ...c, [qid]: true }));
  }

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Thư viện bài đọc
      </Button>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-semibold">{passage.title}</h2>
            <p className="text-sm text-muted-foreground">
              {passage.titleVi} · {passage.level} · {passage.wordCount} từ
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => speakEnglish(passage.text)}
          >
            <Volume2 className="size-4" />
            Nghe mẫu
          </Button>
        </div>

        <p className="rounded-xl bg-accent/40 p-4 text-[15px] leading-relaxed text-foreground">
          {passage.text}
        </p>
      </div>

      <div className="space-y-4">
        {passage.questions.map((q, idx) => {
          const chosen = answers[q.id];
          const isChecked = checked[q.id];
          const isCorrect = chosen === q.answer;
          return (
            <div
              key={q.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm"
            >
              <p className="mb-3 font-medium">
                Câu {idx + 1}. {q.question}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {q.options.map((opt, oi) => {
                  const selected = chosen === oi;
                  const showCorrect = isChecked && oi === q.answer;
                  const showWrong = isChecked && selected && oi !== q.answer;
                  return (
                    <button
                      key={oi}
                      type="button"
                      onClick={() => choose(q.id, oi)}
                      disabled={isChecked}
                      className={cn(
                        "flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                        showCorrect
                          ? "border-green-400 bg-green-50 text-green-700"
                          : showWrong
                            ? "border-red-400 bg-red-50 text-red-700"
                            : selected
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/40",
                      )}
                    >
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full border text-xs">
                        {showCorrect ? (
                          <Check className="size-3.5" />
                        ) : showWrong ? (
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
              {isChecked ? (
                <p
                  className={cn(
                    "mt-2 text-sm font-medium",
                    isCorrect ? "text-green-600" : "text-red-600",
                  )}
                >
                  {isCorrect ? "Chính xác!" : "Chưa đúng — đáp án đúng đã được đánh dấu."}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {allChecked ? (
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-lg font-semibold">
            Kết quả: {correctCount}/{passage.questions.length} câu đúng
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {correctCount === passage.questions.length
              ? "Xuất sắc! Bạn hiểu bài rất tốt."
              : "Đọc lại đoạn văn và thử sức lần nữa nhé."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setAnswers({});
                setChecked({});
              }}
            >
              <RotateCcw className="size-4" />
              Làm lại
            </Button>
            <Button onClick={onBack}>Chọn bài khác</Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}