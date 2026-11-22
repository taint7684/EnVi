import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getAssessmentResults } from "@/lib/assessment-db";
import { summarizeProgress } from "@/lib/progress";

export const metadata = { title: "Tiến bộ — EnVi" };

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("vi-VN");
  } catch {
    return iso;
  }
}

export default async function ProgressPage() {
  const rows = await getAssessmentResults();
  const summary = summarizeProgress(rows);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-semibold text-foreground">Tiến bộ</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          So sánh năng lực Trước – Sau qua các mốc đánh giá.
        </p>
      </div>

      {summary.baseline && summary.latest ? (
        <Card>
          <CardHeader>
            <CardTitle>Trước – Sau</CardTitle>
            <CardDescription>
              {summary.hasComparison
                ? "Cùng bộ đề và rubric, so sánh đầu kỳ với mốc mới nhất."
                : "Bạn đã có đánh giá đầu kỳ. Làm thêm mốc Ngày 30 để thấy so sánh."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border p-4">
                <div className="text-xs uppercase text-muted-foreground">Đầu kỳ</div>
                <div className="mt-1 text-2xl font-bold">{summary.baseline.totalPercent}%</div>
                <div className="text-sm text-muted-foreground">
                  {summary.baseline.estimatedLevel} · {fmtDate(summary.baseline.date)}
                </div>
              </div>
              <div className="rounded-xl border p-4 bg-primary/5">
                <div className="text-xs uppercase text-muted-foreground">Mới nhất</div>
                <div className="mt-1 text-2xl font-bold">{summary.latest.totalPercent}%</div>
                <div className="text-sm text-muted-foreground">
                  {summary.latest.estimatedLevel} · {fmtDate(summary.latest.date)}
                </div>
              </div>
            </div>
            {summary.deltaTotal != null && summary.hasComparison && (
              <p className="mt-4 text-sm font-medium text-primary">
                {summary.deltaTotal >= 0 ? "+" : ""}
                {summary.deltaTotal}% so với đầu kỳ
              </p>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Chưa có đánh giá đầu kỳ.{" "}
            <Link href="/assessment" className="text-primary underline">
              Làm đánh giá Ngày 1
            </Link>{" "}
            để bắt đầu theo dõi tiến bộ.
          </CardContent>
        </Card>
      )}

      {summary.history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Lịch sử đánh giá</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {summary.history.map((h) => (
              <div
                key={h.milestone}
                className="flex items-center justify-between rounded-lg border px-4 py-2 text-sm"
              >
                <span className="font-medium">{h.label}</span>
                <span className="text-muted-foreground">
                  {h.totalPercent}% · {h.estimatedLevel} · {fmtDate(h.date)}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Button asChild>
          <Link href="/assessment">Làm đánh giá mốc mới</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/roadmap">Xem lộ trình 90 ngày</Link>
        </Button>
      </div>
    </div>
  );
}