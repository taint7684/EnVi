"use client";

import { cn } from "@/lib/utils";

export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.HTMLAttributes<HTMLHRElement> & {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}) {
  return (
    <hr
      className={cn(
        "shrink-0 bg-border",
        orientation === "horizontal" ? "h-[1px] w-full" : "w-[1px] h-full",
        className
      )}
      aria-orientation={orientation}
      aria-hidden={decorative}
      {...props}
    />
  );
}