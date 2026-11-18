import { getDashboardData } from "@/lib/dashboard";
import { getDailyStudyPlan } from "@/app/actions/study-plan";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const [{ stats, weekData }, plan] = await Promise.all([
    getDashboardData(),
    getDailyStudyPlan(),
  ]);

  return <DashboardContent stats={stats} weekData={weekData} plan={plan} />;
}