"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/use-recorder";
import type { ShadowingLesson, ShadowingSegment } from "@/lib/shadowing-data";
import { formatTime } from "@/lib/shadowing-data";

type Props = {
  lesson: ShadowingLesson;
};

const SPEEDS = [0.75, 1, 1.25, 1.5];

export function ShadowingPlayer({ lesson }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  const recorder = useRecorder();
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [comparisonPlaying, setComparisonPlaying] = useState(false);
  const comparisonAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [speed, volume, isMuted]);

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
      comparisonAudioRef.current?.pause();
    };
  }, [recordedUrl]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleSegmentClick = useCallback(
    (segment: ShadowingSegment) => {
      handleSeek(segment.start);
      setActiveSegment(segment.id);
    },
    [handleSeek],
  );

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    if (audioRef.current) audioRef.current.playbackRate = newSpeed;
  }, []);

  const handleRecord = useCallback(async () => {
    if (recorder.isRecording) {
      await recorder.stop();
    } else {
      await recorder.start();
    }
  }, [recorder]);

  const handlePlayComparison = useCallback(
    (which: "original" | "recorded") => {
      comparisonAudioRef.current?.pause();
      if (which === "original" && audioRef.current) {
        audioRef.current.currentTime = activeSegment
          ? lesson.transcript.find((s) => s.id === activeSegment)?.start ?? 0
          : 0;
        audioRef.current.play();
        setIsPlaying(true);
      } else if (which === "recorded" && recordedUrl) {
        if (!comparisonAudioRef.current) {
          comparisonAudioRef.current = new Audio(recordedUrl);
        }
        comparisonAudioRef.current.src = recordedUrl;
        comparisonAudioRef.current.play();
        setComparisonPlaying(true);
        comparisonAudioRef.current.onended = () => setComparisonPlaying(false);
      }
    },
    [activeSegment, lesson.transcript, recordedUrl],
  );

  return (
    <div className="space-y-6">
      {/* Player */}
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-medium">{lesson.title}</h3>
          <span className="text-sm text-muted-foreground">{lesson.duration}</span>
        </div>

        {lesson.type === "audio" ? (
          <div className="relative overflow-hidden rounded-xl bg-black/5">
            <audio
              ref={audioRef}
              src={lesson.url}
              onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
              onEnded={() => setIsPlaying(false)}
              className="hidden"
            />
            <div className="flex flex-col items-center gap-2 p-6">
              <div className="flex items-center gap-3">
                <Button
                  size="icon"
                  className="h-12 w-12 rounded-full"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="relative h-2 w-full max-w-md rounded-full bg-muted">
                <div
                  className="absolute h-full rounded-full bg-primary"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={(e) => handleSeek(Number(e.target.value))}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {SPEEDS.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={speed === s ? "default" : "outline"}
                      onClick={() => handleSpeedChange(s)}
                      className="h-7 text-xs"
                    >
                      {s}x
                    </Button>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setVolume(volume > 0 ? 0 : 1);
                    setIsMuted(volume > 0);
                  }}
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="aspect-video overflow-hidden rounded-xl bg-black">
            <iframe
              ref={iframeRef}
              src={lesson.url}
              title={lesson.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full"
            />
          </div>
        )}
      </div>

      {/* Transcript + Record */}
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
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent",
                )}
              >
                <span className="mr-2 text-xs text-muted-foreground">
                  {formatTime(seg.start)}
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
                  <Volume2 className="mr-1 h-4 w-4" />
                )}
                {recorder.isRecording ? "Đang ghi..." : "Ghi âm"}
              </Button>
              {recordedUrl && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlayComparison("original")}
                  >
                    <Play className="mr-1 h-4 w-4" />
                    Bản gốc
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handlePlayComparison("recorded")}
                  >
                    <Play className="mr-1 h-4 w-4" />
                    Giọng bạn
                  </Button>
                </>
              )}
            </div>

            {recorder.error && (
              <p className="text-sm text-destructive">{recorder.error}</p>
            )}

            {recordedUrl && (
              <div className="rounded-lg bg-accent p-2">
                <audio src={recordedUrl} controls className="w-full" />
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Nhấp vào một câu trong lời thoại để tua đến đoạn đó. Sau đó nhấn
              Ghi âm và đọc theo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}