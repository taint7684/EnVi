"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Mic, RotateCcw, X, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { stopSpeaking } from "@/lib/speech";
import { cn } from "@/lib/utils";
import { updateSpeakingProgress, updateVoiceDiaryProgress } from "@/app/actions/gamification";

type VoiceDiaryConfig = {
  topicId: string;
  layer: "L1" | "L2" | "L3";
  round: 1 | 2;
  prompts: string[];
};

type VoiceDiaryState = "intro" | "recording" | "review" | "complete";

export function VoiceDiarySession({
  config,
  onComplete,
}: {
  config: VoiceDiaryConfig;
  onComplete?: (metrics: {
    totalSpeakingSeconds: number;
    entriesCount: number;
    avgWpm: number;
    viSegments: number;
  }) => void;
}) {
  const [state, setState] = useState<VoiceDiaryState>("intro");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<{
    praise: string;
    naturalAlternative: string;
    wpm: number;
    viSegments: number;
  } | null>(null);
  const [totalSpeakingSeconds, setTotalSpeakingSeconds] = useState(0);
  const [entriesCount, setEntriesCount] = useState(0);
  const recordingStartRef = useRef<number>(0);

  const [recordingDuration, setRecordingDuration] = useState(0);

  const currentPrompt = config.prompts[currentPromptIndex];
  const isLastPrompt = currentPromptIndex >= config.prompts.length - 1;

  useEffect(() => {
    if (state === "recording") {
      recordingStartRef.current = performance.now();
    }
    return () => stopSpeaking();
  }, [state]);

  useEffect(() => {
    if (state === "review" && recordingStartRef.current > 0) {
      const duration = Math.round((performance.now() - recordingStartRef.current) / 1000);
      setRecordingDuration(duration);
    }
  }, [state]);

  async function handleSpeech(spoken: string) {
    setTranscript(spoken);
    const latency = Math.round(performance.now() - recordingStartRef.current);
    
    const viSegments = (spoken.match(/\b[vV]ietnamese\b|\b[tT]iếng\s*[vV]iệt\b|[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g) || []).length;
    
    const words = spoken.trim().split(/\s+/).length;
    const wpm = Math.round((words / Math.max(1, latency / 60000)) * 60);

    setTotalSpeakingSeconds((prev) => prev + Math.ceil(latency / 1000));
    setEntriesCount((prev) => prev + 1);

    setFeedback({
      praise: viSegments === 0 ? "Tuyệt vời! 100% tiếng Anh!" : "Tốt, lần sau thử nói toàn tiếng Anh nhé.",
      naturalAlternative: `Cách nói tự nhiên hơn: "Today I learned about ${config.topicId}. It was interesting because..."`,
      wpm,
      viSegments,
    });
  }

  function nextPrompt() {
    if (isLastPrompt) {
      setState("complete");
      onComplete?.({
        totalSpeakingSeconds,
        entriesCount,
        avgWpm: feedback?.wpm || 0,
        viSegments: feedback?.viSegments || 0,
      });

      // Award XP for speaking time and voice diary completion
      const minutes = Math.ceil(totalSpeakingSeconds / 60);
      if (minutes > 0) {
        updateSpeakingProgress(minutes, { module: "voice_diary", phrases: entriesCount });
      }
      updateVoiceDiaryProgress(entriesCount);
    } else {
      setCurrentPromptIndex((i) => i + 1);
      setState("intro");
      setTranscript("");
      setFeedback(null);
    }
  }

  function retryPrompt() {
    setTranscript("");
    setFeedback(null);
    setState("recording");
  }

  function saveEntry() {
    // In real app, save to Supabase
    console.log("Saving voice diary entry:", {
      prompt: currentPrompt,
      transcript,
      feedback,
      timestamp: new Date().toISOString(),
    });
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const progress = ((currentPromptIndex + 1) / config.prompts.length) * 100;

  if (state === "complete") {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="text-4xl">📔</div>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">Hoàn thành Voice Diary!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn đã ghi {entriesCount} mục trong {formatTime(totalSpeakingSeconds)}.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-2xl font-bold text-emerald-700">{entriesCount}</p>
            <p className="text-xs text-emerald-600">Mục đã ghi</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <p className="text-2xl font-bold text-blue-700">{formatTime(totalSpeakingSeconds)}</p>
            <p className="text-xs text-blue-600">Tổng thời gian</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3">
            <p className="text-2xl font-bold text-purple-700">{feedback?.wpm || 0}</p>
            <p className="text-xs text-purple-600">WPM trung bình</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => { setCurrentPromptIndex(0); setState("intro"); }}>Làm lại</Button>
          <Button variant="outline" onClick={() => onComplete?.({ totalSpeakingSeconds: 0, entriesCount: 0, avgWpm: 0, viSegments: 0 })}>Về trang chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-rose-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Mục {currentPromptIndex + 1}/{config.prompts.length}
          </span>
        </div>
        <span className="text-sm font-mono tabular-nums text-muted-foreground">
          {state === "recording" ? "🔴 Đang ghi..." : state === "review" ? "Đã xong" : "Sẵn sàng"}
        </span>
      </div>

      {state === "intro" && (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center">
          <div className="text-4xl">📔</div>
          <h3 className="mt-3 font-semibold text-rose-700">Voice Diary - {config.layer}</h3>
          <p className="mt-2 text-sm text-rose-600">
            Ghi âm nhật ký giọng 60s về chủ đề: <strong>{config.topicId}</strong>
          </p>
          <div className="mt-4 p-3 rounded-xl bg-white/50 text-left">
            <p className="font-semibold text-foreground">Gợi ý hôm nay:</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentPrompt}</p>
          </div>
          <p className="mt-3 text-xs text-rose-500">
            Nhấn nút dưới → Nói 60 giây → AI cho feedback → Lưu lại
          </p>
          <Button className="mt-4 w-full size-12" onClick={() => setState("recording")}>
            <Mic className="size-6" /> Bắt đầu ghi âm
          </Button>
        </div>
      )}

      {state === "recording" && (
        <div className="mb-4 rounded-2xl border-2 border-rose-500 bg-rose-50 p-6 text-center animate-pulse">
          <div className="text-6xl">🔴</div>
          <h3 className="mt-3 font-semibold text-rose-700">Đang ghi âm...</h3>
          <p className="mt-1 text-sm text-rose-600">{currentPrompt}</p>
          <div className="mt-4 flex justify-center">
            <Button
              className="w-full size-20 rounded-full bg-rose-600 text-white"
              onClick={() => setState("review")}
            >
              <Check className="size-8" /> Xong (hoặc tự dừng sau 60s)
            </Button>
          </div>
          <p className="mt-2 text-xs text-rose-500">Nói tự nhiên, đừng dịch. Sai cũng được!</p>
        </div>
      )}

      {state === "review" && feedback && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold text-foreground">Kết quả ghi âm</h3>
          
          <div className="mt-3 rounded-xl p-4 text-left">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Bạn đã nói:</p>
            <p className="mt-1 text-base text-foreground">{transcript || "(chưa có transcript)"}</p>
          </div>

          <div className={cn(
            "mt-4 rounded-xl p-4 text-center",
            feedback.viSegments > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          )}>
            <p className="flex items-center justify-center gap-2 font-semibold">
              {feedback.viSegments > 0 ? (
                <>
                  <X className="size-5" /> Phát hiện {feedback.viSegments} đoạn tiếng Việt
                </>
              ) : (
                <>
                  <Check className="size-5" /> {feedback.praise}
                </>
              )}
            </p>
            <p className="mt-2 text-sm italic text-muted-foreground">{feedback.naturalAlternative}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              WPM: {feedback.wpm} | Thời gian: {recordingDuration}s
            </p>
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={retryPrompt}>
              <RotateCcw className="size-4" /> Nói lại
            </Button>
            <Button variant="ghost" onClick={saveEntry}>
              <Save className="size-4" /> Lưu nhật ký
            </Button>
            <Button onClick={nextPrompt} size="lg">
              {isLastPrompt ? "Hoàn tất" : "Mục tiếp theo"} <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}

      <p className="mt-3 text-center text-xs text-muted-foreground">
        Mẹo: Voice Diary giúp bạn thói quen suy nghĩ bằng tiếng Anh. 60s/ngày = 6 tiếng/tháng!
      </p>
    </div>
  );
}