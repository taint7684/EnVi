import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayPlan } from "@/app/actions/study-plan";
import { getNorthStarMetrics } from "@/lib/dashboard";
import { DailyStudyPlan as TodayPlan } from "@/components/dashboard/daily-study-plan";
import { NorthStarCard } from "@/components/dashboard/north-star-card";
import { ThreeHourPlan } from "@/components/today/three-hour-plan";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [plan, metrics] = await Promise.all([getTodayPlan(), getNorthStarMetrics()]);
  return (
    <div className="space-y-6">
      <NorthStarCard metrics={metrics} />
      <TodayPlan plan={plan} />
      <ThreeHourPlan />
    </div>
  );
}