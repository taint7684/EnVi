"use client";

import { useEffect } from "react";
import { XCircle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
        <XCircle className="size-8 text-destructive" />
      </div>
      <h2 className="mt-4 font-serif text-2xl font-semibold">
        Ứng dụng gặp sự cố
      </h2>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        {error.message ?? "Đã xảy ra lỗi nghiêm trọng. Vui lòng tải lại trang."}
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Tải lại ứng dụng
      </button>
    </div>
  );
}