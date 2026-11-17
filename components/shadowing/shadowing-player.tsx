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
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);
  const [useIframe, setUseIframe] = useState(false);

  const recorder = useRecorder();
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const youtubeUrl = `https://www.youtube.com/embed/${lesson.youtubeId}?enablejsapi=1&origin=${typeof window !== "undefined" ? window.location.origin : ""}`;

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
    };
  }, [recordedUrl]);

  useEffect(() => {
    if (!useIframe || !iframeRef.current) return;

    const updateTime = () => {
      if (!iframeRef.current?.contentWindow) return;
      iframeRef.current.contentWindow.postMessage(
        '{"event":"listening","id":"shadowing-player"}',
        "*",
      );
    };

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://www.youtube.com") return;
      try {
        const data = JSON.parse(event.data);
        if (data.event === "onStateChange" && data.info === 1) {
          setIsPlaying(true);
        } else if (data.event === "onStateChange" && data.info === 2) {
          setIsPlaying(false);
        }
      } catch {
        // ignore
      }
    };

    window.addEventListener("message", handleMessage);
    const interval = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(interval);
    };
  }, [useIframe]);

  useEffect(() => {
    if (!useIframe || !isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime((prev) => {
        const active = lesson.transcript.find(
          (s) => s.startTime <= prev && prev < s.endTime,
        );
        if (active) setActiveSegment(active.id);
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [useIframe, isPlaying, lesson.transcript]);

  const handleSegmentClick = useCallback(
    (segment: ShadowingSegment) => {
      setActiveSegment(segment.id);
      if (useIframe && iframeRef.current) {
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
    [useIframe],
  );

  const handleRecord = useCallback(async () => {
    if (recorder.isRecording) {
      await recorder.stop();
    } else {
      await recorder.start();
    }
  }, [recorder]);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    if (useIframe && iframeRef.current) {
      iframeRef.current.contentWindow?.postMessage(
        JSON.stringify({
          event: "command",
          func: "setPlaybackRate",
          args: [newSpeed],
        }),
        "*",
      );
    }
  }, [useIframe]);

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
          <iframe
            ref={iframeRef}
            src={youtubeUrl}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="aspect-video w-full"
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
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

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              setUseIframe((prev) => !prev);
            }}
          >
            <Play className="mr-1 h-4 w-4" />
            {useIframe ? "YouTube" : "Tải video"}
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
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-accent",
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
                  <Volume2 className="mr-1 h-4 w-4" />
                )}
                {recorder.isRecording ? "Đang ghi..." : "Ghi âm"}
              </Button>
              {recordedUrl && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (iframeRef.current?.contentWindow) {
                        iframeRef.current.contentWindow.postMessage(
                          JSON.stringify({
                            event: "command",
                            func: "playVideo",
                            args: [],
                          }),
                          "*",
                        );
                      }
                    }}
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