"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeft, ArrowRight, Check, X, AlertTriangle, RotateCcw, Volume2, Mic, Brain, Lightbulb, Flag, Sparkles } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { speakEnglish, stopSpeaking } from "@/lib/speech";
import { useVadWithMetrics } from "@/lib/hooks/useVad";

type MakeupLesson = {
  id: number;
  error_event_id: number;
  pattern_id: number | null;
  step: number;
  step1_awareness_done: boolean;
  step2_drill_done: boolean;
  step3_shadowing_done: boolean;
  step4_production_done: boolean;
  step5_verification_done: boolean;
  step_data: Record<string, unknown>;
  verification_score: number | null;
  status: string;
  completed_at: string | null;
  mastered_at: string | null;
  created_at: string;
  updated_at: string;
};

type ErrorEvent = {
  id: number;
  module: string;
  error_type: string;
  severity: string;
  expected: string | null;
  actual: string | null;
  user_transcript: string | null;
  layer: string | null;
  topic_id: string | null;
  difficulty: string | null;
  latency_ms: number | null;
  wpm: number | null;
  pauses_over_3s: number | null;
  vi_segments: number | null;
  lifeline_used: boolean | null;
  status: string;
  ai_feedback: Record<string, unknown> | null;
  created_at: string;
};

const STEPS = [
  { num: 1, label: "Nhận biết", desc: "Xem lỗi & giải thích AI" },
  { num: 2, label: "Luyện tập", desc: "Drill tập trung lỗi này" },
  { num: 3, label: "Shadowing", desc: "Nói theo mẫu đúng" },
  { num: 4, label: "Tự sản xuất", desc: "Nói tự do dùng đúng" },
  { num: 5, label: "Kiểm chứng", desc: "Điểm ≥ 0.75 = thành thạo" },
];

export default function MakeupLessonPage({ params }: { params: Promise<{ id: string }> }) {
  const [lesson, setLesson] = useState<MakeupLesson | null>(null);
  const [errorEvent, setErrorEvent] = useState<ErrorEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speechInput, setSpeechInput] = useState("");
  const [evaluation, setEvaluation] = useState<{ correct: boolean; score: number; feedback: string } | null>(null);

  const supabase = createClient();
  const vad = useVadWithMetrics();

  useEffect(() => {
    async function loadData() {
      const resolvedParams = await params;
      const lessonId = resolvedParams.id;
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: lessonData }, { data: errorData }] = await Promise.all([
          supabase.from("makeup_lessons").select("*").eq("id", lessonId).eq("user_id", user.id).single(),
          supabase.from("error_events").select("*").eq("id", (await supabase.from("makeup_lessons").select("error_event_id").eq("id", lessonId).single()).data?.error_event_id).single(),
        ]);

        setLesson(lessonData);
        setErrorEvent(errorData);
        setCurrentStep(lessonData?.step || 1);
      } catch (e) {
        console.error("Failed to load makeup lesson:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [params]);

  const step = STEPS[currentStep - 1];
  const progress = ((currentStep - 1) / 5) * 100;

  const handleStepComplete = useCallback(async () => {
    if (!lesson) return;

    const updates: Partial<MakeupLesson> = { step: Math.min(currentStep + 1, 5) };
    const stepKeys = {
      1: "step1_awareness_done",
      2: "step2_drill_done",
      3: "step3_shadowing_done",
      4: "step4_production_done",
      5: "step5_verification_done",
    } as const;
    const stepKey = stepKeys[currentStep as keyof typeof stepKeys];
    updates[stepKey] = true;

    if (currentStep === 5) {
      updates.status = "mastered";
      updates.mastered_at = new Date().toISOString();
      updates.verification_score = evaluation?.score || 0;
    }

    try {
      await supabase
        .from("makeup_lessons")
        .update(updates)
        .eq("id", lesson.id);

      setLesson((prev) => prev ? { ...prev, ...updates } : null);

      if (currentStep < 5) {
        setCurrentStep((s) => s + 1);
      } else {
        // Also update error_event status
        await supabase
          .from("error_events")
          .update({ status: "mastered", mastered_at: new Date().toISOString() })
          .eq("id", lesson.error_event_id);
      }
    } catch (e) {
      console.error("Failed to update step:", e);
    }
  }, [lesson, currentStep, evaluation, supabase]);

  const playAudio = useCallback(async (text: string) => {
    setIsPlaying(true);
    try {
      await speakEnglish(text);
    } finally {
      setIsPlaying(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!lesson || !errorEvent) {
    return (
      <div className="mx-auto max-w-2xl text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
        <h2 className="mt-4 font-semibold">Không tìm thấy bài bù</h2>
        <Link href="/errors" className="mt-4 inline-block text-primary underline">
          ← Quay lại Sổ lỗi
        </Link>
      </div>
    );
  }

  const isComplete = lesson.status === "mastered" || lesson.status === "completed";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/errors" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Quay lại Sổ lỗi
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Bài bù #{lesson.id}
              </CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Lỗi: {errorEvent.error_type} • Module: {errorEvent.module} • {new Date(lesson.created_at).toLocaleDateString("vi-VN")}
              </p>
            </div>
            {isComplete && (
              <div className="flex items-center gap-2 text-emerald-600">
                <Flag className="h-5 w-5" />
                <span className="font-semibold">HOÀN THÀNH - THÀNH THÁO!</span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={isComplete ? 100 : progress} className="mb-6 h-2" />

          <div className="mb-6 flex gap-1 overflow-x-auto pb-2">
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                className={cn(
                  "flex flex-col items-center gap-1 shrink-0 w-[110px] relative",
                  i < STEPS.length - 1 && "after:absolute after:top-5 after:left-1/2 after:h-0.5 after:w-full after:bg-border"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium transition-colors",
                    i + 1 < currentStep && "bg-emerald-500 text-emerald-foreground",
                    i + 1 === currentStep && "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2",
                    i + 1 > currentStep && "bg-muted text-muted-foreground"
                  )}
                >
                  {i + 1 < currentStep ? <Check className="h-5 w-5" /> : s.num}
                </div>
                <p className="text-xs text-center text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>

          <Separator />

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <Sparkles className="mx-auto h-12 w-12 text-primary" />
                <h3 className="mt-3 font-serif text-lg font-semibold">Bước 1: Nhận biết lỗi</h3>
                <p className="mt-1 text-sm text-muted-foreground">Hiểu rõ lỗi của bạn và cách sửa</p>
              </div>

              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm font-semibold text-red-700">Bạn nói (sai)</p>
                      <p className="mt-1 text-lg font-mono text-red-600">{errorEvent.actual || errorEvent.user_transcript || "—"}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-emerald-700">Đúng nên là</p>
                      <p className="mt-1 text-lg font-mono text-emerald-600">{errorEvent.expected || "—"}</p>
                    </div>
                  </div>
                  {errorEvent.ai_feedback && (
                    <div className="mt-4 p-3 rounded-lg bg-white border">
                      <p className="text-sm font-semibold text-muted-foreground">🤖 Giải thích AI:</p>
                      <p className="mt-1 text-sm">{JSON.stringify(errorEvent.ai_feedback)}</p>
                    </div>
                  )}
                  <div className="mt-4">
                    <Button onClick={() => playAudio(errorEvent.expected || "")} disabled={isPlaying} className="w-full">
                      <Volume2 className="mr-1 h-4 w-4" /> Nghe mẫu đúng
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button onClick={handleStepComplete} size="lg" className="bg-primary hover:bg-primary/90">
                  <ArrowRight className="mr-1 h-4 w-4" /> Tôi hiểu rồi, sang Bước 2
                </Button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <Brain className="mx-auto h-12 w-12 text-primary" />
                <h3 className="mt-3 font-serif text-lg font-semibold">Bước 2: Drill tập trung</h3>
                <p className="mt-1 text-sm text-muted-foreground">Luyện phát âm / cấu trúc đúng 5 lần</p>
              </div>

              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      {i}
                    </div>
                    <p className="font-medium">{errorEvent.expected}</p>
                    <div className="flex-1" />
                    <Button variant="outline" size="sm" onClick={() => playAudio(errorEvent.expected || "")} disabled={isPlaying}>
                      <Volume2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => vad.startListening()}>
                      <Mic className="h-4 w-4" /> Nói
                    </Button>
                  </div>
                ))}
              </div>

              <div className="flex justify-center">
                <Button onClick={handleStepComplete} size="lg" variant={lesson.step2_drill_done ? "default" : "outline"}>
                  <ArrowRight className="mr-1 h-4 w-4" /> Xong 5 lần, sang Bước 3
                </Button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <RotateCcw className="mx-auto h-12 w-12 text-primary" />
                <h3 className="mt-3 font-serif text-lg font-semibold">Bước 3: Shadowing</h3>
                <p className="mt-1 text-sm text-muted-foreground">Nghe mẫu → Nói theo y hệt (nhịnh, ngữ điệu, trọng âm)</p>
              </div>

              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-lg font-medium">{errorEvent.expected}</p>
                  <div className="mt-6 flex justify-center gap-3">
                    <Button onClick={() => playAudio(errorEvent.expected || "")} disabled={isPlaying} size="lg">
                      <Volume2 className="mr-1 h-4 w-4" /> Nghe mẫu
                    </Button>
                    <Button onClick={() => vad.startListening()} size="lg" className="bg-primary hover:bg-primary/90">
                      <Mic className="mr-1 h-4 w-4" /> Shadow ngay
                    </Button>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground">Thử 3 lần, nghe lại so sánh A/B</p>
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button onClick={handleStepComplete} size="lg">
                  <ArrowRight className="mr-1 h-4 w-4" /> Sang Bước 4
                </Button>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <div className="text-center">
                <Mic className="mx-auto h-12 w-12 text-primary" />
                <h3 className="mt-3 font-serif text-lg font-semibold">Bước 4: Tự sản xuất</h3>
                <p className="mt-1 text-sm text-muted-foreground">Nói tự do, TỰ DÙNG đúng mẫu vừa học trong câu mới</p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground mb-4">Tạo 1 câu mới dùng đúng: <strong className="text-foreground">{errorEvent.expected}</strong></p>
                  <div className="flex justify-center">
                    <Button onClick={() => vad.startListening()} size="lg" className="bg-primary hover:bg-primary/90 w-full max-w-md">
                      <Mic className="mr-1 h-4 w-4" /> Bắt đầu ghi âm
                    </Button>
                  </div>
                  {speechInput && (
                    <div className="mt-4 p-3 rounded-lg bg-muted">
                      <p className="text-sm font-semibold text-muted-foreground">Bạn nói:</p>
                      <p className="mt-1">{speechInput}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button onClick={handleStepComplete} size="lg">
                  <ArrowRight className="mr-1 h-4 w-4" /> Sang Bước 5 kiểm chứng
                </Button>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-4">
              <div className="text-center">
                <Flag className="mx-auto h-12 w-12 text-primary" />
                <h3 className="mt-3 font-serif text-lg font-semibold">Bước 5: Kiểm chứng thành thạo</h3>
                <p className="mt-1 text-sm text-muted-foreground">Điểm ≥ 0.75 = lỗi này coi như đã sửa xong</p>
              </div>

              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-center text-muted-foreground mb-4">Nói câu mẫu đúng một lần cuối để chấm điểm</p>
                  <p className="text-lg font-medium mb-6">{errorEvent.expected}</p>
                  <Button onClick={() => vad.startListening()} size="lg" className="bg-emerald-600 hover:bg-emerald-700 w-full max-w-md">
                    <Mic className="mr-1 h-4 w-4" /> Ghi âm kiểm chứng
                  </Button>
                  {evaluation && (
                    <div className="mt-6 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                      <p className="font-semibold text-emerald-700">Điểm: {Math.round((evaluation.score || 0) * 100)}%</p>
                      <p className="mt-1 text-sm text-emerald-600">{evaluation.feedback}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-center">
                <Button onClick={handleStepComplete} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
                  {evaluation && evaluation.score >= 0.75 ? (
                    <>
                      <Flag className="mr-1 h-4 w-4" /> Hoàn tất - Thành tháo!
                    </>
                  ) : (
                    <>
                      <RotateCcw className="mr-1 h-4 w-4" /> Thử lại
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {!isComplete && currentStep > 1 && (
            <div className="flex justify-center">
              <Button onClick={() => setCurrentStep((s) => Math.max(1, s - 1))} variant="ghost" size="sm">
                <ArrowLeft className="mr-1 h-4 w-4" /> Quay lại bước trước
              </Button>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Quy trình 5 bước đảm bảo lỗi được sửa từ gốc. Mỗi bước đều có ý nghĩa - đừng bỏ qua!
          </p>
        </CardContent>
      </Card>
    </div>
  );
}