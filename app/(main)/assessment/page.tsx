"use client";

import { useState } from "react";
import { AssessmentForm } from "@/components/assessment/assessment-form";
import type { Milestone } from "@/lib/assessment";

const MILESTONES: { value: Milestone; label: string }[] = [
  { value: "baseline", label: "Đầu kỳ (Ngày 1)" },
  { value: "day30", label: "Ngày 30" },
  { value: "day60", label: "Ngày 60" },
  { value: "day90", label: "Ngày 90" },
];

export default function AssessmentPage() {
  const [milestone, setMilestone] = useState<Milestone>("baseline");
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <h1 className="font-serif text-2xl font-semibold">
        Đánh giá năng lực 4 kỹ năng
      </h1>
      <p className="text-muted-foreground">
        Dùng đề tương đương và cùng rubric cho Đầu kỳ / Ngày 30 / Ngày 60 / Ngày 90.
        Kết quả lưu trên trình duyệt của bạn, không gửi lên server.
      </p>
      <div className="flex items-center gap-3 w-64">
        <label className="text-sm font-medium text-foreground">Chọn mốc</label>
        <select
          value={milestone}
          onChange={(e) => setMilestone(e.target.value as Milestone)}
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        >
          {MILESTONES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
      </div>
      <AssessmentForm milestone={milestone} />
    </div>
  );
}
