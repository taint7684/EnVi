"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export type VadState = "idle" | "listening" | "speech_start" | "speech_end";

export type VadSpeechStartEvent = { type: "speech_start"; timestamp: number; confidence: number };
export type VadSpeechEndEvent = { type: "speech_end"; timestamp: number; duration: number };
export type VadErrorEvent = { type: "vad_error"; error: string };

export type VadEvent = VadSpeechStartEvent | VadSpeechEndEvent | VadErrorEvent;

type VadCallbacks = {
  onSpeechStart?: (event: VadSpeechStartEvent) => void;
  onSpeechEnd?: (event: VadSpeechEndEvent) => void;
  onError?: (error: string) => void;
};

type MicVADInstance = {
  start: () => Promise<void>;
  pause: () => Promise<void>;
  destroy: () => Promise<void>;
  setOptions: (update: Partial<Record<string, unknown>>) => void;
  listening: boolean;
  errored: string | null;
};

export function useVad(callbacks: VadCallbacks = {}) {
  const [state, setState] = useState<VadState>("idle");
  const [isSupported, setIsSupported] = useState(false);
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [onsetLatencyMs, setOnsetLatencyMs] = useState<number | null>(null);

  const vadRef = useRef<MicVADInstance | null>(null);
  const speechStartedRef = useRef<boolean>(false);
  const speechStartTimeRef = useRef<number>(0);
  const ttsEndTimeRef = useRef<number>(0);

  const callbacksRef = useRef(callbacks);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const checkSupport = useCallback(async () => {
    try {
      const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasAudioContext = !!(window.AudioContext || (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext);
      if (hasGetUserMedia && hasAudioContext) {
        // Defer state updates to avoid synchronous setState in effect
        setTimeout(() => {
          setIsSupported(true);
          setIsModelLoaded(true);
        }, 0);
      }
    } catch (e) {
      console.warn("VAD support check failed:", e);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (vadRef.current) {
      vadRef.current.destroy().catch(() => {});
      vadRef.current = null;
    }
    speechStartedRef.current = false;
    setState("idle");
  }, []);

  useEffect(() => {
    checkSupport();
    return () => cleanup();
  }, [checkSupport, cleanup]);

  const startListening = useCallback(async (onTtsEnd?: () => void) => {
    const currentCallbacks = callbacksRef.current;
    if (!isSupported || !isModelLoaded) {
      currentCallbacks.onError?.("VAD not ready");
      return false;
    }

    if (state !== "idle" && vadRef.current) {
      cleanup();
    }

    try {
      const { MicVAD } = await import("@ricky0123/vad-web");

      const vad = await MicVAD.new({
        positiveSpeechThreshold: 0.5,
        negativeSpeechThreshold: 0.35,
        redemptionMs: 400,
        preSpeechPadMs: 100,
        onSpeechStart: () => {
          if (!speechStartedRef.current) {
            speechStartedRef.current = true;
            speechStartTimeRef.current = performance.now();
            const onsetLatency = ttsEndTimeRef.current > 0 ? speechStartTimeRef.current - ttsEndTimeRef.current : 0;
            const latencyMs = onsetLatency > 0 ? Math.round(onsetLatency) : null;
            if (latencyMs !== null) {
              setOnsetLatencyMs(latencyMs);
            }
            setState("speech_start");
            currentCallbacks.onSpeechStart?.({
              type: "speech_start",
              timestamp: speechStartTimeRef.current,
              confidence: 1.0,
            });
          }
          setState("listening");
        },
        onSpeechEnd: (audio: Float32Array) => {
          if (speechStartedRef.current) {
            const speechEndTime = performance.now();
            const duration = speechEndTime - speechStartTimeRef.current;
            speechStartedRef.current = false;
            setState("speech_end");
            currentCallbacks.onSpeechEnd?.({
              type: "speech_end",
              timestamp: speechEndTime,
              duration,
            });
            setTimeout(() => {
              setState("idle");
            }, 2000);
          }
        },
        onVADMisfire: () => {
          // Speech detected but too short - ignore
        },
        onSpeechRealStart: () => {
          // Valid speech start
        },
        onFrameProcessed: () => {
          // Frame processed - not needed for our use case
        },
        audioContext: undefined,
        getStream: async () => {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000,
            },
          });
          return stream;
        },
        pauseStream: async (stream: MediaStream) => {
          stream.getTracks().forEach((t) => t.stop());
        },
        resumeStream: async () => {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: 16000,
            },
          });
          return stream;
        },
        startOnLoad: false,
        processorType: "auto",
      });

      vadRef.current = vad;
      ttsEndTimeRef.current = 0;
      speechStartedRef.current = false;
      setOnsetLatencyMs(null);
      setState("listening");
      return true;
    } catch (e) {
      currentCallbacks.onError?.(e instanceof Error ? e.message : "Failed to start VAD");
      return false;
    }
  }, [isSupported, isModelLoaded, state, cleanup]);

  const markTtsEnd = useCallback(() => {
    ttsEndTimeRef.current = performance.now();
  }, []);

  const stopListening = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const getOnsetLatency = useCallback(() => {
    return onsetLatencyMs;
  }, [onsetLatencyMs]);

  return {
    state,
    isSupported,
    isModelLoaded,
    onsetLatencyMs,
    startListening,
    stopListening,
    markTtsEnd,
    getOnsetLatency,
  };
}

export function useVadWithMetrics() {
  const [onsetLatencyMs, setOnsetLatencyMs] = useState<number | null>(null);
  const [speechDurationMs, setSpeechDurationMs] = useState<number | null>(null);
  const [vadConfidence, setVadConfidence] = useState<number>(0);

  const vad = useVad({
    onSpeechStart: (e) => {
      setVadConfidence(e.confidence);
    },
    onSpeechEnd: (e) => {
      setSpeechDurationMs(e.duration);
    },
  });

  const wrappedMarkTtsEnd = useCallback(() => {
    vad.markTtsEnd();
  }, [vad]);

  const wrappedStartListening = useCallback(async (onTtsEnd?: () => void) => {
    setOnsetLatencyMs(null);
    setSpeechDurationMs(null);
    setVadConfidence(0);
    const result = await vad.startListening(onTtsEnd);
    const latency = vad.getOnsetLatency();
    if (latency !== null) {
      setOnsetLatencyMs(latency);
    }
    return result;
  }, [vad]);

  return {
    ...vad,
    onsetLatencyMs,
    speechDurationMs,
    vadConfidence,
    markTtsEnd: wrappedMarkTtsEnd,
    startListening: wrappedStartListening,
  };
}