"use client";

import { useState } from "react";
import { startSpeakingSession } from "@/app/actions/speaking";
import { SpeakingSession } from "./speaking-session";
import topicsData from "@/data/speaking-topics.json";

const GROUPS = topicsData.groups;

export function SpeakingHome() {
  const [session, setSession] = useState<{
    sessionId: string;
    topic: string;
  } | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);

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

  const currentGroup = GROUPS.find((g) => g.id === activeGroup) ?? GROUPS[0];

  return (
    <div className="mx-auto max-w-4xl">
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

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {GROUPS.map((group) => (
          <button
            key={group.id}
            type="button"
            onClick={() => setActiveGroup(group.id)}
            className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              activeGroup === group.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {group.name}
          </button>
        ))}
      </div>

      <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
        {currentGroup.nameEn} — {currentGroup.topics.length} chủ đề
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {currentGroup.topics.map((topic) => (
          <button
            key={topic.id}
            type="button"
            disabled={starting}
            onClick={() => void start(topic.label)}
            className="group flex items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary/40 hover:bg-accent/40 disabled:opacity-50"
          >
            <span className="text-2xl">{topic.emoji}</span>
            <span className="flex-1">
              <span className="block font-medium text-foreground">
                {topic.label}
              </span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
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