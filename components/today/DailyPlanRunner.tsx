"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { Play, Pause, Check, X, ChevronRight, Clock, Volume2, Flag, RotateCcw, Zap, Flame, Target, Trophy, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import type { TodayPlan } from "@/lib/today-plan";
import type { DayBlock } from "@/lib/curriculum";
import { updateReflexProgress, updateSpeakingProgress, updatePictureTalkProgress, updateChunksProgress, updateVoiceDiaryProgress, updateShadowingProgress, updateMirrorProgress, updateRealWorldProgress } from "@/app/actions/gamification";

type BlockStatus = "pending" | "running" | "completed" | "skipped";

interface BlockWithStatus extends DayBlock {
  status: BlockStatus;
  startedAt?: number;
  completedAt?: number;
}

const MODULE_LABELS: Record<string, string> = {
  reflex: "Reflex",
  picture_talk: "Picture Talk",
  voice_diary: "Voice Diary",
  chunks: "Chunks",
  shadowing: "Shadowing",
  speaking: "AI Speaking",
  mirror: "Mirror",
  real_world: "Real World",
  dashboard: "Dashboard",
};

const MODULE_ICONS: Record<string, React.ReactNode> = {
  reflex: <Zap className="h-4 w-4" />,
  picture_talk: <Target className="h-4 w-4" />,
  voice_diary: <Star className="h-4 w-4" />,
  chunks: <Trophy className="h-4 w-4" />,
  shadowing: <Flame className="h-4 w-4" />,
  speaking: <Sparkles className="h-4 w-4" />,
  mirror: <Target className="h-4 w-4" />,
  real_world: <Flag className="h-4 w-4" />,
  dashboard: <Trophy className="h-4 w-4" />,
};

export function DailyPlanRunner({ plan }: { plan: TodayPlan }) {
  const router = useRouter();
  const [blocks, setBlocks] = useState<BlockWithStatus[]>(
    plan.blocks.map((b) => ({ ...b, status: "pending" as BlockStatus }))
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const blockStartRef = useRef<number>(0);
  const celebrationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentBlock = blocks[currentIndex]!;
  const isLastBlock = currentIndex >= blocks.length - 1;
  const completedCount = blocks.filter((b) => b.status === "completed").length;
  const totalSpeakingMinutes = plan.speakingMinutes;
  const totalMinutes = plan.totalMinutes;
  const overallProgress = useMemo(() => Math.round((completedCount / plan.blocks.length) * 100), [completedCount, plan.blocks.length]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (currentBlock?.status === "running" && !isPaused) pauseBlock();
        else if (isPaused) resumeBlock();
        else if (currentBlock?.status === "pending") startBlock();
      }
      if (e.key === "ArrowRight" && (currentBlock?.status === "completed" || currentBlock?.status === "running")) {
        e.preventDefault();
        handleBlockComplete();
      }
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        e.preventDefault();
        setCurrentIndex(i => i - 1);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentBlock, currentIndex, isPaused, isRunning]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setElapsedMs((prev) => prev + 1000);
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, isPaused]);

  const startBlock = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
    blockStartRef.current = Date.now();
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === currentIndex ? { ...b, status: "running" as BlockStatus, startedAt: Date.now() } : b
      )
    );
  }, [currentIndex]);

  const pauseBlock = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resumeBlock = useCallback(() => {
    setIsPaused(false);
  }, []);

  const handleBlockComplete = useCallback(async () => {
    const completedBlock = blocks[currentIndex]!;
    const blockModule = completedBlock.module;
    const minutes = completedBlock.minutes;
    
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === currentIndex
          ? { ...b, status: "completed" as BlockStatus, completedAt: Date.now() }
          : b
      )
    );

    try {
      switch (blockModule) {
        case "reflex":
          await updateReflexProgress(completedBlock.config.phraseCount ?? 8);
          break;
        case "speaking":
          await updateSpeakingProgress(minutes);
          break;
        case "picture_talk":
          await updatePictureTalkProgress(1);
          break;
        case "chunks":
          await updateChunksProgress(completedBlock.config.chunkKeys?.length ?? 5);
          break;
        case "voice_diary":
          await updateVoiceDiaryProgress(1);
          break;
        case "shadowing":
          await updateShadowingProgress(minutes);
          break;
        case "mirror":
          await updateMirrorProgress();
          break;
        case "real_world":
          await updateRealWorldProgress();
          break;
      }
    } catch (e) {
      console.error("Failed to update progress:", e);
    }

    if (isLastBlock) {
      setIsRunning(false);
      setSessionCompleted(true);
      setShowCelebration(true);
      celebrationTimeoutRef.current = setTimeout(() => setShowCelebration(false), 3000);
    } else {
      setCurrentIndex((i) => i + 1);
      setElapsedMs(0);
      blockStartRef.current = Date.now();
      setBlocks((prev) =>
        prev.map((b, i) =>
          i === currentIndex + 1 ? { ...b, status: "running" as BlockStatus, startedAt: Date.now() } : b
        )
      );
    }
  }, [blocks, currentIndex, isLastBlock]);

  const handleBlockSkip = useCallback(() => {
    setBlocks((prev) =>
      prev.map((b, i) =>
        i === currentIndex ? { ...b, status: "skipped" as BlockStatus, completedAt: Date.now() } : b
      )
    );

    if (isLastBlock) {
      setIsRunning(false);
      setSessionCompleted(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setElapsedMs(0);
      blockStartRef.current = Date.now();
      setBlocks((prev) =>
        prev.map((b, i) =>
          i === currentIndex + 1 ? { ...b, status: "running" as BlockStatus, startedAt: Date.now() } : b
        )
      );
    }
  }, [currentIndex, isLastBlock]);

  const handleRestart = useCallback(() => {
    setBlocks(plan.blocks.map((b) => ({ ...b, status: "pending" as BlockStatus })));
    setCurrentIndex(0);
    setIsRunning(false);
    setIsPaused(false);
    setElapsedMs(0);
    setSessionCompleted(false);
    setShowCelebration(false);
  }, [plan.blocks]);

  const formatTime = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const getDayOfWeekLabel = (day: number) => {
    const labels = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
    return labels[day % 7];
  };

  const getPhaseLabel = (phase: string): string => {
    const labels: Record<string, string> = {
      G1: "G1 — Phá băng",
      G2: "G2 — Mở rộng",
      G3: "G3 — Trôi chảy B1",
      G4: "G4 — Bước vào B2",
      G5: "G5 — Vững B2",
    };
    return labels[phase] ?? phase;
  };

  if (sessionCompleted) {
    return (
      <div className="mx-auto max-w-3xl">
        <Card className="mb-6">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 animate-pulse">
              <Check className="h-10 w-10 text-green-600" />
            </div>
            <h2 className="font-serif text-2xl font-semibold">Hoàn thành buổi học! 🎉</h2>
            <p className="mt-2 text-muted-foreground">
              Bạn đã nói tiếng Anh {totalSpeakingMinutes} phút hôm nay ({plan.speakingPct}% thời gian).
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {plan.mode === "busy" ? "Ngày bận vẫn giữ streak — tuyệt vời!" : plan.mode === "saturday" ? "Nhiệm vụ thực tế hoàn tất!" : plan.mode === "sunday" ? "Mirror recording đã lưu, tuần mới sắp bắt đầu!" : "Tiến bộ từng ngày, trôi chảy suốt đời."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button onClick={handleRestart} variant="outline">
                Làm lại
              </Button>
              <Button onClick={() => router.push("/dashboard")}>
                Về Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

return (
    <div className="mx-auto max-w-3xl space-y-6">
      {showCelebration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
          <div className="text-8xl animate-bounce">🎉</div>
        </div>
      )}
      
      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-serif text-xl font-semibold">Hôm nay — Ngày {plan.dayIndex} / 180</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {getPhaseLabel(plan.phase)} • Tuần {plan.weekNum} • {plan.topicNameVi} ({plan.topicNameEn})
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", plan.mode === "busy" && "bg-amber-100 text-amber-700", plan.mode === "saturday" && "bg-blue-100 text-blue-700", plan.mode === "sunday" && "bg-purple-100 text-purple-700", plan.mode === "normal" && "bg-emerald-100 text-emerald-700")}>
              {plan.mode === "normal" ? "Bình thường (90′)" : plan.mode === "busy" ? "Ngày bận (15′)" : plan.mode === "saturday" ? "Thứ 7 — Nhiệm vụ thực tế" : "Chủ nhật — Mirror & Ôn tập"}
            </span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {getDayOfWeekLabel(plan.dayOfWeek)}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {totalMinutes}′ tổng
          </span>
          <span className="flex items-center gap-1">
            <Volume2 className="h-3.5 w-3.5" /> {totalSpeakingMinutes}′ nói ({plan.speakingPct}%)
          </span>
          <span className="flex items-center gap-1">
            <Flag className="h-3.5 w-3.5" /> XP mục tiêu: {plan.xpTarget}
          </span>
        </div>

        <p className="mt-3 text-sm text-muted-foreground italic">&#8220;{plan.encouragement}&#8221;</p>
        
        <Progress value={overallProgress} className="mt-3 h-1.5" />
        <p className="mt-1 text-xs text-muted-foreground text-center">Tiến độ tổng thể: {overallProgress}%</p>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            Kế hoạch hôm nay ({plan.blocks.length} khối)
            <span className="text-sm font-normal text-muted-foreground">
              {completedCount}/{plan.blocks.length} hoàn thành
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={overallProgress} className="mb-4 h-2" />

          <div className="space-y-2">
            {blocks.map((block, index) => (
              <div
                key={block.id}
                className={cn(
                  "relative flex items-center gap-3 rounded-xl border p-3 transition-all duration-300",
                  block.status === "running" && "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-lg",
                  block.status === "completed" && "border-emerald-200 bg-emerald-50",
                  block.status === "skipped" && "border-amber-200 bg-amber-50 opacity-70",
                  block.status === "pending" && "border-border bg-card hover:border-primary/30"
                )}
              >
                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-medium transition-all", block.status === "completed" && "bg-emerald-100 text-emerald-700", block.status === "running" && "bg-primary text-primary-foreground animate-pulse shadow-[0_0_0_3px_rgba(59,130,246,0.3)]", block.status === "skipped" && "bg-amber-100 text-amber-700", block.status === "pending" && "bg-muted text-muted-foreground")}>
                  {block.status === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : block.status === "skipped" ? (
                    <X className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {MODULE_ICONS[block.module] && (
                      <span className={cn("flex-shrink-0", block.status === "completed" && "text-emerald-600", block.status === "running" && "text-primary", block.status === "pending" && "text-muted-foreground")}>
                        {MODULE_ICONS[block.module]}
                      </span>
                    )}
                    <p className={cn("font-medium truncate", block.status === "completed" && "line-through text-muted-foreground")}>
                      {block.label}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    ~{block.minutes} phút • {block.speaking ? "Nói" : "Input"}
                  </p>
                </div>

                {block.status === "running" && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <span className="font-mono">{formatTime(elapsedMs)} / {block.minutes}′</span>
                    <ChevronRight className="h-4 w-4 animate-bounce" />
                  </div>
                )}

                {block.status === "completed" && block.startedAt && block.completedAt && (
                  <span className="text-xs text-emerald-700 flex items-center gap-1">
                    <Check className="h-3 w-3" />
                    Hoàn thành trong {formatTime(block.completedAt - block.startedAt)}
                  </span>
                )}

                {block.status === "skipped" && (
                  <span className="text-xs text-amber-700 flex items-center gap-1">
                    <X className="h-3 w-3" />
                    Đã bỏ qua
                  </span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {currentBlock && !sessionCompleted ? (
          <>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-serif text-lg font-semibold">
                Khối {currentIndex + 1}/{plan.blocks.length}: {currentBlock.label}
              </h2>
              {isRunning && !isPaused ? (
                <Button onClick={pauseBlock} variant="outline" size="sm">
                  <Pause className="mr-1 h-4 w-4" />Tạm dừng
                </Button>
              ) : isPaused ? (
                <Button onClick={resumeBlock} variant="outline" size="sm">
                  <Play className="mr-1 h-4 w-4" />Tiếp tục
                </Button>
              ) : (
                <Button onClick={startBlock} size="lg">
                  <Play className="mr-1 h-4 w-4" />Bắt đầu khối này
                </Button>
              )}
            </div>

            {isRunning && (
              <div className="mb-4 rounded-xl bg-muted p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Đang chạy...</p>
                  <p className="mt-1 font-mono text-2xl font-semibold">{formatTime(elapsedMs)}</p>
                  <Progress
                    value={Math.min(100, (elapsedMs / (currentBlock.minutes * 60 * 1000)) * 100)}
                    className="mt-2 h-3"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Còn {formatTime(Math.max(0, currentBlock.minutes * 60 * 1000 - elapsedMs))}
                  </p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-background p-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {MODULE_ICONS[currentBlock.module] && (
                    <span className="text-primary">{MODULE_ICONS[currentBlock.module]}</span>
                  )}
                  <p className="text-center text-muted-foreground mb-0">
                    Module: <span className="font-medium capitalize">{MODULE_LABELS[currentBlock.module] || currentBlock.module}</span>
                  </p>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <div className="rounded-lg bg-card p-3 text-center">
                    <p className="text-xs text-muted-foreground">Thời lượng</p>
                    <p className="font-mono text-lg">{currentBlock.minutes} phút</p>
                  </div>
                  <div className="rounded-lg bg-card p-3 text-center">
                    <p className="text-xs text-muted-foreground">Loại</p>
                    <p className="font-medium capitalize">{currentBlock.speaking ? "Nói" : "Input"}</p>
                  </div>
                </div>

                {currentBlock.config.topicId && (
                  <p className="text-xs text-muted-foreground mb-2 flex items-center justify-center gap-1">
                    <span className="rounded bg-primary/10 px-2 py-0.5 text-primary text-xs">Chủ đề: {currentBlock.config.topicId}</span>
                    <span className="rounded bg-emerald/10 px-2 py-0.5 text-emerald-600 text-xs">Tầng: {currentBlock.config.layer || "L1"}</span>
                    <span className="rounded bg-amber/10 px-2 py-0.5 text-amber-600 text-xs">Round: {currentBlock.config.round || 1}</span>
                  </p>
                )}

                {currentBlock.config.chunkKeys && currentBlock.config.chunkKeys.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2 text-center">Chunks tuần này:</p>
                    <div className="flex flex-wrap justify-center gap-1">
                      {currentBlock.config.chunkKeys.slice(0, 8).map((chunk, i) => (
                        <span key={i} className="rounded-full bg-primary/10 px-2 py-0.5 text-primary text-xs font-medium">{chunk}</span>
                      ))}
                      {currentBlock.config.chunkKeys.length > 8 && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-muted-foreground text-xs">+{currentBlock.config.chunkKeys.length - 8} nữa</span>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap justify-center gap-2">
                  <Button 
                    onClick={() => router.push(MODULE_ROUTES[currentBlock.module as keyof typeof MODULE_ROUTES] || "/dashboard")} 
                    variant="outline"
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />Mở trang module
                  </Button>
                  {isRunning ? (
                    <>
                      <Button onClick={handleBlockComplete} className="bg-emerald-600 hover:bg-emerald-700">
                        <Check className="mr-1 h-4 w-4" />Hoàn thành khối này
                      </Button>
                      <Button onClick={handleBlockSkip} variant="ghost">
                        <X className="mr-1 h-4 w-4" />Bỏ qua
                      </Button>
                    </>
                  ) : (
                    <Button onClick={startBlock} size="lg">
                      <Play className="mr-1 h-4 w-4" />Bắt đầu đếm giờ
                    </Button>
                  )}
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  Mẹo: Nói to, đừng dịch trong đầu. Mở miệng trước, nghĩ trong lúc nói.
                </p>
                
                {/* Keyboard hints */}
                <div className="mt-3 pt-3 border-t border-border/50 flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">Space/Enter</kbd><span> Bắt đầu/Tạm dừng</span>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">→</kbd><span> Hoàn thành</span>
                  <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">←</kbd><span> Quay lại</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-8">
            <Flag className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 font-semibold">Tất cả khối đã hoàn thành</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Nhấn "Làm lại" hoặc quay về Dashboard
            </p>
            <Button onClick={handleRestart} variant="outline" className="mt-4">
              Làm lại từ đầu
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

const MODULE_ROUTES: Record<string, string> = {
  reflex: "/reflex",
  picture_talk: "/speak/picture-talk",
  voice_diary: "/voice-diary",
  chunks: "/chunks",
  shadowing: "/shadowing",
  speaking: "/speaking",
  mirror: "/progress",
  real_world: "/real-world",
  dashboard: "/progress",
};