"use client";

import { useState } from "react";

import { startSpeakingSession } from "@/app/actions/speaking";

import { SpeakingSession } from "./speaking-session";

const TOPICS = [
  {
    id: "daily-routine",
    label: "Daily Routine",
    emoji: "🌅",
    desc: "Những việc bạn làm mỗi ngày",
  },
  {
    id: "work",
    label: "Work",
    emoji: "💼",
    desc: "Công việc, đồng nghiệp, họp",
  },
  {
    id: "hobbies",
    label: "Hobbies",
    emoji: "🎨",
    desc: "Sở thích, thời gian rảnh",
  },
  {
    id: "travel",
    label: "Travel",
    emoji: "✈️",
    desc: "Đi lại, đặt phòng, hỏi đường",
  },
  {
    id: "food",
    label: "Food",
    emoji: "🍜",
    desc: "Đồ ăn, nhà hàng, gọi món",
  },
];

export function SpeakingHome() {
  const [session, setSession] = useState<{
    sessionId: string;
    topic: string;
  } | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start(topic: string) {
    setStarting(true);
    setError(null);

    try {
      const { sessionId } = await startSpeakingSession();
      setSession({ sessionId, topic });
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Không thể bắt đầu phiên.",
      );
    } finally {
      setStarting(false);
    }
  }

  if (session) {
    return (
      <SpeakingSession
        sessionId={session.sessionId}
        topic={session.topic}
        onEnd={() => setSession(null)}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          AI Speaking Coach
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Chọn chủ đề để luyện nói 5 bước với AI
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {TOPICS.map((topic) => (
          <button
            key={topic.id}
            type="button"
            disabled={starting}
            onClick={() => void start(topic.label)}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-5 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40 disabled:opacity-50"
          >
            <span className="text-3xl">{topic.emoji}</span>
            <span className="flex-1">
              <span className="block font-medium text-foreground">
                {topic.label}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {topic.desc}
              </span>
            </span>
          </button>
        ))}
      </div>

      {starting ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Đang tạo phiên...
        </p>
      ) : null}
    </div>
  );
}