export function playWordAudio(word: {
  audio_url: string | null;
  lemma: string;
}) {
  if (word.audio_url) {
    const audio = new Audio(word.audio_url);
    void audio.play().catch(() => speak(word.lemma));
    return;
  }

  speak(word.lemma);
}

function speak(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}