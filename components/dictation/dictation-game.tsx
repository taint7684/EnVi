"use client";

import { useState, useRef, useEffect } from "react";
import { Volume2, RotateCcw, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { diffWords } from "diff";

const DICTATION_SENTENCES = [
  "The weather is beautiful today.",
  "I would like to order a cup of coffee.",
  "She has been working here for five years.",
  "They are going to visit their grandparents next week.",
  "Could you please tell me where the library is?",
  "The meeting has been postponed until tomorrow afternoon.",
  "Learning a new language takes time and practice.",
  "He always arrives at work before eight o'clock.",
];

function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

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

export function DictationGame() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userText, setUserText] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentSentence = DICTATION_SENTENCES[currentIndex];
  const isCorrect = userText.trim().toLowerCase() === currentSentence.toLowerCase();

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const handlePlay = () => {
    window.speechSynthesis.cancel();
    speak(currentSentence);
  };

  const handleSubmit = () => {
    setShowResult(true);
    setTotal((t) => t + 1);
    if (isCorrect) setScore((s) => s + 1);
  };

  const handleNext = () => {
    setCurrentIndex((i) => (i + 1) % DICTATION_SENTENCES.length);
    setUserText("");
    setShowResult(false);
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
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">
          Câu {currentIndex + 1}/{DICTATION_SENTENCES.length}
        </span>
        <span className="text-sm text-muted-foreground">
          Điểm: {score}/{total}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-center">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full"
            onClick={handlePlay}
          >
            <Volume2 className="h-6 w-6" />
          </Button>
        </div>

        <div className="space-y-3">
          <Input
            ref={inputRef}
            placeholder="Gõ lại câu bạn nghe được..."
            value={userText}
            onChange={(e) => setUserText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showResult) handleSubmit();
              if (e.key === "Enter" && showResult) handleNext();
            }}
            disabled={showResult}
            className="text-center text-lg"
          />

          {showResult && (
            <DiffResult userText={userText} expected={currentSentence} />
          )}

          <div className="flex items-center justify-center gap-2">
            {!showResult ? (
              <Button onClick={handleSubmit} disabled={!userText.trim()}>
                <Check className="mr-1 h-4 w-4" />
                Kiểm tra
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Câu tiếp theo
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