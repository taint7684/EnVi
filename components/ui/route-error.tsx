"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, RefreshCw, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type RouteErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
};

export function RouteError({
  error,
  reset,
  title = "Không thể tải nội dung",
  message,
}: RouteErrorProps) {
  const router = useRouter();
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" />
      </div>
      <h3 className="mt-4 font-serif text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {message ?? error.message ?? "Đã xảy ra lỗi không mong muốn."}
      </p>
      <div className="mt-4 flex flex-col sm:flex-row gap-2 items-center justify-center">
        <Button
          onClick={() => {
            reset();
            router.refresh();
          }}
          variant="outline"
          size="sm"
        >
          <RotateCcw className="mr-1 h-4 w-4" />Thử lại
        </Button>
        <Button
          onClick={() => router.push("/today")}
          variant="secondary"
          size="sm"
        >
          <RefreshCw className="mr-1 h-4 w-4" />Về Hôm nay
        </Button>
      </div>
    </div>
  );
}
