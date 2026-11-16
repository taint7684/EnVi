"use client";

import { useState, useCallback } from "react";
import { Volume2, RotateCcw, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecorder } from "@/hooks/use-recorder";

const READING_PASSAGES = [
  {
    id: "p1",
    title: "A Day in the Life",
    titleVi: "Một Ngày Trong Cuộc Sống",
    text: `My name is Sarah and I live in a small town called Brookfield. Every morning, I wake up at six o'clock and go for a jog in the park. The park is beautiful in the morning, with tall trees and colorful flowers. After my jog, I stop at a small café to get a cup of coffee. The café owner, Mr. Johnson, always greets me with a smile. I usually read the newspaper while I drink my coffee. Around eight o'clock, I head to work. I work at a local library as a librarian. My job involves organizing books, helping visitors find information, and sometimes reading stories to children. In the afternoon, I often take a short break to walk around the neighborhood. I enjoy meeting different people and hearing their stories. After work, I go home and prepare dinner. Sometimes I cook simple meals, but on weekends I like to try new recipes. I believe that reading and learning new things is important for everyone, regardless of age.`,
  },
  {
    id: "p2",
    title: "The Importance of Sleep",
    titleVi: "Tầm Quan Trọng Của Giấc Ngủ",
    text: `Sleep is one of the most important activities for human health. During sleep, the body repairs tissues, builds bone and muscle, and strengthens the immune system. The brain also processes information from the day, forming memories and solving problems. Scientists recommend that adults get between seven and nine hours of sleep each night. Children and teenagers need even more sleep because their bodies and brains are still developing. Unfortunately, many people do not get enough sleep due to work, stress, or electronic devices. Lack of sleep can lead to serious health problems such as obesity, diabetes, and heart disease. It also affects mood, concentration, and decision-making abilities. To improve sleep quality, experts suggest maintaining a regular sleep schedule, avoiding caffeine in the evening, and creating a dark, quiet bedroom environment. Regular exercise during the day can also help people fall asleep more easily at night.`,
  },
  {
    id: "p3",
    title: "Travel and Culture",
    titleVi: "Du Lịch và Văn Hóa",
    text: `Traveling to different countries is one of the best ways to learn about other cultures. When we visit a new place, we experience different foods, customs, and ways of life. For example, in Japan, people often remove their shoes before entering a home. In France, it is common to greet shopkeepers with a polite "Bonjour" before asking a question. In Thailand, people show respect by pressing their palms together in a gesture called "wai". These small cultural differences remind us that there is no single right way to live. Travel also teaches us about history and geography in a way that textbooks cannot. Standing in front of ancient ruins or walking through historic streets makes history feel real and immediate. Moreover, travel helps us develop empathy by showing us how other people live and what they value. Many travelers return home with a broader perspective and a greater appreciation for diversity.`,
  },
];

function speak(text: string) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  window.speechSynthesis.speak(utterance);
}

export function ReadingPractice() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  const recorder = useRecorder();
  const passage = READING_PASSAGES[currentIndex];

  const handlePlay = useCallback(() => {
    window.speechSynthesis.cancel();
    speak(passage.text);
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(passage.text);
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  }, [passage.text]);

  const handleRecord = useCallback(async () => {
    if (recorder.isRecording) {
      await recorder.stop();
      if (recorder.audioBlob) {
        const url = URL.createObjectURL(recorder.audioBlob);
        setRecordedUrl(url);
      }
    } else {
      await recorder.start();
    }
  }, [recorder]);

  const handleNext = () => {
    setCurrentIndex((i) => (i + 1) % READING_PASSAGES.length);
    setRecordedUrl(null);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold">{passage.title}</h3>
            <p className="text-sm text-muted-foreground">{passage.titleVi}</p>
          </div>
          <span className="text-sm text-muted-foreground">
            {currentIndex + 1}/{READING_PASSAGES.length}
          </span>
        </div>

        <div className="mb-6 rounded-lg bg-accent/50 p-4">
          <p className="text-sm leading-relaxed">{passage.text}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handlePlay} disabled={isPlaying}>
            {isPlaying ? (
              <RotateCcw className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="mr-1 h-4 w-4" />
            )}
            {isPlaying ? "Đang phát..." : "Nghe mẫu"}
          </Button>

          <Button
            variant={recorder.isRecording ? "destructive" : "default"}
            onClick={handleRecord}
          >
            {recorder.isRecording ? (
              <RotateCcw className="mr-1 h-4 w-4" />
            ) : (
              <Volume2 className="mr-1 h-4 w-4" />
            )}
            {recorder.isRecording ? "Dừng ghi âm" : "Ghi âm"}
          </Button>

          {recordedUrl && (
            <div className="flex items-center gap-2">
              <audio src={recordedUrl} controls className="h-8" />
            </div>
          )}

          <Button variant="outline" onClick={handleNext}>
            Đoạn tiếp theo
          </Button>
        </div>

        {recorder.error && (
          <p className="mt-2 text-sm text-destructive">{recorder.error}</p>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Đọc to đoạn văn trên và ghi âm giọng của bạn. Sau đó phát lại để so sánh với giọng mẫu.
      </p>
    </div>
  );
}