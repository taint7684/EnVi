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
  ArrowRight,
  CheckCircle2,
  Keyboard,
  Mic,
  RefreshCw,
  Send,
  Square,
  Volume2,
  XCircle,
} from "lucide-react";

import { endSpeakingSession } from "@/app/actions/speaking";
import { useRecorder } from "@/hooks/use-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import {
  getLevelQuestions,
  LEVEL_LABELS,
  type Level,
} from "@/data/speaking-questions-by-level";
import type {
  SpeakingError,
  SpeakingNextAction,
  SpeakingTurnResult,
} from "@/lib/types/speaking";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  questionIndex?: number;
  step?: number;
  mode?: "topic" | "freespeak";
  feedback_vi?: string;
  errors?: SpeakingError[];
  improved_answer?: string;
  top_errors?: string[];
  key_phrases?: string[];
  reflex_questions?: string[];
  sttMs?: number;
  aiMs?: number;
};

const STEPS = ["Hỏi", "Kiểm tra", "Cải thiện", "Nói lại", "Tổng kết"];
const TOTAL_QUESTIONS = 5;

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
  topicId,
  level,
  onEnd,
}: {
  sessionId: string;
  topic: string;
  topicId: string;
  level: Level;
  onEnd: () => void;
}) {
  const [mode, setMode] = useState<"topic" | "freespeak">("topic");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rateLimitRetry, setRateLimitRetry] = useState<{
    userMessage: string;
    step: number;
    timestamp: number;
    mode: "topic" | "freespeak";
  } | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [fallbackQuestionIndex, setFallbackQuestionIndex] = useState(0);
  const [fallbackAudioUrl, setFallbackAudioUrl] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [sttMs, setSttMs] = useState<number | null>(null);
  const [aiMs, setAiMs] = useState<number | null>(null);
  const [transcript, setTranscript] = useState("");
  const [showingTranscript, setShowingTranscript] = useState(false);
  const [awaitingUserRepeat, setAwaitingUserRepeat] = useState(false);
  const [questionCompleted, setQuestionCompleted] = useState(false);
  const [showingQuestions, setShowingQuestions] = useState(true);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const startedRef = useRef(false);
  const lastSentRef = useRef<string | null>(null);
  const sessionStartedRef = useRef(false);

  const {
    error: recorderError,
    isRecording,
    start: startRecording,
    stop: stopRecording,
  } = useRecorder();

  const { speak } = useSpeechSynthesis();

  const currentTopicQuestions = mode === "topic"
    ? getLevelQuestions(topicId, level).slice(0, TOTAL_QUESTIONS)
    : [];
  const currentQuestion = currentTopicQuestions[questionIndex];
  const isLastQuestion = questionIndex >= TOTAL_QUESTIONS - 1;

  const requestAI = useCallback(
    async (userMessage: string, step: number, currentMode: "topic" | "freespeak", qIndex: number) => {
      if (lastSentRef.current === userMessage) return;
      lastSentRef.current = userMessage;

      setLoading(true);
      setError(null);
      setAiMs(null);

      const aiStart = Date.now();

      try {
        const response = await fetch("/api/ai/speaking", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            currentStep: step,
            topic,
            userMessage,
            mode: currentMode,
            questionIndex: qIndex,
            level,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Không thể lấy phản hồi AI.");
        }

        const data = (await response.json()) as {
          result: SpeakingTurnResult;
          aiMs?: number;
        };
        const result = data.result;

        setAiMs(data.aiMs ?? Date.now() - aiStart);

        setMessages((previous) => [
          ...previous,
          {
            id: makeId(),
            role: "ai",
            text: result.ai_response_en,
            questionIndex: qIndex,
            step: result.step,
            mode: result.mode ?? currentMode,
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
            aiMs: data.aiMs,
          },
        ]);

        setCurrentStep(result.step);

        if (result.next_action === "done") {
          setQuestionCompleted(true);
          setAwaitingUserRepeat(false);
        } else if (result.next_action === "request_retry") {
          setAwaitingUserRepeat(true);
        } else {
          setAwaitingUserRepeat(false);
        }

        speak(result.ai_response_en);
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Có lỗi xảy ra.";
        const isRateLimit =
          /429|rate.?limit|quota|hết lượt|đã quá giới hạn/i.test(message);

        if (isRateLimit) {
          setError(null);
          setRateLimitRetry({
            userMessage,
            step,
            timestamp: Date.now(),
            mode: currentMode,
          });
        } else {
          setRateLimitRetry(null);
          setFallbackMode(false);
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    },
    [sessionId, topic, speak],
  );

  useEffect(() => {
    if (mode !== "topic") return;
    const timer = setTimeout(() => {
      void requestAI(currentQuestion ?? "", 1, "topic", questionIndex);
    }, 0);
    return () => clearTimeout(timer);
  }, [requestAI, mode, questionIndex, currentQuestion]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, transcribing]);

  const sendUserMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      setMessages((previous) => [
        ...previous,
        {
          id: makeId(),
          role: "user",
          text: trimmed,
          questionIndex,
          mode,
        },
      ]);
      setTextInput("");
      setSttMs(null);
      setAiMs(null);
      setShowingTranscript(false);
      setTranscript("");
      // Sau khi AI hỏi (bước 1), câu trả lời của user phải được đánh giá ở bước 2.
      // Gửi currentStep + 1 để API build đúng prompt "kiểm tra" thay vì hỏi lại.
      const stepForAI =
        mode === "topic" ? Math.min(currentStep + 1, 5) : currentStep;
      void requestAI(trimmed, stepForAI, mode, questionIndex);
    },
    [currentStep, mode, questionIndex, requestAI],
  );

  const transcribeAndSend = useCallback(
    async (blob: Blob) => {
      setTranscribing(true);
      setError(null);
      setSttMs(null);

      const sttStart = Date.now();

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

        setSttMs(Date.now() - sttStart);

        if (!text) {
          setError(
            "Không nghe được giọng nói. Hãy thử lại hoặc nhập bằng bàn phím.",
          );
          setTranscribing(false);
          return;
        }

        setTranscript(text);
        setShowingTranscript(true);
        setTranscribing(false);
      } catch (cause) {
        setTranscribing(false);
        setSttMs(Date.now() - sttStart);
        setError(
          cause instanceof Error ? cause.message : "Có lỗi khi xử lý giọng nói.",
        );
      }
    },
    [],
  );

  const handleToggleRecording = useCallback(async () => {
    if (rateLimitRetry) {
      const remaining = Math.max(0, 30000 - (Date.now() - rateLimitRetry.timestamp));
      setError(
        `AI đang bận. Vui lòng đợi ${Math.ceil(remaining / 1000)} giây nữa hoặc chọn “Chuyển sang chế độ Tự luyện tập”.`,
      );
      return;
    }
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

    setTranscript("");
    setShowingTranscript(false);
    await startRecording();
  }, [isRecording, startRecording, stopRecording, transcribeAndSend, rateLimitRetry]);

  const handleSendTranscript = useCallback(() => {
    const text = (transcript || textInput || "").trim();
    if (!text) return;
    sendUserMessage(text);
  }, [transcript, textInput, sendUserMessage]);

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleSendTranscript();
  };

  const handleNextQuestion = useCallback(() => {
    if (questionIndex >= TOTAL_QUESTIONS - 1) return;
    setQuestionIndex((prev) => prev + 1);
    setCurrentStep(1);
    setQuestionCompleted(false);
    setAwaitingUserRepeat(false);
    setTranscript("");
    setShowingTranscript(false);
    setError(null);
    setSttMs(null);
    setAiMs(null);
    lastSentRef.current = null;
  }, [questionIndex]);

  const handleEnd = useCallback(async () => {
    try {
      await endSpeakingSession(sessionId);
    } catch {
      // ignore
    }
    onEnd();
  }, [sessionId, onEnd]);

  const handleFallbackToggleRecording = useCallback(async () => {
    if (isRecording) {
      try {
        const blob = await stopRecording();
        const url = URL.createObjectURL(blob);
        setFallbackAudioUrl(url);
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Không thể xử lý ghi âm.",
        );
      }
      return;
    }
    setFallbackAudioUrl(null);
    await startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleFallbackPlayback = useCallback(() => {
    if (!fallbackAudioUrl) return;
    const audio = new Audio(fallbackAudioUrl);
    audio.play();
  }, [fallbackAudioUrl]);

  const handleFallbackNext = useCallback(() => {
    const questions = getLevelQuestions(topicId, level);
    const nextIndex =
      fallbackQuestionIndex + 1 < questions.length
        ? fallbackQuestionIndex + 1
        : 0;
    setFallbackQuestionIndex(nextIndex);
    setFallbackAudioUrl(null);
  }, [fallbackQuestionIndex, topicId, level]);

  const handleRetryAI = useCallback(() => {
    setFallbackMode(false);
    setFallbackQuestionIndex(0);
    setFallbackAudioUrl(null);
    setRateLimitRetry(null);
    setError(null);
    lastSentRef.current = null;
  }, []);

  const handleModeChange = useCallback((newMode: "topic" | "freespeak") => {
    setMode(newMode);
    setError(null);
    setRateLimitRetry(null);
    setSttMs(null);
    setAiMs(null);
    setTranscript("");
    setShowingTranscript(false);
    lastSentRef.current = null;
    sessionStartedRef.current = false;
  }, []);

  const handleSpeakAI = useCallback((text: string) => {
    speak(text);
  }, [speak]);

  const canSend = Boolean(transcript.trim() || textInput.trim()) && !loading && !transcribing;

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-foreground">
            {topic}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "topic"
              ? `Câu ${questionIndex + 1}/${TOTAL_QUESTIONS} · Bước ${currentStep}/5 · ${STEPS[currentStep - 1]}`
              : "Nói tự do — AI sẽ trả lời và góp ý"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Chế độ:</span>
          <div className="flex rounded-lg border border-border">
            <button
              type="button"
              onClick={() => handleModeChange("topic")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === "topic"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Theo chủ đề
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("freespeak")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                mode === "freespeak"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              Nói tự do
            </button>
          </div>
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

      {mode === "topic" && !fallbackMode && showingQuestions && (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            5 câu hỏi — {LEVEL_LABELS[level]}
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-6 mb-4">
            {getLevelQuestions(topicId, level).map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => setShowingQuestions(false)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Bắt đầu luyện
          </button>
        </div>
      )}

      {mode === "topic" && !fallbackMode && !showingQuestions && (
        <div className="mb-4 flex gap-1">
          {[...Array(TOTAL_QUESTIONS)].map((_, index) => (
            <div
              key={index}
              className={`h-1.5 w-3 rounded-full transition-colors ${
                index < questionIndex ? "bg-primary" : index === questionIndex ? "bg-primary/50" : "bg-muted"
              }`}
            />
          ))}
        </div>
      )}

      {!showingQuestions && (
        <>
          <div className="flex min-h-[420px] max-h-[60vh] flex-col gap-3 overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-sm">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSpeak={() => handleSpeakAI(message.text)}
              />
            ))}

            {loading ? <TypingIndicator label="AI đang suy nghĩ" /> : null}
            {transcribing ? (
              <TypingIndicator label="Đang nghe giọng nói" />
            ) : null}

            {(sttMs !== null || aiMs !== null) && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border bg-muted px-3 py-2 text-xs text-muted-foreground shadow-sm">
                  {sttMs !== null && <span>Chép lời: {sttMs}ms</span>}
                  {sttMs !== null && aiMs !== null && <span>·</span>}
                  {aiMs !== null && <span>AI: {aiMs}ms</span>}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {rateLimitRetry ? (
            <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700 flex flex-col items-start gap-2">
              <span>
                AI đang bận một chút. Vui lòng đợi trong giây lát nhé!
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const { userMessage, step, mode: retryMode } = rateLimitRetry;
                    setRateLimitRetry(null);
                    setError(null);
                    void requestAI(userMessage, step, retryMode, questionIndex);
                  }}
                  className="text-sm font-medium text-amber-700 underline hover:text-amber-800"
                >
                  Thử lại
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRateLimitRetry(null);
                    setError(null);
                    setFallbackMode(true);
                  }}
                  className="text-sm font-medium text-blue-600 underline hover:text-blue-700"
                >
                  Tiếp tục tự luyện
                </button>
              </div>
            </div>
          ) : recorderError || error ? (
            <div className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {recorderError ?? error}
            </div>
          ) : null}

          {fallbackMode ? (
            <div className="mt-3 flex flex-col items-center gap-4">
              <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700 mb-2">
                Chế độ tự luyện tập (AI tạm thời không khả năng). Bạn tự nghe câu
                hỏi, ghi âm và phát lại để so sánh. Không có đánh giá AI.
              </div>
              <div className="rounded-2xl border border-border bg-white p-6 shadow-sm w-full max-w-lg">
                <p className="text-sm font-semibold text-foreground mb-4">
                  Câu hỏi {fallbackQuestionIndex + 1}/{
                    getLevelQuestions(topicId, level).length
                  }
                </p>
                <p className="text-lg text-foreground italic">
                  {"\""}
                  {getLevelQuestions(topicId, level)[fallbackQuestionIndex]}
                  {"\""}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleFallbackToggleRecording}
                  disabled={isRecording}
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
                  {isRecording ? "Dừng" : "Ghi âm"}
                </button>

                {fallbackAudioUrl ? (
                  <button
                    type="button"
                    onClick={handleFallbackPlayback}
                    className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <Volume2 className="size-4" />
                    Phát lại
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleFallbackNext}
                  disabled={isRecording}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
                >
                  <ArrowRight className="size-4" />
                  Tiếp theo
                </button>
              </div>

              <button
                type="button"
                onClick={handleRetryAI}
                className="text-sm text-muted-foreground underline hover:text-foreground"
              >
                ← Thử kết nối lại AI
              </button>
            </div>
          ) : null}

          {!fallbackMode && showingTranscript && (
            <div className="mt-3 flex flex-col gap-2">
              <div className="rounded-lg border border-border bg-muted p-3">
                <p className="text-xs font-semibold text-foreground mb-1">
                  Bản chép lời nói của bạn
                </p>
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                  <input
                    value={transcript}
                    onChange={(event) => setTranscript(event.target.value)}
                    placeholder="Sửa bản chép nếu cần..."
                    className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                    disabled={loading || transcribing}
                  />
                  <button
                    type="submit"
                    disabled={
                      !transcript.trim() || loading || transcribing
                    }
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    <Send className="size-4" />
                    Gửi AI
                  </button>
                  </form>
              </div>
            </div>
          )}
          {showTextInput && (
            <div className="rounded-lg border border-border bg-muted p-3">
              <p className="text-xs font-semibold text-foreground mb-1">
                Hoặc nhập bằng bàn phím
              </p>
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  value={textInput}
                  onChange={(event) => setTextInput(event.target.value)}
                  placeholder="Nhập câu trả lời bằng tiếng Anh..."
                  className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  disabled={loading || transcribing}
                />
                <button
                  type="submit"
                  disabled={
                    !textInput.trim() || loading || transcribing
                  }
                  className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  <Send className="size-4" />
                  Gửi AI
                </button>
              </form>
            </div>
          )}

          {!fallbackMode && !showingTranscript && !loading && !transcribing && (
            <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => void handleToggleRecording()}
                disabled={!!rateLimitRetry || questionCompleted}
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
                disabled={loading || transcribing}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Keyboard className="size-4" />
                {showTextInput ? "Ẩn bàn phím" : "Nhập bằng bàn phím"}
              </button>
            </div>
          )}

          {awaitingUserRepeat && !questionCompleted && !fallbackMode && (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 flex flex-col items-start gap-2">
              <span>
                Hãy nói lại câu đã cải thiện ở trên. Khi xong, bấm Ghi âm và đọc
                lại.
              </span>
              <button
                type="button"
                onClick={() => {
                  setAwaitingUserRepeat(false);
                  setQuestionCompleted(true);
                }}
                className="text-sm font-medium text-green-700 underline hover:text-green-800"
              >
                Tôi đã nói lại, sang câu tiếp theo
              </button>
            </div>
          )}

          {questionCompleted && !isLastQuestion && !fallbackMode && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex flex-col items-start gap-2">
              <span>Câu {questionIndex + 1}/${TOTAL_QUESTIONS} đã hoàn thành.</span>
              <button
                type="button"
                onClick={handleNextQuestion}
                className="text-sm font-medium text-emerald-700 underline hover:text-emerald-800"
              >
                Sang câu tiếp theo
              </button>
            </div>
          )}

          {questionCompleted && isLastQuestion && !fallbackMode && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex flex-col items-start gap-2">
              <span>Đã luyện hết {TOTAL_QUESTIONS} câu. Buổi học kết thúc.</span>
            </div>
          )}
        </>
      )}
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
            <p className="text-xs font-semibold text-red-700">
              Lỗi cần sửa (tối đa 2)
            </p>
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
