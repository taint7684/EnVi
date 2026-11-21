"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp, TextCursor, X } from "lucide-react";

type MisspelledWord = {
  word: string;
  position: number;
  suggestions: string[];
};

type SpellCheckResult = {
  misspelled: MisspelledWord[];
  corrected_text: string;
  summary: string;
};

type Props = {
  text: string;
  disabled?: boolean;
  className?: string;
  onCorrectedText?: (text: string) => void;
};

export function SpellCheck({
  text,
  disabled = false,
  className,
  onCorrectedText,
}: Props) {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<SpellCheckResult | null>(null);
  const [highlighted, setHighlighted] = useState<MisspelledWord[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  async function runCheck() {
    if (!text.trim() || checking) return;
    setChecking(true);
    try {
      const res = await fetch("/api/spell-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || "Không thể kiểm tra chính tả.");
      setResult(data.result);
      setHighlighted(data.result.misspelled);
      setShowSuggestions(true);
      if (onCorrectedText) onCorrectedText(data.result.corrected_text);
    } catch (cause) {
      // Silent fail — spell check is optional enhancement.
    } finally {
      setChecking(false);
    }
  }

  useEffect(() => {
    if (text.trim().length > 0) {
      const timer = setTimeout(runCheck, 1500);
      return () => clearTimeout(timer);
    }
  }, [text, checking]);

  const misspelledSet = new Set(highlighted.map((w) => w.word));

  function getSuggestionFor(word: string): string[] {
    const found = highlighted.find((w) => w.word === word);
    return found ? found.suggestions : [];
  }

  function replaceWord(targetWord: string, suggestion: string) {
    if (!onCorrectedText) return;
    const regex = new RegExp(`\\b${escapeRe(targetWord)}\\b`, "g");
    onCorrectedText(text.replace(regex, suggestion));
  }

  function escapeRe(s: string): string {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  if (disabled) return null;

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <button
          type="button"
          onClick={runCheck}
          disabled={checking || !text.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 hover:border-primary/40"
        >
          {checking ? (
            <TextCursor className="size-3.5 animate-spin" />
          ) : (
            <TextCursor className="size-3.5" />
          )}
          {checking ? "Đang kiểm tra..." : "Kiểm tra chính tả"}
        </button>
        {result && showSuggestions && (
          <button
            type="button"
            onClick={() => setShowSuggestions(false)}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Đóng gợi ý"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {result && showSuggestions ? (
        <div className="rounded-lg border border-border bg-amber-50 p-3 text-sm">
          <p className="mb-2 font-semibold text-amber-800">
            {result.summary}
          </p>
          {highlighted.length > 0 ? (
            <div className="space-y-2">
              {highlighted.map((w, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2 text-xs text-amber-700"
                >
                  <span className="shrink-0 font-mono text-amber-800 underline">
                    &quot;{w.word}&quot;
                  </span>
                  <span className="text-amber-600">
                    Gợi ý: {w.suggestions.slice(0, 3).join(", ")}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      w.suggestions[0] && replaceWord(w.word, w.suggestions[0])
                    }
                    disabled={!w.suggestions[0]}
                    className="ml-auto text-amber-600 hover:text-amber-800 underline underline-offset-4"
                  >
                    Áp dụng
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-amber-600">Không tìm thấy lỗi chính tả.</p>
          )}
          <p className="mt-2 text-xs text-amber-600">
            Sửa văn bản bên trên hoặc nhấn &quot;Áp dụng&quot; để thay thế từ được chọn.
          </p>
        </div>
      ) : null}

      {!result && checking && (
        <p className="text-xs text-muted-foreground">Đang kiểm tra chính tả...</p>
      )}
    </div>
  );
}
