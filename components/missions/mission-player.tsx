"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useRecorder } from "@/hooks/use-recorder";
import { useSpeechSynthesis } from "@/hooks/use-speech-synthesis";
import type { Mission } from "@/lib/missions/schema";
import {
  startMission,
  submitMissionTurn,
  finishMission,
  type MissionDebrief,
} from "@/lib/missions/server";

async function transcribe(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("audio", blob, "answer.webm");
  const res = await fetch("/api/stt", { method: "POST", body: form });
  if (!res.ok) return "";
  const data = (await res.json()) as { text?: string };
  return data.text ?? "";
}

export function MissionPlayer({ mission }: { mission: Mission }) {
  const recorder = useRecorder();
  const { speak } = useSpeechSynthesis();

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [turnIndex, setTurnIndex] = useState(0);
  const [doneIds, setDoneIds] = useState<string[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debrief, setDebrief] = useState<MissionDebrief | null>(null);

  const script = mission.offline_script;
  const current = script[turnIndex] ?? null;
  const personaLine = current?.persona ?? "Let's begin. Take your time.";

  async function begin() {
    setBusy(true);
    setError(null);
    try {
      const res = await startMission(mission.id);
      setAttemptId(res.attemptId);
      speak(personaLine);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không bắt đầu được.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRecord() {
    if (recorder.isRecording) {
      const blob = await recorder.stop();
      setBusy(true);
      const transcript = await transcribe(blob);
      setText(transcript);
      setBusy(false);
      return;
    }
    setError(null);
    await recorder.start();
  }

  async function submitTurn() {
    if (!attemptId || text.trim().length < 2) {
      setError("Hãy nói hoặc gõ câu trả lời trước.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const progress = await submitMissionTurn({
        attemptId,
        learnerTurn: text,
        personaLine,
      });
      setDoneIds(progress.doneIds);
      setText("");
      recorder.reset();
      if (turnIndex + 1 < script.length) {
        const next = turnIndex + 1;
        setTurnIndex(next);
        speak(script[next]?.persona ?? "");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi chấm.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!attemptId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await finishMission(attemptId);
      setDebrief(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lỗi khi tổng kết.");
    } finally {
      setBusy(false);
    }
  }

  if (debrief) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{debrief.success ? "🎉 Hoàn thành mission!" : "Gần xong rồi!"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Đạt {debrief.done}/{debrief.total} mục tiêu.
            {debrief.success ? " Bạn đã làm tốt — +80 XP." : " Thử lại để đạt thêm mục tiêu nhé."}
          </p>
          <ul className="space-y-1">
            {debrief.objectives.map((o) => {
              const done = debrief.doneIds.includes(o.id);
              return (
                <li key={o.id} className="flex items-center gap-2 text-sm">
                  <span>{done ? "✅" : "⬜"}</span>
                  <span className={done ? "" : "text-muted-foreground"}>{o.text_vi}</span>
                </li>
              );
            })}
          </ul>
        </CardContent>
      </Card>
    );
  }

  if (!attemptId) {
    return (
      <div className="space-y-4">
        <div className="rounded-xl border p-4">
          <h3 className="font-medium">Bối cảnh</h3>
          <p className="mt-1 text-sm text-muted-foreground">{mission.scenario_vi}</p>
          <p className="mt-2 text-sm">
            Bạn nói chuyện với <strong>{mission.ai_persona.name}</strong> — {mission.ai_persona.role}.
          </p>
        </div>
        <div className="rounded-xl border p-4">
          <h3 className="font-medium mb-2">Cụm từ chuẩn bị</h3>
          <div className="flex flex-wrap gap-2">
            {mission.prep_chunks.map((c) => (
              <button
                key={c}
                onClick={() => speak(c)}
                className="rounded-full border px-3 py-1 text-sm hover:bg-muted"
                title="Nghe mẫu"
              >
                🔊 {c}
              </button>
            ))}
          </div>
        </div>
        <ul className="space-y-1">
          {mission.objectives.map((o) => (
            <li key={o.id} className="flex items-center gap-2 text-sm">
              <span>⬜</span>
              <span>{o.text_vi}</span>
            </li>
          ))}
        </ul>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={begin} disabled={busy}>
          {busy ? "Đang bắt đầu…" : "Bắt đầu"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase text-muted-foreground">
            {mission.ai_persona.name} · lượt {turnIndex + 1}/{script.length}
          </span>
          <button onClick={() => speak(personaLine)} className="text-sm text-primary">
            🔊 Nghe lại
          </button>
        </div>
        <p className="mt-2 text-lg">{personaLine}</p>
      </div>

      <div className="rounded-xl border p-4 space-y-2">
        <label className="text-sm font-medium">Câu trả lời của bạn</label>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Nói (ghi âm) hoặc gõ câu trả lời…"
          rows={3}
          className="w-full"
        />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={handleRecord} disabled={busy}>
            {recorder.isRecording ? "⏹ Dừng ghi" : "🎙 Ghi âm"}
          </Button>
          <Button onClick={submitTurn} disabled={busy}>
            Gửi lượt
          </Button>
          <Button variant="ghost" onClick={finish} disabled={busy}>
            Kết thúc
          </Button>
        </div>
        {recorder.error && <p className="text-xs text-destructive">{recorder.error}</p>}
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>

      <ul className="space-y-1">
        {mission.objectives.map((o) => {
          const done = doneIds.includes(o.id);
          return (
            <li key={o.id} className="flex items-center gap-2 text-sm">
              <span>{done ? "✅" : "⬜"}</span>
              <span className={done ? "text-muted-foreground line-through" : ""}>{o.text_vi}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}