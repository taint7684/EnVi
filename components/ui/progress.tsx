"use client";

import { cn } from "@/lib/utils";

export function Progress({
  className,
  value,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
}) {
  return (
    <div
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
        className
      )}
    >
      <div
        className="h-full bg-primary transition-all duration-300 ease-out"
        style={{ width: `${Math.min(100, Math.max(0, value ?? 0))}%` }}
        {...props}
      />
    </div>
  );
}