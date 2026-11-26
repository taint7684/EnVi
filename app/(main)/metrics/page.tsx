import { createClient } from "@/lib/supabase/server";
import { getNorthStarMetrics } from "@/lib/dashboard";
import { NorthStarCard } from "@/components/dashboard/north-star-card";
import { MetricsChart } from "@/components/dashboard/metrics-chart";

export default async function MetricsDashboardPage() {
  const metrics = await getNorthStarMetrics();

  return (
    <div className="mx-auto max-w-5xl py-6 px-4">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Dashboard Quan sát</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Theo dõi các chỉ số North Star: WPM, Latency, VI Segments, Lifeline Usage, Streak
        </p>
      </div>

      <NorthStarCard metrics={metrics} />

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <MetricsChart 
          metric="wpm" 
          title="WPM Trend (7 ngày)" 
          data={metrics.wpmHistory}
        />
        <MetricsChart 
          metric="latency" 
          title="Latency Trend (7 ngày)" 
          data={metrics.latencyHistory}
        />
        <MetricsChart 
          metric="viSegments" 
          title="VI Segments (7 ngày)" 
          data={metrics.viHistory}
        />
        <MetricsChart 
          metric="lifeline" 
          title="Lifeline Usage (7 ngày)" 
          data={metrics.lifelineHistory}
        />
      </div>

      <div className="mt-8">
        <h2 className="font-semibold mb-4">Chi tiết phiên gần đây</h2>
        <RecentSessionsTable />
      </div>
    </div>
  );
}

async function RecentSessionsTable() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) return <div className="text-center py-8 text-muted-foreground">Cần đăng nhập</div>;

  const { data: sessions } = await supabase
    .from("speak_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (!sessions || sessions.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">Chưa có phiên nói nào</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border bg-muted">
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Ngày</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Module</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Phút</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">WPM</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Latency</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">VI %</th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Lifeline</th>
          </tr>
        </thead>
        <tbody>
          {sessions.map((session) => (
            <tr key={session.id} className="border-b border-border/50 hover:bg-muted/50">
              <td className="px-4 py-3 text-sm">
                {new Date(session.created_at).toLocaleDateString("vi-VN", { 
                  day: "2-digit", 
                  month: "2-digit", 
                  hour: "2-digit", 
                  minute: "2-digit" 
                })}
              </td>
              <td className="px-4 py-3 text-sm font-mono">{session.module}</td>
              <td className="px-4 py-3 text-right text-sm font-mono">
                {Math.round((session.speaking_seconds || 0) / 60)}m
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono">
                {session.wpm?.toFixed(1) || "-"}
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono">
                {session.onset_latency_ms || "-"}ms
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono">
                {session.vi_segments ? `${((session.vi_segments / (session.total_turns || 1)) * 100).toFixed(1)}%` : "-"}
              </td>
              <td className="px-4 py-3 text-right text-sm font-mono">
                {session.lifelines_used || 0}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}