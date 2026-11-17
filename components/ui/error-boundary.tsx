"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <h3 className="mt-4 font-serif text-lg font-semibold">
            Đã có lỗi xảy ra
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {this.state.error?.message ?? "Vui lòng thử lại."}
          </p>
          <Button
            onClick={this.handleReset}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RotateCcw className="mr-1 h-4 w-4" />
            Thử lại
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export function ErrorFallback({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <AlertTriangle className="size-7 text-destructive" />
      </div>
      <h3 className="mt-4 font-serif text-xl font-semibold">
        Không thể tải nội dung
      </h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {error.message ?? "Đã xảy ra lỗi không mong muốn. Vui lòng thử lại."}
      </p>
      <Button onClick={reset} variant="outline" size="sm" className="mt-4">
        <RotateCcw className="mr-1 h-4 w-4" />
        Tải lại
      </Button>
    </div>
  );
}