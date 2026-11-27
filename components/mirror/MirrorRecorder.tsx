"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Play, Pause, Volume2, VolumeX, RefreshCw, Clock, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function MirrorRecorder({ 
  weekNum, 
  topicId, 
  type = "topic", // "fixed" | "topic"
  onComplete 
}: {
  weekNum: number;
  topicId: string;
  type?: "fixed" | "topic";
  onComplete?: (recordingId: string) => void;
}) {
  const [state, setState] = useState<"idle" | "recording" | "processing" | "done">("idle");
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const MAX_DURATION = 60; // seconds

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          echoCancellation: true, 
          noiseSuppression: true, 
          autoGainControl: true,
          sampleRate: 16000 
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 32000, // 32kbps Opus
      });
      
      chunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm;codecs=opus" });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        audioRef.current = new Audio(url);
        setState("done");
        stream.getTracks().forEach(t => t.stop());
      };
      
      mediaRecorderRef.current.start(100);
      startTimeRef.current = Date.now();
      setState("recording");
      
      // Timer
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        setDuration(elapsed);
        if (elapsed >= MAX_DURATION) stopRecording();
      }, 100);
      
    } catch (e) {
      setError("Microphone access denied. Please allow microphone permission.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && state === "recording") {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const playPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const retry = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setDuration(0);
    setState("idle");
  };

  const upload = async () => {
    if (!audioUrl) return;
    
    setState("processing");
    setUploadProgress(0);
    
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const sb = createClient();
      const fileName = `mirror/${weekNum}/${type}_${topicId}_${Date.now()}.webm`;
      const { data, error: uploadError } = await sb.storage
        .from("mirror-recordings")
        .upload(fileName, blob, {
          contentType: "audio/webm",
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: { publicUrl } } = sb.storage
        .from("mirror-recordings")
        .getPublicUrl(fileName);
      
      // Save to database
      const { data: sessionData, error: sessionError } = await sb
        .from("mirror_recordings")
        .insert({
          user_id: (await sb.auth.getUser()).data.user?.id,
          week_num: weekNum,
          type,
          topic_id: topicId,
          audio_url: publicUrl,
          duration_seconds: duration,
          transcript: null, // TODO: add Whisper transcription
        })
        .select()
        .single();
      
      if (sessionError) throw sessionError;
      
      setUploadProgress(100);
      onComplete?.(sessionData.id);
      
    } catch (e) {
      setError("Upload failed: " + (e instanceof Error ? e.message : "Unknown error"));
      setState("done");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {type === "fixed" ? `Fixed Prompt ${weekNum}` : `Topic: ${topicId}`}
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
          Week {weekNum} · {type}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-3 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="size-4" /> {error}
        </div>
      )}

      {state === "idle" && (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            Record your 60-second mirror response for this week.
          </p>
          <Button size="lg" onClick={startRecording} className="gap-2">
            <Mic className="size-5" />
            Start Recording (max 60s)
          </Button>
        </div>
      )}

      {state === "recording" && (
        <div className="text-center py-8">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="relative">
              <div className="size-24 rounded-full border-4 border-red-500 animate-pulse" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold text-red-500">{MAX_DURATION - duration}s</span>
              </div>
            </div>
          </div>
          <p className="text-red-500 font-medium mb-4">Recording... {duration}s / {MAX_DURATION}s</p>
          <Button variant="destructive" size="lg" onClick={stopRecording} className="gap-2">
            <MicOff className="size-5" />
            Stop & Review
          </Button>
        </div>
      )}

      {state === "done" && audioUrl && (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" onClick={playPause} size="lg" className="size-12 rounded-full">
              {isPlaying ? <Pause className="size-6" /> : <Play className="size-6" />}
            </Button>
            <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-100"
                style={{ width: `${(duration / MAX_DURATION) * 100}%` }}
              />
            </div>
            <span className="text-sm text-muted-foreground w-12 text-right">{duration}s</span>
          </div>
          
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={retry}>
              <RefreshCw className="size-4" /> Retry
            </Button>
            <Button onClick={upload} disabled={state !== "done"}>
              <CheckCircle className="size-4" /> Submit
            </Button>
          </div>
        </div>
      )}

      {state === "processing" && (
        <div className="text-center py-4">
          <div className="size-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p>Uploading... {uploadProgress}%</p>
        </div>
      )}
    </div>
  );
}

// Weekly Comparison Component
export function MirrorComparison({ weekNum }: { weekNum: number }) {
  const [comparison, setComparison] = useState<{
    week1: { audio_url: string; created_at: string } | null;
    current: { audio_url: string; created_at: string } | null;
    metrics_delta: { wpm: number; latency_ms: number; pauses: number };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchComparison = async () => {
    try {
      const sb = createClient();
      const { data } = await sb
        .from("mirror_weekly_comparison")
        .select("*")
        .eq("week_num", weekNum)
        .single();
      setComparison(data);
    } catch (e) {
      console.error("Failed to load comparison:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchComparison();
  }, [weekNum]);

  if (loading) return <div className="text-center py-8">Loading comparison...</div>;
  if (!comparison) return <div className="text-center py-8 text-muted-foreground">No comparison data yet. Complete Week 1 and current week recordings.</div>;

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="text-lg font-semibold mb-4">Week 1 vs Week {weekNum} Comparison</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-border p-4">
          <h4 className="font-medium mb-2">Week 1 (Baseline)</h4>
          <audio controls src={comparison.week1?.audio_url} className="w-full" />
          <p className="text-xs text-muted-foreground mt-1">{comparison.week1?.created_at}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <h4 className="font-medium mb-2">Week {weekNum} (Current)</h4>
          <audio controls src={comparison.current?.audio_url} className="w-full" />
          <p className="text-xs text-muted-foreground mt-1">{comparison.current?.created_at}</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <MetricDelta label="WPM" value={comparison.metrics_delta.wpm} unit="wpm" />
        <MetricDelta label="Latency" value={comparison.metrics_delta.latency_ms} unit="ms" />
        <MetricDelta label="Pauses" value={comparison.metrics_delta.pauses} unit=">3s" />
      </div>
    </div>
  );
}

function MetricDelta({ label, value, unit }: { label: string; value: number; unit: string }) {
  const isImprovement = (label === "WPM" && value > 0) || (label !== "WPM" && value < 0);
  return (
    <div className={`rounded-lg p-4 ${isImprovement ? "bg-emerald-50" : "bg-rose-50"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${isImprovement ? "text-emerald-700" : "text-rose-700"}`}>
        {value > 0 ? "+" : ""}{value} {unit}
      </p>
      <p className="text-xs">{isImprovement ? "Improved" : "Needs work"}</p>
    </div>
  );
}