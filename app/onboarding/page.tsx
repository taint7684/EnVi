"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveOnboarding } from "@/lib/onboarding";
import { Check, Target, Clock, User, Sparkles } from "lucide-react";

const GOALS = [
  { value: "travel", label: "Du lịch & giao tiếp hàng ngày", icon: "🌍", desc: "Giao tiếp cơ bản khi đi du lịch, đặt món, hỏi đường" },
  { value: "work", label: "Làm việc & email tiếng Anh", icon: "💼", desc: "Email, meeting, present, báo cáo bằng tiếng Anh" },
  { value: "study", label: "Học tập & thi chứng chỉ", icon: "📚", desc: "IELTS, TOEIC, học thuật, đọc tài liệu chuyên ngành" },
  { value: "native", label: "Giao tiếp tự tin với người bản ngữ", icon: "🗣️", desc: "Trò chuyện tự nhiên, hiểu văn hóa, nói flow" },
] as const;

const MINUTES = [15, 30, 45, 60, 90, 120] as const;

const STEPS = [
  { key: "goal", title: "Mục tiêu", subtitle: "Bạn muốn đạt được gì?" },
  { key: "time", title: "Thời gian", subtitle: "Bạn dành bao nhiêu phút/ngày?" },
  { key: "level", title: "Trình độ", subtitle: "Bạn đang ở đâu?" },
  { key: "confirm", title: "Xác nhận", subtitle: "Sẵn sàng bắt đầu?" },
];

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/today";
  
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<string>(GOALS[0].value);
  const [minutesPerDay, setMinutesPerDay] = useState<number>(60);
  const [level, setLevel] = useState<string>("A2");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLastStep = step === STEPS.length - 1;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await saveOnboarding({ goal, minutesPerDay });
      router.push(redirectTo);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không lưu được.");
    } finally {
      setPending(false);
    }
  }

  async function handleSkip() {
    setPending(true);
    setError(null);
    try {
      await saveOnboarding({ goal: GOALS[0].value, minutesPerDay: 0 });
      router.push(redirectTo);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không lưu được.");
    } finally {
      setPending(false);
    }
  }

  function nextStep() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    }
  }

  function prevStep() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex flex-col items-center">
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all
                  ${i < step ? "bg-primary text-primary-foreground" : i === step ? "bg-primary/20 text-primary border-2 border-primary" : "bg-muted text-muted-foreground"}
                `}>
                  {i < step ? <Check className="size-5" /> : <span>{i + 1}</span>}
                </div>
                <p className={`mt-1 text-xs ${i <= step ? "text-foreground" : "text-muted-foreground"}`}>
                  {s.title}
                </p>
              </div>
            ))}
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Step content */}
        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              {STEPS[step]!.key === "goal" && <Target className="size-8 text-primary" />}
              {STEPS[step]!.key === "time" && <Clock className="size-8 text-primary" />}
              {STEPS[step]!.key === "level" && <User className="size-8 text-primary" />}
              {STEPS[step]!.key === "confirm" && <Sparkles className="size-8 text-primary" />}
            </div>
            <h1 className="font-serif text-2xl font-semibold text-foreground">
              {STEPS[step]!.title}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {STEPS[step]!.subtitle}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm">
              {error}
            </div>
          )}

          {STEPS[step]!.key === "goal" && (
            <div className="space-y-3">
              {GOALS.map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => { setGoal(g.value); nextStep(); }}
                  className={`w-full rounded-xl border p-4 text-left transition-all ${
                    goal === g.value
                      ? "bg-primary/5 border-primary shadow-[0_0_0_1px_rgba(59,130,246,0.5)]"
                      : "border-border hover:border-primary/50 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">{g.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{g.label}</p>
                      <p className="text-sm text-muted-foreground">{g.desc}</p>
                    </div>
                    {goal === g.value && <Check className="size-5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
          )}

          {STEPS[step]!.key === "time" && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground text-center">
                Khuyến nghị: ≥ 90 phút để đạt mục tiêu B1/B2
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {MINUTES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMinutesPerDay(m); nextStep(); }}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      minutesPerDay === m
                        ? "bg-primary/5 border-primary shadow-[0_0_0_1px_rgba(59,130,246,0.5)]"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <p className="text-2xl font-bold text-foreground">{m}</p>
                    <p className="text-xs text-muted-foreground">phút/ngày</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {STEPS[step]!.key === "level" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => { setLevel(l); nextStep(); }}
                    className={`rounded-xl border p-4 text-center transition-all ${
                      level === l
                        ? "bg-primary/5 border-primary shadow-[0_0_0_1px_rgba(59,130,246,0.5)]"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                  >
                    <p className="text-2xl font-bold text-foreground">{l}</p>
                    <p className="text-xs text-muted-foreground">CEFR</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {STEPS[step].key === "confirm" && (
            <div className="space-y-4">
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Target className="size-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{GOALS.find(g => g.value === goal)?.label}</p>
                    <p className="text-sm text-muted-foreground">Mục tiêu</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="rounded-lg bg-blue/10 p-2">
                    <Clock className="size-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{minutesPerDay} phút/ngày</p>
                    <p className="text-sm text-muted-foreground">Thời gian học</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-purple/10 p-2">
                    <User className="size-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium">{level} (CEFR)</p>
                    <p className="text-sm text-muted-foreground">Trình độ hiện tại</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                EnVi sẽ tạo lộ trình 180 ngày cá nhân hóa cho bạn
              </p>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            {step > 0 && (
              <Button type="button" variant="outline" onClick={prevStep} disabled={pending} className="flex-1">
                Quay lại
              </Button>
            )}
            {isLastStep ? (
              <Button type="submit" form="onboarding-form" disabled={pending} className="flex-1 w-full sm:w-auto">
                {pending ? "Đang tạo lộ trình…" : "Tạo lộ trình & Bắt đầu"}
              </Button>
            ) : (
              <Button type="button" onClick={nextStep} disabled={pending} className="flex-1 w-full sm:w-auto">
                Tiếp theo
              </Button>
            )}
            <Button type="button" variant="ghost" onClick={handleSkip} disabled={pending} className="w-full sm:w-auto">
              Bỏ qua
            </Button>
          </div>
        </div>

        <form id="onboarding-form" onSubmit={handleSubmit} className="hidden">
          <input type="hidden" name="goal" value={goal} />
          <input type="hidden" name="minutesPerDay" value={minutesPerDay} />
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Đang tải...</div>}>
      <OnboardingContent />
    </Suspense>
  );
}