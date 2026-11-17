"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const AI_RATE_LIMIT_KEY = "envi_ai_last_request";
const RATE_LIMIT_MS = 3000;

export function RateLimitCheck() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const checkRateLimit = () => {
      const lastRequest = localStorage.getItem(AI_RATE_LIMIT_KEY);
      if (!lastRequest) return;

      const timeSinceLastRequest = Date.now() - parseInt(lastRequest, 10);
      if (timeSinceLastRequest < RATE_LIMIT_MS) {
        toast.warning("Từ từ thôi bạn ơi! ⏳", {
          description: "Hãy đợi một chút trước khi gửi tiếp.",
        });
        return false;
      }
      return true;
    };

    // Monkey-patch fetch to intercept AI API calls
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const [url, options] = args;
      const urlString = typeof url === "string" ? url : url.toString();

      // Check if this is an AI API call
      if (
        urlString.includes("/api/ai/") ||
        urlString.includes("/api/assistant") ||
        urlString.includes("/api/stt")
      ) {
        if (!checkRateLimit()) {
          throw new Error("Rate limit exceeded");
        }

        // Update last request time
        localStorage.setItem(AI_RATE_LIMIT_KEY, Date.now().toString());
      }

      return originalFetch(...args);
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [pathname, router]);

  return null;
}