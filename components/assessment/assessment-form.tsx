"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  buildAssessment,
  scoreAssessment,
  type AssessmentInput, type SkillResult, type AssessmentResult,
  MILESTONE_LABEL,
  SPEAKING_CRITERIA,
  WRITING_CRITERIA,
  ratingStars,
  levelLabel,
  saveAssessment,
  type Milestone,
} from "@/lib/assessment";

type Step = "listening" | "reading" | "speaking" | "writing" | "result";

const STEP_LABEL: Record<Step, string> = {
  listening: "1. Nghe hieu",
  reading: "2. Doc hieu",
  speaking: "3. Noi (tu danh gia)",
  writing: "4. Viet tu do",
  result: "Ket qua",
};

function optClass(selected: boolean) {
  return selected
    ? "text-left rounded-lg border px-3 py-2 text-sm bg-primary text-primary-foreground border-primary"
    : "text-left rounded-lg border px-3 py-2 text-sm bg-muted hover:bg-muted/80 border-border";
}

function ratingBtnClass(selected: boolean) {
  return selected
    ? "size-8 rounded-full border flex items-center justify-center text-sm font-medium bg-primary text-primary-foreground border-primary"
    : "size-8 rounded-full border flex items-center justify-center text-sm font-medium bg-muted hover:bg-muted/80 border-border";
}

function chipClass(active: boolean, done: boolean) {
  let c = "px-2 py-1 rounded text-xs font-medium ";
  if (active) c += "bg-primary text-primary-foreground";
  else if (done) c += "bg-green-100 text-green-700";
  else c += "bg-muted text-muted-foreground";
  return c;
}

export function AssessmentForm({
  milestone,
}: {
  milestone: Milestone;
}) {
  const { listening, reading, level } = buildAssessment(milestone);

  const [step, setStep] = useState<Step>("listening");
  const [listeningAnswers, setListeningAnswers] = useState<Record<number, number>>({});
  const [readingAnswers, setReadingAnswers] = useState<Record<number, number>>({});
  const [speakingRatings, setSpeakingRatings] = useState<Record<string, number>>({});
  const [speakingNote, setSpeakingNote] = useState("");
  const [writingText, setWritingText] = useState("");
  const [writingRatings, setWritingRatings] = useState<Record<string, number>>({});
  const [writingNote, setWritingNote] = useState("");
  const [result, setResult] = useState<AssessmentResult | null>(null);

  const order: Step[] = ["listening", "reading", "speaking", "writing", "result"];
  const stepIdx = order.indexOf(step);


  const canNext = (): boolean => {
    switch (step) {
      case "listening":
        return Object.keys(listeningAnswers).length === listening.length;
      case "reading":
        return Object.keys(readingAnswers).length === reading.length;
      case "speaking":
        return SPEAKING_CRITERIA.every((c) => speakingRatings[c.id] != null);
      case "writing":
        return (
          writingText.trim().length > 0 &&
          WRITING_CRITERIA.every((c) => writingRatings[c.id] != null)
        );
      default:
        return true;
    }
  };

  function handleSubmit() {
    const input: AssessmentInput = {
      listeningAnswers,
      readingAnswers,
      speakingRatings,
      speakingNote,
      writingText,
      writingRatings,
      writingNote,
    };
    const res = scoreAssessment(milestone, input, listening, reading);
    setResult(res);
    saveAssessment(res);
    setStep("result");
  }

  function reset() {
    setListeningAnswers({});
    setReadingAnswers({});
    setSpeakingRatings({});
    setSpeakingNote("");
    setWritingText("");
    setWritingRatings({});
    setWritingNote("");
    setResult(null);
    setStep("listening");
  }

  if (result) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>
              {MILESTONE_LABEL[milestone]} — Ket qua
            </CardTitle>
            <CardDescription>
              Muc tieu {level} · Uoc luong:{" "}
              <span className="font-semibold text-primary">
                {levelLabel(result.estimatedLevel)}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4 text-center">
              {result.skills.map((s: SkillResult) => (
                <div key={s.skill} className="rounded-xl border p-3">
                  <div className="text-2xl font-bold">
                    {s.score}/{s.maxScore}
                  </div>
                  <div className="text-xs text-muted-foreground uppercase">
                    {s.skill === "listening" ? "Nghe" : s.skill === "reading" ? "Doc" : s.skill === "speaking" ? "Noi" : "Viet"}
                  </div>
                  <div className="text-sm font-medium">{s.percent}%</div>
                </div>
              ))}
              <div className="rounded-xl border p-3 bg-primary/5">
                <div className="text-3xl font-bold">{result.totalPercent}%</div>
                <div className="text-xs text-muted-foreground uppercase">Tong</div>
              </div>
            </div>

            <div className="rounded-xl border p-4">
              <h4 className="font-medium mb-2">Chi tiet tung ky nang</h4>
              {result.skills.map((s: SkillResult) => (
                <div key={s.skill} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium">
                      {s.skill === "listening" ? "Nghe hieu" : s.skill === "reading" ? "Doc hieu" : s.skill === "speaking" ? "Noi" : "Viet"}
                    </span>
                    <span>{s.percent}%</span>
                  </div>
                  <ul className="text-xs text-muted-foreground space-y-1 pl-4">
                    {s.detail.map((d: string, i: number) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <h4 className="font-medium mb-1">Muc nang luc uoc luong</h4>
              <p className="text-lg font-semibold">
                {levelLabel(result.estimatedLevel)}
              </p>
              <p className="text-sm text-muted-foreground">{result.notes}</p>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" onClick={reset}>
                Lam lai
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold">
          {MILESTONE_LABEL[milestone]}
        </h1>
        <div className="flex gap-1 text-xs text-muted-foreground">
          {order.map((s) => {
            const active = step === s;
            const done = order.indexOf(s) < stepIdx;
            return (
              <span key={s} className={chipClass(active, done)}>
                {STEP_LABEL[s]}
              </span>
            );
          })}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{STEP_LABEL[step]}</CardTitle>
          <CardDescription>{stepDesc(step)}</CardDescription>
        </CardHeader>
        <CardContent>
          {step === "listening" && (
            <div className="space-y-4">
              {listening.map((q, i) => (
                <div key={q.key} className="rounded-lg border p-3">
                  <p className="font-medium mb-3">{i + 1}. {q.prompt}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => {
                      const selected = listeningAnswers[i] === oi;
                      return (
                        <button
                          key={oi}
                          onClick={() =>
                            setListeningAnswers((a) => ({ ...a, [i]: oi }))
                          }
                          className={optClass(selected)}
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === "reading" && (
            <div className="space-y-4">
              {reading.map((q, i) => (
                <div key={q.key} className="rounded-lg border p-3">
                  <p className="font-medium mb-3">{i + 1}. {q.prompt}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => {
                      const selected = readingAnswers[i] === oi;
                      return (
                        <button
                          key={oi}
                          onClick={() => setReadingAnswers((a) => ({ ...a, [i]: oi }))}
                          className={optClass(selected)}
                        >
                          {String.fromCharCode(65 + oi)}. {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          {step === "speaking" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Ghi am lan noi cua ban (mic that), sau do tu danh gia moi tieu chi 1-5 sao.
              </p>
              {SPEAKING_CRITERIA.map((c) => (
                <div key={c.id} className="rounded-lg border p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.hint}</p>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                      {ratingStars(speakingRatings[c.id] ?? 0)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() =>
                          setSpeakingRatings((r) => ({ ...r, [c.id]: n }))
                        }
                        className={ratingBtnClass(
                          speakingRatings[c.id] === n,
                        )}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-lg border p-3">
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Ghi chu buoi noi (tuychon)
                </label>
                <Textarea
                  value={speakingNote}
                  onChange={(e) => setSpeakingNote(e.target.value)}
                  placeholder="Mot ý da noi ro, mot chou con bi, mot cum muon luyen..."
                  rows={2}
                  className="w-full"
                />
              </div>
            </div>
          )}
          {step === "writing" && (
            <div className="space-y-4">
              <div className="rounded-lg border p-3">
                <p className="font-medium mb-2">De viet:</p>
                <p className="text-sm text-muted-foreground italic">
                  Viet mot email (khoang 80-120 tu) thong bao lai tien do du an cho dong nghiep, neu van de dang gap va yeu cau lam ro mot diem.
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Bai viet cua ban (tieng Anh)
                </label>
                <Textarea
                  value={writingText}
                  onChange={(e) => setWritingText(e.target.value)}
                  placeholder="Viet bai o day..."
                  rows={6}
                  className="w-full"
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Tu danh gia moi tieu chi 1-5 sao:
              </p>
              {WRITING_CRITERIA.map((c) => (
                <div key={c.id} className="rounded-lg border p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.hint}</p>
                    </div>
                    <span className="text-sm font-mono text-muted-foreground">
                      {ratingStars(writingRatings[c.id] ?? 0)}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() =>
                          setWritingRatings((r) => ({ ...r, [c.id]: n }))
                        }
                        className={ratingBtnClass(writingRatings[c.id] === n)}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div className="rounded-lg border p-3">
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Ghi chu ve bai viet (tuychon)
                </label>
                <Textarea
                  value={writingNote}
                  onChange={(e) => setWritingNote(e.target.value)}
                  placeholder="Bai nay dang phan loai phan nao, muon luyen gi tiep..."
                  rows={2}
                  className="w-full"
                />
              </div>
            </div>
          )}
        <div className="flex justify-between">
          {stepIdx <= 0 ? null : (
            <Button variant="outline" onClick={() => setStep(order[stepIdx - 1])}>
              Quay lai
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={!canNext()} className="ml-auto">
            {step === "writing" ? "Xem ket qua" : "Tiep theo"}
          </Button>
        </div>
      </CardContent>
      </Card>
    </div>
  );
}

function stepDesc(step: Step): string {
  switch (step) {
    case "listening":
      return "Chon dap an dung sau moi doan nghe.";
    case "reading":
      return "Doc doan roi chon dap an dung.";
    case "speaking":
      return "Danh gia minh theo tung tieu chi (1-5).";
    case "writing":
      return "Viet cau tra loi cho de va tu danh gia.";
    default:
      return "Tong hop 4 ky nang va muc nang luc uoc luong.";
  }
}
