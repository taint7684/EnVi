export function speakEnglish(text: string, audioUrl?: string | null): void {
  if (typeof window === "undefined") return;

  if (audioUrl) {
    const audio = new Audio(audioUrl);
    void audio.play().catch(() => speakFallback(text));
    return;
  }

  speakFallback(text);
}

function speakFallback(text: string): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function stopSpeaking(): void {
  if (typeof window !== "undefined" && "speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}