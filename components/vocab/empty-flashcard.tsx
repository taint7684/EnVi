"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Mic, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function EmptyFlashcard() {
  const router = useRouter();

  useEffect(() => {
    // Auto-refresh after 5 seconds to check for new cards
    const timer = setTimeout(() => router.refresh(), 5000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-green-100">
        <span className="text-3xl">🎉</span>
      </div>
      <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">
        Hôm nay bạn đã ôn hết thẻ!
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Xuất sắc! Quay lại sau để tiếp tục học từ mới.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Link
          href="/speaking"
          className="flex items-center justify-center gap-2 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <Mic className="size-5 text-primary" />
          <span className="font-medium">Luyện Speaking</span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          href="/reading"
          className="flex items-center justify-center gap-2 rounded-xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
        >
          <BookOpen className="size-5 text-primary" />
          <span className="font-medium">Đọc to</span>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Tự động làm mới sau 5 giây...
      </p>
    </div>
  );
}