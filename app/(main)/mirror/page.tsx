"use client";

import { useEffect, useState } from "react";
import { Mic, Play, Volume2, Calendar, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MirrorRecorder } from "@/components/mirror/MirrorRecorder";
import { Skeleton, SkeletonCard } from "@/components/ui/skeleton";

const FIXED_PROMPTS = [
  { key: "self_intro", title: "Giới thiệu bản thân", text: "Introduce yourself: name, job, daily routine, and goals." },
  { key: "work_description", title: "Mô tả công việc", text: "Describe your current project or work responsibilities in detail." },
  { key: "weekend_recap", title: "Cuối tuần vừa rồi", text: "Tell me about your last weekend: what you did, who with, how you felt." },
];

type Tab = "record" | "compare";

export default function MirrorPage() {
  const [activeTab, setActiveTab] = useState<Tab>("record");
  const [userWeek, setUserWeek] = useState(1);
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState<any>(null);

  useEffect(() => {
    fetchCurrentWeek();
  }, []);

  async function fetchCurrentWeek() {
    try {
      const res = await fetch("/api/curriculum/current-week");
      const data = await res.json();
      if (data.weekNum) setUserWeek(data.weekNum);
    } catch (e) {
      console.error("Failed to fetch current week:", e);
    }
  }

  async function fetchComparison(weekNum: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/mirror/comparison?week_num=${weekNum}`);
      const data = await res.json();
      setComparisonData(data);
    } catch (e) {
      console.error("Failed to fetch comparison:", e);
    } finally {
      setLoading(false);
    }
  }

  const handleRecordComplete = () => {
    fetchComparison(userWeek);
  };

  return (
    <div className="mx-auto max-w-5xl py-6">
      <div className="mb-6">
        <h1 className="font-serif text-2xl font-semibold text-foreground">Mirror — Ghi âm Before/After</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mỗi Chủ nhật: 4 bản ghi × 60 giây (3 câu hỏi cố định + 1 câu chủ đề tuần).
          So sánh Tuần 1 vs Tuần hiện tại để nghe thấy tiến bộ.
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tuần hiện tại: <span className="font-medium">Tuần {userWeek}</span>
        </p>
      </div>

      <div className="mb-4 flex border-b border-border">
        <Button
          variant={activeTab === "record" ? "default" : "ghost"}
          onClick={() => setActiveTab("record")}
          className="gap-2"
        >
          <Mic className="size-4" /> Ghi âm tuần này
        </Button>
        <Button
          variant={activeTab === "compare" ? "default" : "ghost"}
          onClick={() => { setActiveTab("compare"); fetchComparison(userWeek); }}
          className="gap-2"
        >
          <RefreshCw className="size-4" /> So sánh Tuần 1 vs {userWeek}
        </Button>
      </div>

      {activeTab === "record" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FIXED_PROMPTS.map((prompt, index) => (
              <Card key={prompt.key} className="border-primary/20">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <span className="rounded-full bg-primary/10 p-1 text-primary text-xs">{index + 1}</span>
                    {prompt.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{prompt.text}</p>
                  <MirrorRecorder
                    weekNum={userWeek}
                    topicId={prompt.key}
                    type="fixed"
                    onComplete={handleRecordComplete}
                  />
                </CardContent>
              </Card>
            ))}
            <Card className="border-amber-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="rounded-full bg-amber-100 p-1 text-amber-600 text-xs">4</span>
                  Chủ đề tuần này
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">Give your opinion on this week&apos;s curriculum topic with reasons and examples.</p>
                <MirrorRecorder
                  weekNum={userWeek}
                  topicId="topic_weekly"
                  type="topic"
                  onComplete={handleRecordComplete}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "compare" && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8 w-64" />
              <div className="grid grid-cols-2 gap-4">
                <SkeletonCard />
                <SkeletonCard />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
                <Skeleton className="h-20" />
              </div>
            </div>
          ) : comparisonData && comparisonData.comparisons && comparisonData.comparisons.length > 0 ? (
            <div className="space-y-6">
              {comparisonData.comparisons.map((comp: any) => (
                <Card key={comp.question_key} className="border-primary/20">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 p-1 text-primary text-xs">
                        {FIXED_PROMPTS.find(p => p.key === comp.question_key) ? FIXED_PROMPTS.findIndex(p => p.key === comp.question_key) + 1 : 4}
                      </span>
                      {comp.question_key === "topic_weekly" ? "Chủ đề tuần này" : FIXED_PROMPTS.find(p => p.key === comp.question_key)?.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="rounded-lg border border-border p-4">
                        <h4 className="font-medium mb-2 text-emerald-700">Tuần 1 (Baseline)</h4>
                        <audio controls src={comp.week1_audio_url} className="w-full" />
                        <p className="text-xs text-muted-foreground mt-1">{comp.week1_created_at}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>WPM: {comp.week1_wpm}</div>
                          <div>{"Pauses >3s: "}{comp.week1_pauses}</div>
                          <div>VI segments: {comp.week1_vi_segments}</div>
                          <div>Latency: {comp.week1_latency_ms}ms</div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border p-4">
                        <h4 className="font-medium mb-2 text-blue-700">Tuần {userWeek} (Current)</h4>
                        <audio controls src={comp.current_audio_url} className="w-full" />
                        <p className="text-xs text-muted-foreground mt-1">{comp.current_created_at}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                          <div>WPM: {comp.current_wpm}</div>
                          <div>{"Pauses >3s: "}{comp.current_pauses}</div>
                          <div>VI segments: {comp.current_vi_segments}</div>
                          <div>Latency: {comp.current_latency_ms}ms</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-center">
                      <MetricDelta
                        label="WPM"
                        value={comp.wpm_change_pct}
                        unit="%"
                        higherIsBetter
                      />
                      <MetricDelta
                        label="Pauses >3s"
                        value={comp.pause_change}
                        unit=""
                        higherIsBetter={false}
                      />
                      <MetricDelta
                        label="VI segments"
                        value={comp.vi_change}
                        unit=""
                        higherIsBetter={false}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Calendar className="size-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">
                Chưa đủ dữ liệu để so sánh.
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                Hoàn thành ghi âm Tuần 1 và Tuần {userWeek} để xem so sánh.
              </p>
              <Button variant="outline" onClick={() => setActiveTab("record")}>
                <Mic className="size-4 mr-2" /> Đi ghi âm
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricDelta({ label, value, unit, higherIsBetter }: { label: string; value: number | null; unit: string; higherIsBetter: boolean }) {
  if (value === null) {
    return (
      <div className="rounded-lg p-4 bg-muted/50">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold text-muted-foreground">—</p>
        <p className="text-xs text-muted-foreground">Chưa có dữ liệu</p>
      </div>
    );
  }

  const isImprovement = higherIsBetter ? value > 0 : value < 0;
  return (
    <div className={`rounded-lg p-4 ${isImprovement ? "bg-emerald-50" : "bg-rose-50"}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-2xl font-bold ${isImprovement ? "text-emerald-700" : "text-rose-700"}`}>
        {value > 0 ? "+" : ""}{value}{unit}
      </p>
      <p className="text-xs">{isImprovement ? "Cải thiện" : "Cần cố gắng"}</p>
    </div>
  );
}