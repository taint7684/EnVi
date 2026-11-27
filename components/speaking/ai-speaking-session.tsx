"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Mic, Lightbulb, RotateCcw, Volume2, Shield, MessageSquare, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakEnglish, stopSpeaking } from "@/lib/speech";
import { evaluateSpeech } from "@/lib/speech-eval";
import { cn } from "@/lib/utils";
import { updateSpeakingProgress } from "@/app/actions/gamification";

type SpeakingStep = "warmup" | "openers" | "main" | "rescues" | "chunks" | "freestyle";

const STEP_LABELS: Record<SpeakingStep | "freetalk", string> = {
  warmup: "Khởi động (30s)",
  openers: "Câu mở đầu (2')",
  main: "Trò chuyện chính (20')",
  rescues: "Câu cứu cánh (2')",
  chunks: "Cụm từ sẵn sàng (3')",
  freestyle: "Tự do (3')",
  freetalk: "Tự do nói chuyện (30')",
};

const STEP_DESCRIPTIONS: Record<SpeakingStep | "freetalk", string> = {
  warmup: "Nghe AI hỏi → Nói ngay câu đã học (Reflex thuần)",
  openers: "Dùng 1 trong 3 câu mở đầu để bắt đầu cuộc trò chuyện",
  main: "Trò chuyện tự do với AI Coach về chủ đề tuần",
  rescues: "Khi bị kẹt: dùng 1 trong 3 câu cứu cánh",
  chunks: "Nói 5 cụm từ chủ đề tuần (chunks)",
  freestyle: "Nói bất cứ điều gì về chủ đề - không giới hạn",
  freetalk: "Tự do nói chuyện với AI - không có cấu trúc, không giới hạn thời gian từng bước",
};

const STEP_DURATIONS: Record<SpeakingStep | "freetalk", number> = {
  warmup: 30,
  openers: 120,
  main: 1200,
  rescues: 120,
  chunks: 180,
  freestyle: 180,
  freetalk: 1800,
};

const STEP_ORDER: SpeakingStep[] = ["warmup", "openers", "main", "rescues", "chunks", "freestyle"];

export type LifelineType = "translate" | "hint" | "sample_peek";

export type SpeakingMode = "structured" | "freetalk";

export type SpeakingConfig = {
  topicId: string;
  layer: "L1" | "L2" | "L3";
  round: 1 | 2;
  scenarioId: string;
  openers: string[];
  rescues: string[];
  chunks: string[];
  lifelinesUsed: Record<LifelineType, number>;
};

export type AIResponse = {
  text: string;
  feedback?: {
    praise: string;
    naturalAlternative: string;
    chunkToReuse: string;
    errors: string[];
    scores: { fluency: number; accuracy: number; prosody: number };
  };
};

export function AISpeakingSession({
  config,
  mode = "structured",
  onComplete,
}: {
  config: SpeakingConfig;
  mode?: SpeakingMode;
  onComplete?: (metrics: {
    totalSpeakingSeconds: number;
    lifelinesUsed: Record<LifelineType, number>;
    aiFeedback: AIResponse["feedback"] | null;
    talkRatio: number;
  }) => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; text: string; step?: SpeakingStep | "freetalk" }[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<ReturnType<typeof evaluateSpeech> | null>(null);
  const [aiFeedback, setAiFeedback] = useState<AIResponse["feedback"] | null>(null);
  const [lifelinesUsed, setLifelinesUsed] = useState<Record<LifelineType, number>>({
    translate: 0,
    hint: 0,
    sample_peek: 0,
  });
  const [stepStartTime, setStepStartTime] = useState<number>(Date.now());
  const stepStartTimeRef = useRef(stepStartTime);
  stepStartTimeRef.current = stepStartTime;
  const [totalSpeakingSeconds, setTotalSpeakingSeconds] = useState(0);
  const [totalAiSeconds, setTotalAiSeconds] = useState(0);
  const [showLifelineModal, setShowLifelineModal] = useState<LifelineType | null>(null);
  const [sessionStartTime] = useState(Date.now());

  const step = STEP_ORDER[stepIndex]!;
  const stepDuration = STEP_DURATIONS[step]!;
  const elapsed = Math.floor((Date.now() - stepStartTimeRef.current) / 1000);
  const remaining = Math.max(0, stepDuration - elapsed);

  const currentLifelineCount = lifelinesUsed.translate + lifelinesUsed.hint + lifelinesUsed.sample_peek;
  const canUseLifeline = currentLifelineCount < 3;

  // Talk ratio calculation (user speaking time / total session time)
  const totalSessionSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);
  const talkRatio = totalSessionSeconds > 0 ? totalSpeakingSeconds / totalSessionSeconds : 0;

  useEffect(() => {
    if (mode === "freetalk") return; // Free Talk mode doesn't auto-advance steps
    if (elapsed >= stepDuration && step !== "freestyle") {
      nextStep();
    }
  }, [elapsed, step, mode]);

  async function handleSpeech(spoken: string) {
    setTranscript(spoken);
    const evalResult = evaluateSpeech("", spoken);
    setEvaluation(evalResult);

    const speakingSecs = Math.ceil(spoken.length / 12);
    setTotalSpeakingSeconds((prev) => prev + speakingSecs);

    if (mode === "structured" && (step === "warmup" || step === "openers" || step === "chunks")) {
      nextStep();
    }
  }

  async function sendToAI() {
    if (!transcript.trim()) return;

    const userMsg = { role: "user" as const, text: transcript, step };
    setAiMessages((prev) => [...prev, userMsg]);

    // Estimate AI response time (brief responses in Free Talk)
    const aiSpeakingSecs = mode === "freetalk" ? 3 : 8;
    setTotalAiSeconds((prev) => prev + aiSpeakingSecs);

    const currentStep: SpeakingStep | "freetalk" = mode === "freetalk" ? "freetalk" : step;

    try {
      const response = await fetch("/api/speaking-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          step: currentStep,
          topicId: config.topicId,
          layer: config.layer,
          scenarioId: config.scenarioId,
          conversationHistory: aiMessages.map((m) => `${m.role}: ${m.text}`).join("\n"),
          mode,
        }),
      });

      const data: AIResponse = await response.json();
      const aiMsg = { role: "assistant" as const, text: data.text, step: currentStep };
      setAiMessages((prev) => [...prev, aiMsg]);
      if (data.feedback) {
        setAiFeedback(data.feedback);
      }
    } catch {
      const fallbackMsg = { role: "assistant" as const, text: "Xin lỗi, tôi không nghe rõ. Bạn nói lại nhé?", step: currentStep };
      setAiMessages((prev) => [...prev, fallbackMsg]);
    }

    setTranscript("");
    setEvaluation(null);
  }

  function activateLifeline(type: LifelineType) {
    if (!canUseLifeline) return;
    setLifelinesUsed((prev) => ({ ...prev, [type]: prev[type] + 1 }));
    setShowLifelineModal(type);
  }

  function nextStep() {
    if (stepIndex < STEP_ORDER.length - 1) {
      setStepIndex((prev) => prev + 1);
    } else {
      completeSession();
    }
  }

  function completeSession() {
    onComplete?.({
      totalSpeakingSeconds,
      lifelinesUsed,
      aiFeedback,
      talkRatio,
    });

    // Award XP for speaking time
    const minutes = Math.ceil(totalSpeakingSeconds / 60);
    if (minutes > 0) {
      updateSpeakingProgress(minutes, { module: "ai_speaking" });
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const progress = ((stepIndex + 1) / STEP_ORDER.length) * 100;

  // Free Talk mode UI
  if (mode === "freetalk") {
    return (
      <div className="mx-auto max-w-2xl">
        {/* Header with Talk Ratio */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${Math.min(100, talkRatio * 100)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Free Talk · {formatTime(totalSessionSeconds)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                talkRatio >= 0.7 ? "text-emerald-600" : "text-amber-600"
              }`}
            >
              Talk Ratio: {Math.round(talkRatio * 100)}%
            </span>
            {canUseLifeline && (
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
                <Shield className="size-3" />
                Lifeline: {3 - currentLifelineCount}
              </span>
            )}
          </div>
        </div>

        {/* Talk Ratio Indicator */}
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Mục tiêu: Nói ≥ 70% thời gian</p>
              <p className="text-xs text-muted-foreground">
                AI sẽ trả lời ngắn gọn để bạn có nhiều thời gian nói hơn.
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{Math.round(talkRatio * 100)}%</p>
              <p className="text-xs text-muted-foreground">
                {talkRatio >= 0.7 ? "✅ Đạt mục tiêu" : "🎯 Cần nói nhiều hơn"}
              </p>
            </div>
          </div>
        </div>

        {/* Topic Suggestions */}
        <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">
            Gợi ý cho chủ đề "{config.topicId}":
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Câu mở đầu</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {config.openers.slice(0, 2).map((opener, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentInput(opener)}
                    className="text-left h-auto px-2 py-1"
                  >
                    {opener}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Cụm từ chủ đề</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {config.chunks.slice(0, 3).map((chunk, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentInput(chunk)}
                    className="text-left h-auto px-2 py-1"
                  >
                    {chunk}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">Câu cứu cánh</p>
              <div className="mt-1 flex flex-wrap gap-1">
                {config.rescues.slice(0, 2).map((rescue, i) => (
                  <Button
                    key={i}
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentInput(rescue)}
                    className="text-left h-auto px-2 py-1"
                  >
                    {rescue}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Conversation Area */}
        <div className="mb-4 rounded-2xl border border-border bg-background p-4 max-h-96 overflow-y-auto">
          {aiMessages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "mb-3 flex gap-2",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-2 text-sm",
                  msg.role === "user"
                    ? "rounded-br-none bg-primary text-white"
                    : "rounded-bl-none bg-muted text-foreground",
                )}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isListening && (
            <div className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-primary/10 px-4 py-2 text-sm text-primary animate-pulse">
                Đang nghe... {transcript}
              </div>
            </div>
          )}
        </div>

        {showLifelineModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
              <h3 className="font-semibold text-lg">
                {showLifelineModal === "translate"
                  ? "🌐 Dịch sang tiếng Việt"
                  : showLifelineModal === "hint"
                  ? "💡 Gợi ý từ khóa"
                  : "👀 Xem câu mẫu"}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {showLifelineModal === "translate"
                  ? "Tạm dịch ý bạn sang tiếng Việt để AI hiểu và trả lời tiếp."
                  : showLifelineModal === "hint"
                  ? "Gợi ý 3 từ khóa/ cụm từ liên quan đến chủ đề để bạn tiếp tục."
                  : "Xem 1 câu mẫu tự nhiên về chủ đề này để tham khảo."}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowLifelineModal(null)}>
                  Hủy
                </Button>
                <Button onClick={() => setShowLifelineModal(null)}>Đã hiểu</Button>
              </div>
            </div>
          </div>
        )}

        {/* Input Area - Always available in Free Talk */}
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentInput.trim()) {
                  sendToAI();
                  setCurrentInput("");
                }
              }}
              placeholder="Gõ hoặc nói câu trả lời... (Enter để gửi)"
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 outline-none focus-visible:border-primary"
            />
            <Button
              className="size-12 rounded-full"
              onClick={() => setIsListening(true)}
            >
              <Mic className="size-6" />
            </Button>
            <Button
              variant="outline"
              className="size-12 rounded-full"
              onClick={sendToAI}
              disabled={!currentInput.trim()}
            >
              <MessageSquare className="size-5" />
            </Button>
          </div>

          {/* Lifelines */}
          {canUseLifeline && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => activateLifeline("translate")}
                disabled={lifelinesUsed.translate >= 1}
              >
                <MessageSquare className="size-4" /> Dịch
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => activateLifeline("hint")}
                disabled={lifelinesUsed.hint >= 1}
              >
                <Lightbulb className="size-4" /> Gợi ý
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => activateLifeline("sample_peek")}
                disabled={lifelinesUsed.sample_peek >= 1}
              >
                <Volume2 className="size-4" /> Xem mẫu
              </Button>
            </div>
          )}

          <div className="flex justify-center gap-2">
            <Button variant="outline" onClick={completeSession}>
              Kết thúc phiên
            </Button>
          </div>
        </div>

        <p className="mt-3 text-center text-xs text-muted-foreground">
          Mẹo: Nói tự nhiên, đừng dịch trong đầu. AI sẽ trả lời ngắn để bạn nói nhiều hơn. Nhấn "Kết thúc phiên" khi xong.
        </p>
      </div>
    );
  }

  // Structured mode UI (original)
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Bước {stepIndex + 1}/6: {STEP_LABELS[step]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono tabular-nums">{formatTime(remaining)}</span>
          {canUseLifeline && (
            <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
              <Shield className="size-3" />
              Lifeline: {3 - currentLifelineCount}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <p className="text-sm text-muted-foreground">{STEP_DESCRIPTIONS[step]}</p>
        {config.lifelinesUsed && Object.values(config.lifelinesUsed).some((v) => v > 0) && (
          <p className="mt-1 text-xs text-muted-foreground">
            Lifeline đã dùng: Dịch {config.lifelinesUsed.translate} | Gợi ý {config.lifelinesUsed.hint} | Xem mẫu {config.lifelinesUsed.sample_peek}
          </p>
        )}
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-background p-4 max-h-80 overflow-y-auto">
        {aiMessages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              "mb-3 flex gap-2",
              msg.role === "user" ? "justify-end" : "justify-start",
            )}
          >
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                msg.role === "user"
                  ? "rounded-br-none bg-primary text-white"
                  : "rounded-bl-none bg-muted text-foreground",
              )}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isListening && (
          <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl bg-primary/10 px-4 py-2 text-sm text-primary animate-pulse">
              Đang nghe... {transcript}
            </div>
          </div>
        )}
      </div>

      {step === "openers" && config.openers.length > 0 && (
        <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs font-semibold text-primary uppercase tracking-wide">Câu mở đầu gợi ý:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.openers.map((opener, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => setCurrentInput(opener)}
                className="text-left"
              >
                {opener}
              </Button>
            ))}
          </div>
        </div>
      )}

      {step === "rescues" && config.rescues.length > 0 && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold text-rose-700 uppercase tracking-wide">Câu cứu cánh (khi bị kẹt):</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.rescues.map((rescue, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => setCurrentInput(rescue)}
                className="text-left"
              >
                {rescue}
              </Button>
            ))}
          </div>
        </div>
      )}

      {step === "chunks" && config.chunks.length > 0 && (
        <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">5 cụm từ sẵn sàng hôm nay:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {config.chunks.map((chunk, i) => (
              <Button
                key={i}
                variant="outline"
                size="sm"
                onClick={() => setCurrentInput(chunk)}
                className="text-left"
              >
                {chunk}
              </Button>
            ))}
          </div>
        </div>
      )}

      {showLifelineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-card p-6 shadow-xl">
            <h3 className="font-semibold text-lg">
              {showLifelineModal === "translate" ? "🌐 Dịch sang tiếng Việt" : showLifelineModal === "hint" ? "💡 Gợi ý từ khóa" : "👀 Xem câu mẫu"}
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {showLifelineModal === "translate"
                ? "Tạm dịch ý bạn sang tiếng Việt để AI hiểu và trả lời tiếp."
                : showLifelineModal === "hint"
                ? "Gợi ý 3 từ khóa/ cụm từ liên quan đến chủ đề để bạn tiếp tục."
                : "Xem 1 câu mẫu tự nhiên về chủ đề này để tham khảo."}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowLifelineModal(null)}>
                Hủy
              </Button>
              <Button onClick={() => setShowLifelineModal(null)}>Đã hiểu</Button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-2">
        {(step === "warmup" || step === "openers" || step === "chunks") && !isListening ? (
          <Button
            className="w-full size-20 rounded-full"
            onClick={() => setIsListening(true)}
          >
            <Mic className="size-8" />
          </Button>
        ) : step === "main" || step === "freestyle" ? (
          <div className="flex gap-2">
            <input
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentInput.trim()) {
                  sendToAI();
                  setCurrentInput("");
                }
              }}
              placeholder="Gõ hoặc nói câu trả lời..."
              className="flex-1 rounded-xl border border-border bg-background px-4 py-3 outline-none focus-visible:border-primary"
            />
            <Button
              className="size-12 rounded-full"
              onClick={() => setIsListening(true)}
            >
              <Mic className="size-6" />
            </Button>
            <Button
              variant="outline"
              className="size-12 rounded-full"
              onClick={sendToAI}
              disabled={!currentInput.trim()}
            >
              <MessageSquare className="size-5" />
            </Button>
          </div>
        ) : null}

        {(step === "main" || step === "freestyle") && canUseLifeline && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => activateLifeline("translate")}
              disabled={lifelinesUsed.translate >= 1}
            >
              <MessageSquare className="size-4" /> Dịch
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => activateLifeline("hint")}
              disabled={lifelinesUsed.hint >= 1}
            >
              <Lightbulb className="size-4" /> Gợi ý
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => activateLifeline("sample_peek")}
              disabled={lifelinesUsed.sample_peek >= 1}
            >
              <Volume2 className="size-4" /> Xem mẫu
            </Button>
          </div>
        )}

        <div className="flex justify-center gap-2">
          <Button variant="ghost" onClick={() => stepIndex > 0 && setStepIndex((i) => i - 1)} disabled={stepIndex === 0}>
            <RotateCcw className="size-4" /> Bước trước
          </Button>
          <Button variant="outline" onClick={nextStep}>
            Bước sau <ArrowRight className="size-4" />
          </Button>
        </div>
      </div>

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Mẹo: Nói tự nhiên, đừng dịch trong đầu. Sai cũng được — AI sẽ sửa và gợi ý cách nói tự nhiên hơn.
      </p>
    </div>
  );
}