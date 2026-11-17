"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, RotateCcw, Check, Play, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { diffWords } from "diff";
import { DICTATION_LESSONS } from "@/lib/dictation-data";

function DiffResult({ userText, expected }: { userText: string; expected: string }) {
  const diff = diffWords(userText.toLowerCase(), expected.toLowerCase());

  return (
    <div className="rounded-lg border border-border bg-muted/50 p-3">
      <p className="mb-2 text-sm font-medium">Kết quả:</p>
      <div className="text-sm">
        {diff.map((part, i) => (
          <span
            key={i}
            className={cn(
              "rounded px-1",
              part.added
                ? "bg-destructive/10 text-destructive"
                : part.removed
                  ? "bg-green-500/10 text-green-700"
                  : "text-foreground",
            )}
          >
            {part.value}
          </span>
        ))}
      </div>
    </div>
  );
}

function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function DictationGame() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userText, setUserText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const currentLesson = DICTATION_LESSONS[currentIndex];
  const isCorrect = userText.trim().toLowerCase() === currentLesson.transcript.toLowerCase();

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlayTTS = () => {
    window.speechSynthesis.cancel();
    speak(currentLesson.transcript);
  };

  const handlePlayVideo = () => {
    setShowVideo(true);
  };

  const handleVideoEnd = () => {
    setShowVideo(false);
  };

  const handleSubmit = () => {
    setShowResult(true);
    setTotal((t) => t + 1);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i + 1) % DICTATION_LESSONS.length);
    setUserText("");
    setShowResult(false);
    setShowVideo(false);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setUserText("");
    setShowResult(false);
    setScore(0);
    setTotal(0);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Bài {currentIndex + 1}/{DICTATION_LESSONS.length}
        </span>
        <span className="text-sm text-muted-foreground">
          Điểm: {score}/{total}
        </span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 font-medium">Video / Audio</h4>

          {showVideo ? (
            <div className="overflow-hidden rounded-xl bg-black">
              <iframe
                ref={iframeRef}
                src={`${currentLesson.videoUrl}?autoplay=1&enablejsapi=1`}
                title={currentLesson.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="aspect-video w-full"
                onLoad={() => {
                  // Video ended detection via postMessage
                  const handleMessage = (event: MessageEvent) => {
                    if (event.origin !== "https://www.youtube.com") return;
                    try {
                      const data = JSON.parse(event.data);
                      if (data.event === "onStateChange" && data.info === 0) {
                        handleVideoEnd();
                      }
                    } catch {
                      // ignore
                    }
                  };
                  window.addEventListener("message", handleMessage);
                }}
              />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-xl bg-muted p-8">
              <div
                className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted"
                style={{
                  backgroundImage: `url(${currentLesson.thumbnail})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <button
                    onClick={handlePlayVideo}
                    className="flex size-16 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition-transform hover:scale-105"
                  >
                    <Film className="size-6" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handlePlayVideo} size="sm">
                  <Film className="mr-1 h-4 w-4" />
                  Xem video
                </Button>
                <Button onClick={handlePlayTTS} variant="outline" size="sm">
                  <Volume2 className="mr-1 h-4 w-4" />
                  Nghe TTS
                </Button>
              </div>
            </div>
          )}

          <p className="mt-2 text-xs text-muted-foreground">
            {currentLesson.title} · {currentLesson.titleVi} · {currentLesson.level}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
          <h4 className="mb-3 font-medium">Gõ lại lời thoại</h4>

          <Input
            ref={inputRef}
            placeholder="Gõ lại những gì bạn nghe được..."
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showResult) handleSubmit();
              if (e.key === "Enter" && showResult) handleNext();
            }}
            disabled={showResult}
            className="mb-3"
          />

          {showResult && (
            <DiffResult userText={userText} expected={currentLesson.transcript} />
          )}

          <div className="mt-3 flex items-center justify-center gap-2">
            {!showResult ? (
              <Button onClick={handleSubmit} disabled={!userText.trim()}>
                <Check className="mr-1 h-4 w-4" />
                Kiểm tra
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Bài tiếp theo
                <RotateCcw className="ml-1 h-4 w-4" />
              </Button>
            )}

            <Button variant="outline" onClick={handleReset}>
              Làm lại
            </Button>
          </div>
        </div>
      </div>

      {showResult && (
        <div
          className={cn(
            "rounded-lg p-4 text-center",
            isCorrect ? "bg-green-500/10 text-green-700" : "bg-destructive/10 text-destructive",
          )}
        >
          {isCorrect ? "Chính xác! 🎉" : "Chưa chính xác, hãy thử lại!"}
        </div>
      )}
    </div>
  );
}