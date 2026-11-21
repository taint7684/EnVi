import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getDailyStudyPlan } from "@/app/actions/study-plan";
import { TodayPlan } from "@/components/today/today-plan";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const plan = await getDailyStudyPlan();
  return <TodayPlan plan={plan} />;
}
