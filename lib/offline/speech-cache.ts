"use client";

const SPEECH_CACHE_KEY = "envi_speech_cache";
const CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days
const CACHE_MAX_SIZE = 50 * 1024 * 1024; // 50MB

interface CachedSpeech {
  audioBlob: Blob;
  timestamp: number;
  text: string;
  voice: string;
}

function getCache(): Map<string, CachedSpeech> {
  if (typeof window === "undefined") return new Map();
  try {
    const stored = localStorage.getItem(SPEECH_CACHE_KEY);
    if (!stored) return new Map();
    const data = JSON.parse(stored);
    const cache = new Map<string, CachedSpeech>();
    for (const [key, value] of Object.entries(data)) {
      const v = value as CachedSpeech;
      cache.set(key, { ...v, audioBlob: base64ToBlob(v.audioBlob as unknown as string) });
    }
    return cache;
  } catch {
    return new Map();
  }
}

function base64ToBlob(base64: string): Blob {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: "audio/mpeg" });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function saveCache(cache: Map<string, CachedSpeech>): void {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, unknown> = {};
    for (const [key, value] of cache.entries()) {
      obj[key] = { ...value, audioBlob: value.audioBlob };
    }
    localStorage.setItem(SPEECH_CACHE_KEY, JSON.stringify(obj));
  } catch (e) {
    console.error("Failed to save speech cache:", e);
  }
}

function generateCacheKey(text: string, voice: string): string {
  return `${voice}:${text.slice(0, 100)}`;
}

export async function getCachedSpeech(text: string, voice: string): Promise<Blob | null> {
  const cache = getCache();
  const key = generateCacheKey(text, voice);
  const cached = cache.get(key);
  
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_MAX_AGE) {
    cache.delete(key);
    saveCache(cache);
    return null;
  }
  
  return cached.audioBlob;
}

export async function cacheSpeech(text: string, voice: string, audioBlob: Blob): Promise<void> {
  const cache = getCache();
  const key = generateCacheKey(text, voice);
  
  // Check size limit
  let totalSize = 0;
  for (const v of cache.values()) {
    totalSize += v.audioBlob.size;
  }
  
  if (totalSize + audioBlob.size > CACHE_MAX_SIZE) {
    // Remove oldest entries
    const entries = Array.from(cache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (const [k] of entries) {
      if (totalSize + audioBlob.size <= CACHE_MAX_SIZE) break;
      totalSize -= cache.get(k)!.audioBlob.size;
      cache.delete(k);
    }
  }
  
  const base64 = await blobToBase64(audioBlob);
  cache.set(key, {
    audioBlob: base64 as unknown as Blob, // Store as base64 string for JSON serialization
    timestamp: Date.now(),
    text,
    voice,
  });
  
  saveCache(cache);
}

export async function speakWithCache(text: string, voice: string): Promise<HTMLAudioElement | null> {
  const cached = await getCachedSpeech(text, voice);
  if (cached) {
    const url = URL.createObjectURL(cached);
    const audio = new Audio(url);
    audio.play().catch(() => URL.revokeObjectURL(url));
    return audio;
  }
  return null;
}

export function clearSpeechCache(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SPEECH_CACHE_KEY);
}

export function getSpeechCacheStats(): { count: number; totalSize: number; oldestAge: number } {
  const cache = getCache();
  let totalSize = 0;
  let oldest = 0;
  
  for (const v of cache.values()) {
    totalSize += v.audioBlob.size;
    const age = Date.now() - v.timestamp;
    if (age > oldest) oldest = age;
  }
  
  return { count: cache.size, totalSize, oldestAge: oldest };
}