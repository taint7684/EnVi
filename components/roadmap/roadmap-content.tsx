"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  Check,
  Flame,
  Headphones,
  Layers,
  Mic,
  Moon,
  PenLine,
  Sparkles,
  Sun,
  Trophy,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Cấu hình bài học theo ngày                                          */
/* ------------------------------------------------------------------ */

type TaskId =
  | "vocab"
  | "dictation"
  | "grammar"
  | "reflex"
  | "speaking"
  | "shadowing"
  | "weekendReview"
  | "weekendReading";

type TaskDef = {
  id: TaskId;
  bit: number;
  label: string;
  desc: string;
  href: string;
  minutes: number;
  icon: typeof Layers;
};

const TASKS: TaskDef[] = [
  // Sáng — Input (không nói to)
  {
    id: "vocab",
    bit: 1 << 0,
    label: "Flashcard từ vựng",
    desc: "Ôn 20 thẻ SRS + nghe YouGlish",
    href: "/vocab",
    minutes: 20,
    icon: Layers,
  },
  {
    id: "dictation",
    bit: 1 << 1,
    label: "Dictation",
    desc: "Nghe & gõ lại câu",
    href: "/dictation",
    minutes: 15,
    icon: Headphones,
  },
  {
    id: "grammar",
    bit: 1 << 2,
    label: "Ngữ pháp",
    desc: "1 chủ điểm + quiz",
    href: "/grammar",
    minutes: 20,
    icon: PenLine,
  },
  // Tối — Output (nói to)
  {
    id: "reflex",
    bit: 1 << 3,
    label: "Reflex (Dịch & Nói)",
    desc: "Nói đúng 20 câu giao tiếp",
    href: "/reflex",
    minutes: 20,
    icon: Mic,
  },
  {
    id: "speaking",
    bit: 1 << 4,
    label: "Speaking với AI",
    desc: "Hội thoại 5 bước với AI",
    href: "/speaking",
    minutes: 20,
    icon: Mic,
  },
  {
    id: "shadowing",
    bit: 1 << 5,
    label: "Shadowing",
    desc: "Nghe & nói đuổi theo audio",
    href: "/shadowing",
    minutes: 15,
    icon: Headphones,
  },
  // Cuối tuần — Ôn tập & thực chiến
  {
    id: "weekendReview",
    bit: 1 << 6,
    label: "Ôn tập tổng hợp",
    desc: "Từ vựng + Dictation + Reflex",
    href: "/vocab",
    minutes: 30,
    icon: BookOpen,
  },
  {
    id: "weekendReading",
    bit: 1 << 7,
    label: "Đọc hiểu dài",
    desc: "Đọc to + đọc hiểu đoạn dài",
    href: "/reading",
    minutes: 30,
    icon: BookOpen,
  },
];

const MORNING = TASKS.filter((t) => t.bit <= 1 << 2);
const EVENING = TASKS.filter((t) => t.bit >= 1 << 3 && t.bit <= 1 << 5);
const WEEKEND = TASKS.filter((t) => t.bit >= 1 << 6);

const WEEKDAY_MASK = MORNING.reduce((m, t) => m | t.bit, 0) |
  EVENING.reduce((m, t) => m | t.bit, 0);
const WEEKEND_MASK = TASKS.reduce((m, t) => m | t.bit, 0);
const BONUS_BIT = 1 << 14; // đánh dấu đã cộng 100 XP hôm nay

const BONUS_XP = 100;

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function applicableMaskForDate(dateStr: string): number {
  const day = new Date(`${dateStr}T00:00:00`).getDay();
  return day === 0 || day === 6 ? WEEKEND_MASK : WEEKDAY_MASK;
}

function isDayComplete(mask: number, dateStr: string): boolean {
  const app = applicableMaskForDate(dateStr);
  return (mask & app) === app;
}

function sumMinutes(mask: number): number {
  return TASKS.reduce(
    (sum, t) => (mask & t.bit ? sum + t.minutes : sum),
    0,
  );
}

type DayRow = { date: string; mask: number };

function computeStreak(history: DayRow[], today: string): number {
  const complete = new Set(
    history.filter((h) => isDayComplete(h.mask, h.date)).map((h) => h.date),
  );
  let streak = 0;
  const cursor = new Date(`${today}T00:00:00`);
  if (!complete.has(today)) cursor.setDate(cursor.getDate() - 1);
  for (let i = 0; i < 400; i++) {
    const ds = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}-${String(cursor.getDate()).padStart(2, "0")}`;
    if (complete.has(ds)) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

/* ------------------------------------------------------------------ */
/* Timeline 3 giai đoạn                                                */
/* ------------------------------------------------------------------ */

const PHASES = [
  {
    month: 1,
    title: "Xây nền tảng",
    range: "Ngày 1–30",
    focus: "Từ vựng · Ngữ pháp · Phản xạ cơ bản",
    color: "from-sky-500 to-blue-600",
  },
  {
    month: 2,
    title: "Bứt phá",
    range: "Ngày 31–60",
    focus: "AI Speaking · Shadowing · Phản xạ nâng cao",
    color: "from-emerald-500 to-green-600",
  },
  {
    month: 3,
    title: "Thực chiến",
    range: "Ngày 61–90",
    focus: "Tự do nói với AI · Đọc hiểu dài",
    color: "from-violet-500 to-purple-600",
  },
];

/* ------------------------------------------------------------------ */
/* Confetti                                                            */
/* ------------------------------------------------------------------ */

const CONFETTI_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#eab308",
  "#ec4899",
  "#a855f7",
  "#ef4444",
];

function rand(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 44 }, (_, i) => ({
        left: rand(i + 1) * 100,
        delay: rand(i + 7) * 0.6,
        duration: 2.4 + rand(i + 13) * 1.6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: rand(i + 21) * 360,
        size: 6 + rand(i + 31) * 7,
      })),
    [],
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <style>{`@keyframes envi-confetti{0%{transform:translateY(-12vh) rotate(0deg);opacity:1}100%{transform:translateY(112vh) rotate(720deg);opacity:0}}`}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-12vh",
            width: p.size,
            height: p.size * 0.6,
            backgroundColor: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `envi-confetti ${p.duration}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Task row                                                            */
/* ------------------------------------------------------------------ */

function TaskRow({
  task,
  done,
  disabled,
  onToggle,
}: {
  task: TaskDef;
  done: boolean;
  disabled?: boolean;
  onToggle: (task: TaskDef) => void;
}) {
  const Icon = task.icon;
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border p-3 transition-colors",
        done
          ? "border-green-200 bg-green-50"
          : "border-border bg-card hover:border-primary/40",
        disabled && "opacity-50",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task)}
        disabled={disabled}
        aria-pressed={done}
        aria-label={`Đánh dấu ${task.label}`}
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md border transition-colors",
          done
            ? "border-green-500 bg-green-500 text-white"
            : "border-muted-foreground/40 bg-background",
        )}
      >
        {done ? <Check className="size-4" /> : null}
      </button>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-1.5 truncate text-sm font-medium">
          <Icon className="size-4 text-primary" />
          {task.label}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {task.desc} · {task.minutes} phút
        </p>
      </div>

      <Link
        href={task.href}
        className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        aria-label={`Mở ${task.label}`}
      >
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

export function RoadmapContent() {
  const [history, setHistory] = useState<DayRow[]>([]);
  const [todayMask, setTodayMask] = useState(0);
  const [loading, setLoading] = useState(true);
  const [celebrate, setCelebrate] = useState(false);
  const [saving, setSaving] = useState(false);

  const today = todayStr();
  const todayApplicable = applicableMaskForDate(today);
  const isWeekendToday = todayApplicable === WEEKEND_MASK;
  const dayComplete = (todayMask & todayApplicable) === todayApplicable;

  const load = useCallback(async () => {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const since = new Date();
    since.setDate(since.getDate() - 120);
    const sinceStr = since.toISOString().split("T")[0];

    const { data } = await supabase
      .from("daily_progress")
      .select("date, speaking_minutes")
      .eq("user_id", user.id)
      .gte("date", sinceStr)
      .order("date", { ascending: false });

    const rows: DayRow[] = (data ?? []).map(
      (d) =>
        ({
          date: (d as { date: string }).date,
          mask: (d as { speaking_minutes: number }).speaking_minutes ?? 0,
        }) satisfies DayRow,
    );

    setHistory(rows);
    setTodayMask(rows.find((r) => r.date === today)?.mask ?? 0);
    setLoading(false);
  }, [today]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const streak = useMemo(
    () => computeStreak(history, today),
    [history, today],
  );

  const completedCount = useMemo(
    () =>
      history.filter((h) => isDayComplete(h.mask, h.date)).length,
    [history],
  );

  const currentDay = Math.min(90, completedCount + (dayComplete ? 0 : 1));
  const activePhase = currentDay <= 30 ? 0 : currentDay <= 60 ? 1 : 2;
  const progressPct = Math.min(100, (completedCount / 90) * 100);

  async function toggleTask(task: TaskDef) {
    if (saving || (task.bit >= 1 << 6 && !isWeekendToday)) return;
    setSaving(true);

    const had = (todayMask & task.bit) !== 0;
    let next = had ? todayMask & ~task.bit : todayMask | task.bit;

    // Ăn mừng + cộng XP khi vừa hoàn thành tất cả task trong ngày
    let justCompleted = false;
    if (!had && (next & todayApplicable) === todayApplicable) {
      if ((next & BONUS_BIT) === 0) {
        next |= BONUS_BIT;
        justCompleted = true;
      }
    }

    // optimistic
    setTodayMask(next);
    setHistory((prev) => {
      const rest = prev.filter((r) => r.date !== today);
      return [{ date: today, mask: next }, ...rest];
    });

    const nextHistory: DayRow[] = [
      { date: today, mask: next },
      ...history.filter((r) => r.date !== today),
    ];
    const newStreak = computeStreak(nextHistory, today);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("daily_progress").upsert(
        {
          user_id: user.id,
          date: today,
          minutes: sumMinutes(next),
          words_reviewed: 0,
          speaking_minutes: next,
          streak: newStreak,
        },
        { onConflict: "user_id,date" },
      );

      if (justCompleted) {
        await supabase.rpc("add_xp", {
          user_uuid: user.id,
          xp_amount: BONUS_XP,
        });
        window.dispatchEvent(new Event("envi:xp-refresh"));
        setCelebrate(true);
        window.setTimeout(() => setCelebrate(false), 4200);
      }
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground">
        Đang tải lộ trình...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {celebrate ? <Confetti /> : null}

      {/* Tổng quan */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-serif text-xl font-semibold">
              Lộ trình 90 ngày cá nhân hóa
            </h2>
            <p className="text-sm text-muted-foreground">
              Ngày {currentDay}/90 · Giai đoạn {activePhase + 1}:{" "}
              {PHASES[activePhase].title}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Flame className="size-5 text-orange-500" />
              <span className="text-xl font-bold">{streak}</span>
              <span className="text-sm text-muted-foreground">streak</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Trophy className="size-5 text-primary" />
              <span className="text-xl font-bold">{completedCount}</span>
              <span className="text-sm text-muted-foreground">ngày xong</span>
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 w-full rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Timeline 3 giai đoạn */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-medium">3 giai đoạn</h3>
        <div className="space-y-3">
          {PHASES.map((phase, i) => {
            const active = i === activePhase;
            const passed = i < activePhase;
            return (
              <div
                key={phase.month}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 transition-colors",
                  active
                    ? "border-primary bg-primary/5"
                    : passed
                      ? "border-green-200 bg-green-50"
                      : "border-border",
                )}
              >
                <div
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white",
                    phase.color,
                  )}
                >
                  <span className="text-sm font-bold">T{phase.month}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">
                      Tháng {phase.month}: {phase.title}
                    </p>
                    {passed ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                        Hoàn tất
                      </span>
                    ) : active ? (
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                        Đang học
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">{phase.range}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {phase.focus}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lịch học hôm nay */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-medium">
            <CalendarDays className="size-5 text-primary" />
            Lịch học hôm nay
          </h3>
          {dayComplete ? (
            <span className="flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              <Sparkles className="size-4" />
              Hoàn thành +{BONUS_XP} XP
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">
              Tick đủ task để nhận +{BONUS_XP} XP
            </span>
          )}
        </div>

        {/* Sáng */}
        <SlotBlock
          title="Sáng · 04:00–05:30 (Input — không nói to)"
          icon={<Sun className="size-5 text-amber-500" />}
          tasks={MORNING}
          mask={todayMask}
          onToggle={toggleTask}
        />

        {/* Tối */}
        <SlotBlock
          title="Tối · 20:00–22:00 (Output — nói to)"
          icon={<Moon className="size-5 text-indigo-500" />}
          tasks={EVENING}
          mask={todayMask}
          onToggle={toggleTask}
        />

        {/* Cuối tuần */}
        <div className="mt-5">
          <div className="mb-2 flex items-center gap-2">
            <CalendarDays className="size-5 text-emerald-500" />
            <h4 className="text-sm font-medium">Cuối tuần (T7, CN)</h4>
            {!isWeekendToday ? (
              <span className="text-xs text-muted-foreground">
                — hôm nay là ngày thường, chưa tính
              </span>
            ) : null}
          </div>
          <div className="space-y-2">
            {WEEKEND.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                done={(todayMask & task.bit) !== 0}
                disabled={!isWeekendToday}
                onToggle={toggleTask}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 90-day dots */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h3 className="mb-4 font-medium">Bản đồ 90 ngày</h3>
        <div className="grid grid-cols-10 gap-1.5 sm:gap-2">
          {Array.from({ length: 90 }, (_, i) => {
            const day = i + 1;
            const done = day <= completedCount;
            const isCurrent = day === currentDay && !dayComplete;
            return (
              <div
                key={day}
                title={`Ngày ${day}`}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md text-[10px] font-medium transition-colors sm:text-xs",
                  done
                    ? "bg-primary text-primary-foreground"
                    : isCurrent
                      ? "border-2 border-primary bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : day}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function SlotBlock({
  title,
  icon,
  tasks,
  mask,
  onToggle,
}: {
  title: string;
  icon: React.ReactNode;
  tasks: TaskDef[];
  mask: number;
  onToggle: (task: TaskDef) => void;
}) {
  return (
    <div className="mt-5">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <h4 className="text-sm font-medium">{title}</h4>
      </div>
      <div className="space-y-2">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            done={(mask & task.bit) !== 0}
            onToggle={onToggle}
          />
        ))}
      </div>
    </div>
  );
}