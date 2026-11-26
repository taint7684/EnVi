import { Flame, Gauge, Mic, TrendingUp, TrendingDown, Minus, AlertTriangle, Zap } from "lucide-react";

import type { NorthStarMetrics } from "@/lib/dashboard";

function Stat({
  icon,
  value,
  unit,
  label,
  accent,
  delta,
}: {
  icon: React.ReactNode;
  value: string | number;
  unit?: string;
  label: string;
  accent: string;
  delta?: { value: number; label: string } | null;
}) {
  const deltaColor = delta?.value === 0 ? "text-muted-foreground" : delta && delta.value > 0 ? "text-emerald-600" : "text-rose-600";
  const DeltaIcon = delta?.value === 0 ? Minus : delta && delta.value > 0 ? TrendingUp : TrendingDown;
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
      {delta != null && (
        <div className="mt-1 flex items-center gap-1 text-[10px] font-medium">
          <DeltaIcon className={`size-3 ${deltaColor}`} />
          <span className={deltaColor}>{delta.value >= 0 ? "+" : ""}{delta.value}{delta.label}</span>
        </div>
      )}
    </div>
  );
}

export function NorthStarCard({ metrics }: { metrics: NorthStarMetrics }) {
  const wpm = metrics.avgWpmWeek != null ? Math.round(metrics.avgWpmWeek) : "—";
  const wpmDelta = metrics.avgWpmPrevWeek != null && metrics.avgWpmWeek != null
    ? Math.round(metrics.avgWpmWeek - metrics.avgWpmPrevWeek)
    : null;
  const minutesDelta = metrics.speakingMinutesPrevWeek != null
    ? Math.round(metrics.speakingMinutesWeek - metrics.speakingMinutesPrevWeek)
    : null;
  const sessionsDelta = metrics.speakingSessionsPrevWeek != null
    ? metrics.speakingSessionsWeek - metrics.speakingSessionsPrevWeek
    : null;
  const latency = metrics.avgLatencyMsWeek != null ? Math.round(metrics.avgLatencyMsWeek) : "—";
  const latencyDelta = metrics.avgLatencyPrevWeek != null && metrics.avgLatencyMsWeek != null
    ? Math.round(metrics.avgLatencyPrevWeek - metrics.avgLatencyMsWeek)
    : null;
  const viDelta = metrics.viSegmentsPrevWeek != null
    ? metrics.viSegmentsPrevWeek - metrics.viSegmentsWeek
    : null;
  const lifelineDelta = metrics.lifelineUsedPrevWeek != null
    ? metrics.lifelineUsedPrevWeek - metrics.lifelineUsedWeek
    : null;

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-serif text-lg font-semibold text-foreground">Chỉ số then chốt (North Star)</h2>
          <p className="text-xs text-muted-foreground">
            Tuần này vs tuần trước — phút nói, tốc độ (WPM), độ trễ (ms), tiếng Việt, lifeline, chuỗi ngày.
          </p>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          icon={<Mic className="h-4 w-4" />}
          value={metrics.speakingMinutesWeek}
          unit="phút/tuần"
          label={`Phút nói · hôm nay ${metrics.speakingMinutesToday}p`}
          accent="text-blue-600"
          delta={minutesDelta != null ? { value: minutesDelta, label: "p" } : null}
        />
        <Stat
          icon={<Gauge className="h-4 w-4" />}
          value={wpm}
          unit="từ/phút"
          label="WPM (7 ngày)"
          accent="text-purple-600"
          delta={wpmDelta != null ? { value: wpmDelta, label: " WPM" } : null}
        />
        <Stat
          icon={<Zap className="h-4 w-4" />}
          value={latency}
          unit="ms"
          label="Độ trễ Reflex (onset)"
          accent="text-amber-600"
          delta={latencyDelta != null ? { value: latencyDelta, label: "ms" } : null}
        />
        <Stat
          icon={<Flame className="h-4 w-4" />}
          value={metrics.streak}
          unit="ngày"
          label="Streak (≥3′ nói/ngày)"
          accent="text-orange-600"
        />
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
        <div className="rounded-lg border border-border bg-background p-3 flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
          <div>
            <p className="font-medium text-rose-700">VI segments tuần này</p>
            <p className="text-foreground">{metrics.viSegmentsWeek} đoạn</p>
          </div>
          {viDelta != null && (
            <span className={`ml-auto text-[10px] font-medium ${viDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {viDelta >= 0 ? "+" : ""}{viDelta} vs tuần trước
            </span>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background p-3 flex items-center gap-2">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <div>
            <p className="font-medium text-amber-700">Lifeline dùng tuần này</p>
            <p className="text-foreground">{metrics.lifelineUsedWeek} lần</p>
          </div>
          {lifelineDelta != null && (
            <span className={`ml-auto text-[10px] font-medium ${lifelineDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {lifelineDelta >= 0 ? "+" : ""}{lifelineDelta} vs tuần trước
            </span>
          )}
        </div>
        <div className="rounded-lg border border-border bg-background p-3 flex items-center gap-2">
          <Mic className="h-3.5 w-3.5 text-purple-500" />
          <div>
            <p className="font-medium text-purple-700">Phiên Speaking tuần này</p>
            <p className="text-foreground">{metrics.speakingSessionsWeek} phiên</p>
          </div>
          {sessionsDelta != null && (
            <span className={`ml-auto text-[10px] font-medium ${sessionsDelta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {sessionsDelta >= 0 ? "+" : ""}{sessionsDelta} vs tuần trước
            </span>
          )}
        </div>
      </div>
      {metrics.speakingSessionsWeek === 0 ? (
        <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
          Tuần này bạn chưa luyện Speaking. Hãy làm 1 phiên để bắt đầu ghi nhận phút nói, WPM và độ trễ.
        </p>
      ) : (
        <p className="mt-3 text-xs text-muted-foreground flex items-center gap-2">
          <span>Mục tiêu: WPM ↑, Độ trễ ↓, VI segments ↓, Lifeline ↓, Streak ≥3′ nói/ngày</span>
        </p>
      )}
    </div>
  );
}