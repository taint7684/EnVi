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
import { SpellCheck } from "@/components/ui/spell-check";
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

const PAGE_SIZE = 9;

function safePassage(p: unknown): ReadingPassage | null {
  if (!p || typeof p !== "object") return null;
  const pp = p as Record<string, unknown>;
  if (
    typeof pp.id !== "string" ||
    typeof pp.title !== "string" ||
    typeof pp.titleVi !== "string" ||
    typeof pp.level !== "string" ||
    typeof pp.text !== "string" ||
    typeof pp.wordCount !== "number" ||
    !Array.isArray(pp.questions)
  ) {
    return null;
  }
  const questions = pp.questions.filter((q: unknown) => {
    if (!q || typeof q !== "object") return false;
    const qq = q as Record<string, unknown>;
    return (
      typeof qq.id === "number" &&
      typeof qq.question === "string" &&
      Array.isArray(qq.options) &&
      qq.options.length >= 2 &&
      typeof qq.answer === "number"
    );
  });
  if (questions.length === 0) return null;
  return {
    id: pp.id as string,
    title: pp.title as string,
    titleVi: pp.titleVi as string,
    level: pp.level as string,
    text: pp.text as string,
    wordCount: pp.wordCount as number,
    questions: questions as Array<{
      id: number;
      question: string;
      options: string[];
      answer: number;
    }>,
  };
}

const ALL_PASSAGES: ReadingPassage[] = (
  READING_PASSAGES as unknown[]
)
  .map(safePassage)
  .filter((p): p is ReadingPassage => p !== null);

export default function ReadingPage() {
  const [level, setLevel] = useState<string>("A2");
  const [visible, setVisible] = useState<number>(PAGE_SIZE);
  const [selected, setSelected] = useState<ReadingPassage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const list = useMemo(
    () => ALL_PASSAGES.filter((p) => p.level === level),
    [level],
  );

  const shown = list.slice(0, visible);

  function changeLevel(lv: string) {
    setLevel(lv);
    setVisible(PAGE_SIZE);
    setError(null);
  }

  if (selected) {
    return (
      <PassageDetail
        passage={selected}
        onBack={() => {
          stopSpeaking();
          setSelected(null);
          setError(null);
        }}
      />
    );
  }

  if (list.length === 0) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          Chưa có bài đọc cho cấp độ này
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error ?? "Vui lòng chọn cấp độ khác hoặc thử lại sau."}
        </p>
        <Button onClick={() => changeLevel("A2")}>Thử cấp độ A2</Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {READING_LEVELS.map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => changeLevel(lv)}
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
        {shown.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => {
              setError(null);
              setSelected(p);
            }}
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
              {p.text.slice(0, 120)}{p.text.length > 120 ? "..." : ""}
            </p>
            <span className="mt-4 flex items-center gap-1 text-sm font-medium text-primary">
              Bắt đầu
              <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>

      {visible < list.length ? (
        <div className="flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Xem thêm ({list.length - visible} bài)
          </Button>
        </div>
      ) : null}
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
  const [summary, setSummary] = useState("");
  const [summarySaved, setSummarySaved] = useState(false);

  const correctCount = passage.questions.filter(
    (q) => checked[q.id] && answers[q.id] === q.answer,
  ).length;
  const allChecked = passage.questions.every((q) => checked[q.id]);

  function choose(qid: number, option: number) {
    if (checked[qid]) return;
    setAnswers((a) => ({ ...a, [qid]: option }));
    setChecked((c) => ({ ...c, [qid]: true }));
  }

  function handleSpeak() {
    if (!passage.text) return;
    speakEnglish(passage.text);
  }

  function handleSaveSummary() {
    if (!summary.trim()) {
      setErrorMessage("Viết ít nhất một câu tóm tắt trước khi lưu.");
      return;
    }
    // Persist summary to localStorage
    try {
      const key = `envi:reading:summary:${passage.id}`;
      const existing = localStorage.getItem(key);
      const summaries = existing ? JSON.parse(existing) : [];
      summaries.push({
        text: summary,
        savedAt: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(summaries));
      setSummarySaved(true);
    } catch {
      setErrorMessage("Không thể lưu tóm tắt trên thiết bị.");
    }
  }

  let errorMessage: string | null = null;
  function setErrorMessage(msg: string) {
    errorMessage = msg;
  }

  return (
    <div className="space-y-5">
      {errorMessage ? (
        <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {errorMessage}
        </p>
      ) : null}

      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Thư viện bài đọc
      </Button>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">
              {passage.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {passage.titleVi} · {passage.level} · {passage.wordCount} từ
            </p>
          </div>
          <Button
            variant="outline"
            onClick={handleSpeak}
            disabled={!passage.text}
          >
            <Volume2 className="size-4" />
            {passage.text ? "Nghe mẫu" : "Không có âm thanh"}
          </Button>
        </div>

        <p className="rounded-xl bg-accent/40 p-4 text-[15px] leading-relaxed text-foreground">
          {passage.text || "(Không có nội dung bài đọc.)"}
        </p>
        {passage.text ? (
          <SpellCheck text={passage.text} disabled={false} />
        ) : null}
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-serif text-lg font-semibold text-foreground">
            Tóm tắt / Nói lại bằng tiếng Anh
          </h3>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            Tùy chọn
          </span>
        </div>
        <textarea
          rows={5}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="Viết tóm tắt ngắn gọn bằng tiếng Anh về đoạn văn trên..."
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Hãy dùng từ vựng đã học trong đoạn văn để tóm tắt ý chính.
        </p>
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            onClick={handleSaveSummary}
            disabled={!summary.trim() || summarySaved}
          >
            {summarySaved ? "Đã lưu" : "Lưu tóm tắt"}
          </Button>
          {summarySaved ? (
            <span className="ml-2 text-xs text-green-600">
              ✓ Tóm tắt đã lưu cho bài này
            </span>
          ) : null}
        </div>
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
                setSummary("");
                setSummarySaved(false);
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
