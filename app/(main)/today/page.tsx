import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getTodayPlan } from "@/app/actions/study-plan";
import { getNorthStarMetrics } from "@/lib/dashboard";
import { DailyStudyPlan as TodayPlan } from "@/components/dashboard/daily-study-plan";
import { NorthStarCard } from "@/components/dashboard/north-star-card";
import { ThreeHourPlan } from "@/components/today/three-hour-plan";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const SPEAKING_BLOCKS: Array<{ id: string; label: string; href: string }> = [
  { id: "reflex", label: "Phản xạ thuần", href: "/reflex" },
  { id: "speaking", label: "Speaking AI", href: "/speaking" },
  { id: "listen", label: "Shadowing", href: "/shadowing" },
  { id: "pronunciation", label: "Phát âm", href: "/pronunciation" },
];

function getMainSpeakingTask(plan: Awaited<ReturnType<typeof getTodayPlan>>) {
  return plan.tasks.find((t) => SPEAKING_BLOCKS.some((b) => b.id === t.id));
}

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const [plan, metrics] = await Promise.all([getTodayPlan(), getNorthStarMetrics()]);
  const mainTask = getMainSpeakingTask(plan);
  const mainTaskInfo = mainTask ? SPEAKING_BLOCKS.find((b) => b.id === mainTask.id) : null;

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

      {mainTask && mainTaskInfo ? (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-xs font-medium text-white">
              NHIỆM VỤ NÓI CHÍNH
            </span>
            <span className="text-sm font-semibold text-foreground">
              {mainTaskInfo.label} — {mainTask.minutes} phút
            </span>
          </div>
          <p className="text-xs text-emerald-700">
            Bắt đầu bằng việc này. Nghe → Nói ngay → So sánh → Nói lại.
            Sai cũng được, miễn là đã nói. Làm xong mới làm block khác.
          </p>
          <Link
            href={mainTaskInfo.href}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 transition-colors"
          >
            Bắt đầu {mainTaskInfo.label}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50 p-4 text-center">
          <p className="text-sm text-amber-700">
            Hôm nay chưa có nhiệm vụ nói trong kế hoạch.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {SPEAKING_BLOCKS.map((b) => (
              <Link
                key={b.id}
                href={b.href}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 transition-colors"
              >
                {b.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      <TodayPlan plan={plan} />
      <ThreeHourPlan />
    </div>
  );
}