"use client";

import { useEffect, useState, useCallback } from "react";

export type OfflineQueueItem = {
  id: string;
  type: "speech_metric" | "phrase_review" | "progress_update" | "mirror_recording" | "real_world_task";
  payload: Record<string, unknown>;
  timestamp: number;
  retries: number;
};

const OFFLINE_QUEUE_KEY = "envi_offline_queue";
const MAX_RETRIES = 3;

let queue: OfflineQueueItem[] = [];
const isOnline = typeof navigator !== "undefined" ? navigator.onLine : true;
let syncInProgress = false;
let listeners: Array<(queue: OfflineQueueItem[]) => void> = [];

function loadQueue(): OfflineQueueItem[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveQueue(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    notifyListeners();
  } catch (e) {
    console.error("Failed to save offline queue:", e);
  }
}

function notifyListeners(): void {
  listeners.forEach((cb) => cb([...queue]));
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function getOfflineQueue(): OfflineQueueItem[] {
  if (queue.length === 0) queue = loadQueue();
  return [...queue];
}

export function subscribeToQueue(cb: (queue: OfflineQueueItem[]) => void): () => void {
  listeners.push(cb);
  return () => {
    listeners = listeners.filter((l) => l !== cb);
  };
}

export function isOnlineStatus(): boolean {
  return isOnline;
}

export function subscribeToOnlineStatus(cb: (online: boolean) => void): () => void {
  const handler = () => cb(isOnline);
  window.addEventListener("online", handler);
  window.addEventListener("offline", handler);
  return () => {
    window.removeEventListener("online", handler);
    window.removeEventListener("offline", handler);
  };
}

export function addToQueue(item: Omit<OfflineQueueItem, "id" | "timestamp" | "retries">): string {
  if (queue.length === 0) queue = loadQueue();
  
  const newItem: OfflineQueueItem = {
    ...item,
    id: generateId(),
    timestamp: Date.now(),
    retries: 0,
  };
  
  queue.push(newItem);
  saveQueue();
  return newItem.id;
}

export function removeFromQueue(id: string): void {
  queue = queue.filter((item) => item.id !== id);
  saveQueue();
}

export function clearQueue(): void {
  queue = [];
  saveQueue();
}

export async function syncQueue(): Promise<{ synced: number; failed: number }> {
  if (syncInProgress || !isOnline || queue.length === 0) {
    return { synced: 0, failed: 0 };
  }

  syncInProgress = true;
  let synced = 0;
  let failed = 0;

  const itemsToSync = [...queue];
  
  for (const item of itemsToSync) {
    if (!isOnline) break;

    try {
      await sendToServer(item);
      removeFromQueue(item.id);
      synced++;
    } catch (_error) {
      const updatedItem = queue.find((i) => i.id === item.id);
      if (updatedItem) {
        updatedItem.retries++;
        if (updatedItem.retries >= MAX_RETRIES) {
          console.error("Max retries reached for item:", item.id);
          removeFromQueue(item.id);
          failed++;
        } else {
          saveQueue();
        }
      }
    }
  }

  syncInProgress = false;
  return { synced, failed };
}

async function sendToServer(item: OfflineQueueItem): Promise<void> {
  const endpoints: Record<OfflineQueueItem["type"], string> = {
    speech_metric: "/api/speech-metrics",
    phrase_review: "/api/phrase-review",
    progress_update: "/api/gamification/profile",
    mirror_recording: "/api/mirror/recordings",
    real_world_task: "/api/real-world/tasks",
  };

  const endpoint = endpoints[item.type];
  if (!endpoint) throw new Error(`Unknown queue item type: ${item.type}`);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item.payload),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Unknown error" }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
}

export function getQueueStats(): { total: number; byType: Record<string, number>; oldestAge: number } {
  const q = getOfflineQueue();
  const byType: Record<string, number> = {};
  let oldest = 0;
  
  for (const item of q) {
    byType[item.type] = (byType[item.type] || 0) + 1;
    const age = Date.now() - item.timestamp;
    if (age > oldest) oldest = age;
  }

  return { total: q.length, byType, oldestAge: oldest };
}

export function formatAge(ms: number): string {
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3600000) return `${Math.round(ms / 60000)}m`;
  if (ms < 86400000) return `${Math.round(ms / 3600000)}h`;
  return `${Math.round(ms / 86400000)}d`;
}

export function useOfflineQueue() {
  const [queueItems, setQueueItems] = useState<OfflineQueueItem[]>(() => getOfflineQueue());
  const [online, setOnline] = useState(isOnlineStatus());

  useEffect(() => {
    const unsubscribeQueue = subscribeToQueue(setQueueItems);
    const unsubscribeOnline = subscribeToOnlineStatus(setOnline);
    return () => {
      unsubscribeQueue();
      unsubscribeOnline();
    };
  }, []);

  const addItem = useCallback((item: Omit<OfflineQueueItem, "id" | "timestamp" | "retries">) => {
    return addToQueue(item);
  }, []);

  const removeItem = useCallback((id: string) => {
    removeFromQueue(id);
  }, []);

  const triggerSync = useCallback(async () => {
    if (!online) return { synced: 0, failed: 0 };
    return await syncQueue();
  }, [online]);

  return { queue: queueItems, online, addItem, removeItem, triggerSync, stats: getQueueStats() };
}