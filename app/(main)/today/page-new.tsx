import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getNorthStarMetrics } from "@/lib/dashboard";
import { DailyStudyPlanNew } from "@/components/today/daily-study-plan-new";
import { ThreeHourPlanNew } from "@/components/today/three-hour-plan-new";
import { NorthStarCard } from "@/components/dashboard/north-star-card";
import { getDayPlan } from "@/lib/curriculum";
import { getServerUserStats } from "@/app/actions/user-stats";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userStats = await getServerUserStats(user.id);
  const plan = getDayPlan(userStats.currentDay, userStats);
  const metrics = await getNorthStarMetrics();

  return (
    <div className="space-y-6">
      <NorthStarCard metrics={metrics} />
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-foreground">
          Ưu tiên hôm nay: NÓI NGAY — đừng dịch trong đầu
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          6 block cố định: Shadowing 10′ → Reflex 20′ → Picture Talk 15′ → AI Speaking 30′ → Chunks 10′ → Voice Diary 5′ = 90′
          <br />
          Mục tiêu: ≥{plan.speakingMinutes}′ nói ({plan.speakingPct}%) | XP mục tiêu: {plan.xpTarget} | Phase {plan.phase} Tuần {plan.weekNum}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Chủ đề: {plan.topicNameVi} ({plan.topicNameEn}) | Round {plan.blocks[0].config.round} | Layer: L1 {plan.layerWeights.L1}% L2 {plan.layerWeights.L2}% L3 {plan.layerWeights.L3}%
        </p>
      </div>

      <DailyStudyPlanNew plan={plan} />
      <ThreeHourPlanNew plan={plan} />
    </div>
  );
}