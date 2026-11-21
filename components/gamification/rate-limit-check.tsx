"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function RateLimitCheck() {
  const pathname = usePathname();

  useEffect(() => {
    // Rate limiting handled server-side (HTTP 429). No client-side fetch interception
    // to avoid blocking legitimate conversation flow after initial AI question.
  }, [pathname]);

  return null;
}
