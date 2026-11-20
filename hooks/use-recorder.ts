"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type RecorderState = "idle" | "recording" | "processing";

export function useRecorder() {
  const [state, setState] = useState<RecorderState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const resolveRef = useRef<((blob: Blob) => void) | null>(null);
  const rejectRef = useRef<((error: Error) => void) | null>(null);

  const cleanup = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setAudioBlob(null);

    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === "undefined"
    ) {
      setError("Trình duyệt không hỗ trợ ghi âm. Hãy nhập bằng bàn phím.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream);

      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setAudioBlob(blob);
        setState("idle");
        cleanup();

        if (resolveRef.current) {
          resolveRef.current(blob);
          resolveRef.current = null;
          rejectRef.current = null;
        }
      };

      recorder.onerror = () => {
        const failure = new Error("Ghi âm bị lỗi.");
        setError(failure.message);
        setState("idle");
        cleanup();

        if (rejectRef.current) {
          rejectRef.current(failure);
          resolveRef.current = null;
          rejectRef.current = null;
        }
      };

      recorder.start();
      setState("recording");
    } catch (cause) {
      cleanup();
      const message =
        cause instanceof DOMException && cause.name === "NotAllowedError"
          ? "Bạn đã từ chối quyền micro. Hãy cấp quyền trong trình duyệt hoặc nhập bằng bàn phím."
          : "Không thể mở micro. Hãy kiểm tra thiết bị hoặc nhập bằng bàn phím.";
      setError(message);
      setState("idle");
    }
  }, [cleanup]);

  const stop = useCallback((): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const recorder = recorderRef.current;

      if (!recorder || recorder.state === "inactive") {
        reject(new Error("Không có bản ghi để dừng."));
        return;
      }

      resolveRef.current = resolve;
      rejectRef.current = reject;
      setState("processing");
      recorder.stop();
    });
  }, []);

  const reset = useCallback(() => {
    setAudioBlob(null);
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    state,
    audioBlob,
    error,
    isRecording: state === "recording",
    isProcessing: state === "processing",
    start,
    stop,
    reset,
  };
}