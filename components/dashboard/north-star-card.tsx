import { Flame, Gauge, Mic } from "lucide-react";

import type { NorthStarMetrics } from "@/lib/dashboard";

function Stat({
  icon,
  value,
  unit,
  label,
  accent,
}: {
  icon: React.ReactNode;
  value: string | number;
  unit?: string;
  label: string;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <div className={`flex items-center gap-2 text-xs font-medium ${accent}`}>
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-2xl font-bold text-foreground">{value}</span>
        {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
      </div>
    </div>
  );
}

export function NorthStarCard({ metrics }: { metrics: NorthStarMetrics }) {
  const wpm = metrics.avgWpmWeek != null ? Math.round(metrics.avgWpmWeek) : "—";
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">Chỉ số then chốt</h2>
          <p className="text-xs text-muted-foreground">
            Đo tiến bộ nói của bạn — phút nói, tốc độ (WPM) và chuỗi ngày học.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          icon={<Mic className="h-4 w-4" />}
          value={metrics.speakingMinutesWeek}
          unit="phút/tuần"
          label={`Phút nói · hôm nay ${metrics.speakingMinutesToday}p`}
          accent="text-blue-600"
        />
        <Stat
          icon={<Gauge className="h-4 w-4" />}
          value={wpm}
          unit="từ/phút"
          label="WPM trung bình (7 ngày)"
          accent="text-purple-600"
        />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          value={metrics.streak}
          unit="ngày"
          label="Streak liên tiếp"
          accent="text-orange-600"
        />
      </div>
      {metrics.speakingSessionsWeek === 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Tuần này bạn chưa luyện Speaking. Hãy làm 1 phiên để bắt đầu ghi nhận phút nói và WPM.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground">
          Tuần này: {metrics.speakingSessionsWeek} phiên Speaking · WPM càng tăng là bạn nói càng trôi chảy.
        </p>
      )}
    </div>
  );
}