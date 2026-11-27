"use client";

import { useMemo, useState } from "react";
import { Check, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { COLLOCATIONS } from "@/lib/collocations-data";

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr];
  let s = seed * 9301 + 49297;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    const temp = a[i];
    a[i] = a[j]!;
    a[j] = temp!;
  }
  return a;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function blankOut(example: string, phrase: string): { cloze: string; found: boolean } {
  const tokens = phrase.split(/\s+/);
  const first = escapeRe(tokens[0]!);
  const rest = tokens.slice(1).map(escapeRe).join("\\s+");
  const pattern = new RegExp(`\\b${first}(?:s|es|ed|ing)?(?:\\s+${rest})?\\b`, "i");
  if (pattern.test(example)) {
    return { cloze: example.replace(pattern, "_____"), found: true };
  }
  return { cloze: example, found: false };
}

export function CollocationsPractice() {
  const [seed, setSeed] = useState(1);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});

  const items = useMemo(() => seededShuffle(COLLOCATIONS, seed).slice(0, 10), [seed]);

  const correctCount = items.filter(
    (c, i) => checked[i] && norm(answers[i] ?? "") === norm(c.en),
  ).length;
  const answeredAll = items.every((_, i) => checked[i]);

  function newRound() {
    setSeed((s) => s + 1);
    setAnswers({});
    setChecked({});
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-serif text-lg font-semibold">Practice — Collocations</h3>
          <p className="text-sm text-muted-foreground">
            Điền cụm từ còn thiếu vào câu (hoặc gõ cụm từ theo nghĩa tiếng Việt).
          </p>
        </div>
        <Button variant="outline" onClick={newRound}>
          <RotateCcw className="size-4" />
          10 câu mới
        </Button>
      </div>

      <div className="space-y-4">
        {items.map((c, i) => {
          const { cloze, found } = blankOut(c.example, c.en);
          const chosen = answers[i] ?? "";
          const isChecked = checked[i];
          const correct = norm(chosen) === norm(c.en);
          return (
            <div key={`${c.en}-${i}`} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">
                Nghĩa: <span className="font-medium text-foreground">{c.vi}</span>
              </p>
              <p className="mt-2 text-[15px] leading-relaxed">
                {isChecked ? c.example : found ? cloze : `${cloze} (${c.vi})`}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  value={chosen}
                  onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                  disabled={isChecked}
                  placeholder={found ? "Điền cụm từ..." : `Gõ cụm từ tiếng Anh...`}
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-primary disabled:opacity-60"
                />
                {!isChecked && (
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={!chosen.trim()}
                    onClick={() => setChecked((c2) => ({ ...c2, [i]: true }))}
                  >
                    <Check className="size-4" />
                  </Button>
                )}
              </div>
              {isChecked ? (
                <p
                  className={cn(
                    "mt-2 text-xs font-medium",
                    correct ? "text-green-600" : "text-red-600",
                  )}
                >
                  {correct ? "Chính xác!" : `Đáp án: ${c.en}`}
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {answeredAll ? (
        <p className="rounded-xl bg-primary/5 p-4 text-center text-sm font-medium">
          Kết quả: {correctCount}/{items.length} câu đúng
        </p>
      ) : null}
    </div>
  );
}