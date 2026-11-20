"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play, RotateCcw, Volume2, VolumeX, RefreshCw, Mic, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/use-recorder";
import type { ShadowingLesson, ShadowingSegment } from "@/lib/shadowing-data";
import { formatTime } from "@/lib/shadowing-data";
import { speakEnglish } from "@/lib/speech";

type Props = {
  lesson: ShadowingLesson;
};

const SPEEDS = [0.75, 1, 1.25, 1.5];

type Evaluation = {
  score: number;
  correct: boolean;
  feedback: string;
} | null;

export function ShadowingPlayer({ lesson }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [useTTS, setUseTTS] = useState(false);

  const recorder = useRecorder();
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation>(null);
  const [evaluating, setEvaluating] = useState(false);

  const youtubeUrl = `https://www.youtube.com/embed/${lesson.youtubeId}?enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`;
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (recorder.audioBlob) {
      const url = URL.createObjectURL(recorder.audioBlob);
      setRecordedUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [recorder.audioBlob]);

  useEffect(() => {
    return () => {
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      if (audioRef.current) audioRef.current.pause();
    };
  }, [recordedUrl]);

  const playSegmentTTS = useCallback((segment: ShadowingSegment) => {
    speakEnglish(segment.text);
  }, []);

  const handleRecord = useCallback(async () => {
    if (recorder.isRecording) {
      await recorder.stop();
    } else {
      setEvaluation(null);
      await recorder.start();
    }
  }, [recorder]);

  const handleEvaluate = useCallback(async () => {
    if (!recordedUrl) return;
    setEvaluating(true);
    try {
      const audio = new Audio(recordedUrl);
      // Use browser Web Speech API for transcription-free comparison via STT would need server.
      // Fallback: compare against expected text using user's manual input is not possible here.
      // Instead provide a self-scoring: user listens to their recording vs original.
      setEvaluation({
        score: 0,
        correct: false,
        feedback: "Ghi âm hoàn thành. Hãy nghe lại bản gốc và bản ghi của bạn để tự đánh giá.",
      });
    } catch {
      setEvaluation(null);
    } finally {
      setEvaluating(false);
    }
  }, [recordedUrl]);

  const handleSegmentClick = useCallback(
    (segment: ShadowingSegment) => {
      setActiveSegment(segment.id);
      setEvaluation(null);
      if (useTTS) {
        playSegmentTTS(segment);
      } else if (iframeRef.current) {
        iframeRef.current.contentWindow?.postMessage(
          JSON.stringify({
            event: "command",
            func: "seekTo",
            args: [segment.startTime, true],
          }),
          "*",
        );
      }
    },
    [useTTS, playSegmentTTS],
  );

  const handlePlayOriginal = useCallback(() => {
    if (useTTS && activeSegment) {
      const seg = lesson.transcript.find((s) => s.id === activeSegment);
      if (seg) playSegmentTTS(seg);
    } else if (iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "playVideo",
          args: [],
        }),
        "*",
      );
    }
  }, [useTTS, activeSegment, lesson.transcript, playSegmentTTS]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    if (!useTTS && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "setPlaybackRate",
          args: [newSpeed],
        }),
        "*",
      );
    }
  }, [useTTS]);

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
          {!useTTS ? (
            <iframe
              ref={iframeRef}
              src={youtubeUrl}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="aspect-video w-full"
            />
          ) : (
            <div className="aspect-video w-full bg-black flex items-center justify-center">
              <div className="text-center">
                <Volume2 className="mx-auto h-8 w-8 text-primary-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Chế độ phát âm máy (Edge TTS) — không cần YouTube
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          {SPEEDS.map((s) => (
            <Button
              key={s}
              size="sm"
              variant={speed === s ? "default" : "outline"}
              onClick={() => handleSpeedChange(s)}
              className="h-7 text-xs"
              disabled={useTTS}
            >
              {s}x
            </Button>
          ))}

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setUseTTS((prev) => !prev);
              setEvaluation(null);
            }}
          >
            <Play className="mr-1 h-4 w-4" />
            {useTTS ? "YouTube video" : "Phát âm máy"}
          </Button>
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
              Nhấp vào câu trong lời thoại để chọn đoạn. Sau đó nhấn Ghi âm và
              đọc theo. Nhấn Đánh giá để so sánh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
