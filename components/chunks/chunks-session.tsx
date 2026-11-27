"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Mic, Lightbulb, RotateCcw, Hash, X, Zap, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakEnglish, stopSpeaking } from "@/lib/speech";
import { evaluateSpeech } from "@/lib/speech-eval";
import { cn } from "@/lib/utils";
import { updateSpeakingProgress, updateChunksProgress } from "@/app/actions/gamification";

type ChunkItem = {
  key: string;
  text: string;
  meaning: string;
  example: string;
  layer: "L1" | "L2" | "L3";
};

type ChunksConfig = {
  topicId: string;
  layer: "L1" | "L2" | "L3";
  round: 1 | 2;
  chunks: ChunkItem[];
};

type ChunksState = "intro" | "learning" | "practicing" | "quiz" | "complete";

export function ChunksSession({
  config,
  onComplete,
}: {
  config: ChunksConfig;
  onComplete?: (metrics: {
    totalSpeakingSeconds: number;
    chunksMastered: number;
    avgAccuracy: number;
  }) => void;
}) {
  const [state, setState] = useState<ChunksState>("intro");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mastered, setMastered] = useState<Set<string>>(new Set());
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<ReturnType<typeof evaluateSpeech> | null>(null);
  const [showMeaning, setShowMeaning] = useState(false);
  const [totalSpeakingSeconds, setTotalSpeakingSeconds] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const startRef = useRef<number>(0);

  const currentChunk = config.chunks[currentIndex]!;
  const isLastChunk = currentIndex >= config.chunks.length - 1;
  const masteredCount = mastered.size;

  useEffect(() => {
    if (state === "practicing" && currentChunk) {
      startRef.current = performance.now();
      speakEnglish(currentChunk.text);
    }
    return () => stopSpeaking();
  }, [state, currentIndex]);

  async function handleSpeech(spoken: string) {
    setTranscript(spoken);
    const latency = Math.round(performance.now() - startRef.current);
    
    const evalResult = evaluateSpeech(currentChunk.text, spoken);
    setEvaluation(evalResult);
    setAttemptCount((prev) => prev + 1);

    if (evalResult.correct) {
      setCorrectCount((prev) => prev + 1);
      setMastered((prev) => new Set([...prev, currentChunk.key]));
      setTotalSpeakingSeconds((prev) => prev + Math.ceil(latency / 1000));
      
      if (isLastChunk) {
        setState("complete");
        onComplete?.({
          totalSpeakingSeconds,
          chunksMastered: masteredCount + 1,
          avgAccuracy: Math.round((correctCount + 1) / attemptCount * 100),
        });

        // Award XP for speaking time and chunks completion
        const minutes = Math.ceil(totalSpeakingSeconds / 60);
        if (minutes > 0) {
          updateSpeakingProgress(minutes, { module: "chunks", segments: masteredCount + 1 });
        }
        updateChunksProgress(masteredCount + 1);
      } else {
        nextChunk();
      }
    }
  }

  function nextChunk() {
    setCurrentIndex((i) => i + 1);
    setState("learning");
    setTranscript("");
    setEvaluation(null);
    setShowMeaning(false);
  }

  function retryChunk() {
    setTranscript("");
    setEvaluation(null);
    setShowMeaning(false);
    setState("practicing");
  }

  function skipChunk() {
    if (!isLastChunk) {
      nextChunk();
    } else {
      setState("complete");
      onComplete?.({
        totalSpeakingSeconds,
        chunksMastered: masteredCount,
        avgAccuracy: attemptCount > 0 ? Math.round(correctCount / attemptCount * 100) : 0,
      });

      // Award XP for speaking time and chunks completion
      const minutes = Math.ceil(totalSpeakingSeconds / 60);
      if (minutes > 0) {
        updateSpeakingProgress(minutes, { module: "chunks", segments: masteredCount });
      }
      updateChunksProgress(masteredCount);
    }
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const progress = ((currentIndex + 1) / config.chunks.length) * 100;
  const accuracy = attemptCount > 0 ? Math.round(correctCount / attemptCount * 100) : 0;

  // Render complete state
  if (state === "complete") {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="text-4xl">#️⃣</div>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">Chunks Complete!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You practiced {masteredCount}/{config.chunks.length} chunks in {formatTime(totalSpeakingSeconds)}.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-2xl font-bold text-emerald-700">{masteredCount}</p>
            <p className="text-xs text-emerald-600">Mastered</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <p className="text-2xl font-bold text-blue-700">{formatTime(totalSpeakingSeconds)}</p>
            <p className="text-xs text-blue-600">Total time</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3">
            <p className="text-2xl font-bold text-purple-700">{accuracy}%</p>
            <p className="text-xs text-purple-600">Accuracy</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => { setCurrentIndex(0); setMastered(new Set()); setState("intro"); setCorrectCount(0); setAttemptCount(0); }}>Retry</Button>
          <Button variant="outline" onClick={() => onComplete?.({ totalSpeakingSeconds: 0, chunksMastered: 0, avgAccuracy: 0 })}>Back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-indigo-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Chunk {currentIndex + 1}/{config.chunks.length} | Mastered: {masteredCount}
          </span>
        </div>
        <span className="text-sm font-mono tabular-nums text-muted-foreground">
          {state === "practicing" ? "🎤 Speaking..." : state === "learning" ? "📖 Learning" : "Ready"}
        </span>
      </div>

      {state === "intro" && (
        <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-6 text-center">
          <div className="text-4xl">#️⃣</div>
          <h3 className="mt-3 font-semibold text-indigo-700">Chunks - {config.layer}</h3>
          <p className="mt-2 text-sm text-indigo-600">
            Learn & speak {config.chunks.length} ready-to-use chunks for topic: <strong>{config.topicId}</strong>
          </p>
          <p className="mt-2 text-xs text-indigo-500">
            Layer {config.layer === "L1" ? "L1: Basic chunks" : config.layer === "L2" ? "L2: Story chunks" : "L3: Argument chunks"}.
            Each chunk: listen → understand → speak → master.
          </p>
          <Button className="mt-4 w-full size-12" onClick={() => setState("learning")}>
            <Hash className="size-6" /> Start learning
          </Button>
        </div>
      )}

      {state === "learning" && currentChunk && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="text-center">
            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
              <Hash className="size-4" /> {currentChunk.key}
            </span>
            <h3 className="mt-3 font-serif text-2xl font-semibold text-foreground">{currentChunk.text}</h3>
            
            <div className="mt-4 p-3 rounded-xl bg-indigo-50 text-left">
              <p className="text-xs font-semibold text-indigo-700">Example:</p>
              <p className="mt-1 text-sm text-indigo-900">{currentChunk.example}</p>
            </div>

            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => speakEnglish(currentChunk.text)}
              >
                <Volume2 className="size-4" /> Hear pronunciation
              </Button>
              <Button
                onClick={() => { setShowMeaning(true); setState("practicing"); }}
              >
                <Mic className="size-4" /> Start speaking
              </Button>
            </div>

            {showMeaning && (
              <div className="mt-3 p-3 rounded-xl bg-amber-50 text-left text-sm">
                <p className="font-semibold text-amber-700">Meaning:</p>
                <p className="mt-1 text-amber-900">{currentChunk.meaning}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {state === "practicing" && currentChunk && (
        <div className="mb-4 rounded-2xl border-2 border-indigo-500 bg-indigo-50 p-6 text-center">
          <h3 className="font-semibold text-indigo-700">Say this chunk:</h3>
          <p className="mt-2 font-serif text-2xl font-semibold text-foreground">{currentChunk.text}</p>
          
          <div className="mt-4 flex justify-center">
            <Button
              className="w-full size-20 rounded-full bg-indigo-600 text-white"
              onClick={() => setState("practicing")}
            >
              <Mic className="size-8" /> Speak now
            </Button>
          </div>
          
          {evaluation && (
            <div className={cn(
              "mt-4 rounded-xl p-4 text-center",
              evaluation.correct ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
            )}>
              <p className="flex items-center justify-center gap-2 font-semibold">
                {evaluation.correct ? (
                  <>
                    <Check className="size-5" /> Correct! +1 mastered
                  </>
                ) : (
                  <>
                    <X className="size-5" /> Not quite, try again
                  </>
                )}
              </p>
              {!evaluation.correct && (
                <p className="mt-2 text-sm text-muted-foreground">
                  Answer: {currentChunk.text}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={retryChunk}>
              <RotateCcw className="size-4" /> Retry
            </Button>
            <Button variant="ghost" size="sm" onClick={() => speakEnglish(currentChunk.text)}>
              <Zap className="size-4" /> Hear again
            </Button>
            <Button variant="outline" size="sm" onClick={skipChunk}>
              <X className="size-4" /> Bỏ qua
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}