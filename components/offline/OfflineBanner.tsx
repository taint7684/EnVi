"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi, AlertTriangle, RefreshCw, CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getOfflineQueue, subscribeToQueue, isOnlineStatus, subscribeToOnlineStatus, syncQueue, formatAge } from "@/lib/offline/queue";

export function OfflineBanner() {
  const [queue, setQueue] = useState(() => getOfflineQueue());
  const [online, setOnline] = useState(isOnlineStatus());
  const [syncing, setSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{ synced: number; failed: number } | null>(null);

  useEffect(() => {
    const unsubscribeQueue = subscribeToQueue(setQueue);
    const unsubscribeOnline = subscribeToOnlineStatus(setOnline);
    return () => {
      unsubscribeQueue();
      unsubscribeOnline();
    };
  }, []);

  const handleSync = async () => {
    if (!online || syncing) return;
    setSyncing(true);
    try {
      const result = await syncQueue();
      setLastSyncResult(result);
      if (result.synced > 0) {
        setTimeout(() => setLastSyncResult(null), 3000);
      }
    } finally {
      setSyncing(false);
    }
  };

  if (online && queue.length === 0 && !lastSyncResult) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-slide-up",
        !online && "ring-2 ring-amber-500"
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-lg">
        {!online ? (
          <>
            <WifiOff className="flex-shrink-0 text-amber-500" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Đang ngoại tuyến</p>
              <p className="text-xs text-muted-foreground">
                Dữ liệu sẽ được lưu cục bộ và đồng bộ khi có mạng. Streak tính ×0.8 khi offline.
              </p>
            </div>
          </>
        ) : queue.length > 0 ? (
          <>
            <RefreshCw className={cn("flex-shrink-0 text-primary", syncing && "animate-spin")} size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{syncing ? "Đang đồng bộ..." : "Có dữ liệu chờ đồng bộ"}</p>
              <p className="text-xs text-muted-foreground">
                {queue.length} mục chờ • Cũ nhất: {formatAge(Math.max(...queue.map(q => Date.now() - q.timestamp), 0))}
              </p>
            </div>
            <Button 
              onClick={handleSync} 
              disabled={syncing}
              variant="outline" 
              size="sm"
            >
              <RotateCcw className="mr-1 h-3 w-3" /> Sync ngay
            </Button>
          </>
        ) : lastSyncResult ? (
          <>
            <CheckCircle className="flex-shrink-0 text-emerald-500" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Đã đồng bộ xong</p>
              <p className="text-xs text-muted-foreground">
                {lastSyncResult.synced} mục thành công{lastSyncResult.failed > 0 ? `, ${lastSyncResult.failed} thất bại` : ""}
              </p>
            </div>
          </>
        ) : (
          <>
            <Wifi className="flex-shrink-0 text-emerald-500" size={20} />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">Trực tuyến</p>
              <p className="text-xs text-muted-foreground">Kết nối đã khôi phục.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function OfflineStatusIndicator() {
  const [queue, setQueue] = useState(() => getOfflineQueue());
  const [online, setOnline] = useState(isOnlineStatus());

  useEffect(() => {
    const unsubscribeQueue = subscribeToQueue(setQueue);
    const unsubscribeOnline = subscribeToOnlineStatus(setOnline);
    return () => {
      unsubscribeQueue();
      unsubscribeOnline();
    };
  }, []);

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs">
      <span
        className={cn(
          "flex h-1.5 w-1.5 rounded-full",
          online ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
        )}
      />
      <span className={cn("font-medium", online ? "text-emerald-700" : "text-amber-700")}>
        {online ? "Trực tuyến" : "Ngoại tuyến"}
      </span>
      {queue.length > 0 && (
        <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-amber-700">
          <AlertTriangle className="size-3" />
          {queue.length} chờ sync
        </span>
      )}
    </div>
  );
}