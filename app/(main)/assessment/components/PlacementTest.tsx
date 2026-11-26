// Placement Test Component - Adaptive CEFR Assessment
"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Mic, Volume2, Check, Loader2, Brain, BarChart2, Flag } from "lucide-react";
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

type PlacementState = "intro" | "testing" | "speaking" | "results";
type Section = "vocab" | "grammar" | "listening" | "speaking";

const SECTION_LABELS: Record<Section, string> = {
  vocab: "Từ vựng",
  grammar: "Ngữ pháp",
  listening: "Nghe hiểu",
  speaking: "Nói",
};

const SECTION_ICONS: Record<Section, React.ReactNode> = {
  vocab: <span className="text-2xl">📚</span>,
  grammar: <span className="text-2xl">📝</span>,
  listening: <span className="text-2xl">👂</span>,
  speaking: <span className="text-2xl">🎤</span>,
};

const SECTION_ORDER: Section[] = ["vocab", "grammar", "listening", "speaking"];

interface PlacementTestProps {
  onComplete?: (result: { level: string; score: number; sectionScores: Record<string, number> }) => void;
}

export function PlacementTest({ onComplete }: PlacementTestProps) {
  const [state, setState] = useState<PlacementState>("intro");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLevel, setCurrentLevel] = useState<"A1" | "A2" | "B1" | "B2">("A2");
  const [currentSection, setCurrentSection] = useState<Section>("vocab");
  const [sectionProgress, setSectionProgress] = useState<Record<string, number>>({});
  const [sectionScores, setSectionScores] = useState<Record<string, number>>({});
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<Question[]>([]);

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
      const res = await fetch("/api/assessment/placement");
      const data = await res.json();
      if (data.questions) {
        setQuestions(data.questions);
        setAdaptiveQuestions(data.questions.filter((q: Question) => q.section === "vocab" && q.cefr_level === "A2").slice(0, 2));
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
      const res = await fetch("/api/assessment/placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (data.session) {
        setSessionId(data.session.id.toString());
        setState("testing");
        setCurrentIndex(0);
        setCurrentSection("vocab");
        setCurrentLevel("A2");
        setSectionScores({});
        // Load first adaptive questions
        loadAdaptiveQuestions("vocab", "A2");
      }
    } catch (e) {
      setError("Không thể bắt đầu bài kiểm tra");
    } finally {
      setLoading(false);
    }
  }

  function loadAdaptiveQuestions(section: Section, level: "A1" | "A2" | "B1" | "B2") {
    const sectionQuestions = questions.filter(q => q.section === section);
    const levels = ["A1", "A2", "B1", "B2"] as const;
    const idx = levels.indexOf(level);
    const targetLevels: ("A1" | "A2" | "B1" | "B2")[] = [level];
    if (idx > 0) targetLevels.push(levels[idx - 1]);
    if (idx < 3) targetLevels.push(levels[idx + 1]);
    
    const available = sectionQuestions.filter(q => targetLevels.includes(q.cefr_level as "A1" | "A2" | "B1" | "B2"));
    available.sort((a, b) => a.order_index - b.order_index);
    setAdaptiveQuestions(available.slice(0, 2));
  }

  const currentQuestion = adaptiveQuestions[0] || questions.find(q => q.section === currentSection && q.cefr_level === currentLevel);
  const sectionQuestions = questions.filter(q => q.section === currentSection);
  const sectionIndex = sectionQuestions.findIndex(q => q.id === currentQuestion?.id);
  const isLastInSection = sectionIndex === sectionQuestions.length - 1;
  const isLastOverall = currentSection === "speaking" && isLastInSection;

  function updateSectionProgress() {
    const completed = Object.keys(answers).length;
    setSectionProgress(prev => ({ ...prev, [currentSection]: completed }));
  }

  async function submitAnswer(answerData: any) {
    if (!sessionId || !currentQuestion) return;
    
    setLoading(true);
    try {
      const res = await fetch("/api/assessment/placement", {
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
        
        // Update level based on answer
        if (data.nextLevel) {
          setCurrentLevel(data.nextLevel);
        }
        if (data.sectionScores) {
          setSectionScores(data.sectionScores);
        }
        
        // Move to next question or section
        if (isLastOverall) {
          completeSession();
        } else if (isLastInSection) {
          // Move to next section
          const nextSectionIdx = SECTION_ORDER.indexOf(currentSection) + 1;
          if (nextSectionIdx < SECTION_ORDER.length) {
            const nextSection = SECTION_ORDER[nextSectionIdx];
            setCurrentSection(nextSection);
            setCurrentIndex(0);
            loadAdaptiveQuestions(nextSection, currentLevel);
          } else {
            completeSession();
          }
        } else {
          // Load next adaptive question
          loadAdaptiveQuestions(currentSection, currentLevel);
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
      const res = await fetch("/api/assessment/placement", {
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
        // Simulate STT - in real app, send to Whisper API
        const transcript = speechTranscript || "User speech transcript placeholder";
        
        submitAnswer({
          user_audio_path: "simulated/path",
          transcript,
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

  const overallProgress = ((SECTION_ORDER.indexOf(currentSection) * 100) / SECTION_ORDER.length) + 
    ((sectionIndex + 1) / sectionQuestions.length) * (100 / SECTION_ORDER.length);

  if (state === "intro") {
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
            <Brain className="size-8 text-primary" />
          </div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Bài Kiểm Tra Định Vị Thích Ứng</h1>
          <p className="mt-2 text-muted-foreground">
            AI điều chỉnh độ khó theo thời gian thực · 4 kỹ năng · Kết quả CEFR (A1–B2)
          </p>
        </div>

        <div className="space-y-3 mb-6">
          {SECTION_ORDER.map((section) => (
            <div key={section} className="rounded-xl border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-primary/10 p-3">{SECTION_ICONS[section]}</div>
                <div>
                  <p className="font-medium">{SECTION_LABELS[section]}</p>
                  <p className="text-sm text-muted-foreground">
                    {questions.filter(q => q.section === section).length} câu hỏi · Thích ứng A1→B2
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 rounded bg-muted">Mức {currentLevel}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-amber-100 p-2 mt-0.5">
              <Flag className="size-5 text-amber-700" />
            </div>
            <div className="text-sm text-amber-800">
              <p className="font-medium">Cách hoạt động thích ứng:</p>
              <ul className="mt-2 list-disc list-inside space-y-1">
                <li>Bắt đầu ở mức A2 (trung bình)</li>
                <li>Trả lời đúng → Tăng độ khó (A2→B1→B2)</li>
                <li>Trả lời sai → Giảm độ khó (B1→A2→A1)</li>
                <li>Mỗi kỹ năng được đánh giá riêng</li>
                <li>Kết quả: Trình độ CEFR chính xác</li>
              </ul>
            </div>
          </div>
        </div>

        <Button className="mt-6 w-full size-14" onClick={startSession} disabled={loading}>
          {loading ? <Loader2 className="size-5 animate-spin" /> : <>Bắt đầu định vị <ArrowRight className="size-5 ml-2" /></>}
        </Button>

        {error && <p className="mt-4 text-center text-red-600">{error}</p>}
      </div>
    );
  }

  if (state === "results") {
    const finalLevel = sectionScores ? Object.entries(sectionScores).reduce((a, b) => a[1] > b[1] ? a : b)[0] : "A2";
    return (
      <div className="mx-auto max-w-2xl py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center rounded-full bg-primary/10 p-4 mb-4">
            <span className="text-4xl font-bold text-primary">{finalLevel}</span>
          </div>
          <h1 className="font-serif text-2xl font-semibold">Hoàn thành bài kiểm tra!</h1>
          <p className="mt-1 text-muted-foreground">Trình độ CEFR ước tính của bạn</p>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          {SECTION_ORDER.map((section) => (
            <div key={section} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className="text-2xl">{SECTION_ICONS[section]}</div>
              <p className="font-medium">{SECTION_LABELS[section]}</p>
              <p className="text-3xl font-bold text-primary mt-1">
                {Math.round((sectionScores[section] || 0) * 100)}%
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border bg-card p-4 mb-6">
          <h3 className="font-semibold mb-3">Gợi ý lộ trình học:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {finalLevel === "A1" && (
              <>
                <li>• Tập trung từ vựng cơ bản 500 từ đầu tiên (Oxford 3000)</li>
                <li>• Luyện cấu trúc câu đơn giản: S + V + O, hiện tại đơn</li>
                <li>• Mỗi ngày 15 phút Shadowing + 10 phút Reflex</li>
              </>
            )}
            {finalLevel === "A2" && (
              <>
                <li>• Mở rộng vốn từ 1000-1500 từ (Oxford 3000)</li>
                <li>• Luyện các thì: quá khứ đơn, hiện tại tiếp diễn, tương lai gần</li>
                <li>• Picture Talk L1 + Speaking AI L1</li>
              </>
            )}
            {finalLevel === "B1" && (
              <>
                <li>• Từ vựng 2000+ từ, bắt đầu học collocations</li>
                <li>• Luyện kể chuyện (L2): quá khứ, hiện tại hoàn thành, điều kiện loại 2</li>
                <li>• Picture Talk L2 + Speaking AI L2</li>
              </>
            )}
            {finalLevel === "B2" && (
              <>
                <li>• Từ vựng 3000+ từ, học phrasal verbs, idioms</li>
                <li>• Luyện lập luận (L3): cấu trúc phức tạp, từ nối logic</li>
                <li>• Picture Talk L3 + Real World Tasks</li>
              </>
            )}
          </ul>
        </div>

        <div className="flex gap-3">
          <Button className="flex-1" onClick={() => { setState("intro"); setAnswers({}); setSessionId(null); }}>
            Làm lại
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => onComplete?.({ level: finalLevel, score: Object.values(sectionScores).reduce((a,b)=>a+b,0)/Object.keys(sectionScores).length, sectionScores })}>
            Vào lộ trình
          </Button>
        </div>
      </div>
    );
  }

  if (!currentQuestion) return null;

  return (
    <div className="mx-auto max-w-2xl py-4">
      {/* Progress Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>
            {SECTION_LABELS[currentSection]} · Câu {sectionIndex + 1}/{sectionQuestions.length}
          </span>
          <span className="font-mono">{Math.round(overallProgress)}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${overallProgress}%` }} />
        </div>
        <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>Mức độ khó hiện tại: <span className="font-bold text-primary">{currentLevel}</span></span>
          <span>Thích ứng: {sectionScores[currentSection] ? Math.round(sectionScores[currentSection] * 100) : 0}% đúng</span>
        </div>
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
              Nhấn nút dưới để ghi âm (tối đa 2 phút) · Mức {currentLevel}
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

        {/* Adaptive indicator */}
        <div className="mt-4 p-3 rounded-xl bg-muted/50 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            AI đang điều chỉnh: {currentLevel} → {sectionScores[currentSection] ? (sectionScores[currentSection] > 0.7 ? "Tăng" : sectionScores[currentSection] < 0.4 ? "Giảm" : "Giữ") : "Đang học"}
          </span>
          <BarChart2 className="size-4 text-muted-foreground" />
        </div>
      </div>

      {error && <p className="mt-4 text-center text-red-600">{error}</p>}
    </div>
  );
}