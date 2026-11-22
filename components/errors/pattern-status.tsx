"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type PatternStatusButtonProps = {
  userId: string;
  patternKey: string;
  status: string;
};

export function PatternStatusButton({
  userId,
  patternKey,
  status,
}: PatternStatusButtonProps) {
  const [pending, setPending] = useState(false);

  const nextStatus = (() => {
    switch (status) {
      case "new":
        return "practicing";
      case "practicing":
        return "mastered";
      default:
        return "dismissed";
    }
  })();

  async function handleClick() {
    setPending(true);
    try {
      const res = await fetch("/api/errors", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, patternKey, status: nextStatus }),
      });
      if (!res.ok) throw new Error("Cập nhật thất bại");
    } finally {
      setPending(false);
    }
  }

  const labels: Record<string, string> = {
    new: "Mới",
    practicing: "Đang luyện",
    mastered: "Đã thành thạo",
    dismissed: "Đã bỏ qua",
  };

  return (
    <Button
      onClick={handleClick}
      disabled={pending}
      size="sm"
      variant={status === "mastered" ? "default" : "outline"}
      className="text-xs px-2 py-1"
    >
      {pending ? "…" : labels[nextStatus] ?? nextStatus}
    </Button>
  );
}
