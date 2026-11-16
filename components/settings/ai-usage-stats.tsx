"use client";

import { useState, useEffect } from "react";
import { Zap, BarChart } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";

type UsageStats = {
  total: number;
  today: number;
  byFeature: Record<string, number>;
};

export function AiUsageStats() {
  const [stats, setStats] = useState<UsageStats>({
    total: 0,
    today: 0,
    byFeature: {},
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("ai_usage_log")
      .select("feature, created_at")
      .eq("user_id", user.id);

    if (data) {
      const total = data.length;
      const todayCount = data.filter(
        (d) => d.created_at.startsWith(today),
      ).length;

      const byFeature: Record<string, number> = {};
      data.forEach((d) => {
        byFeature[d.feature] = (byFeature[d.feature] || 0) + 1;
      });

      setStats({ total, today: todayCount, byFeature });
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="text-sm text-muted-foreground">Đang tải thống kê...</div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="size-4" />
          Sử dụng AI
        </CardTitle>
        <CardDescription>
          Thống kê số lượt gọi AI của bạn
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-accent/50 p-4">
            <p className="text-2xl font-bold">{stats.total}</p>
            <p className="text-sm text-muted-foreground">Tổng lượt gọi</p>
          </div>
          <div className="rounded-lg bg-accent/50 p-4">
            <p className="text-2xl font-bold">{stats.today}</p>
            <p className="text-sm text-muted-foreground">Hôm nay</p>
          </div>
        </div>

        {Object.keys(stats.byFeature).length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">Chi tiết theo tính năng:</p>
            {Object.entries(stats.byFeature).map(([feature, count]) => (
              <div
                key={feature}
                className="flex items-center justify-between rounded-lg bg-muted px-3 py-2"
              >
                <span className="text-sm capitalize">{feature}</span>
                <span className="text-sm font-medium">{count} lượt</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}