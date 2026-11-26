// VI→EN Speaking AI Lifeline Component
// Helps users translate Vietnamese thoughts to English during speaking practice
"use client";

import { useState, useCallback } from "react";
import { Brain, ArrowRight, Copy, Check, MessageSquare, X, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type VILifelineState = "idle" | "translating" | "result" | "error";

interface VILifelineProps {
  onTranslationReady?: (english: string, vietnamese: string) => void;
  maxUses?: number;
  usedCount?: number;
  topicContext?: string;
  layer?: "L1" | "L2" | "L3";
}

export function VISpeakingLifeline({
  onTranslationReady,
  maxUses = 3,
  usedCount = 0,
  topicContext = "conversation",
  layer = "L1",
}: VILifelineProps) {
  const [state, setState] = useState<VILifelineState>("idle");
  const [vietnameseInput, setVietnameseInput] = useState("");
  const [englishResult, setEnglishResult] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const remainingUses = maxUses - usedCount;
  const canUse = remainingUses > 0;

  const translate = useCallback(async () => {
    if (!vietnameseInput.trim() || !canUse) return;

    setState("translating");
    
    try {
      const response = await fetch("/api/ai/vi-to-en", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vietnamese: vietnameseInput,
          topicContext,
          layer,
        }),
      });

      const data = await response.json();
      
      if (data.english) {
        setEnglishResult(data.english);
        setSuggestions(data.suggestions || []);
        setState("result");
        onTranslationReady?.(data.english, vietnameseInput);
      } else {
        throw new Error(data.error || "Translation failed");
      }
    } catch (err) {
      console.error("VI→EN translation error:", err);
      setState("error");
    }
  }, [vietnameseInput, canUse, topicContext, layer, onTranslationReady]);

  const copyResult = () => {
    if (englishResult) {
      navigator.clipboard.writeText(englishResult);
    }
  };

  const reset = () => {
    setVietnameseInput("");
    setEnglishResult("");
    setSuggestions([]);
    setState("idle");
  };

  const layerGuidance = {
    L1: "Dùng hiện tại đơn, câu đơn giản: I like..., I usually..., There is...",
    L2: "D용 quá khứ, kể chuyện: First..., Then..., I felt..., It was...",
    L3: "Dùng ý kiến, lập luận: I think..., In my opinion..., because..., however...",
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-purple-100 p-2">
            <Brain className="size-5 text-purple-700" />
          </div>
          <div>
            <p className="font-medium text-foreground">VI→EN Lifeline (Cửu sinh)</p>
            <p className="text-xs text-muted-foreground">
              {canUse ? `Còn ${remainingUses}/${maxUses} lần` : "Đã hết lượt dùng"}
            </p>
          </div>
        </div>
        {state === "result" && (
          <Button variant="ghost" size="icon" onClick={reset}>
            <X className="size-4" />
          </Button>
        )}
      </div>

      {state === "idle" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Gõ tiếng Việt → AI dịch sang tiếng Anh tự nhiên cho {layer}
          </p>
          <textarea
            value={vietnameseInput}
            onChange={(e) => setVietnameseInput(e.target.value)}
            placeholder={`Ví dụ: "${layer === "L1" ? "Tôi thích đọc sách vào buổi tối" : layer === "L2" ? "Hôm qua tôi đi dạo công viên và gặp một người bạn cũ" : "Tôi nghĩ việc làm từ xa tốt hơn vì linh hoạt hơn"}"`}
            rows={2}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary resize-none"
            disabled={!canUse}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{layerGuidance[layer]}</p>
            <Button 
              onClick={translate} 
              disabled={!vietnameseInput.trim() || !canUse}
              className="size-10"
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
          {!canUse && (
            <p className="text-xs text-amber-600">Đã dùng hết 3 lượt cứu cánh cho phiên này</p>
          )}
        </div>
      )}

      {state === "translating" && (
        <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
          <span>Đang dịch sang tiếng Anh...</span>
        </div>
      )}

      {state === "result" && (
        <div className="space-y-3 animate-fade-in">
          <div className="rounded-xl bg-green-50 p-3 border border-green-100">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-green-700">Tiếng Anh tự nhiên:</p>
              <Button variant="ghost" size="icon" onClick={copyResult} className="text-green-600">
                <Copy className="size-4" />
              </Button>
            </div>
            <p className="text-base font-medium text-green-800 break-all">{englishResult}</p>
          </div>

          {suggestions.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Cách nói khác (paraphrase):</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((s, i) => (
                  <Button
                    key={i}
                    variant="outline"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(s)}
                    className="text-left min-w-0 flex-1"
                  >
                    {s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>
              <RotateCcw className="size-4 mr-1" /> Dịch câu khác
            </Button>
            <Button onClick={() => {
              onTranslationReady?.(englishResult, vietnameseInput);
              reset();
            }}>
              <MessageSquare className="size-4 mr-1" /> Dùng câu này
            </Button>
          </div>
        </div>
      )}

      {state === "error" && (
        <div className="rounded-xl bg-red-50 p-3 border border-red-100 flex items-center justify-between">
          <p className="text-sm text-red-700">Không thể dịch lúc này. Thử lại sau.</p>
          <Button variant="outline" size="sm" onClick={reset}>Thử lại</Button>
        </div>
      )}
    </div>
  );
}

// Hook for using VI→EN lifeline in other components
export function useVILifeline() {
  const [translation, setTranslation] = useState<{ english: string; vietnamese: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const translate = async (vietnamese: string, topicContext: string, layer: "L1" | "L2" | "L3") => {
    setIsTranslating(true);
    try {
      const response = await fetch("/api/ai/vi-to-en", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vietnamese, topicContext, layer }),
      });
      const data = await response.json();
      if (data.english) {
        setTranslation({ english: data.english, vietnamese });
        return data;
      }
      throw new Error(data.error || "Translation failed");
    } catch (err) {
      console.error(err);
      return null;
    } finally {
      setIsTranslating(false);
    }
  };

  return { translation, isTranslating, translate, clear: () => setTranslation(null) };
}