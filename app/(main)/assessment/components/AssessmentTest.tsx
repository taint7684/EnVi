"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mic, Volume2, Check, X, Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Question = {
  id: string;
  section: string;
  skill: string;
  difficulty: string;
  question_type: "mcq" | "fill_blank" | "reorder" | "speaking_prompt";
  prompt_text: string;
  prompt_audio_url: string | null;
  options: { text: string; correct: boolean }[] | null;
  cefr_level: string;
  weight: number;
  order_index: number;
};

type AssessmentState = "intro" | "testing" | "speaking" | "results";

const SECTION_LABELS: Record<string, string> = {
  vocab: "Từ vựng",
  grammar: "Ngữ pháp",
  listening: "Nghe hiểu",
  speaking: "Nói",
};

const SECTION_ORDER = ["vocab", "grammar", "listening", "speaking"];

export function AssessmentTest({
  onComplete,
}: {
  onComplete?: (result: { level: string; score: number; sectionScores: Record<string, number> }) => void;
}) {
  const [state, setState] = useState<AssessmentState>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({});

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [speechTranscript, setSpeechTranscript] = useState("");

  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    setLoading(true);
    try {
      const res = await fetch("/api/assessment/questions");
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
      }
    } catch (e) {
      setError("Không thể tải câu hỏi");
    } finally {
      setLoading(false);
    }
  }

  async function startSession() {
    setLoading(true);
    try {
      const res = await fetch("/api/assessment/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (data.session) {
        setSessionId(data.session.id.toString());
        setState("testing");
        setCurrentIndex(0);
      }
    } catch (e) {
      setError("Không thể bắt đầu bài kiểm tra");
    } finally {
      setLoading(false);
    }
  }

  const currentQuestion = questions[currentIndex];
  const currentSection = currentQuestion?.section || "vocab";
  const sectionQuestions = questions.filter(q => q.section === currentSection);
  const sectionIndex = sectionQuestions.findIndex(q => q.id === currentQuestion?.id);
  const isLastInSection = sectionIndex === sectionQuestions.length - 1;
  const isLastOverall = currentIndex === questions.length - 1;

  function updateSectionProgress() {
    const completed = questions
      .filter((_, i) => i < currentIndex && answers[questions[i]?.id])
      .reduce((acc, q) => {
        acc[q.section] = (acc[q.section] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    setSectionProgress(completed);
  }

  async function submitAnswer(answerData: any) {
    if (!sessionId || !currentQuestion) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/assessment/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_answer",
          session_id: sessionId,
          answers: {
            question_id: currentQuestion.id,
            ...answerData,
          },
        }),
      });
      const data = await res.json();
      if (data.answer) {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: data.answer }));
        updateSectionProgress();
        
        if (isLastOverall) {
          completeSession();
        } else {
          setCurrentIndex(prev => prev + 1);
        }
      }
    } catch (e) {
      setError("Lỗi khi gửi câu trả lời");
    } finally {
      setLoading(false);
    }
  }

  async function completeSession() {
    if (!sessionId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/assessment/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", session_id: sessionId }),
      });
      const data = await res.json();
      if (data.final_level) {
        setState("results");
        onComplete?.({
          level: data.final_level,
          score: data.overall_score,
          sectionScores: data.section_scores,
        });
      }
    } catch (e) {
      setError("Lỗi khi hoàn thành bài kiểm tra");
    } finally {
      setLoading(false);
    }
  }

  function handleMCQAnswer(optionText: string) {
    submitAnswer({ user_answer: optionText });
  }

  function handleFillBlankAnswer(text: string) {
    submitAnswer({ user_answer: text });
  }

  function handleReorderAnswer(text: string) {
    submitAnswer({ user_answer: text });
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        // In real app, upload to Supabase Storage
        // For now, we'll simulate
        const formData = new FormData();
        formData.append("audio", blob, "recording.webm");
        
        submitAnswer({
          user_audio_path: "simulated/path",
          transcript: speechTranscript || "User speech transcript",
          latency_ms: 2000,
          vi_segments: 0,
          wpm: 120,
        });
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(t => t + 1);
      }, 1000);
    } catch (e) {
      setError("Không thể truy cập microphone");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setIsRecording(false);
    }
  }

  function playAudio(url: string | null) {
    if (!url) return;
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = new Audio(url);
    audioRef.current.play();
  }

  const sectionProgressPct = sectionQuestions.length > 0 
    ? ((sectionIndex + 1) / sectionQuestions.length) * 100 
    : 0;

  if (state === "intro") {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="text-center mb-8">
          <h1 className="font-serif text-3xl font-semibold text-foreground">Bài Kiểm Tra Định Vị</h1>
          <p className="mt-2 text-muted-foreground">
            30 câu hỏi thích ứng · 4 kỹ năng · Xác định trình độ CEFR (A1–B2)
          </p>
        </div>

        <div className="space-y-4">
          {SECTION_ORDER.map((section) => (
            <div key={section} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">
                  {section === "vocab" && <span className="text-2xl">📚</span>}
                  {section === "grammar" && <span className="text-2xl">📝</span>}
                  {section === "listening" && <span className="text-2xl">👂</span>}
                  {section === "speaking" && <span className="text-2xl">🎤</span>}
                </div>
                <div>
                  <p className="font-medium">{SECTION_LABELS[section]}</p>
                  <p className="text-sm text-muted-foreground">
                    {questions.filter(q => q.section === section).length} câu hỏi
                  </p>
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {sectionProgress[section] || 0}/{questions.filter(q => q.section === section).length}
              </span>
            </div>
          ))}
        </div>

        <Button className="mt-8 w-full size-14" onClick={startSession} disabled={loading}>
          {loading ? <Loader2 className="size-5 animate-spin" /> : <>Bắt đầu kiểm tra <ArrowRight className="size-5 ml-2" /></>}
        </Button>

        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      </div>
    );
  }

  if (state === "results") {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
            <span className="text-4xl font-bold text-primary">{/* Level will be passed via onComplete */}</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold">Hoàn thành bài kiểm tra!</h1>
          <p className="mt-1 text-muted-foreground">Trình độ ước tính của bạn</p>
        </div>
        <Button className="w-full" onClick={() => setState("intro")}>Làm lại</Button>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="mx-auto max-w-2xl py-4">
      {/* Progress Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Câu {currentIndex + 1}/{questions.length}</span>
          <span className="font-mono">{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {SECTION_LABELS[currentSection]} · Câu {sectionIndex + 1}/{sectionQuestions.length}
        </p>
      </div>

      {/* Question Card */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        {currentQuestion.prompt_audio_url && (
          <div className="mb-4 flex justify-center">
            <Button variant="outline" onClick={() => playAudio(currentQuestion.prompt_audio_url)}>
              <Volume2 className="size-4 mr-2" /> Nghe câu hỏi
            </Button>
          </div>
        )}

        <p className="text-lg font-medium text-foreground mb-6">{currentQuestion.prompt_text}</p>

        {currentQuestion.question_type === "mcq" && currentQuestion.options && (
          <div className="space-y-2">
            {currentQuestion.options.map((opt, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full justify-start"
                onClick={() => handleMCQAnswer(opt.text)}
              >
                {opt.text}
              </Button>
            ))}
          </div>
        )}

        {currentQuestion.question_type === "fill_blank" && (
          <input
            type="text"
            placeholder="Điền từ vào chỗ trống..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-center outline-none focus-visible:border-primary"
            onKeyDown={(e) => e.key === "Enter" && handleFillBlankAnswer(e.currentTarget.value)}
            autoFocus
          />
        )}

        {currentQuestion.question_type === "reorder" && (
          <input
            type="text"
            placeholder="Gõ lại câu theo đúng thứ tự..."
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg text-center outline-none focus-visible:border-primary"
            onKeyDown={(e) => e.key === "Enter" && handleReorderAnswer(e.currentTarget.value)}
            autoFocus
          />
        )}

        {currentQuestion.question_type === "speaking_prompt" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Nhấn nút dưới để ghi âm (tối đa 2 phút)
            </p>
            {!isRecording ? (
              <Button 
                className="w-full size-16 rounded-full bg-primary text-white" 
                onClick={startRecording}
              >
                <Mic className="size-8" /> Bắt đầu nói
              </Button>
            ) : (
              <Button 
                className="w-full size-16 rounded-full bg-red-500 text-white animate-pulse" 
                onClick={stopRecording}
              >
                <span className="text-2xl">⏹️</span> Dừng ({recordingTime}s)
              </Button>
            )}
            {speechTranscript && (
              <div className="rounded-xl bg-muted p-3 text-sm text-center">
                <p className="font-semibold text-muted-foreground">Transcript:</p>
                <p className="mt-1">{speechTranscript}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && <p className="mt-4 text-center text-red-600">{error}</p>}
    </div>
  );
}