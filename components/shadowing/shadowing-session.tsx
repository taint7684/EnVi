"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Check, Mic, Lightbulb, RotateCcw, Volume2, X, Play, Pause, FastForward, Rewind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakEnglish, stopSpeaking } from "@/lib/speech";
import { evaluateSpeech } from "@/lib/speech-eval";
import { cn } from "@/lib/utils";
import { updateSpeakingProgress, updateShadowingProgress } from "@/app/actions/gamification";

export type ShadowingSegment = {
  id: string;
  text: string;
  audioUrl?: string;
  startTime: number;
  endTime: number;
};

export type ShadowingConfig = {
  topicId: string;
  layer: "L1" | "L2" | "L3";
  round: 1 | 2;
  segments: ShadowingSegment[];
  audioUrl: string;
  duration: number;
};

type ShadowingState = "intro" | "listening" | "shadowing" | "feedback" | "complete";

export function ShadowingSession({
  config,
  onComplete,
}: {
  config: ShadowingConfig;
  onComplete?: (metrics: {
    totalSpeakingSeconds: number;
    segmentsCompleted: number;
    avgAccuracy: number;
    avgLatencyMs: number;
  }) => void;
}) {
  const [state, setState] = useState<ShadowingState>("intro");
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<ReturnType<typeof evaluateSpeech> | null>(null);
  const [feedback, setFeedback] = useState<{
    accuracy: number;
    latencyMs: number;
    praise: string;
    naturalAlternative: string;
  } | null>(null);
  const [totalSpeakingSeconds, setTotalSpeakingSeconds] = useState(0);
  const [segmentsCompleted, setSegmentsCompleted] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const startRef = useRef<number>(0);
  const [latencies, setLatencies] = useState<number[]>([]);
  const [audioReady, setAudioReady] = useState(false);

  const currentSegment = config.segments[currentSegmentIndex]!;
  const isLastSegment = currentSegmentIndex >= config.segments.length - 1;
  const progress = ((currentSegmentIndex + 1) / config.segments.length) * 100;

  const avgLatency = useMemo(() => {
    return latencies.length
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;
  }, [latencies]);

  useEffect(() => {
    const audio = new Audio(config.audioUrl);
    audio.addEventListener("timeupdate", () => setAudioCurrentTime(audio.currentTime));
    audio.addEventListener("ended", () => setIsPlaying(false));
    audio.addEventListener("canplay", () => setAudioReady(true));
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [config.audioUrl]);

  useEffect(() => {
    if (state === "shadowing" && currentSegment && audioRef.current) {
      startRef.current = performance.now();
      audioRef.current.currentTime = currentSegment.startTime;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    };
  }, [state, currentSegmentIndex]);

  async function handleSpeech(spoken: string) {
    setTranscript(spoken);
    const latency = Math.round(performance.now() - startRef.current);
    setLatencies((prev) => [...prev, latency]);
    
    const evalResult = evaluateSpeech(currentSegment.text, spoken);
    setEvaluation(evalResult);

    if (evalResult.correct) {
      setSegmentsCompleted((prev) => prev + 1);
      setTotalSpeakingSeconds((prev) => prev + Math.ceil((currentSegment.endTime - currentSegment.startTime)));
      
      setFeedback({
        accuracy: evalResult.ratio * 100,
        latencyMs: latency,
        praise: latency < 1000 ? "Shadowing si\u00eau nhanh!" : latency < 2000 ? "T\u1ed1t, theo k\u1ecbp nh\u1ecbp!" : "\u1eccn, nghe l\u1ea1i s\u1ebd nhanh h\u01a1n.",
        naturalAlternative: currentSegment.text,
      });
      
      setState("feedback");
    }
  }

  function nextSegment() {
    if (isLastSegment) {
      setState("complete");
      onComplete?.({
        totalSpeakingSeconds,
        segmentsCompleted,
        avgAccuracy: feedback?.accuracy || 0,
        avgLatencyMs: avgLatency,
      });

      const minutes = Math.ceil(totalSpeakingSeconds / 60);
      if (minutes > 0) {
        updateSpeakingProgress(minutes, { module: "shadowing", segments: segmentsCompleted });
      }
      updateShadowingProgress(segmentsCompleted);
    } else {
      setCurrentSegmentIndex((i) => i + 1);
      setState("shadowing");
      setTranscript("");
      setEvaluation(null);
      setFeedback(null);
    }
  }

  function retrySegment() {
    setTranscript("");
    setEvaluation(null);
    setFeedback(null);
    setState("shadowing");
  }

  function togglePlayPause() {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(() => {});
      }
      setIsPlaying(!isPlaying);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (state === "complete") {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="text-4xl">🎧</div>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">Hoàn thành Shadowing!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bạn đã shadow {segmentsCompleted}/{config.segments.length} đoạn trong {formatTime(totalSpeakingSeconds)}.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-2xl font-bold text-emerald-700">{segmentsCompleted}</p>
            <p className="text-xs text-emerald-600">Đoạn hoàn thành</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <p className="text-2xl font-bold text-blue-700">{Math.round(feedback?.accuracy || 0)}%</p>
            <p className="text-xs text-blue-600">Độ chính xác TB</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3">
            <p className="text-2xl font-bold text-purple-700">{avgLatency}ms</p>
            <p className="text-xs text-purple-600">Độ trễ TB</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => { setCurrentSegmentIndex(0); setState("intro"); setLatencies([]); }}>Làm lại</Button>
          <Button variant="outline" onClick={() => onComplete?.({ totalSpeakingSeconds: 0, segmentsCompleted: 0, avgAccuracy: 0, avgLatencyMs: 0 })}>Về trang chủ</Button>
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
              className="h-full rounded-full bg-blue-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Đoạn {currentSegmentIndex + 1}/{config.segments.length}
          </span>
        </div>
        <span className="text-sm font-mono tabular-nums text-muted-foreground">
          {state === "shadowing" ? "🎤 Shadowing..." : state === "listening" ? "👂 Nghe..." : "Sẵn sàng"}
        </span>
      </div>

      {state === "intro" && (
        <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-6 text-center">
          <div className="text-4xl">🎧</div>
          <h3 className="mt-3 font-semibold text-blue-700">Shadowing - {config.layer}</h3>
          <p className="mt-2 text-sm text-blue-600">
            Nghe & lặp lại ngay {config.segments.length} đoạn về chủ đề: <strong>{config.topicId}</strong>
          </p>
          <p className="mt-2 text-xs text-blue-500">
            Layer {config.layer === "L1" ? "L1: Câu ngắn, từ cơ bản" : config.layer === "L2" ? "L2: Câu phức, kể chuyện" : "L3: Câu phức, lập luận"}.
            Quy tắc: Nghe → Lặp ngay (độ trễ {"<"} 1s) → Không nhìn chữ.
          </p>
          
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={togglePlayPause} disabled={!audioReady}>
              {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />} Nghe trước toàn bộ ({formatTime(config.duration)})
            </Button>
          </div>
          
          <Button className="mt-4 w-full size-12" onClick={() => setState("shadowing")}>
            <Volume2 className="size-6" /> Bắt đầu Shadowing
          </Button>
        </div>
      )}

      {state === "listening" && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
          <div className="text-4xl">👂</div>
          <h3 className="mt-3 font-semibold text-amber-700">Nghe một lần nữa</h3>
          <p className="mt-2 text-sm text-amber-600">Tập trung vào âm thanh, nhịp độ, gồng ngoại.</p>
          <Button className="mt-4 w-full" onClick={() => setState("shadowing")}>
            <Mic className="mr-2 size-5" /> Bắt đầu shadow
          </Button>
        </div>
      )}

      {state === "shadowing" && (
        <div className="mb-6 rounded-2xl border-2 border-blue-500 bg-blue-50 p-6">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              <Mic className="size-4 animate-pulse" />
              \u0110ang Shadowing...
            </span>
          </div>
          <div className="text-center text-xl font-medium text-foreground leading-relaxed">
            {currentSegment?.text}
          </div>
          <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span>{formatTime(audioCurrentTime)} / {formatTime(currentSegment?.endTime || 0)}</span>
            <span className="text-emerald-600 font-semibold">
              ← {Math.max(0, (currentSegment?.endTime || 0) - audioCurrentTime).toFixed(1)}s
            </span>
          </div>
        </div>
      )}

      {state === "feedback" && (
        <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
              <Check className="size-4" />
              {evaluation?.correct ? "Chính xác!" : "Cần đọc thêm"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="rounded-xl bg-emerald-100 p-3 text-center">
              <p className="text-2xl font-bold text-emerald-700">{Math.round((feedback?.accuracy || 0))}%</p>
              <p className="text-xs text-emerald-600">Độ chính xác</p>
            </div>
            <div className="rounded-xl bg-purple-100 p-3 text-center">
              <p className="text-2xl font-bold text-purple-700">{feedback?.latencyMs}ms</p>
              <p className="text-xs text-purple-600">Độ trễ</p>
            </div>
          </div>
          <p className="text-center text-sm text-emerald-700">{feedback?.praise}</p>
          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" onClick={retrySegment}>
              <RotateCcw className="mr-1 size-4" /> Lặp lại
            </Button>
            <Button onClick={nextSegment}>
              {isLastSegment ? "Hoàn thành" : "Tiếp đoạn tiếp"} <ArrowRight className="ml-1 size-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => audioRef.current && (audioRef.current.currentTime = Math.max(0, (audioRef.current.currentTime || 0) - 10))}>
            <Rewind className="size-4" /> -10s
          </Button>
          <Button variant="outline" onClick={togglePlayPause} className="size-10 rounded-full">
            {isPlaying ? <Pause className="size-5" /> : <Play className="size-5" />}
          </Button>
          <Button variant="outline" size="sm" onClick={() => audioRef.current && (audioRef.current.currentTime = Math.min(config.duration, (audioRef.current.currentTime || 0) + 10))}>
            <FastForward className="size-4" /> +10s
          </Button>
          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${config.duration > 0 ? (audioCurrentTime / config.duration) * 100 : 0}%` }}
            />
          </div>
          <span className="text-sm font-mono tabular-nums text-muted-foreground">
            {formatTime(audioCurrentTime)} / {formatTime(config.duration)}
          </span>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-muted/50 p-4 text-center">
        <p className="text-xs text-muted-foreground">Quy tắc: Nghe → Lặp ngay (không nhìn chữ) → Kiểm tra phát âm</p>
      </div>
    </div>
  );
}