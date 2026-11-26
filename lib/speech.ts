import { getVoiceForPhrase } from "@/lib/tts";

export function speakEnglish(text: string, audioUrl?: string | null, phraseId?: string): void {
  if (typeof window === "undefined") return;

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    void audio.play().catch(() => speakFallback(text, phraseId));
    return;
  }

  speakFallback(text, phraseId);
}

async function speakFallback(text: string, phraseId?: string): Promise<void> {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  
  // Use deterministic voice based on phrase ID for variety
  if (phraseId) {
    const voiceName = getVoiceForPhrase(phraseId, "en");
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find(v => v.name === voiceName);
    if (voice) utterance.voice = voice;
  }
  
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}