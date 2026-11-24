"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import {
  Mic, MicOff, Volume2, Eye, EyeOff, ArrowLeft, ArrowRight,
  Lightbulb, BarChart3, RotateCcw,
} from "lucide-react";
import type {
  PictureTalkImage,
  PictureLevel,
  PictureVocabulary,
} from "@/lib/picture-talk-types";
import { LEVEL_LABELS, LEVEL_DESCRIPTIONS } from "@/lib/picture-talk-types";

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechResultEventLike) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

interface SpeechResultEventLike {
  resultIndex: number;
  results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }>;
}

type SpeechRecognitionWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

function getRecognition(): SpeechRecognitionLike | null {
  if (typeof window === "undefined") return null;
  const w = window as SpeechRecognitionWindow;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = "en-US";
  rec.interimResults = true;
  rec.continuous = true;
  return rec;
}

function speakEnglish(text: string) {
  if (typeof window === "undefined" || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 0.9;
  window.speechSynthesis.speak(utter);
}

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function countPauses(text: string): number {
  const pauses = text.match(/\[pause\]|\.{2,}|\?\?+/g);
  return pauses ? pauses.length : 0;
}

const LEVEL_ORDER: PictureLevel[] = ["describe", "opinion", "story", "teach"];

export function PictureTalkPlayer({
  pictures,
}: {
  pictures: PictureTalkImage[];
}) {
  const [selected, setSelected] = useState<PictureTalkImage | null>(null);
  const [level, setLevel] = useState<PictureLevel>("describe");
  const [showVocab, setShowVocab] = useState(true);
  const [showQuestions, setShowQuestions] = useState(true);
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [duration, setDuration] = useState(0);
  const [lifesaverText, setLifesaverText] = useState("");
  const [showLifesaver, setShowLifesaver] = useState(false);

  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const transcriptRef = useRef("");
  const lastResultTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wordCount = countWords(transcript);
  const wpm = duration > 0 ? Math.round((wordCount / duration) * 60) : 0;
  const pauses = countPauses(transcript);

  const stopRecording = useCallback(() => {
    setRecording(false);
    try { recRef.current?.stop(); } catch { /* */ }
    recRef.current = null;
    setInterim("");
    if (startTime) {
      setDuration((Date.now() - startTime) / 1000);
    }
    setShowHints(true);
  }, [startTime]);

  const startRecording = useCallback(() => {
    const rec = getRecognition();
    if (!rec) {
      alert("Trình duyệt không hỗ trợ Speech Recognition. Hãy dùng Chrome/Edge.");
      return;
    }
    rec.onresult = (event) => {
      let final = "";
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) final += result[0].transcript + " ";
        else interimText += result[0].transcript;
      }
      if (final) {
        transcriptRef.current += final;
        setTranscript(transcriptRef.current.trim());
      }
      setInterim(interimText);
      lastResultTimeRef.current = Date.now();
    };
    rec.onerror = () => {
      setRecording(false);
      try { rec.stop(); } catch { /* */ }
      recRef.current = null;
    };
    rec.onend = () => {
      if (recording) {
        try { rec.start(); } catch { /* */ }
      }
    };
    recRef.current = rec;
    transcriptRef.current = "";
    setTranscript("");
    setInterim("");
    setRecording(true);
    setStartTime(Date.now());
    lastResultTimeRef.current = Date.now();
    try { rec.start(); } catch { /* */ }
  }, [recording]);

  // Silence detection: show hints after 5s of no new results
  useEffect(() => {
    if (!recording) return;
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(() => {
      if (Date.now() - lastResultTimeRef.current > 5000) {
        setShowHints(true);
      }
    }, 5500);
    return () => { if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current); };
  }, [recording, interim, transcript]);

  // Timer for duration
  useEffect(() => {
    if (!recording) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      if (startTime) setDuration((Date.now() - startTime) / 1000);
    }, 500);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording, startTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      try { recRef.current?.stop(); } catch { /* */ }
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setInterim("");
    setDuration(0);
    setStartTime(null);
    setShowHints(false);
    transcriptRef.current = "";
  }, []);

  if (!selected) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <h2 className="font-serif text-xl font-semibold">Chọn một bức ảnh</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {pictures.map((pic) => (
            <button
              key={pic.id}
              type="button"
              onClick={() => setSelected(pic)}
              className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:border-primary/50 hover:shadow-md"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted">
                <img
                  src={pic.imageUrl}
                  alt={pic.title}
                  className="h-full w-full object-cover transition group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground">{pic.titleVi}</p>
                <p className="text-xs text-muted-foreground">
                  {pic.level} · {pic.vocabulary.length} từ vựng
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => { setSelected(null); reset(); }}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> Đổi ảnh
        </button>
        <span className="text-xs text-muted-foreground">{selected.level} · {selected.topic}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Left: image + recording */}
        <div className="space-y-3">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-muted">
            <img
              src={selected.imageUrl}
              alt={selected.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-2 py-1 text-xs text-white">
              {selected.titleVi}
            </div>
          </div>

          {/* Level selector */}
          <div className="grid grid-cols-4 gap-2">
            {LEVEL_ORDER.map((lv) => (
              <button
                key={lv}
                type="button"
                onClick={() => { setLevel(lv); reset(); }}
                className={`rounded-xl px-2 py-2 text-xs font-medium transition ${
                  level === lv
                    ? "bg-primary text-white"
                    : "bg-muted text-foreground hover:bg-muted/70"
                }`}
              >
                {LEVEL_LABELS[lv]}
              </button>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground">{LEVEL_DESCRIPTIONS[level]}</p>

          {/* Recording controls */}
          <div className="flex items-center justify-center gap-3">
            {!recording ? (
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-xl bg-red-500 px-5 py-3 text-sm font-semibold text-white hover:bg-red-600"
              >
                <Mic className="size-4" /> Bắt đầu nói
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-700 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800"
              >
                <MicOff className="size-4" /> Dừng ({Math.round(duration)}s)
              </button>
            )}
            {transcript && !recording ? (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-2 rounded-xl bg-muted px-4 py-3 text-sm font-medium text-foreground hover:bg-muted/70"
              >
                <RotateCcw className="size-4" /> Làm lại
              </button>
            ) : null}
          </div>

          {/* Lifesaver: Vietnamese → simple English */}
          {showLifesaver ? (
            <div className="rounded-2xl border border-blue-300 bg-blue-50 p-3">
              <p className="text-xs font-medium text-blue-800">Phao cứu sinh — nói tiếng Việt (1 lần):</p>
              <div className="mt-2 flex gap-2">
                <input
                  type="text"
                  value={lifesaverText}
                  onChange={(e) => setLifesaverText(e.target.value)}
                  placeholder="Ví dụ: Tôi đang uống cà phê..."
                  className="flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-foreground"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && lifesaverText.trim()) {
                      speakEnglish(lifesaverText.trim());
                      setLifesaverText("");
                      setShowLifesaver(false);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (lifesaverText.trim()) {
                      speakEnglish(lifesaverText.trim());
                      setLifesaverText("");
                      setShowLifesaver(false);
                    }
                  }}
                  className="rounded-lg bg-blue-500 px-3 py-2 text-sm font-medium text-white hover:bg-blue-600"
                >
                  Nói lại
                </button>
              </div>
              <p className="mt-1 text-xs text-blue-600">App sẽ đọc câu tiếng Việt — sau đó bạn nói lại bằng tiếng Anh</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowLifesaver(true)}
              className="text-xs text-blue-600 underline hover:text-blue-800"
            >
              Cần trợ giúp? Dùng phao cứu sinh (nói tiếng Việt 1 lần)
            </button>
          )}

          {/* Transcript display */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Transcript
              </span>
              {transcript ? (
                <button
                  type="button"
                  onClick={() => speakEnglish(transcript)}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  <Volume2 className="size-3" /> Nghe lại
                </button>
              ) : null}
            </div>
            <p className="min-h-[80px] whitespace-pre-wrap text-sm text-foreground">
              {transcript}
              {interim ? <span className="text-muted-foreground">{interim}</span> : null}
              {!transcript && !interim ? (
                <span className="text-muted-foreground">
                  Nhấn &quot;Bắt đầu nói&quot; để ghi âm...
                </span>
              ) : null}
            </p>
          </div>

          {/* Metrics */}
          {duration > 0 ? (
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-blue-50 p-3 text-center">
                <p className="text-xl font-bold text-blue-600">{wpm}</p>
                <p className="text-xs text-blue-700">WPM</p>
              </div>
              <div className="rounded-xl bg-purple-50 p-3 text-center">
                <p className="text-xl font-bold text-purple-600">{wordCount}</p>
                <p className="text-xs text-purple-700">Số từ</p>
              </div>
              <div className="rounded-xl bg-amber-50 p-3 text-center">
                <p className="text-xl font-bold text-amber-600">{pauses}</p>
                <p className="text-xs text-amber-700">Ngập ngừng</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: hints panel */}
        <div className="space-y-3">
          {/* Vocabulary */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <button
              type="button"
              onClick={() => setShowVocab((p) => !p)}
              className="flex w-full items-center justify-between"
            >
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                <Lightbulb className="size-4 text-amber-500" /> Từ vựng gợi ý
              </span>
              {showVocab ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
            </button>
            {showVocab ? (
              <div className="mt-3 space-y-2">
                {selected.vocabulary.map((v: PictureVocabulary) => (
                  <div key={v.word} className="rounded-lg bg-muted/50 p-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">{v.word}</span>
                      <button
                        type="button"
                        onClick={() => speakEnglish(v.example)}
                        className="text-xs text-primary hover:underline"
                      >
                        nghe
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">{v.example}</p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* Questions / starters */}
          <div className="rounded-2xl border border-border bg-card p-4">
            <button
              type="button"
              onClick={() => setShowQuestions((p) => !p)}
              className="flex w-full items-center justify-between"
            >
              <span className="inline-flex items-center gap-1 text-sm font-medium">
                <BarChart3 className="size-4 text-blue-500" />
                {level === "opinion" ? "Câu hỏi" : "Gợi ý"}
              </span>
              {showQuestions ? <EyeOff className="size-4 text-muted-foreground" /> : <Eye className="size-4 text-muted-foreground" />}
            </button>
            {showQuestions ? (
              <div className="mt-3 space-y-2">
                {level === "opinion"
                  ? selected.opinion_questions.map((q, i) => (
                      <div key={i} className="rounded-lg bg-blue-50 p-2 text-sm">
                        <span className="font-medium text-blue-700">{i + 1}.</span>{" "}
                        <span className="text-foreground">{q}</span>
                      </div>
                    ))
                  : level === "story"
                  ? selected.story_starters.map((s, i) => (
                      <div key={i} className="rounded-lg bg-purple-50 p-2 text-sm">
                        <span className="font-medium text-purple-700">{i + 1}.</span>{" "}
                        <span className="text-foreground">{s}</span>
                      </div>
                    ))
                  : level === "teach"
                  ? selected.vocabulary.slice(0, 5).map((v, i) => (
                      <div key={i} className="rounded-lg bg-amber-50 p-2 text-sm">
                        <span className="font-medium text-amber-700">Dạy từ:</span>{" "}
                        <span className="text-foreground">{v.word}</span> — {v.example}
                      </div>
                    ))
                  : selected.vocabulary.slice(0, 8).map((v, i) => (
                      <div key={i} className="rounded-lg bg-muted/50 p-2 text-sm">
                        <span className="font-medium text-foreground">{v.word}</span>{" "}
                        <span className="text-muted-foreground">({v.type})</span>
                      </div>
                    ))}
              </div>
            ) : null}
          </div>

          {/* Hint after silence */}
          {showHints && level === "describe" ? (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4">
              <p className="text-sm font-medium text-amber-800">Gợi ý: còn từ nào chưa dùng?</p>
              <p className="mt-1 text-xs text-amber-700">
                {selected.vocabulary.filter((v) => !transcript.toLowerCase().includes(v.word.toLowerCase())).slice(0, 5).map((v) => v.word).join(", ")}
              </p>
            </div>
          ) : null}

          {/* Used vocabulary + retry/next */}
          {duration > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-medium text-foreground">Từ vựng đã dùng</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {selected.vocabulary
                  .filter((v) => transcript.toLowerCase().includes(v.word.toLowerCase()))
                  .map((v) => (
                    <span key={v.word} className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {v.word}
                    </span>
                  ))}
                {selected.vocabulary.filter((v) => transcript.toLowerCase().includes(v.word.toLowerCase())).length === 0 ? (
                  <span className="text-xs text-muted-foreground">Chưa dùng từ gợi ý nào — thử lại nhé!</span>
                ) : null}
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={reset}
                  className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  <RotateCcw className="mr-1 inline size-4" /> Luyện lại cùng ảnh
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idx = pictures.findIndex((p) => p.id === selected.id);
                    const next = pictures[(idx + 1) % pictures.length];
                    if (next) { setSelected(next); reset(); }
                    else { setSelected(null); reset(); }
                  }}
                  className="flex-1 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
                >
                  <ArrowRight className="mr-1 inline size-4" /> Sang ảnh mới
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}