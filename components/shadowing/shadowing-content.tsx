"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { SHADOWING_LESSONS } from "@/lib/shadowing-data";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 5;

const ShadowingPlayer = dynamic(
  () => import("@/components/shadowing/shadowing-player").then((m) => m.ShadowingPlayer),
  {
    loading: () => (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang tải video...</p>
        </div>
      </div>
    ),
    ssr: false,
  },
);

export function ShadowingContent() {
  const [visible, setVisible] = useState(PAGE_SIZE);
  const lessons = SHADOWING_LESSONS.slice(0, visible);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-2 font-serif text-2xl font-semibold">Shadowing</h1>
      <p className="mb-6 text-muted-foreground">
        Nghe và nói lại theo video. Nhấp vào lời thoại để tua đến đoạn đó.
      </p>

      <div className="space-y-6">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <ShadowingPlayer lesson={lesson} />
          </div>
        ))}
      </div>

      {visible < SHADOWING_LESSONS.length ? (
        <div className="mt-6 flex justify-center">
          <Button
            variant="outline"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
          >
            Xem thêm ({SHADOWING_LESSONS.length - visible} bài)
          </Button>
        </div>
      ) : null}
    </div>
  );
}