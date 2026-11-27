"use client";

import { useEffect, useState } from "react";
import { SWRegistration } from "@/components/pwa/SWRegistration";
import { setupOnlineListener } from "@/lib/offline-queue";

export function PWAProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(() => typeof navigator !== "undefined" ? navigator.onLine : true);
  const [isInstallable, setIsInstallable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Setup background sync on online
    const cleanup = setupOnlineListener();

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      cleanup();
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstallable(false);
      setDeferredPrompt(null);
    }
  };

  return (
    <>
      {children}
      <SWRegistration />
      {!isOnline && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 animate-slide-down">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 shadow-lg flex items-center gap-2 text-amber-800 text-sm">
            <svg className="size-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Đang ngoại tuyến - Dữ liệu sẽ đồng bộ khi có mạng
          </div>
        </div>
      )}
      {isInstallable && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:bottom-4 md:w-80 z-50 animate-slide-up">
          <div className="rounded-xl border border-border bg-card p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <svg className="size-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Cài đặt EnVi</p>
                <p className="text-xs text-muted-foreground mt-0.5">Thêm vào màn hình chính để học offline</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={install}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground"
                >
                  Cài đặt
                </button>
                <button
                  onClick={() => setIsInstallable(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background"
                >
                  Sau
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}