import Link from "next/link";
import { ReflexSession } from "@/components/reflex/reflex-session";
import { getCurriculumPhrases } from "@/lib/phrases-v2";
import { getDayPlan } from "@/lib/curriculum";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function ReflexPage({
  searchParams,
}: {
  searchParams: Promise<{ day?: string; mode?: string }>;
}) {
  const { day, mode } = await searchParams;
  const userDay = day ? Math.max(1, Math.min(180, parseInt(day, 10))) : 1;
  const sessionMode: "learn" | "review" = mode === "review" ? "review" : "learn";

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let currentDay = userDay;
  if (user) {
    const { data: progress } = await supabase
      .from("curriculum_progress")
      .select("current_day")
      .eq("user_id", user.id)
      .single();
    if (progress) currentDay = progress.current_day;
  }

  const dayPlan = getDayPlan(currentDay, {
    currentDay,
    currentWeek: Math.ceil(currentDay / 7),
    currentPhase: "G1",
    baselineLatencyMs: null,
    baselineWpm: null,
    totalSpeakingMinutes: 0,
    streakDays: 0,
  });

  const reflexBlock = dayPlan.blocks.find(b => b.id === "reflex");
  const phrases = await getCurriculumPhrases(
    reflexBlock?.config.topicId || "topic-01-self",
    reflexBlock?.config.layer || "L1",
    reflexBlock?.config.round || 1,
    reflexBlock?.config.phraseCount || 12
  );

  const dayHref = (d: number) => {
    const params = new URLSearchParams();
    params.set("day", d.toString());
    if (sessionMode === "review") params.set("mode", "review");
    return `/reflex?${params.toString()}`;
  };

  return (
    <div className="py-4">
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-semibold text-foreground">
          Luyện phản xạ câu giao tiếp
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {sessionMode === "review"
            ? "Chế độ ôn tập · Luyện không giới hạn các câu đã học"
            : `Ngày ${currentDay}/180 · ${dayPlan.topicNameVi} · Layer ${reflexBlock?.config.layer || "L1"} · 12 câu/ngày`}
        </p>
      </div>

      <div className="mx-auto mb-6 flex max-w-xl flex-wrap justify-center gap-2">
        {Array.from({ length: 180 }, (_, i) => i + 1).map((d) => (
          <Link
            key={d}
            href={dayHref(d)}
            className={cn(
              "rounded-full px-2 py-1 text-xs font-medium transition-colors",
              currentDay === d
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {d}
          </Link>
        ))}
      </div>

      {phrases.length === 0 ? (
        <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
          <p className="text-4xl">📚</p>
          <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
            {sessionMode === "review"
              ? "Chưa có câu nào để ôn"
              : "Chưa có câu nào để luyện"}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {sessionMode === "review"
              ? "Hãy học vài câu mới trước, rồi quay lại ôn tập."
              : "Hãy thử ngày khác hoặc import câu giao tiếp."}
          </p>
        </div>
      ) : (
        <ReflexSession phrases={phrases.map(p => ({ phrase: p, review: null }))} sessionMode={sessionMode} level={reflexBlock?.config.layer || "L1"} />
      )}
    </div>
  );
}