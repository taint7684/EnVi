"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  ArrowLeft,
  Keyboard,
  Mic,
  Send,
  Square,
  Volume2,
} from "lucide-react";

import { endSpeakingSession } from "@/app/actions/speaking";
import { useRecorder } from "@/hooks/use-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import type {
  SpeakingError,
  SpeakingNextAction,
  SpeakingTurnResult,
} from "@/lib/types/speaking";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  step?: number;
  feedback_vi?: string;
  errors?: SpeakingError[];
  improved_answer?: string;
  top_errors?: string[];
  key_phrases?: string[];
  reflex_questions?: string[];
};

const STEPS = ["Hỏi", "Kiểm tra", "Cải thiện", "Nói lại", "Tổng kết"];

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

function mapNextAction(action: SpeakingNextAction): number {
  switch (action) {
    case "ask_question":
      return 2;
    case "request_retry":
      return 3;
    case "wrap_up":
    case "done":
      return 5;
    default:
      return 2;
  }
}

export function SpeakingSession({
  sessionId,
  topic,
  onEnd,
}: {
  sessionId: string;
  topic: string;
  onEnd: () => void;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [displayStep, setDisplayStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);

  const {
    error: recorderError,
    isRecording,
    start: startRecording,
    stop: stopRecording,
  } = useRecorder();

  const { speak } = useSpeechSynthesis();

  const requestAI = useCallback(
    async (userMessage: string, step: number) => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai/speaking", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            currentStep: step,
            topic,
            userMessage,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Không thể lấy phản hồi AI.");
        }

        const data = (await response.json()) as {
          result: SpeakingTurnResult;
        };
        const result = data.result;

        setMessages((previous) => [
          ...previous,
          {
            id: makeId(),
            role: "ai",
            text: result.ai_response_en,
            step: result.step,
            feedback_vi: result.feedback_vi || undefined,
            errors: result.errors?.length ? result.errors : undefined,
            improved_answer: result.improved_answer || undefined,
            top_errors: result.top_errors?.length
              ? result.top_errors
              : undefined,
            key_phrases: result.key_phrases?.length
              ? result.key_phrases
              : undefined,
            reflex_questions: result.reflex_questions?.length
              ? result.reflex_questions
              : undefined,
          },
        ]);

        setDisplayStep(result.step);
        setCurrentStep(mapNextAction(result.next_action));
        speak(result.ai_response_en);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Có lỗi xảy ra.");
      } finally {
        setLoading(false);
      }
    },
    [sessionId, topic, speak],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void requestAI("", 1);
  }, [requestAI]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, transcribing]);

  const sendUserMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((previous) => [
        ...previous,
        { id: makeId(), role: "user", text: trimmed },
      ]);
      setTextInput("");
      void requestAI(trimmed, currentStep);
    },
    [currentStep, requestAI],
  );

  const transcribeAndSend = useCallback(
    async (blob: Blob) => {
      setTranscribing(true);
      setError(null);

      try {
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");

        const response = await fetch("/api/stt", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(
            data.error ?? "Không thể chuyển giọng nói thành văn bản.",
          );
        }

        const data = (await response.json()) as { text: string };
        const text = data.text?.trim();

        if (!text) {
          throw new Error(
            "Không nghe được giọng nói. Hãy thử lại hoặc nhập bằng bàn phím.",
          );
        }

        setTranscribing(false);
        sendUserMessage(text);
      } catch (cause) {
        setTranscribing(false);
        setError(
          cause instanceof Error ? cause.message : "Có lỗi khi xử lý giọng nói.",
        );
      }
    },
    [sendUserMessage],
  );

  const handleToggleRecording = useCallback(async () => {
    if (isRecording) {
      try {
        const blob = await stopRecording();
        await transcribeAndSend(blob);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Không thể xử lý ghi âm.",
        );
      }
      return;
    }

    await startRecording();
  }, [isRecording, startRecording, stopRecording, transcribeAndSend]);

  const handleEnd = useCallback(async () => {
    try {
      await endSpeakingSession(sessionId);
    } catch {
      // ignore
    }
    onEnd();
  }, [sessionId, onEnd]);

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    sendUserMessage(textInput);
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-foreground">
            {topic}
          </h1>
          <p className="text-sm text-muted-foreground">
            Bước {displayStep}/5 · {STEPS[displayStep - 1]}
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleEnd()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Kết thúc
        </button>
      </div>

      <div className="mb-4 flex gap-1">
        {STEPS.map((label, index) => (
          <div
            key={label}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              index < displayStep ? "bg-primary" : "bg-muted"
            }`}
          />
        ))}
      </div>

      <div className="flex min-h-[420px] max-h-[60vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-sm">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            onSpeak={() => speak(message.text)}
          />
        ))}

        {loading ? <TypingIndicator label="AI đang suy nghĩ" /> : null}
        {transcribing ? (
          <TypingIndicator label="Đang nghe giọng nói" />
        ) : null}

        <div ref={bottomRef} />
      </div>

      {recorderError || error ? (
        <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {recorderError ?? error}
        </div>
      ) : null}

      {showTextInput || recorderError ? (
        <form onSubmit={handleManualSubmit} className="mt-3 flex gap-2">
          <input
            value={textInput}
            onChange={(event) => setTextInput(event.target.value)}
            placeholder="Nhập câu trả lời bằng tiếng Anh..."
            className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={!textInput.trim() || loading || transcribing}
            className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="size-4" />
            Gửi
          </button>
        </form>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => void handleToggleRecording()}
          disabled={loading || transcribing}
          className={`inline-flex h-12 items-center gap-2 rounded-full px-6 text-sm font-semibold text-white transition-colors disabled:opacity-50 ${
            isRecording
              ? "animate-pulse bg-red-500 hover:bg-red-600"
              : "bg-primary hover:bg-primary/90"
          }`}
        >
          {isRecording ? (
            <Square className="size-4" />
          ) : (
            <Mic className="size-4" />
          )}
          {isRecording ? "Dừng thu âm" : "Ghi âm"}
        </button>

        <button
          type="button"
          onClick={() => setShowTextInput((value) => !value)}
          className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Keyboard className="size-4" />
          {showTextInput ? "Ẩn bàn phím" : "Nhập bằng bàn phím"}
        </button>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onSpeak,
}: {
  message: ChatMessage;
  onSpeak: () => void;
}) {
  if (message.role === "user") {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
          {message.text}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%] rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 shadow-sm">
        <div className="flex items-start gap-2">
          <p className="flex-1 text-sm text-foreground">{message.text}</p>
          <button
            type="button"
            onClick={onSpeak}
            className="mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground transition-colors hover:bg-accent/80"
            aria-label="Nghe lại"
          >
            <Volume2 className="size-3.5" />
          </button>
        </div>

        {message.feedback_vi ? (
          <p className="mt-2 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
            {message.feedback_vi}
          </p>
        ) : null}

        {message.errors && message.errors.length > 0 ? (
          <div className="mt-2 space-y-1.5 rounded-lg bg-red-50 px-3 py-2">
            <p className="text-xs font-semibold text-red-700">Lỗi cần sửa</p>
            {message.errors.map((item, index) => (
              <div key={index} className="text-sm">
                <p className="text-red-700">
                  <span className="font-medium">{item.error}</span>
                  {item.correction ? ` → ${item.correction}` : ""}
                </p>
                {item.explanation_vi ? (
                  <p className="text-xs text-red-600/80">
                    {item.explanation_vi}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {message.improved_answer ? (
          <div className="mt-2 rounded-lg bg-green-50 px-3 py-2">
            <p className="text-xs font-semibold text-green-700">
              Câu cải thiện
            </p>
            <p className="text-sm text-green-800">{message.improved_answer}</p>
          </div>
        ) : null}

        {message.top_errors && message.top_errors.length > 0 ? (
          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2">
            <p className="text-xs font-semibold text-red-700">3 lỗi chính</p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-red-700">
              {message.top_errors.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {message.key_phrases && message.key_phrases.length > 0 ? (
          <div className="mt-2 rounded-lg bg-green-50 px-3 py-2">
            <p className="text-xs font-semibold text-green-700">
              5 cụm từ hữu ích
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-green-800">
              {message.key_phrases.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {message.reflex_questions && message.reflex_questions.length > 0 ? (
          <div className="mt-2 rounded-lg bg-accent px-3 py-2">
            <p className="text-xs font-semibold text-accent-foreground">
              3 câu hỏi phản xạ
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-accent-foreground">
              {message.reflex_questions.map((item, index) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function TypingIndicator({ label }: { label: string }) {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-background px-4 py-3 text-sm text-muted-foreground shadow-sm">
        <span>{label}</span>
        <span className="flex gap-1">
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]" />
          <span className="size-1.5 animate-bounce rounded-full bg-muted-foreground" />
        </span>
      </div>
    </div>
  );
}