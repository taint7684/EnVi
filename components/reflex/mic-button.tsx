"use client";

import { useEffect, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/use-recorder";
import { cn } from "@/lib/utils";

type MicButtonProps = {
  onTranscript: (text: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
  className?: string;
};

export function MicButton({
  onTranscript,
  onError,
  disabled,
  className,
}: MicButtonProps) {
  const { start, stop, error, isRecording, isProcessing } = useRecorder();
  const [transcribing, setTranscribing] = useState(false);

  useEffect(() => {
    if (error) onError?.(error);
  }, [error, onError]);

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "speech.webm");

      const res = await fetch("/api/stt", { method: "POST", body: form });
      const data = (await res.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
      };

      if (!res.ok || !data.text) {
        throw new Error(data.error || "Không nhận diện được giọng nói.");
      }

      onTranscript(data.text);
    } catch (cause) {
      onError?.(
        cause instanceof Error ? cause.message : "Lỗi khi nhận diện giọng nói.",
      );
    } finally {
      setTranscribing(false);
    }
  }

  async function handleClick() {
    if (disabled || transcribing || isProcessing) return;

    if (isRecording) {
      try {
        const blob = await stop();
        if (blob.size > 0) await transcribe(blob);
      } catch (cause) {
        onError?.(
          cause instanceof Error ? cause.message : "Không có bản ghi.",
        );
      }
      return;
    }

    await start();
  }

  const busy = transcribing || isProcessing;

  return (
    <Button
      type="button"
      onClick={handleClick}
      disabled={disabled || busy}
      className={cn(
        "h-12 rounded-full px-7 text-base",
        isRecording && "bg-red-500 text-white hover:bg-red-600",
        className,
      )}
      aria-label={isRecording ? "Dừng ghi âm" : "Bắt đầu ghi âm"}
    >
      {busy ? (
        <Loader2 className="size-5 animate-spin" />
      ) : isRecording ? (
        <Square className="size-5" />
      ) : (
        <Mic className="size-5" />
      )}
      {busy ? "Đang xử lý..." : isRecording ? "Dừng" : "Nói"}
    </Button>
  );
}