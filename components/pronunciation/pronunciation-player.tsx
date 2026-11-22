"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useRecorder } from "@/hooks/use-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import { scoreIntelligibility, type WordResult } from "@/lib/speech/scoring";
import { savePronunciationAttempt } from "@/lib/pronunciation/server";
import type { PronunciationFocus } from "@/lib/pronunciation/content";

async function transcribe(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "pron.webm");
  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) return "";
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}

type ItemType = "word" | "sentence";

export function PronunciationPlayer({ focus }: { focus: PronunciationFocus }) {
  const recorder = useRecorder();
  const { speak } = useSpeechSynthesis();

  const [itemType, setItemType] = useState<ItemType>("word");
  const [items, setItems] = useState<string[]>(focus.words);
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [results, setResults] = useState<WordResult[] | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const current = items[index] ?? "";

  function switchType(t: ItemType) {
    setItemType(t);
    setItems(t === "word" ? focus.words : focus.sentences);
    setIndex(0);
    reset();
  }

  function reset() {
    setTranscript("");
    setResults(null);
    setScore(null);
    setError(null);
  }

  async function handleRecord() {
    if (recorder.isRecording) {
      const blob = await recorder.stop();
      setBusy(true);
      setError(null);
      try {
        const text = await transcribe(blob);
        setTranscript(text);
        const scored = scoreIntelligibility(text, current);
        setResults(scored.results);
        setScore(scored.score);
        await savePronunciationAttempt({
          focusId: focus.id,
          itemType,
          targetText: current,
          transcript: text,
          wordResults: scored.results,
          score: scored.score,
        });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Lỗi khi chấm.");
      } finally {
        setBusy(false);
      }
      return;
    }
    setError(null);
    await recorder.start();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => switchType("word")}
          className={`rounded-full border px-3 py-1 text-sm ${
            itemType === "word" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
          }`}
        >
          Từ ({focus.words.length})
        </button>
        <button
          onClick={() => switchType("sentence")}
          className={`rounded-full border px-3 py-1 text-sm ${
            itemType === "sentence" ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted"
          }`}
        >
          Câu ({focus.sentences.length})
        </button>
      </div>

      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase text-muted-foreground">
            {itemType === "word" ? "Từ" : "Câu"} {index + 1}/{items.length}
          </span>
          <button onClick={() => speak(current)} className="text-sm text-primary">🔊 Nghe mẫu</button>
        </div>
        <p className="mt-2 text-2xl font-medium">{current}</p>
      </div>

      {score != null && (
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold">{score}%</div>
              <div className="text-sm text-muted-foreground">
                Độ rõ (intelligibility) — {score >= 80 ? "rất rõ" : score >= 50 ? "khá rõ" : "cần luyện thêm"}.
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1">
              {results?.map((r, i) => (
                <span
                  key={i}
                  className={`rounded px-1 text-sm ${
                    r.ok ? "text-foreground" : "bg-destructive/10 text-destructive line-through"
                  }`}
                >
                  {r.word}
                </span>
              ))}
            </div>
            {transcript && (
              <p className="mt-2 text-xs text-muted-foreground">Máy nghe được: “{transcript}”</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={handleRecord} disabled={busy}>
          {recorder.isRecording ? "⏹ Dừng & chấm" : "🎙 Đọc"}
        </Button>
        {score != null && (
          <Button
            onClick={() => {
              reset();
              setIndex((i) => (i + 1) % items.length);
            }}
            disabled={busy}
          >
            Tiếp theo
          </Button>
        )}
      </div>
      {recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}