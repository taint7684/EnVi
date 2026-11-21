"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ErrorEntry = {
  id: string;
  source: "Writing" | "Speaking" | "Reflex";
  original: string;
  correction: string;
  reason: string;
  category: string;
  date: string;
  status: "pending" | "reviewed" | "dismissed";
};

function dateAgo(iso: string | null): string {
  if (!iso) return "Không rõ";
  const d = new Date(iso);
  const now = new Date();
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days === 0) return "Hôm nay";
  if (days === 1) return "Hôm qua";
  if (days < 7) return `${days} ngày trước`;
  return d.toLocaleDateString("vi-VN");
}

export default function ErrorLogPage() {
  const [errors, setErrors] = useState<ErrorEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch real errors from writing_drafts where feedback_json exists
    const fetchErrors = async () => {
      try {
        const res = await fetch("/api/error-log");
        if (res.ok) {
          const data = await res.json();
          setErrors(data.errors || []);
        } else {
          setErrors([]);
        }
      } catch {
        setErrors([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchErrors();
  }, []);

  const pendingCount = errors.filter((e) => e.status === "pending").length;

  const handleMarkReviewed = (id: string) => {
    setErrors((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "reviewed" as const } : e,
      ),
    );
    void fetch("/api/error-log/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  const handleDismiss = (id: string) => {
    setErrors((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, status: "dismissed" as const } : e,
      ),
    );
    void fetch("/api/error-log/dismiss", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => {});
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl py-10 text-center">
        <p className="text-muted-foreground">Đang tải sổ tay lỗi...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Sổ tay lỗi</h1>
        <Link href="/makeup-lesson">
          <Button variant="outline" size="sm">
            Xem bài bù hôm qua
          </Button>
        </Link>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm">Tất cả</Button>
          <Button variant="outline" size="sm">Ngữ pháp</Button>
          <Button variant="outline" size="sm">Từ vựng</Button>
          <Button variant="outline" size="sm">Phát âm</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lỗi cần ôn ({pendingCount})</CardTitle>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Chưa có lỗi nào được ghi nhận.</p>
              <p className="mt-2 text-xs">
                Lỗi sẽ xuất hiện sau khi bạn hoàn thành bài viết, luyện Speaking hoặc Reflex.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {errors.map((e) => (
                <div
                  key={e.id}
                  className={`p-4 border-b border-border transition-colors ${
                    e.status === "dismissed" ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-primary/10 text-primary">
                        {e.source}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        {e.category}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {dateAgo(e.date)}
                      </span>
                    </div>
                    <span className={`text-xs font-medium ${
                      e.status === "pending"
                        ? "text-amber-600"
                        : e.status === "reviewed"
                        ? "text-green-600"
                        : "text-muted-foreground"
                    }`}>
                      {e.status === "pending" ? "Chưa ôn" : e.status === "reviewed" ? "Đã ôn" : "Đã bỏ"}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-amber-900">{e.original}</p>
                      <p className="text-xs text-muted-foreground">❌ Sai</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-800">{e.correction}</p>
                      <p className="text-xs text-muted-foreground">✅ Đúng</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{e.reason}</p>
                  <div className="flex gap-2 mt-3">
                    {e.status === "pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkReviewed(e.id)}
                      >
                        Đánh dấu đã ôn
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(e.id)}
                    >
                      Bỏ nhận xét AI
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
        <p className="text-sm text-muted-foreground">
          Lỗi lặp sẽ được đưa vào bài bù ngày sau. Cuối tuần có bài ôn tổng hợp.
        </p>
      </div>
    </div>
  );
}
