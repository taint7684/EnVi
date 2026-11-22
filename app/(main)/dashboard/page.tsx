import { getDashboardData, getWeeklyReport } from "@/lib/dashboard";
import { getTodayPlan } from "@/app/actions/study-plan";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const [{ stats, weekData }, plan, report] = await Promise.all([
    getDashboardData(),
    getTodayPlan(),
    getWeeklyReport(),
  ]);

  return (
    <DashboardContent
      stats={stats}
      weekData={weekData}
      plan={plan}
      report={report}
    />
  );
}
