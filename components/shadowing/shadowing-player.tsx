"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Volume2, VolumeX, RefreshCw, Mic, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/use-recorder";
import type { ShadowingLesson, ShadowingSegment } from "@/lib/shadowing-data";
import { formatTime } from "@/lib/shadowing-data";
import { scoreShadowing } from "@/lib/speech/scoring";
import { saveShadowingAttempt } from "@/lib/shadowing/server";

type Props = {
  lesson: ShadowingLesson;
};

const SPEEDS = [0.75, 1, 1.25, 1.5];
const POLL_INTERVAL_MS = 200;

type Evaluation = {
  score: number;
  correct: boolean;
  feedback: string;
} | null;

type YTPlayer = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  setPlaybackRate: (rate: number) => void;
  destroy: () => void;
};

type YTNamespace = {
  Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
};

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export function ShadowingPlayer({ lesson }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [useTTS, setUseTTS] = useState(true);
  const [ttsSpeed, setTtsSpeed] = useState(1);
  const [ttsPlayingAll, setTtsPlayingAll] = useState(false);
  const [ytReady, setYtReady] = useState(false);

  const ttsMode = useTTS;

  const recorder = useRecorder();
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation>(null);
  const [evaluating, setEvaluating] = useState(false);

  const playerRef = useRef<YTPlayer | null>(null);
  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<number>(0);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stopAtRef = useRef<number | null>(null);

  async function transcribe(blob: Blob): Promise<string> {
    const form = new FormData();
    form.append("audio", blob, "shadow.webm");
    const res = await fetch("/api/stt", { method: "POST", body: form });
    if (!res.ok) return "";
    const data = (await res.json()) as { text?: string };
    return data.text ?? "";
  }

  useEffect(() => {
    if (!recorder.audioBlob) return undefined;
    const url = URL.createObjectURL(recorder.audioBlob);
    const timer = setTimeout(() => setRecordedUrl(url), 0);
    return () => clearTimeout(timer);
  }, [recorder.audioBlob]);

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
    };
  }, [recordedUrl]);

  useEffect(() => {
    if (ttsMode) return;
    let cancelled = false;

    function initPlayer() {
      if (cancelled || !window.YT || !ytContainerRef.current) return;
      if (playerRef.current) return;

      const target = ytContainerRef.current;
      const el = document.createElement("div");
      target.innerHTML = "";
      target.appendChild(el);

      playerRef.current = new window.YT.Player(el, {
        videoId: lesson.youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          enablejsapi: 1,
        },
        events: {
          onReady: () => {
            if (cancelled) return;
            setYtReady(true);
            playerRef.current?.setPlaybackRate(speed);
            startPolling();
          },
          onStateChange: (data: { data: number }) => {
            setIsPlaying(data.data === 1);
          },
        },
      });
    }

    function startPolling() {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        const player = playerRef.current;
        if (!player) return;
        try {
          const t = player.getCurrentTime();
          if (stopAtRef.current != null && t >= stopAtRef.current) {
            player.pauseVideo();
            stopAtRef.current = null;
            return;
          }
          const seg = lesson.transcript.find(
            (s) => t >= s.startTime && t < s.endTime,
          );
          if (seg && seg.id !== activeSegment) {
            setActiveSegment(seg.id);
          }
        } catch {
          // player not ready
        }
      }, POLL_INTERVAL_MS);
    }

    if (window.YT?.Player) {
      initPlayer();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initPlayer();
      };
      if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        document.head.appendChild(tag);
      }
    }

    return () => {
      cancelled = true;
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch { /* noop */ }
        playerRef.current = null;
      }
      stopAtRef.current = null;
      setYtReady(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.youtubeId, ttsMode]);

  const playSegmentTTS = useCallback((segment: ShadowingSegment) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(segment.text);
    utter.lang = "en-US";
    utter.rate = ttsSpeed;
    utter.onend = () => {
      setActiveSegment(null);
    };
    setActiveSegment(segment.id);
    window.speechSynthesis.speak(utter);
  }, [ttsSpeed]);

  const speakQueueRef = useRef<(queue: number[], idx: number, rate: number) => void>(() => {});

  const speakQueue = useCallback((queue: number[], idx: number, rate: number) => {
    if (idx >= queue.length) {
      setTtsPlayingAll(false);
      setActiveSegment(null);
      return;
    }
    const segId = queue[idx];
    const seg = lesson.transcript.find((s) => s.id === segId);
    if (!seg) {
      speakQueueRef.current(queue, idx + 1, rate);
      return;
    }
    setActiveSegment(seg.id);
    const utter = new SpeechSynthesisUtterance(seg.text);
    utter.lang = "en-US";
    utter.rate = rate;
    utter.onend = () => {
      speakQueueRef.current(queue, idx + 1, rate);
    };
    window.speechSynthesis.speak(utter);
  }, [lesson.transcript]);

  useEffect(() => {
    speakQueueRef.current = speakQueue;
  }, [speakQueue]);

  const handlePlayAllTTS = useCallback(() => {
    if (ttsPlayingAll) {
      window.speechSynthesis?.cancel();
      setTtsPlayingAll(false);
      setActiveSegment(null);
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const queue = lesson.transcript.map((s) => s.id);
    setTtsPlayingAll(true);
    speakQueue(queue, 0, ttsSpeed);
  }, [ttsPlayingAll, lesson.transcript, speakQueue, ttsSpeed]);

  const handleRecord = useCallback(async () => {
    if (recorder.isRecording) {
      await recorder.stop();
    } else {
      setEvaluation(null);
      startRef.current = Date.now();
      await recorder.start();
    }
  }, [recorder]);

  const handleEvaluate = useCallback(async () => {
    const seg = activeSegment != null
      ? lesson.transcript.find((s) => s.id === activeSegment) ?? lesson.transcript[0]
      : lesson.transcript[0];
    const blob = recorder.audioBlob;
    if (!seg || !blob) return;
    setEvaluating(true);
    try {
      const transcript = await transcribe(blob);
      const userDur = (Date.now() - startRef.current) / 1000;
      const refDur = Math.max(0.1, seg.endTime - seg.startTime);
      const scored = scoreShadowing(transcript, seg.text, userDur, refDur);
      const pct = Math.round(scored.score * 100);
      setEvaluation({
        score: pct,
        correct: scored.score >= 0.8,
        feedback: `Chính xác ${Math.round(scored.accuracy * 100)}% · nhịp ${Math.round(scored.timing * 100)}%.`,
      });
      void saveShadowingAttempt({
        itemId: lesson.id,
        segmentIdx: seg.id,
        transcript,
        accuracy: scored.accuracy,
        timing: scored.timing,
        score: scored.score,
      }).catch(() => {});
    } catch {
      setEvaluation(null);
    } finally {
      setEvaluating(false);
    }
  }, [recorder.audioBlob, activeSegment, lesson.id, lesson.transcript]);

  const handleSegmentClick = useCallback(
    (segment: ShadowingSegment) => {
      setActiveSegment(segment.id);
      setEvaluation(null);
      if (ttsMode) {
        playSegmentTTS(segment);
        return;
      }
      const player = playerRef.current;
      if (!player) return;
      try {
        player.seekTo(segment.startTime, true);
        player.playVideo();
        stopAtRef.current = segment.endTime;
      } catch {
        // player not ready
      }
    },
    [ttsMode, playSegmentTTS],
  );

  const handlePlayOriginal = useCallback(() => {
    if (ttsMode && activeSegment) {
      const seg = lesson.transcript.find((s) => s.id === activeSegment);
      if (seg) playSegmentTTS(seg);
      return;
    }
    const player = playerRef.current;
    if (!player) return;
    try {
      player.playVideo();
      setIsPlaying(true);
    } catch {
      // player not ready
    }
  }, [ttsMode, activeSegment, lesson.transcript, playSegmentTTS]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    const player = playerRef.current;
    if (!ttsMode && player) {
      try { player.setPlaybackRate(newSpeed); } catch { /* noop */ }
    }
  }, [ttsMode]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-medium">{lesson.title}</h3>
            <p className="text-sm text-muted-foreground">{lesson.titleVi}</p>
          </div>
          <span className="rounded-full bg-accent px-2 py-1 text-xs font-medium text-accent-foreground">
            {lesson.level}
          </span>
        </div>

        <div className="overflow-hidden rounded-xl bg-black">
          {!ttsMode ? (
            <div className="relative">
              <div ref={ytContainerRef} className="aspect-video w-full" />
              {!ytReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black">
                  <p className="text-sm text-muted-foreground">Đang tải video…</p>
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <div className="text-center">
                <Volume2 className="mx-auto h-8 w-8 text-primary-foreground mb-2" />
                <p className="text-sm text-primary-foreground font-medium">
                  Đồng bộ 100% · Đọc đúng từng câu
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Chế độ phát âm máy — không cần YouTube
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nhấp câu trong lời thoại để nghe từng câu
                </p>
              </div>
            </div>
          )}
        </div>

        {!ttsMode && lesson.videoSynced ? (
          <p className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
            Video đã đồng bộ với lời thoại — âm thanh khớp chính xác.
          </p>
        ) : !ttsMode ? (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Video tham khảo — có thể không khớp lời thoại. Dùng &quot;Phát âm máy&quot; để nghe đúng từng câu.
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SPEEDS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={(ttsMode ? ttsSpeed : speed) === s ? "default" : "outline"}
              onClick={() => {
                if (ttsMode) setTtsSpeed(s);
                else handleSpeedChange(s);
              }}
              className="h-7 text-xs"
            >
              {s}x
            </Button>
          ))}

          {ttsMode ? (
            <Button
              size="sm"
              variant={ttsPlayingAll ? "destructive" : "outline"}
              onClick={handlePlayAllTTS}
            >
              <Play className="mr-1 h-4 w-4" />
              {ttsPlayingAll ? "Dừng" : "Phát tất cả"}
            </Button>
          ) : null}

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setUseTTS((prev) => !prev);
              setEvaluation(null);
            }}
          >
            <Play className="mr-1 h-4 w-4" />
            {ttsMode ? "Dùng video YouTube" : "Phát âm máy (đồng bộ)"}
          </Button>

          {isPlaying && !ttsMode && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const player = playerRef.current;
                if (player) {
                  try { player.pauseVideo(); } catch { /* noop */ }
                }
                setIsPlaying(false);
              }}
            >
              <VolumeX className="mr-1 h-4 w-4" />
              Dừng
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 font-medium">Lời thoại</h4>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {lesson.transcript.map((seg) => (
              <button
                key={seg.id}
                onClick={() => handleSegmentClick(seg)}
                className={cn(
                  "w-full rounded-lg p-2 text-left text-sm transition-colors",
                  activeSegment === seg.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-accent border-transparent",
                )}
              >
                <span className="mr-2 text-xs text-muted-foreground">
                  {formatTime(seg.startTime)}
                </span>
                {seg.text}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 font-medium">Ghi âm & So sánh</h4>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={recorder.isRecording ? "destructive" : "default"}
                onClick={handleRecord}
              >
                {recorder.isRecording ? (
                  <RotateCcw className="mr-1 h-4 w-4" />
                ) : (
                  <Mic className="mr-1 h-4 w-4" />
                )}
                {recorder.isRecording ? "Đang ghi…" : "Ghi âm"}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleEvaluate}
                disabled={!recordedUrl || evaluating}
              >
                {evaluating ? (
                  <RefreshCw className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1 h-4 w-4" />
                )}
                {evaluating ? "Đánh giá…" : "Đánh giá"}
              </Button>
            </div>

            {recorder.error && (
              <p className="text-sm text-destructive">{recorder.error}</p>
            )}

            {evaluation && (
              <div className={cn(
                "rounded-lg p-3 text-sm",
                evaluation.correct
                  ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border border-amber-200 bg-amber-50 text-amber-700",
              )}>
                <div className="flex items-center gap-2 mb-1">
                  {evaluation.correct ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  <span className="font-semibold">
                    {evaluation.correct ? "Phát âm chuẩn" : "Cần luyện thêm"}
                  </span>
                  <span className="ml-auto text-xs font-mono">{evaluation.score}%</span>
                </div>
                <p className="text-xs">{evaluation.feedback}</p>
              </div>
            )}

            {recordedUrl && (
              <>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handlePlayOriginal}
                    disabled={!activeSegment}
                  >
                    <Play className="mr-1 h-4 w-4" />
                    Bản gốc
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const audio = new Audio(recordedUrl);
                      audio.play();
                    }}
                  >
                    <Play className="mr-1 h-4 w-4" />
                    Giọng bạn
                  </Button>
                </div>
                <div className="rounded-lg bg-muted/50 p-2">
                  <audio src={recordedUrl} controls className="w-full" />
                </div>
              </>
            )}

            <p className="text-xs text-muted-foreground">
              Chế độ &quot;Phát âm máy&quot; đọc đúng từng câu lời thoại (đồng bộ 100%).
              Nhấp câu để nghe, hoặc &quot;Phát tất cả&quot; để nghe toàn bài. Sau đó nhấn
              Ghi âm và đọc theo, rồi Đánh giá để so sánh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}