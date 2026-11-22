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

import {
  endSpeakingSession,
  logSpeakingLifeline,
  peekSpeakingSample,
} from "@/app/actions/speaking";
import { useRecorder } from "@/hooks/use-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import {
  getLevelQuestions,
  LEVEL_LABELS,
  type Level,
} from "@/data/speaking-questions-by-level";
import type {
  SpeakingError,
  SpeakingTurnResult,
} from "@/lib/types/speaking";
import { speakEnglish } from "@/lib/speech";

type ChatMessage = {
  id: string;
  role: "user" | "ai";
  text: string;
  step: number;
  questionIndex?: number;
  mode?: "topic" | "freespeak";
  feedback_vi?: string;
  praise?: string;
  errors?: SpeakingError[];
  corrected_sentence?: string;
  top_errors?: string[];
  key_phrases?: string[];
  reflex_questions?: string[];
  retry_score?: number | null;
  retry_passed?: boolean | null;
  sample_answer?: string;
  keywords?: string[];
  aiMs?: number;
};

const TOTAL_QUESTIONS = 5;
const REFLECTION_QUESTIONS = 3;
const TOTAL_TURNS = TOTAL_QUESTIONS + REFLECTION_QUESTIONS;
const MAX_LIFELINES = 3;
const MAX_TRANSCRIPT_EDITS = 1;
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_PASS_THRESHOLD = 0.75;
const KEYWORD_HINT_DELAY_MS = 5000;
const SAMPLE_PEEK_MS = 3000;

type Phase = "questions" | "reflection" | "summary";

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
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
  const [phase, setPhase] = useState<Phase>("questions");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [step, setStep] = useState(1);
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
  const [fallbackTurnIndex, setFallbackTurnIndex] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [showTextInput, setShowTextInput] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [showingTranscript, setShowingTranscript] = useState(false);
  const [transcriptEdited, setTranscriptEdited] = useState(false);
  const [awaitingRepeat, setAwaitingRepeat] = useState(false);
  const [turnCompleted, setTurnCompleted] = useState(false);
  const [repeatedTurns, setRepeatedTurns] = useState<Set<number>>(new Set());
  const [lifelineCount, setLifelineCount] = useState(0);
  const [retryBlindActive, setRetryBlindActive] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [sampleAnswer, setSampleAnswer] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [retryScore, setRetryScore] = useState<number | null>(null);
  const [retryPassed, setRetryPassed] = useState<boolean | null>(null);
  const [praise, setPraise] = useState("");
  const [showSampleUntil, setShowSampleUntil] = useState<number | null>(null);
  const [courageBefore, setCourageBefore] = useState<number | null>(null);
  const [courageAfter, setCourageAfter] = useState<number | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const lastSentRef = useRef<string | null>(null);
  const sessionStartedRef = useRef(false);
  const keywordHintTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const samplePeekTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ttsEndedRef = useRef(false);

  const {
    error: recorderError,
    isRecording,
    start: startRecording,
    stop: stopRecording,
  } = useRecorder();

  const { speak, speaking: ttsSpeaking } = useSpeechSynthesis();

  const allQuestions = mode === "topic"
    ? getLevelQuestions(topicId, level)
    : [];

  const currentQuestionIndex = phase === "questions" ? questionIndex : TOTAL_QUESTIONS + (questionIndex - TOTAL_QUESTIONS);
  const currentQuestion = allQuestions[currentQuestionIndex] ?? "";
  const isLastTurn = questionIndex >= TOTAL_TURNS - 1;
  const isLastTopicTurn = questionIndex >= TOTAL_QUESTIONS - 1 && phase === "questions";
  const isAskStep = step === 1;
  const isAnswerStep = step === 2;
  const isRetryBlindStep = step === 3;
  const isNextStep = step === 4;
  const isSummaryStep = step === 5;

  const requestAI = useCallback(
    async (userMessage: string, currentStep: number, currentMode: "topic" | "freespeak", qIdx: number) => {
      if (lastSentRef.current === userMessage) return;
      lastSentRef.current = userMessage;

      setLoading(true);
      setError(null);
      setRetryBlindActive(false);
      setSampleAnswer("");
      setKeywords([]);
      setRetryScore(null);
      setRetryPassed(null);
      setPraise("");
      setShowSampleUntil(null);

      const aiStart = Date.now();

      try {
        const response = await fetch("/api/ai/speaking", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            sessionId,
            currentStep: currentStep,
            topic: topic,
            userMessage: userMessage,
            mode: currentMode,
            questionIndex: qIdx,
            level: level,
          }),
        });

        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error ?? "Không thể lấy phản hồi AI.");
        }

        const data = (await response.json()) as {
          result: SpeakingTurnResult;
          aiMs?: number;
          provider?: string;
          model?: string;
        };
        const result = data.result;

        setMessages((previous) => [
          ...previous,
          {
            id: makeId(),
            role: "ai",
            text: result.ai_response_en,
            step: result.step,
            questionIndex: qIdx,
            mode: result.mode ?? currentMode,
            feedback_vi: result.feedback_vi || undefined,
            praise: result.praise || undefined,
            errors: result.errors?.length ? result.errors : undefined,
            corrected_sentence: result.corrected_sentence || undefined,
            top_errors: result.top_errors?.length ? result.top_errors : undefined,
            key_phrases: result.key_phrases?.length ? result.key_phrases : undefined,
            reflex_questions: result.reflex_questions?.length ? result.reflex_questions : undefined,
            retry_score: result.retry_score ?? null,
            retry_passed: result.retry_passed ?? null,
            sample_answer: result.sample_answer || "",
            keywords: result.keywords?.length ? result.keywords : [],
            aiMs: data.aiMs,
          },
        ]);

        setStep(result.step);

        if (result.praise) setPraise(result.praise);
        if (result.sample_answer) setSampleAnswer(result.sample_answer);
        if (result.keywords?.length) setKeywords(result.keywords);
        if (result.retry_score !== null && result.retry_score !== undefined) setRetryScore(result.retry_score);
        if (result.retry_passed !== null && result.retry_passed !== undefined) setRetryPassed(result.retry_passed);

        if (result.next_action === "done") {
          setTurnCompleted(true);
          setAwaitingRepeat(false);
        } else if (result.next_action === "request_retry") {
          setAwaitingRepeat(true);
        } else {
          setAwaitingRepeat(false);
        }

        // Auto-play TTS on ASK step
        if (result.step === 1) {
          ttsEndedRef.current = false;
          speak(result.ai_response_en);
        } else {
          speak(result.ai_response_en);
        }
      } catch (cause) {
        const message =
          cause instanceof Error ? cause.message : "Có lỗi xảy ra.";
        const isRateLimit =
          /429|rate.?limit|quota|hết lượt|đã quá giới hạn/i.test(message);

        if (isRateLimit) {
          setRateLimitRetry({
            userMessage,
            step: currentStep,
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
    [sessionId, topic, level, speak],
  );

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, transcribing]);

  // Auto-start first question when entering topic mode
  useEffect(() => {
    if (mode !== "topic" || fallbackMode || sessionStartedRef.current) return;
    sessionStartedRef.current = true;
    const timer = setTimeout(() => {
      void requestAI(currentQuestion, 1, "topic", questionIndex);
    }, 0);
    return () => clearTimeout(timer);
  }, [requestAI, mode, questionIndex, currentQuestion, fallbackMode]);

  // TTS ended callback: record ask_complete_at for ASK step
  useEffect(() => {
    if (!ttsSpeaking && !ttsEndedRef.current && isAskStep) {
      ttsEndedRef.current = true;
      // ask_complete_at captured implicitly by TTS end; UI shows it
    }
  }, [ttsSpeaking, isAskStep]);

  // Keyword hint after 5s of silence on ANSWER step
  useEffect(() => {
    if (!isAnswerStep || !currentQuestion) {
      if (keywordHintTimerRef.current) {
        clearTimeout(keywordHintTimerRef.current);
        keywordHintTimerRef.current = null;
      }
      return;
    }
    keywordHintTimerRef.current = setTimeout(() => {
      // Keyword hint shown via UI (keywords already displayed from AI)
    }, KEYWORD_HINT_DELAY_MS);
    return () => {
      if (keywordHintTimerRef.current) {
        clearTimeout(keywordHintTimerRef.current);
        keywordHintTimerRef.current = null;
      }
    };
  }, [isAnswerStep, currentQuestion]);

  // Sample peek timeout for RETRY-BLIND
  useEffect(() => {
    if (showSampleUntil === null) return;
    const remaining = Math.max(0, showSampleUntil - Date.now());
    const timer = setTimeout(() => setShowSampleUntil(null), remaining);
    return () => clearTimeout(timer);
  }, [showSampleUntil]);

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
          step: step,
          questionIndex: questionIndex,
          mode: mode,
        },
      ]);
      setTextInput("");
      setTranscript("");
      setShowingTranscript(false);
      setTranscriptEdited(false);

      const stepForAI = Math.min(step + 1, 5);
      void requestAI(trimmed, stepForAI, mode, questionIndex);
    },
    [step, questionIndex, mode, requestAI],
  );

  const transcribeAndSend = useCallback(
    async (blob: Blob) => {
      setTranscribing(true);
      setError(null);

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
    setTranscriptEdited(false);
    await startRecording();
  }, [isRecording, startRecording, stopRecording, transcribeAndSend, rateLimitRetry]);

  const handleLifeline = useCallback(async () => {
    if (lifelineCount >= MAX_LIFELINES) {
      setError("Bạn đã dùng hết 3 lần phao cứu sinh trong phiên này.");
      return;
    }
    setLifelineCount((prev) => prev + 1);
    const viHint = `Gợi ý tiếng Việt: Hãy trả lời câu hỏi "${currentQuestion} bằng cách nói rõ, chậm và tự tin. Bạn có thể bắt đầu bằng "I think..." hoặc "In my opinion...".`;
    setError(viHint);
    try {
      await logSpeakingLifeline(sessionId);
    } catch {
      // ignore
    }
  }, [lifelineCount, currentQuestion, sessionId]);

  const handleSendTranscript = useCallback(() => {
    const text = (transcript || textInput || "").trim();
    if (!text) return;
    sendUserMessage(text);
  }, [transcript, textInput, sendUserMessage]);

  const handleManualSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleSendTranscript();
  };

  const handleEditTranscript = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!transcriptEdited && transcript) {
      setTranscript(event.target.value);
      setTranscriptEdited(true);
    }
  };

  const handleNextTurn = useCallback(() => {
    if (questionIndex >= TOTAL_TURNS - 1) return;
    setQuestionIndex((prev) => prev + 1);
    setStep(1);
    setTurnCompleted(false);
    setAwaitingRepeat(false);
    setTranscript("");
    setShowingTranscript(false);
    setTranscriptEdited(false);
    setError(null);
    setRetryBlindActive(false);
    setSampleAnswer("");
    setKeywords([]);
    setRetryScore(null);
    setRetryPassed(null);
    setPraise("");
    setShowSampleUntil(null);
    lastSentRef.current = null;
  }, [questionIndex]);

  const handleRetryAI = useCallback(() => {
    if (retryAttempts >= MAX_RETRY_ATTEMPTS) {
      setRetryAttempts(0);
      void handleNextTurn();
      return;
    }
    setRetryAttempts((prev) => prev + 1);
    setRetryBlindActive(false);
    setSampleAnswer("");
    setKeywords([]);
    setRetryScore(null);
    setRetryPassed(null);
    setPraise("");
    setShowSampleUntil(null);
    setError(null);
    lastSentRef.current = null;
    const currentMsg = messages
      .filter((m) => m.role === "user")
      .pop()?.text ?? "";
    if (currentMsg) {
      void requestAI(currentMsg, 2, mode, questionIndex);
    }
  }, [retryAttempts, mode, questionIndex, requestAI, messages, handleNextTurn]);

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
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Không thể xử lý ghi âm.",
        );
      }
      return;
    }
    await startRecording();
  }, [isRecording, startRecording, stopRecording]);

  const handleFallbackNext = useCallback(() => {
    const nextIndex =
      fallbackTurnIndex + 1 < allQuestions.length
        ? fallbackTurnIndex + 1
        : 0;
    setFallbackTurnIndex(nextIndex);
  }, [fallbackTurnIndex, allQuestions.length]);

  const handleModeChange = useCallback((newMode: "topic" | "freespeak") => {
    setMode(newMode);
    setError(null);
    setRateLimitRetry(null);
    setTranscript("");
    setShowingTranscript(false);
    setTranscriptEdited(false);
    lastSentRef.current = null;
    sessionStartedRef.current = false;
    setRetryBlindActive(false);
    setSampleAnswer("");
    setKeywords([]);
    setRetryScore(null);
    setRetryPassed(null);
    setPraise("");
    setShowSampleUntil(null);
  }, []);

  const handleSpeakAI = useCallback((text: string) => {
    speak(text);
  }, [speak]);

  const handleShowSample = useCallback(async () => {
    setShowSampleUntil(Date.now() + SAMPLE_PEEK_MS);
    try {
      await peekSpeakingSample(sessionId);
    } catch {
      // ignore
    }
  }, [sessionId]);

  const canSend = Boolean(transcript.trim() || textInput.trim()) && !loading && !transcribing;

  const reflectionQuestions = messages
    .filter((m) => m.role === "ai" && m.reflex_questions?.length)
    .flatMap((m) => m.reflex_questions ?? [])
    .slice(0, REFLECTION_QUESTIONS);

  const allErrors = messages
    .filter((m) => m.role === "ai" && m.errors?.length)
    .flatMap((m) => m.errors ?? []);
  const allKeyPhrases = messages
    .filter((m) => m.role === "ai" && m.key_phrases?.length)
    .flatMap((m) => m.key_phrases ?? []);

  const latestAi = messages[messages.length - 1];
  const isAiAnswer = latestAi?.role === "ai" && latestAi.step === 2;
  const isAiRetryBlind = latestAi?.role === "ai" && latestAi.step === 3;

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-xl font-semibold text-foreground">
            {topic}
          </h1>
          <p className="text-sm text-muted-foreground">
            {phase === "summary"
              ? "Tổng kết buổi học"
              : phase === "reflection"
                ? `Phản xạ ${questionIndex - TOTAL_QUESTIONS + 1}/${REFLECTION_QUESTIONS}`
                : isAskStep
                  ? `Câu ${questionIndex + 1}/${TOTAL_QUESTIONS} — AI đang đọc`
                  : isAnswerStep
                    ? `Câu ${questionIndex + 1}/${TOTAL_QUESTIONS} — Trả lời`
                    : isRetryBlindStep
                      ? `Câu ${questionIndex + 1}/${TOTAL_QUESTIONS} — Nói lại (không xem mẫu)`
                      : `Câu ${questionIndex + 1}/${TOTAL_QUESTIONS} · Bước ${step}/5`}
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

      {mode === "topic" && !fallbackMode && questionIndex === 0 && step === 1 && messages.length === 0 && !courageBefore ? (
        <div className="mt-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground mb-2">
            5 câu hỏi — {LEVEL_LABELS[level]}
          </h2>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-6 mb-4">
            {allQuestions.map((q, i) => (
              <li key={i}>{q}</li>
            ))}
          </ul>
          <div className="mt-2 rounded-lg bg-primary/10 px-3 py-2 text-sm text-primary">
            <strong>Luồng mỗi câu:</strong> AI hỏi → Bạn trả lời (mic/bàn phím) → Góp ý AI →
            Nói lại không xem mẫu → Sang câu tiếp. Sau câu 5, vào Phản xạ 3 câu mới, rồi Tổng kết.
          </div>
          <div className="mt-4 flex items-center gap-3">
            <label className="text-sm text-muted-foreground">Tự tin trước khi bắt đầu (1–10):</label>
            <input
              type="number"
              min="1"
              max="10"
              defaultValue="5"
              className="w-16 h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
              onChange={(e) => setCourageBefore(Number(e.target.value) || 5)}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              void requestAI(currentQuestion, 1, "topic", 0);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Bắt đầu luyện
          </button>
        </div>
      ) : null}

      {!fallbackMode && (
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
                    const { userMessage, step: retryStep, mode: retryMode } = rateLimitRetry;
                    setRateLimitRetry(null);
                    setError(null);
                    void requestAI(userMessage, retryStep, retryMode, questionIndex);
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
                  Câu hỏi {fallbackTurnIndex + 1}/{allQuestions.length}
                </p>
                <p className="text-lg text-foreground italic">
                  {"\""}
                  {allQuestions[fallbackTurnIndex]}
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
                    onChange={handleEditTranscript}
                    placeholder="Sửa bản chép nếu cần (tối đa 1 lần)..."
                    className="h-10 flex-1 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                    disabled={loading || transcribing || transcriptEdited}
                  />
                  {transcriptEdited && (
                    <span className="text-xs text-muted-foreground">Đã sửa 1 lần</span>
                  )}
                  <button
                    type="submit"
                    disabled={
                      !transcript.trim() || loading || transcribing || transcriptEdited
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
              {isAskStep && (
                <>
                  <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    AI đang đọc câu hỏi. Nghe xong rồi hãy trả lời.
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleToggleRecording()}
                    disabled={turnCompleted || ttsSpeaking}
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
                    {ttsSpeaking ? "Đang đọc..." : isRecording ? "Dừng" : "Ghi âm trả lời"}
                  </button>
                  <button
                    type="button"
                    onClick={handleLifeline}
                    disabled={lifelineCount >= MAX_LIFELINES || ttsSpeaking}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm transition-colors ${
                      lifelineCount >= MAX_LIFELINES
                        ? "opacity-50 text-muted-foreground"
                        : "text-blue-600 hover:bg-blue-50"
                    }`}
                  >
                    <RefreshCw className="size-4" />
                    Phao cứu sinh ({lifelineCount}/{MAX_LIFELINES})
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
                </>
              )}
              {isAnswerStep && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleToggleRecording()}
                    disabled={!!rateLimitRetry || turnCompleted}
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
                    {isRecording ? "Dừng thu âm" : "Ghi âm trả lời"}
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
                  {lifelineCount < MAX_LIFELINES && (
                    <button
                      type="button"
                      onClick={handleLifeline}
                      className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-blue-600 transition-colors hover:bg-blue-50"
                    >
                      <RefreshCw className="size-4" />
                      Phao cứu sinh
                    </button>
                  )}
                </>
              )}
              {isRetryBlindStep && (
                <>
                  <button
                    type="button"
                    onClick={() => void handleToggleRecording()}
                    disabled={!!rateLimitRetry || turnCompleted}
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
                    {isRecording ? "Dừng thu âm" : "Ghi âm nói lại"}
                  </button>
                  {showSampleUntil !== null && sampleAnswer && (
                    <div className="rounded-lg border border-border bg-amber-50 p-3 text-sm text-amber-800">
                      <p className="font-semibold mb-1">Xem lại mẫu (3 giây, trừ 5 XP):</p>
                      <p className="italic">{sampleAnswer}</p>
                    </div>
                  )}
                  {showSampleUntil === null && sampleAnswer && !retryPassed && retryAttempts < MAX_RETRY_ATTEMPTS && (
                    <button
                      type="button"
                      onClick={handleShowSample}
                      className="text-xs text-amber-600 underline hover:text-amber-800"
                    >
                      Xem lại mẫu câu
                    </button>
                  )}
                </>
              )}
              {!isAskStep && !isRetryBlindStep && (
                <button
                  type="button"
                  onClick={() => setShowTextInput((value) => !value)}
                  disabled={loading || transcribing}
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <Keyboard className="size-4" />
                  {showTextInput ? "Ẩn bàn phím" : "Nhập bằng bàn phím"}
                </button>
              )}
            </div>
          )}

          {praise && isAnswerStep && (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              <p className="font-semibold">👏 {praise}</p>
            </div>
          )}

          {latestAi?.errors && latestAi.errors.length > 0 && isAnswerStep ? (
            <div className="mt-2 space-y-1.5 rounded-lg bg-red-50 px-3 py-2">
              <p className="text-xs font-semibold text-red-700">
                Lỗi cần sửa (tối đa 2)
              </p>
              {latestAi.errors.map((item, index) => (
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

          {latestAi?.corrected_sentence && isAnswerStep ? (
            <div className="mt-2 rounded-lg bg-green-50 px-3 py-2">
              <p className="text-xs font-semibold text-green-700">
                Câu cải thiện
              </p>
              <p className="text-sm text-green-800">{latestAi.corrected_sentence}</p>
            </div>
          ) : null}

          {isRetryBlindStep && keywords.length > 0 && (
            <div className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
              <p className="font-semibold mb-1">Từ khoá để nói lại (không xem mẫu đầy đủ):</p>
              <div className="flex flex-wrap gap-2">
                {keywords.map((kw, i) => (
                  <span key={i} className="rounded bg-blue-200 px-2 py-1 text-xs font-medium text-blue-900">
                    {kw}
                  </span>
                ))}
              </div>
              {retryScore !== null && (
                <p className="mt-2 text-xs text-blue-600">
                  Điểm nói lại: {(retryScore * 100).toFixed(0)}% (đạt ≥ 75%)
                </p>
              )}
              {retryPassed === false && retryAttempts >= MAX_RETRY_ATTEMPTS && (
                <p className="mt-1 text-xs text-red-600">
                  Đã đạt số lần thử tối đa ({MAX_RETRY_ATTEMPTS}), sang câu tiếp theo.
                </p>
              )}
            </div>
          )}

          {awaitingRepeat && !turnCompleted && !fallbackMode && !isRetryBlindStep && (
            <div className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700 flex flex-col items-start gap-2">
              <span>
                Hãy nói lại câu đã cải thiện ở trên. Khi xong, bấm Ghi âm và đọc
                lại.
              </span>
              <button
                type="button"
                onClick={() => {
                  setAwaitingRepeat(false);
                  setTurnCompleted(true);
                  setRetryBlindActive(true);
                  setRepeatedTurns((prev) => new Set([...prev, questionIndex]));
                }}
                className="text-sm font-medium text-green-700 underline hover:text-green-800"
              >
                Tôi đã nói lại, chấm điểm
              </button>
            </div>
          )}

          {turnCompleted && !isLastTurn && !fallbackMode && !isSummaryStep && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex flex-col items-start gap-2">
              <span>
                {phase === "questions"
                  ? `Câu ${questionIndex + 1}/${TOTAL_QUESTIONS} đã hoàn thành.`
                  : `Phản xạ ${questionIndex - TOTAL_QUESTIONS + 1}/${REFLECTION_QUESTIONS} đã hoàn thành.`}
              </span>
              <button
                type="button"
                onClick={handleNextTurn}
                className="text-sm font-medium text-emerald-700 underline hover:text-emerald-800"
              >
                Sang câu tiếp theo
              </button>
            </div>
          )}

          {turnCompleted && isLastTurn && !fallbackMode && !isSummaryStep && (
            <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 flex flex-col items-start gap-2">
              <span>Đã luyện hết {TOTAL_TURNS} câu. Buổi học kết thúc.</span>
            </div>
          )}

          {isSummaryStep && !fallbackMode && (
            <div className="mt-3 rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-2">Tổng kết buổi học</h2>
              {(latestAi?.top_errors ?? []).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-red-700 mb-1">3 lỗi cần ôn:</p>
                  <ul className="list-disc pl-4 text-sm text-red-700 space-y-1">
                    {(latestAi?.top_errors ?? []).slice(0, 3).map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              )}
              {allKeyPhrases.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-green-700 mb-1">5 cụm từ hữu ích:</p>
                  <ul className="list-disc pl-4 text-sm text-green-700 space-y-1">
                    {allKeyPhrases.slice(0, 5).map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {courageBefore !== null && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Tự tin trước: {courageBefore}/10
                  </p>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    defaultValue={courageAfter || 5}
                    className="w-16 h-9 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                    onChange={(e) => setCourageAfter(Number(e.target.value) || 5)}
                  />
                </div>
              )}
              <button
                type="button"
                onClick={handleEnd}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <ArrowLeft className="size-4" />
                Kết thúc phiên
              </button>
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

        {message.praise ? (
          <p className="mt-1 text-xs font-semibold text-green-700">
            {message.praise}
          </p>
        ) : null}

        {message.feedback_vi ? (
          <p className="mt-1 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
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

        {message.corrected_sentence ? (
          <div className="mt-2 rounded-lg bg-green-50 px-3 py-2">
            <p className="text-xs font-semibold text-green-700">
              Câu cải thiện
            </p>
            <p className="text-sm text-green-800">{message.corrected_sentence}</p>
          </div>
        ) : null}

        {message.retry_score !== null && message.retry_score !== undefined ? (
          <div className="mt-2 rounded-lg bg-blue-50 px-3 py-2">
            <p className="text-xs font-semibold text-blue-700">
              Điểm nói lại: {(message.retry_score * 100).toFixed(0)}%
              {message.retry_passed ? " — ĐẠT" : ""}
            </p>
          </div>
        ) : null}

        {message.top_errors && message.top_errors.length > 0 ? (
          <div className="mt-2 rounded-lg bg-red-50 px-3 py-2">
            <p className="text-xs font-semibold text-red-700">Lỗi lặp ưu tiên</p>
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
              Cụm từ hữu ích
            </p>
            <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm text-green-800">
              {message.key_phrases.map((item, index) => (
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
