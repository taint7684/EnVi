"use client";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "outline" | "destructive";
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variant === "default" && "bg-primary text-primary-foreground hover:bg-primary/80",
        variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        variant === "outline" && "border border-border bg-transparent hover:bg-accent",
        variant === "destructive" && "bg-destructive text-destructive-foreground hover:bg-destructive/80",
        className
      )}
      {...props}
    />
  );
}