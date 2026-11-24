"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, CheckCircle2, RotateCcw, ThumbsDown, ThumbsUp, Trophy, Zap } from "lucide-react";

import { reviewWord, updateSessionState } from "@/app/actions/srs";
import { setTriageStatus } from "@/lib/vocab/triage";
import {
  applyGrade,
  continueGroup as continueGroupState,
  enterPractice,
  initialGradeState,
  isDifficult,
  type GradeState,
} from "@/lib/vocab-session";
import type { DueCard, ReviewGrade, VocabSessionState } from "@/lib/types";

import { Flashcard } from "./flashcard";
import { RatingBar } from "./rating-bar";
import { Button } from "@/components/ui/button";

const GRADES: ReviewGrade[] = ["again", "hard", "good", "easy"];

function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("button, input, textarea, select, a") !== null
  );
}

export function VocabSession({
  cards,
  initialSessionState,
}: {
  cards: DueCard[];
  initialSessionState: VocabSessionState;
}) {
  const [queue, setQueue] = useState<DueCard[]>(cards);
  const [gradeState, setGradeState] = useState<GradeState>(() => ({
    ...initialGradeState(initialSessionState.group_size || 20),
    queueLength: cards.length,
    newWordsInGroup: initialSessionState.new_words_count,
  }));
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sessionState, setSessionState] = useState(initialSessionState);
  const [triageBusy, setTriageBusy] = useState(false);

  const requeueCount = useRef<Record<string, number>>({});
  const ratedIndex = useRef<number | null>(null);

  const { mode, queueIndex, groupSize, groupFinished, newWordsInGroup } = gradeState;
  const current = queue[queueIndex];
  const done = queueIndex >= queue.length;
  const groupProgress = Math.min(newWordsInGroup / groupSize, 1);

  const rate = useCallback(
    (grade: ReviewGrade) => {
      if (!current || ratedIndex.current === queueIndex || submitting) return;
      ratedIndex.current = queueIndex;
      setSubmitting(true);
      setError(null);

      const count = requeueCount.current[current.word.id] ?? 0;
      const result = applyGrade(gradeState, current, grade, count);

      if (result.requeue) {
        requeueCount.current[current.word.id] = count + 1;
        setQueue((previous) => [...previous, current]);
      }

      setGradeState(result.state);
      setFlipped(false);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      void reviewWord(current.word.id, grade, result.state.mode)
        .then(() => {
          if (result.state.mode === "official") {
            if (result.countedAsNew) {
              void updateSessionState({ newWordsCount: result.state.newWordsInGroup });
            }

            if (isDifficult(grade) && result.countedAsNew) {
              const nextDifficult = [...sessionState.difficult_word_ids, current.word.id];
              setSessionState((prev) => ({
                ...prev,
                difficult_word_ids: nextDifficult,
              }));
              void updateSessionState({ difficultWordIds: nextDifficult });
            }

            if (result.reachedGroupEnd) {
              void updateSessionState({
                newWordsCount: 0,
                currentPosition: 0,
                groupStartedAt: new Date().toISOString(),
              });
            }
          }
        })
        .catch((cause) => {
          setError(
            cause instanceof Error ? cause.message : "Có lỗi xảy ra khi lưu.",
          );
        })
        .finally(() => {
          setSubmitting(false);
          ratedIndex.current = null;
        });
    },
    [current, queueIndex, submitting, gradeState, sessionState.difficult_word_ids],
  );

  const startPractice = useCallback(() => {
    setQueue(cards);
    requeueCount.current = {};
    ratedIndex.current = null;
    setGradeState(enterPractice(gradeState, cards.length));
    setFlipped(false);
  }, [cards, gradeState]);

  const handleTriage = useCallback(
    async (status: "known" | "unknown") => {
      if (!current || triageBusy || submitting) return;
      setTriageBusy(true);
      setError(null);
      const wordId = current.word.id;

      try {
        await setTriageStatus({ wordId, status });

        if (status === "known") {
          // Remove this card from the queue — user already knows it
          const newQueue = queue.filter((_, i) => i !== queueIndex);
          setQueue(newQueue);
          setGradeState((prev) => ({
            ...prev,
            queueLength: newQueue.length,
            // queueIndex stays the same — next card shifts into this position
          }));
          setFlipped(false);
        } else {
          // Unknown — advance to next card, keep in queue for grading
          setGradeState((prev) => ({
            ...prev,
            queueIndex: prev.queueIndex + 1,
          }));
          setFlipped(false);
        }
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Có lỗi xảy ra khi lưu.",
        );
      } finally {
        setTriageBusy(false);
      }
    },
    [current, triageBusy, submitting, queueIndex, queue],
  );

  const handleContinueGroup = useCallback(() => {
    const remaining = cards.slice(queueIndex);
    setQueue(remaining);
    requeueCount.current = {};
    ratedIndex.current = null;
    setGradeState(continueGroupState(gradeState, remaining.length));
    setFlipped(false);
    void updateSessionState({
      newWordsCount: 0,
      currentPosition: queueIndex,
      groupStartedAt: new Date().toISOString(),
    });
  }, [cards, queueIndex, gradeState]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (done || groupFinished || submitting) return;

      if (event.key === " " || event.key === "Enter") {
        if (isInteractive(event.target)) return;
        event.preventDefault();
        setFlipped((previous) => !previous);
        return;
      }

      if (event.key >= "1" && event.key <= "4") {
        const grade = GRADES[Number(event.key) - 1];
        if (grade) rate(grade);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [done, rate, groupFinished, submitting]);

  if (groupFinished) {
    const difficult = sessionState.difficult_word_ids;
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
          <Trophy className="size-8 text-primary" />
        </div>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          Hoàn thành nhóm {groupSize} từ!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn đã học {groupSize} từ mới. Có thể ôn lại ngay hoặc học tiếp.
        </p>

        {difficult.length > 0 ? (
          <div className="mt-6 rounded-xl bg-amber-50 p-4 text-left">
            <p className="text-sm font-medium text-amber-800">
              {difficult.length} từ khó cần ôn lại:
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {difficult.slice(0, 10).map((id: string) => (
                <span
                  key={id}
                  className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700"
                >
                  {id.slice(0, 8)}…
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={startPractice} className="w-full">
            <RotateCcw className="mr-2 size-4" />
            Ôn lại nhóm vừa học
          </Button>
          <Button onClick={handleContinueGroup} variant="outline" className="w-full">
            <BookOpen className="mr-2 size-4" />
            Học tiếp {groupSize} từ mới
          </Button>
        </div>
      </div>
    );
  }

  if (done) {
    const totalReviewed = queue.length;
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="size-8 text-green-600" />
        </div>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          {mode === "practice"
            ? "Hoàn thành ôn tập!"
            : "Bạn đã ôn hết thẻ hôm nay!"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {mode === "practice"
            ? "Ôn tập không ảnh hưởng lịch chính."
            : `Đã ôn ${totalReviewed} thẻ. Hẹn gặp lại ở lượt tiếp theo.`}
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {mode === "practice" ? (
            <Button onClick={handleContinueGroup} className="w-full">
              <BookOpen className="mr-2 size-4" />
              Quay lại lịch chính
            </Button>
          ) : (
            <>
              <Button onClick={startPractice} variant="outline" className="w-full">
                <RotateCcw className="mr-2 size-4" />
                Ôn lại nhóm vừa học
              </Button>
              {cards.length > queueIndex ? (
                <Button onClick={handleContinueGroup} className="w-full">
                  <Zap className="mr-2 size-4" />
                  Học tiếp
                </Button>
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {mode === "practice" ? "Ôn tập" : "Lịch chính"} · Thẻ {queueIndex + 1}/{queue.length}
        </span>
        <span>{current.word.pos ?? ""}</span>
        <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          {current.review === null ? "Mới" : "Ôn"}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(queueIndex / queue.length) * 100}%` }}
        />
      </div>

      {mode === "official" ? (
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${groupProgress * 100}%` }}
            />
          </div>
          <span>
            {newWordsInGroup}/{groupSize} từ mới
          </span>
        </div>
      ) : null}

      {error ? (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mt-6">
        <Flashcard
          card={current}
          flipped={flipped}
          onFlip={() => setFlipped((previous) => !previous)}
        />
      </div>

      {current.review === null && !current.triageStatus ? (
        <div className="mt-4 rounded-xl bg-muted/50 p-3">
          <p className="mb-2 text-center text-xs text-muted-foreground">
            Bạn có biết từ này trước khi học không?
          </p>
          <div className="flex justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTriage("unknown")}
              disabled={triageBusy || submitting}
              className="border-amber-300 text-amber-700 hover:bg-amber-50"
            >
              <ThumbsDown className="mr-1.5 size-4" />
              Chưa biết
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTriage("known")}
              disabled={triageBusy || submitting}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <ThumbsUp className="mr-1.5 size-4" />
              Đã biết
            </Button>
          </div>
        </div>
      ) : current.triageStatus === "known" ? (
        <div className="mt-4 rounded-xl bg-emerald-50 p-2 text-center text-xs text-emerald-700">
          Đã đánh dấu: Biết từ này
        </div>
      ) : current.triageStatus === "unknown" ? (
        <div className="mt-4 rounded-xl bg-amber-50 p-2 text-center text-xs text-amber-700">
          Đã đánh dấu: Chưa biết — đang học
        </div>
      ) : null}

      <RatingBar onRate={rate} disabled={submitting} />

      <p className="mt-3 text-center text-xs text-muted-foreground">
        {mode === "practice"
          ? "Ôn tập không ảnh hưởng lịch chính · Space để lật · 1–4 để đánh giá"
          : "Space để lật · 1–4 để đánh giá"}
      </p>
    </div>
  );
}