// Vocab Flashcard Component - Spaced Repetition Vocabulary Practice
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Brain, RefreshCw, Check, X, Volume2, Flag, BookOpen, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { speakEnglish } from "@/lib/speech";

type FlashcardMode = "review" | "learn" | "quiz";

interface VocabCard {
  id: string;
  word: string;
  meaning: string;
  example: string;
  audio_url?: string;
  difficulty: "A1" | "A2" | "B1" | "B2";
  category: string;
  oxford3000: boolean;
  fsrs_state?: {
    due: string;
    stability: number;
    difficulty: number;
    reps: number;
  };
}

interface VocabFlashcardProps {
  cards: VocabCard[];
  mode?: FlashcardMode;
  onComplete?: (stats: { reviewed: number; correct: number; timeSpent: number }) => void;
}

export function VocabFlashcard({ cards, mode = "review", onComplete }: VocabFlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showMeaning, setShowMeaning] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, correct: 0, timeSpent: 0 });
  const sessionStartRef = useRef<number>(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [quizAnswer, setQuizAnswer] = useState("");
  const [quizResult, setQuizResult] = useState<"correct" | "incorrect" | null>(null);

  useEffect(() => {
    sessionStartRef.current = Date.now();
  }, []);

  const currentCard = cards[currentIndex];
  const isLast = currentIndex >= cards.length - 1;
  const progress = cards.length > 0 ? ((currentIndex + 1) / cards.length) * 100 : 0;

  const handleGrade = useCallback((grade: "again" | "hard" | "good" | "easy") => {
    if (!currentCard) return;

    const isCorrect = grade === "good" || grade === "easy";
    setStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
      timeSpent: Math.floor((Date.now() - sessionStartRef.current) / 1000),
    }));

    // In real app, call FSRS scheduler API here
    // await fetch("/api/vocab/review", { method: "POST", body: JSON.stringify({ cardId: currentCard.id, grade }) });

    if (isLast) {
      onComplete?.(stats);
    } else {
      setCurrentIndex(prev => prev + 1);
      setShowMeaning(false);
      setIsFlipped(false);
      setQuizResult(null);
      setQuizAnswer("");
    }
  }, [currentCard, isLast, onComplete, stats]);

  const handleQuizSubmit = () => {
    if (!quizAnswer.trim()) return;
    const isCorrect = quizAnswer.toLowerCase().trim() === currentCard?.meaning.toLowerCase().trim();
    setQuizResult(isCorrect ? "correct" : "incorrect");
    handleGrade(isCorrect ? "good" : "again");
  };

  if (!currentCard) {
    return (
      <div className="mx-auto max-w-md py-12 text-center">
        <BookOpen className="size-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="font-semibold">Không có từ vựng để ôn tập</h3>
        <p className="text-sm text-muted-foreground mt-1">Hãy thêm từ mới hoặc đổi chủ đề</p>
      </div>
    );
  }

  const difficultyColors = {
    A1: "bg-green-100 text-green-700",
    A2: "bg-blue-100 text-blue-700",
    B1: "bg-amber-100 text-amber-700",
    B2: "bg-purple-100 text-purple-700",
  };

  return (
    <div className="mx-auto max-w-md">
      {/* Progress Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>{mode === "quiz" ? "Quiz" : mode === "learn" ? "Học mới" : "Ôn tập"} · {currentIndex + 1}/{cards.length}</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[currentCard.difficulty]}`}>
            {currentCard.difficulty}
          </span>
          {currentCard.oxford3000 && (
            <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-700 flex items-center gap-1">
              <Star className="size-3" /> Oxford 3000
            </span>
          )}
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
            {currentCard.category}
          </span>
        </div>
      </div>

      {/* Flashcard */}
      <div className="mb-4 perspective-1000">
        <div
          className={cn(
            "relative w-full h-64 cursor-pointer transition-all duration-700 transform-style-3d",
            isFlipped && "rotate-y-180"
          )}
          onClick={() => mode !== "quiz" && setIsFlipped(!isFlipped)}
        >
          {/* Front - Word */}
          <div className="absolute w-full h-full backface-hidden rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col items-center justify-center">
            <div className="text-center">
              <p className="text-3xl font-semibold text-foreground mb-2">{currentCard.word}</p>
              <p className="text-sm text-muted-foreground">Click hoặc Space để lật</p>
              <div className="mt-4 flex gap-2">
                {currentCard.audio_url && (
                  <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); speakEnglish(currentCard.word, currentCard.audio_url); }}>
                    <Volume2 className="size-4" />
                  </Button>
                )}
                <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); speakEnglish(currentCard.word); }}>
                  <Volume2 className="size-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(currentCard.word); }}>
                  <Flag className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Back - Meaning */}
          <div className="absolute w-full h-full backface-hidden rotate-y-180 rounded-2xl border border-border bg-card p-8 shadow-sm flex flex-col items-center justify-center">
            <div className="text-center">
              <p className="text-2xl font-medium text-primary mb-3">{currentCard.meaning}</p>
              <p className="text-sm text-muted-foreground italic mb-4">&ldquo;{currentCard.example}&rdquo;</p>
              <div className="flex gap-2">
                {currentCard.audio_url && (
                  <Button variant="outline" size="icon" onClick={(e) => { e.stopPropagation(); speakEnglish(currentCard.meaning, currentCard.audio_url); }}>
                    <Volume2 className="size-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(currentCard.meaning); }}>
                  <Flag className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-3">
        {mode === "quiz" ? (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">Nhập nghĩa tiếng Việt của: <strong>{currentCard.word}</strong></p>
            <input
              type="text"
              value={quizAnswer}
              onChange={(e) => setQuizAnswer(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuizSubmit()}
              placeholder="Gõ nghĩa tiếng Việt..."
              className={cn(
                "w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-center outline-none focus-visible:border-primary",
                quizResult === "correct" && "border-green-500 bg-green-50",
                quizResult === "incorrect" && "border-red-500 bg-red-50"
              )}
              autoFocus
            />
            {quizResult && (
              <p className={cn("text-center text-sm", quizResult === "correct" ? "text-green-600" : "text-red-600")}>
                {quizResult === "correct" ? "✓ Chính xác!" : `✗ Sai. Đáp án: ${currentCard.meaning}`}
              </p>
            )}
            {quizResult && (
              <div className="flex gap-2 justify-center">
                <Button variant="outline" onClick={() => handleGrade("again")}>Lại</Button>
                <Button variant="outline" onClick={() => handleGrade("hard")}>Khó</Button>
                <Button onClick={() => handleGrade("good")}>Tốt</Button>
                <Button onClick={() => handleGrade("easy")}>Dễ</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex gap-2 justify-center">
            <Button variant="outline" onClick={() => handleGrade("again")} disabled={isLast}>
              <RefreshCw className="size-4 mr-1" /> Lại
            </Button>
            <Button variant="outline" onClick={() => handleGrade("hard")} disabled={isLast}>
              <X className="size-4 mr-1" /> Khó
            </Button>
            <Button onClick={() => handleGrade("good")} disabled={isLast}>
              <Check className="size-4 mr-1" /> Tốt
            </Button>
            <Button onClick={() => handleGrade("easy")} disabled={isLast}>
              <Star className="size-4 mr-1" /> Dễ
            </Button>
          </div>
        )}

        <div className="flex justify-center gap-4 text-sm text-muted-foreground">
          <span>Đúng: {stats.correct}/{stats.reviewed}</span>
          <span>Thời gian: {Math.floor(stats.timeSpent / 60)}:{String(stats.timeSpent % 60).padStart(2, "0")}</span>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        {mode === "quiz" 
          ? "Enter: Kiểm tra | 1: Lại | 2: Khó | 3: Tốt | 4: Dễ"
          : "Space/Click: Lật thẻ | 1: Lại | 2: Khó | 3: Tốt | 4: Dễ"}
      </p>
    </div>
  );
}

// Hook for fetching user's due vocab cards
export async function fetchDueVocabCards(userId: string, limit = 20): Promise<VocabCard[]> {
  try {
    const response = await fetch(`/api/vocab/due?limit=${limit}`, {
      headers: { "Authorization": `Bearer ${userId}` }, // Simplified
    });
    const data = await response.json();
    return data.cards || [];
  } catch {
    return [];
  }
}