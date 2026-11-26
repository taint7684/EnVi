"use client";

import { useEffect, useState } from "react";
import { ArrowRight, AlertTriangle, CheckCircle, Clock, X, RotateCcw, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type ErrorEvent = {
  id: number;
  module: string;
  error_type: string;
  severity: string;
  expected: string | null;
  actual: string | null;
  user_transcript: string | null;
  layer: string | null;
  topic_id: string | null;
  difficulty: string | null;
  latency_ms: number | null;
  wpm: number | null;
  pauses_over_3s: number | null;
  vi_segments: number | null;
  lifeline_used: boolean | null;
  status: string;
  makeup_count: number;
  last_makeup_at: string | null;
  mastered_at: string | null;
  created_at: string;
};

type ErrorPattern = {
  id: number;
  pattern_key: string;
  pattern_type: string;
  count: number;
  first_seen: string;
  last_seen: string;
  status: string;
  mastery_streak: number;
  mastery_level: number;
};

type PatternCatalog = {
  id: string;
  pattern_type: string;
  name_vi: string;
  name_en: string;
  description_vi: string;
  description_en: string;
  examples: Array<{ expected: string; wrong: string; correction: string }>;
  tips_vi: string[];
  tips_en: string[];
  difficulty: string;
  is_vietnamese_specific: boolean;
};

const MODULE_LABELS: Record<string, string> = {
  reflex: "Reflex",
  speaking: "AI Speaking",
  picture_talk: "Picture Talk",
  shadowing: "Shadowing",
  chunks: "Chunks",
  voice_diary: "Voice Diary",
  pronunciation: "Phát âm",
  grammar: "Ngữ pháp",
  writing: "Viết",
  reading: "Đọc hiểu",
  dictation: "Dictation",
};

const ERROR_TYPE_LABELS: Record<string, { label: string; icon: React.ComponentType<{ className?: string }> }> = {
  pronunciation: { label: "Phát âm", icon: AlertTriangle },
  grammar: { label: "Ngữ pháp", icon: RotateCcw },
  vocabulary: { label: "Từ vựng", icon: Clock },
  fluency: { label: "Trôi chảy", icon: TrendingUp },
  meaning: { label: "Ý nghĩa", icon: TrendingDown },
  vi_segment: { label: "Tiếng Việt", icon: X },
  latency: { label: "Độ trễ", icon: Clock },
  other: { label: "Khác", icon: Minus },
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  open: { label: "Chưa sửa", color: "bg-red-100 text-red-700" },
  in_makeup: { label: "Đang bài bù", color: "bg-blue-100 text-blue-700" },
  mastered: { label: "Đã thành thạo", color: "bg-emerald-100 text-emerald-700" },
  dismissed: { label: "Đã bỏ qua", color: "bg-muted text-muted-foreground" },
};

const SEVERITY_COLORS: Record<string, string> = {
  minor: "bg-blue-100 text-blue-700",
  major: "bg-amber-100 text-amber-700",
  critical: "bg-red-100 text-red-700",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Vừa xong";
  if (diffMins < 60) return `${diffMins} phút trước`;
  if (diffHours < 24) return `${diffHours} giờ trước`;
  if (diffDays < 7) return `${diffDays} ngày trước`;
  return date.toLocaleDateString("vi-VN");
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ErrorsPage() {
  const [errors, setErrors] = useState<ErrorEvent[]>([]);
  const [patterns, setPatterns] = useState<ErrorPattern[]>([]);
  const [catalog, setCatalog] = useState<PatternCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("errors");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: errorsData }, { data: patternsData }, { data: catalogData }] = await Promise.all([
          supabase.from("error_events").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
          supabase.from("error_patterns").select("*").eq("user_id", user.id).order("last_seen", { ascending: false }),
          supabase.from("pattern_catalog").select("*").order("pattern_type"),
        ]);

        setErrors(errorsData || []);
        setPatterns(patternsData || []);
        setCatalog(catalogData || []);
      } catch (e) {
        console.error("Failed to load errors:", e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const filteredErrors = errors.filter((e) => {
    if (filterStatus !== "all" && e.status !== filterStatus) return false;
    if (filterType !== "all" && e.error_type !== filterType) return false;
    return true;
  });

  const stats = {
    total: errors.length,
    open: errors.filter((e) => e.status === "open").length,
    in_makeup: errors.filter((e) => e.status === "in_makeup").length,
    mastered: errors.filter((e) => e.status === "mastered").length,
    thisWeek: errors.filter((e) => new Date(e.created_at) > new Date(Date.now() - 7 * 86400000)).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Sổ lỗi & Bài bù</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mọi lỗi khi nói đều được ghi lại → tự động tạo bài bù 5 bước → thành thạo mới dừng
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> {stats.total} lỗi tổng
          </Badge>
          <Badge variant="outline" className="gap-1">
            <AlertTriangle className="h-3 w-3" /> {stats.open} chưa sửa
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> {stats.in_makeup} đang bài bù
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CheckCircle className="h-3 w-3" /> {stats.mastered} thành thạo
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="errors">📝 Lỗi ({stats.total})</TabsTrigger>
          <TabsTrigger value="patterns">📊 Mẫu lỗi cá nhân ({patterns.length})</TabsTrigger>
          <TabsTrigger value="catalog">📚 Thư viện mẫu ({catalog.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="errors">
          <div className="flex flex-wrap gap-2 mb-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">Tất cả trạng thái</option>
              <option value="open">Chưa sửa</option>
              <option value="in_makeup">Đang bài bù</option>
              <option value="mastered">Đã thành thạo</option>
              <option value="dismissed">Đã bỏ qua</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
            >
              <option value="all">Tất cả loại</option>
              <option value="pronunciation">Phát âm</option>
              <option value="grammar">Ngữ pháp</option>
              <option value="vocabulary">Từ vựng</option>
              <option value="fluency">Trôi chảy</option>
              <option value="meaning">Ý nghĩa</option>
              <option value="vi_segment">Tiếng Việt</option>
              <option value="latency">Độ trễ</option>
            </select>
          </div>

          {filteredErrors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
                <h3 className="mt-4 font-semibold">Chưa có lỗi nào</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hãy nói nhiều hơn để hệ thống ghi nhận và giúp bạn sửa lỗi!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredErrors.map((error) => {
                const errorTypeInfo = ERROR_TYPE_LABELS[error.error_type] || { label: error.error_type, icon: AlertTriangle };
                const statusInfo = STATUS_LABELS[error.status] || { label: error.status, color: "bg-muted text-muted-foreground" };
                const ErrorIcon = errorTypeInfo.icon;

                return (
                  <Card key={error.id} className="transition-shadow hover:shadow-md">
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", SEVERITY_COLORS[error.severity] || "bg-muted")}>
                            <ErrorIcon className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-medium">{MODULE_LABELS[error.module] || error.module}</span>
                              <Badge variant="secondary">{errorTypeInfo.label}</Badge>
                              <Badge className={statusInfo.color}>{statusInfo.label}</Badge>
                              {error.lifeline_used && <Badge variant="outline">Phao cứu sinh</Badge>}
                              {error.vi_segments && error.vi_segments > 0 && (
                                <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                                  {error.vi_segments} đoạn VI
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {formatRelativeTime(error.created_at)} • {error.topic_id || "—"} • {error.layer || "—"}
                            </p>
                            {(error.expected || error.actual) && (
                              <div className="mt-2 text-sm">
                                {error.expected && (
                                  <p className="text-emerald-700"><strong>Đúng: </strong>{error.expected}</p>
                                )}
                                {error.actual && (
                                  <p className="text-red-700"><strong>Sai: </strong>{error.actual}</p>
                                )}
                                {error.user_transcript && (
                                  <p className="text-muted-foreground"><strong>Bạn nói: </strong>{error.user_transcript}</p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          {error.latency_ms && (
                            <span className="text-xs text-muted-foreground">
                              Latency: {error.latency_ms}ms
                            </span>
                          )}
                          {error.wpm && (
                            <span className="text-xs text-muted-foreground">
                              WPM: {error.wpm}
                            </span>
                          )}
                          <div className="flex gap-2">
                            {error.status === "open" && (
                              <Link href={`/errors/makeup/${error.id}`}>
                                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                                  <RotateCcw className="mr-1 h-3 w-3" /> Bài bù
                                </Button>
                              </Link>
                            )}
                            {error.status === "in_makeup" && (
                              <Link href={`/errors/makeup/${error.id}`}>
                                <Button size="sm" variant="outline">
                                  Tiếp tục bài bù
                                </Button>
                              </Link>
                            )}
                            {error.status === "mastered" && (
                              <Button size="sm" variant="ghost" disabled>
                                <CheckCircle className="mr-1 h-3 w-3" /> Đã xong
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="patterns">
          {patterns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 font-semibold">Chưa có mẫu lỗi nào</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hệ thống sẽ tự động phát hiện mẫu lỗi khi bạn nói đủ nhiều.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {patterns.map((pattern) => {
                const statusColors: Record<string, string> = {
                  active: "bg-red-100 text-red-700",
                  improving: "bg-amber-100 text-amber-700",
                  mastered: "bg-emerald-100 text-emerald-700",
                };
                const statusLabels: Record<string, string> = {
                  active: "Đang lặp lại",
                  improving: "Đang cải thiện",
                  mastered: "Đã thành thạo",
                };

                return (
                  <Card key={pattern.id}>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <AlertTriangle className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium">{pattern.pattern_key}</p>
                            <p className="text-sm text-muted-foreground">
                              {pattern.pattern_type} • {pattern.count} lần • {formatRelativeTime(pattern.last_seen)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <Badge className={statusColors[pattern.status] || "bg-muted text-muted-foreground"}>
                            {statusLabels[pattern.status] || pattern.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <TrendingDown className="h-3 w-3" /> Streak: {pattern.mastery_streak} ngày
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Level: {pattern.mastery_level}/5
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="catalog">
          <div className="space-y-3">
            {catalog.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-medium">{item.name_vi}</h4>
                          <Badge variant="secondary">{item.name_en}</Badge>
                          <Badge className={item.difficulty === "A1" ? "bg-blue-100 text-blue-700" : item.difficulty === "A2" ? "bg-amber-100 text-amber-700" : item.difficulty === "B1" ? "bg-emerald-100 text-emerald-700" : "bg-purple-100 text-purple-700"}>
                            {item.difficulty}
                          </Badge>
                          {item.is_vietnamese_specific && (
                            <Badge variant="outline" className="text-red-700 border-red-200 bg-red-50">
                              🇻🇳 Đặc thù người Việt
                            </Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description_vi}</p>
                        {item.examples.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {item.examples.slice(0, 2).map((ex, i) => (
                              <div key={i} className="text-xs font-mono">
                                <span className="text-emerald-700">✓ {ex.expected}</span>
                                <span className="text-red-700 ml-2">✗ {ex.wrong}</span>
                                <span className="text-muted-foreground ml-2">→ {ex.correction}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {item.tips_vi.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs font-semibold text-muted-foreground">Mẹo:</p>
                            <ul className="mt-1 space-y-0.5">
                              {item.tips_vi.slice(0, 3).map((tip, i) => (
                                <li key={i} className="text-xs text-muted-foreground flex items-center gap-1">
                                  <span>•</span> {tip}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}