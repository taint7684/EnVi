"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronRight,
  Headphones,
  Mic,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpellCheck } from "@/components/ui/spell-check";
import { LookupText } from "@/components/reading/lookup-text";
import { saveReadingAttempt } from "@/lib/reading/server";
import { speakEnglish, stopSpeaking } from "@/lib/speech";
import type {
  ReadingPassage,
  ReadingProgress,
} from "@/lib/reading/types";
import { READING_LEVELS } from "@/lib/reading/types";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<string, string> = {
  A2: "bg-emerald-100 text-emerald-700",
  B1: "bg-sky-100 text-sky-700",
  B2: "bg-violet-100 text-violet-700",
};

const PAGE_SIZE = 9;

type Tab = "read_aloud" | "comprehension";

type Props = {
  passages: ReadingPassage[];
  progress: Record<string, ReadingProgress>;
  dailyIds: string[];
  dailyDate: string;
};

export function ReadingDaily({ passages, progress, dailyIds, dailyDate }: Props) {
  const [level, setLevel] = useState<string>("A2");
  const [visible, setVisible] = useState<number>(PAGE_SIZE);
  const [selected, setSelected] = useState<ReadingPassage | null>(null);
  const [showDaily, setShowDaily] = useState(false);

  const dailyPassages = useMemo(
    () => dailyIds.map((id) => passages.find((p) => p.id === id)).filter(Boolean) as ReadingPassage[],
    [dailyIds, passages],
  );

  const filtered = useMemo(
    () => passages.filter((p) => p.level === level),
    [passages, level],
  );

  const shown = showDaily ? dailyPassages : filtered.slice(0, visible);

  if (selected) {
    return (
      <PassageDetail
        passage={selected}
        progress={progress[selected.id]}
        onBack={() => {
          stopSpeaking();
          setSelected(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* Daily section */}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-medium">Bài đọc hôm nay</h2>
            <p className="text-sm text-muted-foreground">
              {dailyDate} · {dailyPassages.length} bài mới
            </p>
          </div>
          <Button
            variant={showDaily ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDaily(!showDaily)}
          >
            {showDaily ? "Xem thư viện" : "Xem bài hôm nay"}
          </Button>
        </div>
        {showDaily && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {dailyPassages.map((p) => {
              const prog = progress[p.id];
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="group flex flex-col rounded-xl border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", LEVEL_STYLES[p.level] ?? "bg-muted")}>
                      {p.level}
                    </span>
                    {prog?.status === "completed" ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="size-3" /> Đã xong
                      </span>
                    ) : prog ? (
                      <span className="text-xs text-amber-600">Đang học</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Mới</span>
                    )}
                  </div>
                  <h3 className="font-serif text-lg font-semibold">{p.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.titleVi}</p>
                  <span className="mt-3 flex items-center gap-1 text-sm font-medium text-primary">
                    Bắt đầu <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Level filter */}
      {!showDaily && (
        <>
          <div className="flex flex-wrap gap-2">
            {READING_LEVELS.map((lv) => (
              <button
                key={lv}
                onClick={() => { setLevel(lv); setVisible(PAGE_SIZE); }}
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
              {filtered.length} bài đọc
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => {
              const prog = progress[p.id];
              return (
                <button
                  key={p.id}
                  onClick={() => setSelected(p)}
                  className="group flex flex-col rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/30"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", LEVEL_STYLES[p.level] ?? "bg-muted")}>
                      {p.level}
                    </span>
                    <span className="text-xs text-muted-foreground">{p.wordCount} từ</span>
                  </div>
                  <h3 className="flex items-center gap-2 font-serif text-lg font-semibold">
                    <BookOpen className="size-4 text-primary" />
                    {p.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{p.titleVi}</p>
                  <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">
                    {p.text.slice(0, 120)}{p.text.length > 120 ? "..." : ""}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    {prog?.status === "completed" ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <Check className="size-3" /> Đã xong
                      </span>
                    ) : prog ? (
                      <span className="text-xs text-amber-600">Đang học</span>
                    ) : null}
                    <span className="flex items-center gap-1 text-sm font-medium text-primary ml-auto">
                      Bắt đầu <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {visible < filtered.length && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE_SIZE)}>
                Xem thêm ({filtered.length - visible} bài)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── Passage Detail with 2 tabs ─── */
function PassageDetail({
  passage,
  progress,
  onBack,
}: {
  passage: ReadingPassage;
  progress?: ReadingProgress;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("read_aloud");

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={onBack}>
        <ArrowLeft className="size-4" />
        Thư viện bài đọc
      </Button>

      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground">{passage.title}</h2>
            <p className="text-sm text-muted-foreground">
              {passage.titleVi} · {passage.level} · {passage.wordCount} từ
            </p>
          </div>
          <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", LEVEL_STYLES[passage.level] ?? "bg-muted")}>
            {passage.level}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 rounded-xl bg-muted p-1">
        <button
          onClick={() => setTab("read_aloud")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "read_aloud" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Headphones className="size-4" />
          Đọc to
        </button>
        <button
          onClick={() => setTab("comprehension")}
          className={cn(
            "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            tab === "comprehension" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <BookOpen className="size-4" />
          Đọc hiểu + Bài tập
        </button>
      </div>

      {tab === "read_aloud" ? (
        <ReadAloudTab passage={passage} progress={progress} />
      ) : (
        <ComprehensionTab passage={passage} progress={progress} />
      )}
    </div>
  );
}

/* ─── Tab 1: Đọc to ─── */
function ReadAloudTab({ passage }: { passage: ReadingPassage; progress?: ReadingProgress }) {
  const sentences = passage.sentences ?? splitSentences(passage.text);
  const [currentIdx, setCurrentIdx] = useState<number | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [showVocab, setShowVocab] = useState(false);
  const [readDone, setReadDone] = useState<Set<number>>(new Set());
  const mediaRef = useState<{ recorder: MediaRecorder | null; chunks: Blob[] }>({ recorder: null, chunks: [] })[0];

  function startRecording() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        if (recordedUrl) URL.revokeObjectURL(recordedUrl);
        setRecordedUrl(URL.createObjectURL(blob));
        setRecording(false);
        stream.getTracks().forEach((t) => t.stop());
      };
      mediaRef.recorder = recorder;
      mediaRef.chunks = chunks;
      recorder.start();
      setRecording(true);
    }).catch(() => {
      setRecording(false);
    });
  }

  function stopRecording() {
    mediaRef.recorder?.stop();
  }

  function speakSentence(idx: number) {
    speakEnglish(sentences[idx]);
  }

  function speakAll() {
    speakEnglish(passage.text);
  }

  function markDone(idx: number) {
    setReadDone((prev) => new Set([...prev, idx]));
  }

  return (
    <div className="space-y-4">
      {/* Text with sentence highlighting */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-medium">Đọc to</h3>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={speakAll}>
              <Volume2 className="size-4" /> Nghe toàn bài
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTranslation(!showTranslation)}
              disabled={!passage.translation}
            >
              {showTranslation ? "Ẩn dịch" : "Xem dịch"}
            </Button>
          </div>
        </div>

        {showTranslation && passage.translation && (
          <div className="mb-3 rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            {passage.translation}
          </div>
        )}

        <div className="space-y-1">
          {sentences.map((sent, i) => (
            <div
              key={i}
              className={cn(
                "group flex items-start gap-2 rounded-lg p-2 transition-colors",
                currentIdx === i ? "bg-primary/10" : "hover:bg-accent/30",
              )}
            >
              <button
                onClick={() => { setCurrentIdx(i); speakSentence(i); }}
                className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground hover:bg-primary hover:text-primary-foreground"
              >
                {readDone.has(i) ? <Check className="size-3" /> : i + 1}
              </button>
              <button
                onClick={() => { setCurrentIdx(i); speakSentence(i); }}
                className="flex-1 text-left text-sm leading-relaxed"
              >
                {sent}
              </button>
              {readDone.has(i) && <Check className="size-3.5 shrink-0 text-emerald-500" />}
            </div>
          ))}
        </div>
      </div>

      {/* Recording */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
        <h3 className="mb-3 font-medium">Ghi âm đọc to</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant={recording ? "destructive" : "default"} onClick={recording ? stopRecording : startRecording}>
            {recording ? <><X className="mr-1 size-4" /> Dừng ghi</> : <><Mic className="mr-1 size-4" /> Bắt đầu ghi</>}
          </Button>
          {currentIdx != null && (
            <Button variant="outline" onClick={() => speakSentence(currentIdx)}>
              <Volume2 className="size-4" /> Nghe mẫu câu {currentIdx + 1}
            </Button>
          )}
          {currentIdx != null && readDone.has(currentIdx) === false && (
            <Button variant="outline" onClick={() => markDone(currentIdx)}>
              <Check className="size-4" /> Đã đọc xong câu này
            </Button>
          )}
        </div>
        {recordedUrl && (
          <div className="mt-3 rounded-lg bg-muted/50 p-2">
            <audio src={recordedUrl} controls className="w-full" />
          </div>
        )}
        <p className="mt-2 text-xs text-muted-foreground">
          Nhấp câu để nghe mẫu. Ghi âm và nghe lại để so sánh.
        </p>
      </div>

      {/* Vocabulary */}
      {passage.vocabulary && passage.vocabulary.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <button
            onClick={() => setShowVocab(!showVocab)}
            className="flex w-full items-center justify-between"
          >
            <h3 className="font-medium">Từ vựng quan trọng ({passage.vocabulary.length})</h3>
            <ChevronRight className={cn("size-4 transition-transform", showVocab && "rotate-90")} />
          </button>
          {showVocab && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {passage.vocabulary.map((v, i) => (
                <div key={i} className="rounded-lg bg-muted/50 p-2">
                  <button
                    onClick={() => speakEnglish(v.word)}
                    className="text-sm font-medium hover:text-primary"
                  >
                    {v.word}
                    {v.ipa && <span className="ml-1 text-xs text-muted-foreground">{v.ipa}</span>}
                    <Volume2 className="ml-1 inline size-3 text-primary" />
                  </button>
                  <p className="text-xs text-muted-foreground">{v.meaning}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/* ─── Tab 2: Đọc hiểu + Bài tập ─── */
function ComprehensionTab({ passage }: { passage: ReadingPassage; progress?: ReadingProgress }) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [summary, setSummary] = useState("");
  const [summarySaved, setSummarySaved] = useState(false);
  const [exerciseAnswers, setExerciseAnswers] = useState<Record<number, string>>({});
  const [exerciseChecked, setExerciseChecked] = useState<Record<number, boolean>>({});
  const [error, setError] = useState<string | null>(null);

  const questions = passage.questions;
  const exercises = passage.exercises ?? [];

  const correctCount = questions.filter(
    (q) => checked[q.id] && answers[q.id] === q.answer,
  ).length;
  const allChecked = questions.every((q) => checked[q.id]);

  function choose(qid: number, option: number) {
    if (checked[qid]) return;
    setAnswers((a) => ({ ...a, [qid]: option }));
    setChecked((c) => ({ ...c, [qid]: true }));
  }

  function handleSpeak() {
    if (!passage.text) return;
    speakEnglish(passage.text);
  }

  async function handleSaveSummary() {
    if (!summary.trim()) {
      setError("Viết ít nhất một câu tóm tắt trước khi lưu.");
      return;
    }
    try {
      await saveReadingAttempt({
        passageId: passage.id,
        quizScore: correctCount,
        summaryText: summary,
        mode: "comprehension",
      });
      setSummarySaved(true);
      setError(null);
    } catch {
      setError("Không thể lưu tóm tắt. Vui lòng thử lại.");
    }
  }

  function checkExercise(idx: number) {
    setExerciseChecked((c) => ({ ...c, [idx]: true }));
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{error}</p>
      )}

      {/* Text */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-medium">Đoạn văn</h3>
          <Button variant="outline" size="sm" onClick={handleSpeak} disabled={!passage.text}>
            <Volume2 className="size-4" /> Nghe mẫu
          </Button>
        </div>
        <LookupText text={passage.text || "(Không có nội dung bài đọc.)"} />
        <SpellCheck text={passage.text} disabled={false} />
      </div>

      {/* Reading comprehension questions */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-3 font-medium">Câu hỏi đọc hiểu ({questions.length} câu)</h3>
        <div className="space-y-4">
          {questions.map((q, idx) => {
            const chosen = answers[q.id];
            const isChecked = checked[q.id];
            const isCorrect = chosen === q.answer;
            return (
              <div key={q.id} className="rounded-xl border p-4">
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
                          {showCorrect ? <Check className="size-3.5" /> : showWrong ? <X className="size-3.5" /> : String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
                {isChecked && (
                  <p className={cn("mt-2 text-sm font-medium", isCorrect ? "text-green-600" : "text-red-600")}>
                    {isCorrect ? "Chính xác!" : "Chưa đúng — đáp án đúng đã được đánh dấu."}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Vocabulary / structure exercises */}
      {exercises.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-3 font-medium">Bài tập từ vựng / cấu trúc ({exercises.length} câu)</h3>
          <div className="space-y-4">
            {exercises.map((ex, idx) => {
              const isChecked = exerciseChecked[idx];
              const userAns = exerciseAnswers[idx];
              const isCorrect = userAns?.trim().toLowerCase() === ex.answer.toLowerCase();
              return (
                <div key={idx} className="rounded-xl border p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">
                    {ex.type === "fill_blank" && "Điền từ"}
                    {ex.type === "synonym" && "Từ đồng nghĩa"}
                    {ex.type === "error_correction" && "Sửa lỗi"}
                  </p>
                  <p className="mt-1 mb-2 text-sm">{ex.instruction}</p>
                  <p className="mb-3 font-medium">{ex.question}</p>
                  {ex.options ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {ex.options.map((opt, oi) => {
                        const selected = userAns === opt;
                        const showCorrect = isChecked && opt === ex.answer;
                        const showWrong = isChecked && selected && opt !== ex.answer;
                        return (
                          <button
                            key={oi}
                            onClick={() => {
                              if (isChecked) return;
                              setExerciseAnswers((a) => ({ ...a, [idx]: opt }));
                            }}
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
                              {showCorrect ? <Check className="size-3.5" /> : showWrong ? <X className="size-3.5" /> : String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={userAns ?? ""}
                      onChange={(e) => setExerciseAnswers((a) => ({ ...a, [idx]: e.target.value }))}
                      disabled={isChecked}
                      placeholder="Nhập câu trả lời..."
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  )}
                  {!isChecked && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={() => checkExercise(idx)}
                      disabled={!userAns?.trim()}
                    >
                      Kiểm tra
                    </Button>
                  )}
                  {isChecked && (
                    <div className="mt-2">
                      <p className={cn("text-sm font-medium", isCorrect ? "text-green-600" : "text-red-600")}>
                        {isCorrect ? "Chính xác!" : `Đáp án đúng: ${ex.answer}`}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">{ex.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="font-medium">Tóm tắt / Nói lại bằng tiếng Anh</h3>
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
          <Button size="sm" onClick={handleSaveSummary} disabled={!summary.trim() || summarySaved}>
            {summarySaved ? "Đã lưu" : "Lưu tóm tắt"}
          </Button>
          {summarySaved && (
            <span className="ml-2 text-xs text-green-600">✓ Tóm tắt đã lưu cho bài này</span>
          )}
        </div>
      </div>

      {/* Result */}
      {allChecked && (
        <div className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm">
          <p className="text-lg font-semibold">
            Kết quả: {correctCount}/{questions.length} câu đúng
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {correctCount === questions.length
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
                setExerciseAnswers({});
                setExerciseChecked({});
              }}
            >
              <RotateCcw className="size-4" /> Làm lại
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}