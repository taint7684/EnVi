"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRecorder } from "@/hooks/use-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { saveDrill } from "@/lib/drills/server";
import type { FluencyPrompt } from "@/lib/drills/content";
import type { DrillKind, DrillRound, DrillSummary } from "@/lib/drills/schema";
import { DRILL_LABEL } from "@/lib/drills/schema";

const KINDS: DrillKind[] = ["one_minute", "quick_fire", "picture", "eli5", "story_chain", "four_three_two"];

const TARGET_ROUNDS: Record<DrillKind, number> = {
  one_minute: 1,
  quick_fire: 1,
  picture: 1,
  eli5: 1,
  story_chain: 1,
  four_three_two: 3,
};

async function transcribe(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "drill.webm");
  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) return "";
  const data = (await res.json()) as { text?: string; duration_ms?: number };
  return data.text ?? "";
}

function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

export function DrillPlayer({ prompts }: { prompts: FluencyPrompt[] }) {
  const recorder = useRecorder();
  const { speak } = useSpeechSynthesis();

  const [kind, setKind] = useState<DrillKind>("one_minute");
  const [rounds, setRounds] = useState<DrillRound[]>([]);
  const [promptIndex, setPromptIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<DrillSummary | null>(null);
  const startRef = useRef<number>(0);

  const byKind = useMemo(() => {
    const map: Record<string, FluencyPrompt[]> = {};
    for (const p of prompts) (map[p.kind] ??= []).push(p);
    return map;
  }, [prompts]);

  const kindPrompts = byKind[kind] ?? [];
  const prompt = kindPrompts[promptIndex % Math.max(1, kindPrompts.length)] ?? null;
  const target = TARGET_ROUNDS[kind];
  const roundLabel = kind === "four_three_two" ? ["4 phút", "3 phút", "2 phút"][rounds.length] ?? "" : "";

  async function recordRound() {
    if (recorder.isRecording) {
      const durationMs = Date.now() - startRef.current;
      const blob = await recorder.stop();
      setBusy(true);
      setError(null);
      const transcript = await transcribe(blob);
      const words = wordCount(transcript);
      const wpm = durationMs > 500 ? Math.round((words / durationMs) * 60000) : null;
      const round: DrillRound = { duration_ms: durationMs, words, wpm };
      setRounds((prev) => [...prev, round]);
      setBusy(false);
      return;
    }
    setError(null);
    startRef.current = Date.now();
    await recorder.start();
  }

  function reset() {
    setRounds([]);
    setSummary(null);
    setError(null);
  }

  async function save() {
    if (rounds.length === 0) {
      setError("Chưa có lượt nói nào.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await saveDrill({ kind, promptId: prompt?.id ?? null, rounds });
      setSummary(res.summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi lưu.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {KINDS.map((k) => (
          <button
            key={k}
            onClick={() => {
              setKind(k);
              reset();
            }}
            className={`rounded-full border px-3 py-1 text-sm ${
              kind === k ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
            }`}
          >
            {DRILL_LABEL[k]}
          </button>
        ))}
      </div>

      {summary ? (
        <Card>
          <CardContent className="py-6 text-center space-y-2">
            <div className="text-3xl font-bold">{summary.avgWpm ?? "—"} <span className="text-base font-normal text-muted-foreground">WPM TB</span></div>
            <p className="text-sm text-muted-foreground">
              {summary.rounds} lượt · tốt nhất {summary.bestWpm ?? "—"}.
              {summary.trend === "up" ? " ↑ Tốc độ tăng — tuyệt!" : summary.trend === "down" ? " ↓ Chậm lại ở lượt cuối." : ""}
            </p>
            <div className="flex justify-center gap-2 pt-2">
              <Button variant="outline" onClick={reset}>Luyện lại</Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {prompt && (
            <div className="rounded-xl border p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase text-muted-foreground">
                  {DRILL_LABEL[kind]} · lượt {rounds.length + 1}/{target} {roundLabel}
                </span>
                <button onClick={() => speak(prompt.prompt_en)} className="text-sm text-primary">
                  🔊 Nghe đề
                </button>
              </div>
              <p className="mt-2 text-lg">{prompt.prompt_en}</p>
              {prompt.prompt_vi && <p className="text-sm text-muted-foreground">{prompt.prompt_vi}</p>}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={recordRound} disabled={busy}>
              {recorder.isRecording ? "⏹ Dừng & chấm" : "🎙 Nói"}
            </Button>
            {rounds.length < target && rounds.length > 0 && (
              <Button onClick={() => setPromptIndex((i) => i + 1)} disabled={busy}>
                {kind === "four_three_two" ? "Lượt tiếp" : "Đổi đề"}
              </Button>
            )}
            {rounds.length >= target && (
              <Button onClick={save} disabled={busy}>Lưu & xem kết quả</Button>
            )}
          </div>

          {rounds.length > 0 && (
            <div className="text-sm text-muted-foreground">
              Đã nói {rounds.length}/{target} lượt · {rounds.reduce((s, r) => s + r.words, 0)} từ.
            </div>
          )}
          {recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
          {error && <p className="text-xs text-destructive">{error}</p>}
        </>
      )}
    </div>
  );
}