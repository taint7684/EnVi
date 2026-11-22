"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { saveOnboarding } from "@/lib/onboarding";

const GOALS = [
  "Du lịch & giao tiếp hàng ngày",
  "Làm việc & email tiếng Anh",
  "Học tập & thi chứng chỉ",
  "Giao tiếp tự tin với người bản ngữ",
] as const;

const MINUTES = [15, 30, 60, 90, 120, 180] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [goal, setGoal] = useState<string>(GOALS[0]);
  const [minutesPerDay, setMinutesPerDay] = useState<number>(180);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      await saveOnboarding({ goal, minutesPerDay });
      router.push("/today");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Không lưu được.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6 py-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Chào bạn đến với EnVi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cài đặt mục tiêu học tập để EnVi lên kế hoạch phù hợp.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-destructive text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">
            Mục tiêu học tiếng Anh
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGoal(g)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  goal === g
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground block">
            Thời gian học mỗi ngày (phút)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutesPerDay(m)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  minutesPerDay === m
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted text-muted-foreground hover:text-foreground border-border"
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <Button
          type="submit"
          disabled={pending}
          className="w-full"
        >
          {pending ? "Đang lưu…" : "Bắt đầu học"}
        </Button>
      </form>
    </div>
  );
}
