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
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm font-semibold text-foreground">
          Ưu tiên hôm nay: NÓI NGAY — đừng dịch trong đầu
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Làm 2–3 block nói trước (Phản xạ · Speaking · Shadowing · Phát âm).
          Mỗi lần: Nghe → Nói → Sửa → Nói lại. Mục tiêu: nói nhiều, ít dịch, ít sợ.
        </p>
      </div>
      <TodayPlan plan={plan} />
      <ThreeHourPlan />
    </div>
  );
}