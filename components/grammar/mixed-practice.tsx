"use client";

import { useState, useCallback } from "react";
import { Shuffle, RotateCcw, CheckCircle2, BookOpen, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExercisePlayer } from "./exercise-player";
import { GRAMMAR_EXERCISES } from "@/lib/grammar-exercises-data";
import type { GrammarMcq, GrammarFill } from "@/lib/grammar-exercises-data";
import type { GrammarV2Question } from "@/lib/grammar-v2-types";
import grammarMixed from "@/data/grammar-mixed.json";

type ExerciseType = "mcq" | "translation" | "error_correction" | "verb_conjugation";
type ExerciseQuestion = GrammarMcq | GrammarFill | GrammarV2Question;
type Mode = "mix_all" | "review_wrong";

type MixedQuestion = {
  _type: "mixed";
  id: string;
  exercise_type: ExerciseType;
  topic_id: string;
  topic_name: string;
  topic_name_vi: string;
  question?: string;
  options?: string[];
  answer?: number | string;
  correct?: number;
  explanation_vi?: string;
  vi?: string;
  hints?: string[];
  alternatives?: string[];
  sentence?: string;
  error_part?: string;
  correct_part?: string;
  corrected?: string;
  blanks?: { word: string; answer: string }[];
  full?: string;
};

const DEDICATED_MIXED = grammarMixed as MixedQuestion[];

const TYPE_LABELS: Record<ExerciseType, string> = {
  mcq: "Trắc nghiệm",
  translation: "Dịch",
  error_correction: "Sửa lỗi",
  verb_conjugation: "Chia động từ",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildMixedQuestions(count: number, v2Questions: GrammarV2Question[], excludeIds: Set<string> = new Set()): { question: ExerciseQuestion; type: ExerciseType; topicId: string; topicName: string }[] {
  const pool: { question: ExerciseQuestion; type: ExerciseType; topicId: string; topicName: string }[] = [];

  // Dedicated 320 mixed-practice questions (primary source)
  for (const q of DEDICATED_MIXED) {
    const id = `mixed-${q.exercise_type}-${q.topic_id}-${pool.length}`;
    if (!excludeIds.has(id)) {
      pool.push({ question: q as unknown as ExerciseQuestion, type: q.exercise_type, topicId: q.topic_id, topicName: q.topic_name });
    }
  }

  // Supplement with existing pool if dedicated questions run low
  if (pool.length < count) {
    for (const topic of GRAMMAR_EXERCISES) {
      for (const q of topic.mcq) {
        if (!excludeIds.has(`mcq-${q.id}-${topic.topicId}`)) {
          pool.push({ question: q, type: "mcq", topicId: topic.topicId, topicName: topic.name });
        }
      }
    }
    for (const q of v2Questions) {
      const id = `${q.exercise_type}-${(q as any).index}-${q.topic_id}`;
      if (!excludeIds.has(id)) {
        pool.push({ question: q, type: q.exercise_type as ExerciseType, topicId: q.topic_id, topicName: q.topic_name });
      }
    }
  }

  return shuffle(pool).slice(0, count);
}

export function MixedPractice({ wrongAnswerIds = [], v2Questions }: { wrongAnswerIds?: string[]; v2Questions: GrammarV2Question[] }) {
  const [questions, setQuestions] = useState<ReturnType<typeof buildMixedQuestions>>([]);
  const [index, setIndex] = useState(0);
  const [started, setStarted] = useState(false);
  const [results, setResults] = useState<{ topicId: string; topicName: string; correct: boolean }[]>([]);
  const [mode, setMode] = useState<Mode>("mix_all");

  const startSession = useCallback((sessionMode: Mode, count: number) => {
    setMode(sessionMode);
    setResults([]);
    setIndex(0);
    setStarted(true);
    if (sessionMode === "review_wrong") {
      // Filter to wrong answers
      const wrongSet = new Set(wrongAnswerIds);
      const qs = buildMixedQuestions(999, v2Questions).filter((q) => {
        const id = `${q.type}-${q.question.id}-${q.topicId}`;
        return wrongSet.has(id);
      });
      setQuestions(qs.length > 0 ? qs : buildMixedQuestions(count, v2Questions));
    } else {
      setQuestions(buildMixedQuestions(count, v2Questions));
    }
  }, [wrongAnswerIds, v2Questions]);

  const handleAnswer = useCallback((questionId: string, correct: boolean) => {
    const q = questions[index];
    if (!q) return;
    setResults((prev) => [...prev, { topicId: q.topicId, topicName: q.topicName, correct }]);
  }, [questions, index]);

  const handleNext = useCallback(() => {
    setIndex((i) => i + 1);
  }, []);

  if (!started) {
    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h3 className="mb-4 text-center font-serif text-lg font-semibold text-foreground">
            Luyện ngữ pháp tổng hợp
          </h3>
          <p className="mb-4 text-center text-sm text-muted-foreground">
            Trộn cả 16 chủ điểm và 4 dạng bài. Đề bài giấu tên chủ điểm cho đến khi nộp.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button onClick={() => startSession("mix_all", 20)} className="w-full">
              <Shuffle className="mr-2 size-4" />
              Trộn 16 chủ điểm (20 câu)
            </Button>
            <Button onClick={() => startSession("review_wrong", 20)} variant="outline" className="w-full" disabled={wrongAnswerIds.length === 0}>
              <AlertTriangle className="mr-2 size-4" />
              Ôn lỗi của tôi ({wrongAnswerIds.length})
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[10, 20, 40, 80].map((n) => (
              <Button key={n} variant="outline" onClick={() => startSession("mix_all", n)} className="text-sm">
                {n} câu
              </Button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const current = questions[index];
  const done = index >= questions.length;

  if (done || !current) {
    const byTopic: Record<string, { total: number; correct: number }> = {};
    for (const r of results) {
      if (!byTopic[r.topicName]) byTopic[r.topicName] = { total: 0, correct: 0 };
      byTopic[r.topicName].total++;
      if (r.correct) byTopic[r.topicName].correct++;
    }
    const totalCorrect = results.filter((r) => r.correct).length;

    return (
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-card p-6 text-center">
          <CheckCircle2 className="mx-auto size-10 text-green-500" />
          <h3 className="mt-2 font-serif text-lg font-semibold">
            Kết quả: {totalCorrect}/{results.length} câu đúng
          </h3>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-sm font-medium text-foreground">Kết quả theo chủ điểm:</p>
          <div className="space-y-1">
            {Object.entries(byTopic).map(([topic, r]) => (
              <div key={topic} className="flex items-center justify-between text-sm">
                <span>{topic}</span>
                <span className={`font-medium ${r.correct === r.total ? "text-green-600" : r.correct === 0 ? "text-red-600" : "text-amber-600"}`}>
                  {r.correct}/{r.total}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setStarted(false); setIndex(0); setResults([]); }} variant="outline" className="flex-1">
            <RotateCcw className="mr-2 size-4" />
            Lượt mới
          </Button>
        </div>
      </div>
    );
  }

  const exerciseType = current.type;
  const topicName = mode === "mix_all" ? "???" : current.topicName;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Câu {index + 1}/{questions.length}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
          {TYPE_LABELS[exerciseType]}
        </span>
      </div>

      <ExercisePlayer
        key={`${index}-${current.type}`}
        questions={[current.question]}
        exerciseType={exerciseType}
        onAnswer={handleAnswer}
        onNext={handleNext}
      />

      {mode === "mix_all" ? (
        <p className="text-center text-xs text-muted-foreground">
          Chủ điểm: <strong>{current.topicName}</strong> ·{" "}
          <a href={`/grammar#${current.topicId}`} className="text-primary underline">Xem lại lý thuyết</a>
        </p>
      ) : null}
    </div>
  );
}