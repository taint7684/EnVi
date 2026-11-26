"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Volume2, Check, X, Loader2, AlertTriangle, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const WEEKLY_PROMPTS = [
  { key: "self_intro", text: "Introduce yourself: name, job, daily routine, and goals." },
  { key: "work_description", text: "Describe your current project or work responsibilities in detail." },
  { key: "weekend_recap", text: "Tell me about your last weekend: what you did, who with, how you felt." },
  { key: "topic_weekly", text: "Give your opinion on this week's curriculum topic with reasons and examples." },
];

export function OralMirrorRecorder({
  weekNum,
  onComplete,
}: {
  weekNum: number;
  onComplete?: (data: any) => void;
}) {
  const [state, setState] = useState<"intro" | "recording" | "review" | "complete">("intro");
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordings, setRecordings] = useState<Record<string, { blob: Blob; url: string; metrics: any }>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPrompt = WEEKLY_PROMPTS[currentPromptIndex];
  const isLastPrompt = currentPromptIndex >= WEEKLY_PROMPTS.length - 1;

  useEffect(() => {
    fetchHistory();
  }, [weekNum]);

  async function fetchHistory() {
    try {
      const res = await fetch(`/api/assessment/oral-mirror?week_num=${weekNum}`);
      const data = await res.json();
      if (data.recordings) {
        // Could show previous weeks' recordings
      }
    } catch (e) {
      console.error("Failed to fetch history", e);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordings(prev => ({
          ...prev,
          [currentPrompt.key]: { blob, url, metrics: {} }
        }));
        setState("review");
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (e) {
      setError("Không thể truy cập microphone");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
  }

  function playRecording(url: string) {
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = new Audio(url);
    audioRef.current.play();
  }

  async function submitRecording() {
    if (!recordings[currentPrompt.key]) return;
    
    setLoading(true);
    try {
      const recording = recordings[currentPrompt.key];
      const formData = new FormData();
      formData.append("audio", recording.blob, `${currentPrompt.key}.webm`);
      formData.append("week_num", weekNum.toString());
      formData.append("prompt_key", currentPrompt.key);
      formData.append("prompt_text_en", currentPrompt.text);
      formData.append("audio_duration_sec", recordingTime.toString());
      formData.append("transcript", "Transcript placeholder"); // In real app, use STT
      formData.append("wpm", "120");
      formData.append("word_count", "200");
      formData.append("pauses_over_3s", "2");
      formData.append("filler_count", "3");
      formData.append("vi_segments", "0");
      formData.append("onset_latency_ms", "1500");
      formData.append("detected_language", "en");

      const res = await fetch("/api/assessment/oral-mirror", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      
      if (data.recording) {
        if (isLastPrompt) {
          setResults(data);
          setState("complete");
          onComplete?.(data);
        } else {
          setCurrentPromptIndex(prev => prev + 1);
          setState("intro");
          setRecordingTime(0);
        }
      }
    } catch (e) {
      setError("Lỗi khi gửi bản ghi âm");
    } finally {
      setLoading(false);
    }
  }

  function retryRecording() {
    setState("recording");
  }

  function nextPrompt() {
    if (isLastPrompt) {
      setState("complete");
    } else {
      setCurrentPromptIndex(prev => prev + 1);
      setState("intro");
      setRecordingTime(0);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const completedCount = Object.keys(recordings).length;

  if (state === "complete") {
    return (
      <div className="mx-auto max-w-xl py-8">
        <div className="text-center mb-8">
          <div className="text-4xl">🎙️</div>
          <h1 className="mt-4 font-serif text-2xl font-semibold">Hoàn thành Mirror Recording!</h1>
          <p className="mt-1 text-muted-foreground">Tuần {weekNum} · {completedCount}/4 bài ghi âm</p>
        </div>

        {results && (
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm mb-6">
            <h3 className="font-semibold mb-4">Kết quả CEFR ước tính</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="rounded-xl bg-primary/10 p-4 text-center">
                <p className="text-3xl font-bold text-primary">{results.estimatedLevel || "A1"}</p>
                <p className="text-sm text-muted-foreground">Trình độ ước tính</p>
              </div>
              <div className="rounded-xl bg-emerald/10 p-4 text-center">
                <p className="text-3xl font-bold text-emerald-700">{(results.cefrScores?.fluency || 0) * 100}%</p>
                <p className="text-sm text-muted-foreground">Fluency</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-sm">
              <div className="rounded-lg bg-blue/10 p-2">Accuracy: {(results.cefrScores?.accuracy || 0) * 100}%</div>
              <div className="rounded-lg bg-purple/10 p-2">Prosody: {(results.cefrScores?.prosody || 0) * 100}%</div>
              <div className="rounded-lg bg-amber/10 p-2">Vocab: {(results.cefrScores?.vocab_range || 0) * 100}%</div>
              <div className="rounded-lg bg-rose/10 p-2">VI segments: {results.recording?.vi_segments || 0}</div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap justify-center gap-3">
          <Button variant="outline" onClick={() => { setCurrentPromptIndex(0); setRecordings({}); setState("intro"); }}>Làm lại tuần này</Button>
          <Button onClick={() => onComplete?.(null)}>Về trang chủ</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl py-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-48 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${(completedCount / 4) * 100}%` }} />
          </div>
          <span className="text-sm text-muted-foreground">{completedCount}/4 bài ghi âm</span>
        </div>
        <span className="text-sm font-mono tabular-nums text-muted-foreground">
          Tuần {weekNum}
        </span>
      </div>

      {state === "intro" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <div className="text-center mb-4">
            <div className="text-4xl">🎙️</div>
            <h3 className="mt-3 font-semibold text-amber-700">Mirror Recording - Tuần {weekNum}</h3>
            <p className="mt-1 text-sm text-amber-600">Bài {currentPromptIndex + 1}/4: {currentPrompt.key.replace("_", " ")}</p>
          </div>
          <div className="rounded-xl bg-white/50 p-4 text-left mb-4">
            <p className="font-semibold text-foreground">Yêu cầu:</p>
            <p className="mt-1 text-sm text-muted-foreground">{currentPrompt.text}</p>
          </div>
          <p className="text-xs text-amber-500 text-center mb-4">
            Nói tự nhiên 60-120 giây · Không đọc · Sai cũng được
          </p>
          <Button className="w-full size-12" onClick={() => setState("recording")}>
            <Mic className="size-6" /> Bắt đầu ghi âm
          </Button>
        </div>
      )}

      {state === "recording" && (
        <div className="rounded-2xl border-2 border-rose-500 bg-rose-50 p-6 text-center animate-pulse">
          <div className="text-6xl">🔴</div>
          <h3 className="mt-3 font-semibold text-rose-700">Đang ghi âm...</h3>
          <p className="mt-1 text-sm text-rose-600">{currentPrompt.text}</p>
          <div className="mt-4 text-3xl font-mono tabular-nums text-rose-700">{formatTime(recordingTime)}</div>
          <Button className="mt-4 w-full size-14 rounded-full bg-rose-600 text-white" onClick={stopRecording}>
            <Check className="size-8" /> Xong
          </Button>
          <p className="mt-2 text-xs text-rose-500">Nói tự nhiên, không dịch. Tối đa 2 phút.</p>
        </div>
      )}

      {state === "review" && recordings[currentPrompt.key] && (
        <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="font-semibold mb-4">Xem lại bài ghi âm</h3>
          <div className="space-y-3">
            <Button variant="outline" onClick={() => playRecording(recordings[currentPrompt.key].url)}>
              <Volume2 className="size-4 mr-2" /> Nghe lại ({formatTime(recordingTime)})
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={retryRecording}>
                <X className="size-4 mr-2" /> Ghi lại
              </Button>
              <Button onClick={submitRecording} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <>Gửi <TrendingUp className="size-4 ml-2" /></>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {error && <p className="mt-4 text-center text-red-600">{error}</p>}
    </div>
  );
}