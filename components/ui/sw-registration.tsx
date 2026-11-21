"use client";

import { useEffect } from "react";

export function SWRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          // Service worker registered successfully
        })
        .catch(() => {
          // Service worker registration failed - app still works offline-limited
        });
    }
  }, []);

  return null;
}
