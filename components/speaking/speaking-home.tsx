"use client";

import { useCallback, useState } from "react";
import { startSpeakingSession } from "@/app/actions/speaking";
import { SpeakingSession } from "./speaking-session";
import topicsData from "@/data/speaking-topics.json";
import {
  SPEAKING_QUESTIONS_BY_LEVEL,
  LEVEL_LABELS,
  type Level,
} from "@/data/speaking-questions-by-level";

const GROUPS = topicsData.groups;

export function SpeakingHome() {
  const [session, setSession] = useState<{
    sessionId: string;
    topic: string;
    topicId: string;
    level: Level;
    aiMode: "ai" | "fallback";
  } | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeGroup, setActiveGroup] = useState(GROUPS[0].id);
  const [activeLevel, setActiveLevel] = useState<Level>("A2");
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [aiMode, setAiMode] = useState<"ai" | "fallback">("ai");

  async function start(topicId: string, topicLabel: string, level: Level) {
    setStarting(true);
    setError(null);

    try {
      const { sessionId } = await startSpeakingSession();
      if (!sessionId) {
        setError("Server không trả về sessionId.");
        return;
      }
      setSession({ sessionId, topic: topicLabel, topicId, level, aiMode });
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
        topicId={session.topicId}
        level={session.level}
        initialMode={session.aiMode}
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
          Chọn chủ đề, cấp độ và luyện nói 5 bước với AI
        </p>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-muted p-1">
        {GROUPS.map((group: (typeof topicsData.groups)[number]) => (
          <button
            key={group.id}
            type="button"
            onClick={() => {
              setActiveGroup(group.id);
              setSelectedTopicId(null);
            }}
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

      <div className="mb-6 flex items-center gap-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Cấp độ
        </span>
        <div className="flex rounded-lg border border-border">
          {["A2", "B1", "B2"].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setActiveLevel(level as Level)}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                activeLevel === level
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {LEVEL_LABELS[level as Level]}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 flex items-center gap-4">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Phản hồi
        </span>
        <div className="flex rounded-lg border border-border">
          <button
            type="button"
            onClick={() => setAiMode("ai")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              aiMode === "ai"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Có AI (đánh giá)
          </button>
          <button
            type="button"
            onClick={() => setAiMode("fallback")}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              aiMode === "fallback"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            Không AI (tự luyện)
          </button>
        </div>
      </div>

      <p className="mb-3 text-xs uppercase tracking-wide text-muted-foreground">
        {currentGroup.nameEn} — {currentGroup.topics.length} chủ đề
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {currentGroup.topics.map((topic: (typeof currentGroup.topics)[number]) => {
          const topicInfo = SPEAKING_QUESTIONS_BY_LEVEL.find(
            (t) => t.id === topic.id,
          );
          const fiveQuestions =
            topicInfo?.levels[activeLevel].slice(0, 5) ?? [];
          const isSelected = selectedTopicId === topic.id;
          return (
            <div
              key={topic.id}
              className={`group flex flex-col items-start gap-3 rounded-2xl border p-4 text-left shadow-sm transition-colors ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-primary/40 hover:bg-accent/40"
              }`}
              onClick={() => setSelectedTopicId(topic.id)}
            >
              <div className="flex items-start gap-3 w-full cursor-pointer">
                <span className="text-2xl shrink-0">{topic.emoji}</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-medium text-foreground">
                    {topic.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-foreground truncate">
                    {topic.desc}
                  </span>
                </span>
              </div>

              {isSelected && (
                <div className="mt-3 w-full rounded-lg border border-border bg-muted p-3">
                  <p className="text-xs font-semibold text-foreground mb-2">
                    5 câu hỏi phổ biến — {LEVEL_LABELS[activeLevel]}
                  </p>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-4">
                    {fiveQuestions.map((q, i) => (
                      <li key={i}>{q}</li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() =>
                      void start(topic.id, topic.label, activeLevel)
                    }
                    className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    Bắt đầu luyện
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {starting ? (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Đang tạo phiên...
        </p>
      ) : null}
    </div>
  );
}
