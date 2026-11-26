"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Mic, Lightbulb, RotateCcw, Image, X, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speakEnglish, stopSpeaking } from "@/lib/speech";
import { evaluateSpeech } from "@/lib/speech-eval";
import { cn } from "@/lib/utils";
import { updateSpeakingProgress, updatePictureTalkProgress } from "@/app/actions/gamification";

export type PictureTalkImage = {
  id: string;
  url: string;
  prompt: string;
  vocab: string[];
  expectedStructures: string[];
};

export type PictureTalkConfig = {
  topicId: string;
  layer: "L1" | "L2" | "L3";
  round: 1 | 2;
  imageSetId: string;
  images: PictureTalkImage[];
};

export type PictureTalkState = "intro" | "describing" | "feedback" | "complete";

export function PictureTalkSession({
  config,
  onComplete,
}: {
  config: PictureTalkConfig;
  onComplete?: (metrics: {
    totalSpeakingSeconds: number;
    imagesDescribed: number;
    avgWpm: number;
    viSegments: number;
  }) => void;
}) {
  const [state, setState] = useState<PictureTalkState>("intro");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState<ReturnType<typeof evaluateSpeech> | null>(null);
  const [feedback, setFeedback] = useState<{
    praise: string;
    naturalAlternative: string;
    structuresUsed: string[];
    vocabUsed: string[];
    viSegments: number;
    wpm: number;
  } | null>(null);
  const [totalSpeakingSeconds, setTotalSpeakingSeconds] = useState(0);
  const [imagesDescribed, setImagesDescribed] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const startRef = useRef<number>(0);

  const currentImage = config.images[currentImageIndex];
  const isLastImage = currentImageIndex >= config.images.length - 1;

  useEffect(() => {
    if (state === "describing" && currentImage) {
      startRef.current = performance.now();
      const prompt = `Describe this image: ${currentImage.prompt}. Use these words: ${currentImage.vocab.join(", ")}`;
      speakEnglish(prompt);
    }
    return () => stopSpeaking();
  }, [state, currentImageIndex]);

  async function handleSpeech(spoken: string) {
    setTranscript(spoken);
    const latency = Math.round(performance.now() - startRef.current);
    
    const evalResult = evaluateSpeech("", spoken);
    setEvaluation(evalResult);

    const viSegments = (spoken.match(/\b[vV]ietnamese\b|\b[tT]iếng\s*[vV]iệt\b|[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g) || []).length;
    
    const words = spoken.trim().split(/\s+/).length;
    const wpm = Math.round((words / Math.max(1, latency / 60000)) * 60);

    setTotalSpeakingSeconds((prev) => prev + Math.ceil(latency / 1000));
    setImagesDescribed((prev) => prev + 1);

    // Layer-specific feedback
    const layerFeedback = getLayerFeedback(config.layer, spoken, currentImage, latency, viSegments, wpm);
    
    setFeedback(layerFeedback);

    setShowHint(false);
  }

  function getLayerFeedback(
    layer: "L1" | "L2" | "L3",
    spoken: string,
    image: PictureTalkImage | undefined,
    latency: number,
    viSegments: number,
    wpm: number
  ) {
    const baseFeedback = {
      structuresUsed: image?.expectedStructures.filter(s => spoken.toLowerCase().includes(s.toLowerCase())) || [],
      vocabUsed: image?.vocab.filter(v => spoken.toLowerCase().includes(v.toLowerCase())) || [],
      viSegments,
      wpm,
    };

    if (layer === "L1") {
      return {
        ...baseFeedback,
        praise: latency < 5000 ? "Phản xạ tốt! Mô tả hiện tại rất tự nhiên." : "Ổn, nói lại sẽ nhanh hơn.",
        naturalAlternative: `Thay vì "${spoken}", bạn có thể nói: "${image?.prompt.split(".")[0]}. ${image?.vocab.slice(0, 3).join(", ")}."`,
      };
    }

    if (layer === "L2") {
      const hasSequencing = image?.expectedStructures.some(s => 
        ["First", "Then", "After", "Finally", "Next", "Later"].some(w => s.includes(w))
      ) && image?.expectedStructures.some(s => spoken.toLowerCase().includes(s.toLowerCase().split(" ")[0]));
      
      return {
        ...baseFeedback,
        praise: hasSequencing 
          ? "Kể chuyện hay! Cấu trúc trình tự sự kiện rõ ràng."
          : "Cố gắng dùng First, Then, After that, Finally để kể chuyện mượt hơn.",
        naturalAlternative: hasSequencing 
          ? `"${spoken}" - Cấu trúc tốt!`
          : `Thử: "First, ${image?.prompt.split(".")[0].toLowerCase()}. Then, something happened. Finally, ${image?.vocab[0]}."`,
      };
    }

    // L3 - Opinion/Argument
    const hasOpinionMarkers = ["think", "believe", "opinion", "perspective", "view", "should", "must", "agree", "disagree"]
      .some(w => spoken.toLowerCase().includes(w));
    const hasReasoning = ["because", "since", "as", "reason", "therefore", "so", "thus"].some(w => spoken.toLowerCase().includes(w));
    
    return {
      ...baseFeedback,
      praise: hasOpinionMarkers && hasReasoning
        ? "Bày tỏ quan điểm rất thuyết phục! Có ý kiến và lý lẽ rõ ràng."
        : hasOpinionMarkers
          ? "Tốt! Đã có ý kiến cá nhân. Hãy thêm 'because' để giải thích lý do."
          : "Hãy bắt đầu bằng 'In my opinion...', 'I think...', 'From my perspective...'",
      naturalAlternative: hasOpinionMarkers && hasReasoning
        ? `"${spoken}" - Luận điểm chắc chắn!`
        : `Thử: "In my opinion, ${image?.prompt.split(".")[0].toLowerCase()} because ${image?.vocab[0]} is important. I believe..."`,
    };
  }

  function nextImage() {
    if (isLastImage) {
      setState("complete");
      onComplete?.({
        totalSpeakingSeconds,
        imagesDescribed,
        avgWpm: feedback?.wpm || 0,
        viSegments: feedback?.viSegments || 0,
      });

      // Award XP for speaking time and picture talk completion
      const minutes = Math.ceil(totalSpeakingSeconds / 60);
      if (minutes > 0) {
        updateSpeakingProgress(minutes, { module: "picture_talk", phrases: imagesDescribed });
      }
      updatePictureTalkProgress(imagesDescribed);
    } else {
      setCurrentImageIndex((i) => i + 1);
      setState("describing");
      setTranscript("");
      setEvaluation(null);
      setFeedback(null);
    }
  }

  function retryImage() {
    setTranscript("");
    setEvaluation(null);
    setFeedback(null);
    setState("describing");
  }

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  const progress = ((currentImageIndex + 1) / config.images.length) * 100;

  if (state === "complete") {
    return (
      <div className="mx-auto max-w-xl rounded-3xl border border-border bg-card p-10 text-center shadow-sm">
        <div className="text-4xl">🖼️</div>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-foreground">Picture Talk Complete!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You described {imagesDescribed} images in {formatTime(totalSpeakingSeconds)}.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl bg-emerald-50 p-3">
            <p className="text-2xl font-bold text-emerald-700">{imagesDescribed}</p>
            <p className="text-xs text-emerald-600">Images described</p>
          </div>
          <div className="rounded-xl bg-blue-50 p-3">
            <p className="text-2xl font-bold text-blue-700">{formatTime(totalSpeakingSeconds)}</p>
            <p className="text-xs text-blue-600">Total time</p>
          </div>
          <div className="rounded-xl bg-purple-50 p-3">
            <p className="text-2xl font-bold text-purple-700">{feedback?.wpm || 0}</p>
            <p className="text-xs text-purple-600">Avg WPM</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={() => { setCurrentImageIndex(0); setState("intro"); }}>Retry</Button>
          <Button variant="outline" onClick={() => onComplete?.({ totalSpeakingSeconds: 0, imagesDescribed: 0, avgWpm: 0, viSegments: 0 })}>Back to home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-48 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-amber-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">
            Image {currentImageIndex + 1}/{config.images.length}
          </span>
        </div>
        <span className="text-sm font-mono tabular-nums text-muted-foreground">
          {state === "describing" ? "Speaking..." : state === "feedback" ? "Done" : "Ready"}
        </span>
      </div>

      <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm relative">
        {currentImage && (
          <img
            src={currentImage.url}
            alt={currentImage.prompt}
            className="w-full h-48 object-cover rounded-xl"
          />
        )}
        {showHint && currentImage && (
          <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-3 shadow-lg text-sm">
            <p className="font-semibold text-foreground">Structure hint ({config.layer}):</p>
            <p className="mt-1 text-muted-foreground">{currentImage.expectedStructures.join(" | ")}</p>
            <p className="mt-1 font-semibold text-foreground">Vocabulary:</p>
            <p className="text-muted-foreground">{currentImage.vocab.join(", ")}</p>
          </div>
        )}
      </div>

      {state === "intro" && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-3xl">
              {config.layer === "L1" && "📸"}
              {config.layer === "L2" && "📖"}
              {config.layer === "L3" && "💭"}
            </span>
            <p className="font-semibold text-amber-700">Picture Talk - Layer {config.layer}</p>
          </div>
          <p className="mt-1 text-sm text-amber-600">
            {config.layer === "L1" 
              ? `Mô tả ${config.images.length} ảnh cho chủ đề "${config.topicId}". Dùng hiện tại đơn, thói quen, thích/không thích.`
              : config.layer === "L2"
              ? `Kể chuyện về ${config.images.length} ảnh. Dùng quá khứ, trình tự (First, Then, After, Finally), cảm xúc.`
              : `Bày tỏ quan điểm về ${config.images.length} ảnh. Dùng "I think...", "In my opinion...", "because...", so sánh, lập luận.`
            }
          </p>
          <div className="mt-3 p-3 rounded-lg bg-white/50 text-xs text-left text-amber-700">
            <p className="font-semibold mb-1">Cấu trúc gợi ý ({config.layer}):</p>
            <p>{config.layer === "L1" 
              ? "I usually... | Every day I... | I like to... | There is/are..."
              : config.layer === "L2"
              ? "First... Then... After that... Finally... It was... I felt... I remember..."
              : "In my opinion... I think... From my perspective... I believe... because... however..."}
            </p>
          </div>
          <Button className="mt-4 w-full size-12" onClick={() => setState("describing")}>
            <Image className="size-6" /> Bắt đầu ảnh 1
          </Button>
        </div>
      )}

      {state === "describing" && (
        <div className="mb-4 rounded-2xl border border-border bg-background p-4">
          <p className="text-center text-sm text-muted-foreground">
            {config.layer === "L1"
              ? "Nhìn ảnh → Nói ngay (không dịch trong đầu) → AI phản hồi"
              : config.layer === "L2"
              ? "Nhìn ảnh → Kể chuyện (trình tự sự kiện, cảm xúc) → AI phản hồi"
              : "Nhìn ảnh → Bày tỏ quan điểm (ý kiến + lý lẽ) → AI phản hồi"}
          </p>
          <div className="mt-4 flex justify-center">
            <Button
              className={cn("w-full size-20 rounded-full", isListening && "bg-primary text-white")}
              onClick={() => setIsListening(!isListening)}
            >
              <Mic className={cn("size-8", isListening && "animate-pulse")} />
            </Button>
          </div>
          <div className="mt-3 flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setShowHint(!showHint)}>
              <Lightbulb className="size-4" /> Structure hint
            </Button>
            <Button variant="ghost" size="sm" onClick={() => speakEnglish(currentImage?.prompt || "")}>
              <Zap className="size-4" /> Hear prompt
            </Button>
          </div>
        </div>
      )}

      {state === "feedback" && feedback && (
        <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <div className={cn(
            "rounded-xl p-4 text-center",
            feedback.viSegments > 0 ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"
          )}>
            <p className="flex items-center justify-center gap-2 font-semibold">
              {feedback.viSegments > 0 ? (
                <>
                  <X className="size-5" /> Detected {feedback.viSegments} Vietnamese segments — speak 100% English
                </>
              ) : (
                <>
                  <Check className="size-5" /> {feedback.praise}
                </>
              )}
            </p>
            {feedback.naturalAlternative && (
              <p className="mt-2 text-sm italic text-muted-foreground">{feedback.naturalAlternative}</p>
            )}
            {feedback.structuresUsed.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Cấu trúc đã dùng: {feedback.structuresUsed.join(", ")}
              </p>
            )}
            {feedback.vocabUsed.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Vocab used: {feedback.vocabUsed.join(", ")}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              WPM: {feedback.wpm} | Latency: {Math.round((performance.now() - startRef.current))}ms
            </p>
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <Button onClick={retryImage} variant="outline">
              <RotateCcw className="size-4" /> Retry this image
            </Button>
            <Button onClick={nextImage} size="lg">
              Next image <ArrowRight className="size-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}