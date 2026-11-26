"use client";

import { useEffect, useState } from "react";

export function SWRegistration() {
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").then((reg) => {
      setRegistration(reg);

      reg.addEventListener("updatefound", () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateAvailable(true);
            }
          });
        }
      });
    });

    let refreshing = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  const update = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  };

  const dismissUpdate = () => {
    setUpdateAvailable(false);
  };

  if (!updateAvailable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
      <div className="rounded-xl border border-border bg-card p-4 shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <svg className="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="font-medium text-sm">Có phiên bản mới</p>
            <p className="text-xs text-muted-foreground mt-0.5">Làm mới để cập nhật ứng dụng</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={update}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground"
            >
              Cập nhật
            </button>
            <button
              onClick={dismissUpdate}
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background"
            >
              Sau
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}