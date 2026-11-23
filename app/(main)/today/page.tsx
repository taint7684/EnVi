import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayPlan } from "@/app/actions/study-plan";
import { DailyStudyPlan as TodayPlan } from "@/components/dashboard/daily-study-plan";
import { ThreeHourPlan } from "@/components/today/three-hour-plan";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const plan = await getTodayPlan();
  return (
    <div className="space-y-6">
      <TodayPlan plan={plan} />
      <ThreeHourPlan />
    </div>
  );
}