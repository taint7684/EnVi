"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { reviewWord } from "@/app/actions/srs";
import { setTriageStatus } from "@/lib/vocab/triage";
import type { DueCard, ReviewGrade } from "@/lib/types";

import { Flashcard } from "./flashcard";
import { RatingBar } from "./rating-bar";
import { Button } from "@/components/ui/button";

const MAX_REQUEUE = 2;
const GRADES: ReviewGrade[] = ["again", "hard", "good", "easy"];

function isInteractive(target: EventTarget | null): boolean {
  return (
    target instanceof HTMLElement &&
    target.closest("button, input, textarea, select, a") !== null
  );
}

export function VocabSession({ cards }: { cards: DueCard[] }) {
  const [queue, setQueue] = useState<DueCard[]>(cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [triagePending, setTriagePending] = useState<{
    wordId: string;
    status: string;
  } | null>(null);
  const requeueCount = useRef<Record<string, number>>({});
  const ratedIndex = useRef<number | null>(null);

  const current = queue[index];
  const done = index >= queue.length;

  const rate = useCallback(
    (grade: ReviewGrade) => {
      if (!current || ratedIndex.current === index) return;
      ratedIndex.current = index;

      setError(null);

      if (grade === "again") {
        const count = requeueCount.current[current.word.id] ?? 0;
        if (count < MAX_REQUEUE) {
          requeueCount.current[current.word.id] = count + 1;
          setQueue((previous) => [...previous, current]);
        }
      }

      setIndex((previous) => previous + 1);
      setFlipped(false);

      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }

      void reviewWord(current.word.id, grade).catch((cause) => {
        setError(
          cause instanceof Error ? cause.message : "Có lỗi xảy ra khi lưu.",
        );
      });
    },
    [current, index],
  );

  async function handleTriage(status: "known" | "unknown") {
    if (!current) return;
    setTriagePending({ wordId: current.word.id, status });
    try {
      await setTriageStatus({ wordId: current.word.id, status });
      if (status === "known") {
        advanceTriage();
      } else {
        rate("again");
      }
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Lỗi đánh dấu từ.",
      );
    } finally {
      setTriagePending(null);
    }
  }

  function advanceTriage() {
    setFlipped(false);
    setIndex((i) => i + 1);
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (done) return;

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
  }, [done, rate]);

  if (done) {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <p className="text-4xl">🎉</p>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
          Bạn đã ôn hết thẻ hôm nay!
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hẹn gặp lại bạn ở lượt ôn tiếp theo.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Thẻ {index + 1}/{queue.length}
        </span>
        <span>{current.word.pos ?? ""}</span>
        <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
          Chunk {current.word.chunk_index ?? "–"}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${(index / queue.length) * 100}%` }}
        />
      </div>

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

      <RatingBar onRate={rate} />

      <div className="mt-4 flex items-center justify-center gap-2">
        <Button
          onClick={() => handleTriage("known")}
          disabled={
            triagePending?.wordId === current.word.id &&
            triagePending.status === "known"
          }
          variant="outline"
        >
          {triagePending?.wordId === current.word.id &&
          triagePending.status === "known"
            ? "…"
            : "Đã biết"}
        </Button>
        <Button
          onClick={() => handleTriage("unknown")}
          disabled={
            triagePending?.wordId === current.word.id &&
            triagePending.status === "unknown"
          }
          variant="outline"
        >
          {triagePending?.wordId === current.word.id &&
          triagePending.status === "unknown"
            ? "…"
            : "Chưa biết"}
        </Button>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Space để lật · 1–4 để đánh giá
      </p>
    </div>
  );
}