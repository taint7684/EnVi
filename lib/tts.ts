import { cacheTTS, getCachedTTS } from "@/lib/offline-queue";

const EDGE_TTS_VOICES = {
  en: ["en-US-AriaNeural", "en-US-GuyNeural", "en-US-JennyNeural", "en-GB-LibbyNeural", "en-GB-RyanNeural"],
  vi: ["vi-VN-HoaiMyNeural", "vi-VN-NamMinhNeural"],
};

interface TTSOptions {
  text: string;
  lang?: "en" | "vi";
  voice?: string;
  rate?: number;
  pitch?: number;
}

function generateCacheKey(options: TTSOptions): string {
  return `tts:${options.lang || "en"}:${options.voice || "default"}:${options.rate || 1}:${options.pitch || 1}:${options.text}`;
}

export async function speakText(options: TTSOptions): Promise<void> {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    return;
  }

  const cacheKey = generateCacheKey(options);
  
  // Try to get from cache first
  const cachedAudio = await getCachedTTS(cacheKey);
  if (cachedAudio) {
    const audio = new Audio(URL.createObjectURL(cachedAudio));
    audio.playbackRate = options.rate || 1;
    await audio.play();
    return;
  }

  // Fallback to browser speech synthesis
  return new Promise((resolve) => {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(options.text);
    utter.lang = options.lang === "vi" ? "vi-VN" : "en-US";
    utter.rate = options.rate || 1;
    utter.pitch = options.pitch || 1;
    
    if (options.voice) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find(v => v.name === options.voice);
      if (voice) utter.voice = voice;
    }

    utter.onend = () => resolve();
    utter.onerror = () => resolve();
    
    window.speechSynthesis.speak(utter);
  });
}

export async function fetchAndCacheTTS(options: TTSOptions): Promise<void> {
  const cacheKey = generateCacheKey(options);
  
  // Check cache first
  const cached = await getCachedTTS(cacheKey);
  if (cached) return;

  // In a real app, this would call an Edge TTS API
  // For now, we'll use browser synthesis and cache the result
  if (typeof window === "undefined" || !window.speechSynthesis) return;

  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const destination = audioContext.createMediaStreamDestination();
  
  const utter = new SpeechSynthesisUtterance(options.text);
  utter.lang = options.lang === "vi" ? "vi-VN" : "en-US";
  utter.rate = options.rate || 1;
  utter.pitch = options.pitch || 1;

  return new Promise((resolve) => {
    utter.onend = async () => {
      // Note: Capturing audio from speechSynthesis is not directly possible
      // In production, you'd use an actual TTS API
      resolve();
    };
    utter.onerror = () => resolve();
    window.speechSynthesis.speak(utter);
  });
}

export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (typeof window === "undefined") return [];
  return window.speechSynthesis.getVoices();
}

export function getEnglishVoices(): SpeechSynthesisVoice[] {
  return getAvailableVoices().filter(v => v.lang.startsWith("en"));
}

export function getVietnameseVoices(): SpeechSynthesisVoice[] {
  return getAvailableVoices().filter(v => v.lang.startsWith("vi"));
}

// Preload common TTS phrases for offline use
export async function preloadCommonPhrases(phrases: string[], lang: "en" | "vi" = "en"): Promise<void> {
  for (const phrase of phrases) {
    const cacheKey = generateCacheKey({ text: phrase, lang });
    const cached = await getCachedTTS(cacheKey);
    if (!cached) {
      // In production, fetch from TTS API and cache
      // For now, we'll just mark as needing preload
      console.log(`Would preload: ${phrase}`);
    }
  }
}