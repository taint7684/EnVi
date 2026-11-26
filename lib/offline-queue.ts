"use client";

import { useEffect, useState } from "react";

export interface QueuedRecording {
  id?: number;
  sessionId: string;
  turnIndex: number;
  audioBlob: Blob;
  transcript: string;
  latencyMs: number;
  metadata: Record<string, any>;
  timestamp: number;
}

const DB_NAME = "envi-offline";
const DB_VERSION = 1;
const STORE_NAME = "pending-recordings";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains(TTS_STORE)) {
        db.createObjectStore(TTS_STORE, { keyPath: "key" });
      }
    };
  });
}

export async function queueRecording(recording: Omit<QueuedRecording, "id" | "timestamp">): Promise<number> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  const recordingWithTimestamp = {
    ...recording,
    timestamp: Date.now(),
  };
  
  return new Promise((resolve, reject) => {
    const request = store.add(recordingWithTimestamp);
    request.onsuccess = () => resolve(request.result as number);
    request.onerror = () => reject(request.error);
  });
}

export async function getPendingRecordings(): Promise<QueuedRecording[]> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readonly");
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as QueuedRecording[]);
    request.onerror = () => reject(request.error);
  });
}

export async function removeRecording(id: number): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function clearAllRecordings(): Promise<void> {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, "readwrite");
  const store = tx.objectStore(STORE_NAME);
  
  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Background sync registration
export async function registerBackgroundSync(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("sync" in window.ServiceWorkerRegistration.prototype)) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  try {
    await (registration as any).sync.register("upload-recordings");
  } catch (error) {
    console.warn("Background sync registration failed:", error);
  }
}

// Check online status and trigger sync
export function setupOnlineListener(): () => void {
  if (typeof window === "undefined") return () => {};

  const handleOnline = async () => {
    await registerBackgroundSync();
  };

  window.addEventListener("online", handleOnline);
  return () => window.removeEventListener("online", handleOnline);
}

// TTS cache
const TTS_STORE = "tts-cache";

async function openTTSDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(TTS_STORE)) {
        db.createObjectStore(TTS_STORE, { keyPath: "key" });
      }
    };
  });
}

export async function cacheTTS(key: string, audioBlob: Blob): Promise<void> {
  const db = await openTTSDB();
  const tx = db.transaction(TTS_STORE, "readwrite");
  const store = tx.objectStore(TTS_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.put({ key, audioBlob, timestamp: Date.now() });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getCachedTTS(key: string): Promise<Blob | null> {
  const db = await openTTSDB();
  const tx = db.transaction(TTS_STORE, "readonly");
  const store = tx.objectStore(TTS_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result?.audioBlob || null);
    request.onerror = () => reject(request.error);
  });
}

export async function clearOldTTSCache(maxAgeMs = 7 * 24 * 60 * 60 * 1000): Promise<void> {
  const db = await openTTSDB();
  const tx = db.transaction(TTS_STORE, "readwrite");
  const store = tx.objectStore(TTS_STORE);
  
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const now = Date.now();
      const entries = request.result as { key: string; timestamp: number }[];
      entries.forEach((entry) => {
        if (now - entry.timestamp > maxAgeMs) {
          store.delete(entry.key);
        }
      });
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}