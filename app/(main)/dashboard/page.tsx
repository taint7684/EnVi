import { getDashboardData } from "@/lib/dashboard";
import { DashboardContent } from "@/components/dashboard/dashboard-content";

export default async function DashboardPage() {
  const { stats, weekData } = await getDashboardData();

  return <DashboardContent stats={stats} weekData={weekData} />;
}