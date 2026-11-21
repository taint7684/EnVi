"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Mic, MicOff, Clock, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SELF_TALK_PROMPTS = [
  "Describe your typical workday as a business analyst. What do you do from morning to evening?",
  "Tell me about a challenging project you worked on recently. What made it difficult?",
  "How do you usually communicate with your team when working remotely?",
  "Describe a database migration you've handled. What steps did you take?",
  "What are your career goals for the next 12 months?",
];

export default function SelfTalkPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [promptIndex, setPromptIndex] = useState(0);
  const [notes, setNotes] = useState("");
  const [sessionComplete, setSessionComplete] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const currentPrompt = SELF_TALK_PROMPTS[promptIndex];

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          setSessionComplete(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimeLeft(300);
    setSessionComplete(false);
  };

  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
        recorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
          const audioUrl = URL.createObjectURL(audioBlob);
          console.log("Self-talk recording saved:", audioUrl);
          stream.getTracks().forEach((t) => t.stop());
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
        startTimer();
      } catch (err) {
        console.error("Mic access error:", err);
      }
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">Self-talk hàng ngày</h1>
        <Button variant="outline" size="sm" onClick={() => setPromptIndex((i) => (i + 1) % SELF_TALK_PROMPTS.length)}>
          Đề khác
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Thời gian: {formatTime(timeLeft)}</CardTitle>
          <CardDescription>
            Mặc định 5 phút. Nói trọn ý, không dừng giữa câu.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-semibold uppercase text-muted-foreground mb-2">
              Đề nói hôm nay
            </p>
            <p className="text-lg font-serif text-foreground">{currentPrompt}</p>
          </div>

          <div className="flex items-center justify-between gap-3">
            <Button
              onClick={toggleRecording}
              className={`flex-1 h-12 rounded-full px-6 ${
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              {isRecording ? <MicOff className="size-5 mr-2" /> : <Mic className="size-5 mr-2" />}
              {isRecording ? "Dừng thu âm" : "Bắt đầu nói"}
            </Button>
            <Button variant="outline" onClick={resetTimer} disabled={timeLeft >= 300 && !isRecording}>
              <Clock className="size-4 mr-2" /> Đặt lại đồng hồ
            </Button>
          </div>

          {sessionComplete && (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <p className="text-sm font-medium text-green-800">
                Buổi nói xong! Hãy ghi lại kết quả dưới đây.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border p-4">
            <label className="block text-xs font-semibold text-muted-foreground mb-2">
              Ghi chú buổi nói (tùy chọn)
            </label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Một ý đã nói rõ, một chỗ còn bí, một cụm muốn luyện..."
              rows={3}
              className="w-full"
            />
          </div>

          {!sessionComplete && timeLeft < 300 && (
            <Button
              onClick={() => {
                setSessionComplete(true);
                if (timerRef.current) clearInterval(timerRef.current);
              }}
              className="w-full"
            >
              <Send className="size-4 mr-2" /> Kết thúc buổi nói sớm
            </Button>
          )}

          {sessionComplete && notes && (
            <Button variant="outline" onClick={() => setNotes("")} className="w-full">
              Lưu ghi chú
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground text-center">
        Mẹo: Trong khi nói, đừng dịch sang tiếng Việt. Nói trực tiếp bằng tiếng Anh,
        dù sai cú pháp cũng hơn không nói.
      </div>
    </div>
  );
}
