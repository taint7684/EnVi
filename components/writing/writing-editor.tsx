"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  Lightbulb,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
} from "lucide-react";

import {
  saveWritingDraft,
  saveWritingFeedback,
  completeWritingTask,
} from "@/app/actions/writing";
import { Button } from "@/components/ui/button";
import { SpellCheck } from "@/components/ui/spell-check";
import { WRITING_CHECKLIST_ITEMS, type WritingPrompt } from "@/data/writing-prompts";
import type { WritingDraftRow, WritingFeedback } from "@/lib/types";
import { toast } from "sonner";

type Props = {
  prompt: WritingPrompt;
  draft: WritingDraftRow | null;
  userId: string;
  onBack: () => void;
};

type LocalCache = {
  draftText: string;
  revisedText: string;
  checklist: boolean[];
  savedAt: number;
};

const STORAGE_PREFIX = "envi:writing";

function storageKey(userId: string, promptId: string, level: string): string {
  return `${STORAGE_PREFIX}:${userId}:${promptId}:${level}`;
}

function defaultChecklist(): boolean[] {
  return WRITING_CHECKLIST_ITEMS.map(() => false);
}

function readLocal(key: string): LocalCache | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as LocalCache) : null;
  } catch {
    return null;
  }
}

export function WritingEditor({ prompt, draft, userId, onBack }: Props) {
  const key = storageKey(userId, prompt.id, prompt.level);
  const serverUpdatedAt = draft?.updated_at ? Date.parse(draft.updated_at) : 0;

  // Lazy init: pick the newer of device buffer vs server row at mount time.
  // Avoids setState-in-effect lint error and cascading renders.
  const initial = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        text: draft?.draft_text ?? "",
        revised: draft?.revised_text ?? "",
        checklist: defaultChecklist(),
      };
    }
    const cache = readLocal(key);
    if (cache && cache.savedAt > serverUpdatedAt) {
      return {
        text: cache.draftText ?? "",
        revised: cache.revisedText ?? "",
        checklist:
          Array.isArray(cache.checklist) &&
          cache.checklist.length === WRITING_CHECKLIST_ITEMS.length
            ? cache.checklist
            : defaultChecklist(),
      };
    }
    return {
      text: draft?.draft_text ?? "",
      revised: draft?.revised_text ?? "",
      checklist: defaultChecklist(),
    };
  }, [key, serverUpdatedAt, draft]);

  const [text, setText] = useState(initial.text);
  const [revised, setRevised] = useState(initial.revised);
  const [feedback, setFeedback] = useState<WritingFeedback | null>(
    draft?.feedback_json ?? null,
  );
  const [showSample, setShowSample] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(draft?.completed ?? false);
  const [savedAt, setSavedAt] = useState<string | null>(
    draft?.updated_at ?? null,
  );
  const [checklist, setChecklist] = useState<boolean[]>(initial.checklist);
  const [tab, setTab] = useState<"write" | "compare">(feedback ? "compare" : "write");

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textRef = useRef(text);
  const revisedRef = useRef(revised);
  const checklistRef = useRef(checklist);

  textRef.current = text;
  revisedRef.current = revised;
  checklistRef.current = checklist;

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const revisedWordCount = revised.trim()
    ? revised.trim().split(/\s+/).length
    : 0;

  // Persist an immediate device buffer (synchronous) so typing + instant reload
  // never loses the last characters. Cloud (Supabase) stays the source of truth.
  function persistLocal(patch: Partial<Omit<LocalCache, "savedAt">>) {
    if (typeof window === "undefined") return;
    try {
      const prev = readLocal(key);
      const next: LocalCache = {
        draftText: prev?.draftText ?? "",
        revisedText: prev?.revisedText ?? "",
        checklist: prev?.checklist ?? defaultChecklist(),
        ...patch,
        savedAt: Date.now(),
      };
      window.localStorage.setItem(key, JSON.stringify(next));
      console.log("[DEBUG] persistLocal key:", key, "savedAt:", next.savedAt, "draftText:", next.draftText?.slice(0, 50));
    } catch {
      // localStorage full / disabled — cloud save still runs.
    }
  }

  // Debounced cloud autosave of draft + revision after inactivity.
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void handleSave();
    }, 800);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, revised]);

  async function handleSave() {
    setSaving(true);
    try {
      await saveWritingDraft({
        promptId: prompt.id,
        level: prompt.level,
        draftText: textRef.current,
        revisedText: revisedRef.current,
      });
      setSavedAt(new Date().toISOString());
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Lưu nháp lỗi.");
    } finally {
      setSaving(false);
    }
  }

  function handleTextChange(value: string) {
    setText(value);
    persistLocal({ draftText: value });
  }

  function handleRevisedChange(value: string) {
    setRevised(value);
    persistLocal({ revisedText: value });
  }

  function handleToggleChecklist(index: number) {
    setChecklist((prev) => {
      const next = [...prev];
      next[index] = !next[index];
      persistLocal({ checklist: next });
      return next;
    });
  }

  async function handleGetFeedback() {
    if (textRef.current.trim().length < 10) {
      toast.error("Viết ít nhất 10 từ trước khi xin góp ý.");
      return;
    }
    setLoadingFeedback(true);
    setFeedbackError(null);
    try {
      await handleSave();
      const res = await fetch("/api/writing/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptId: prompt.id,
          level: prompt.level,
          draftText: textRef.current,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Không thể lấy góp ý.");
      }
      const fb = data.feedback as WritingFeedback;
      setFeedback(fb);
      setRevised(fb.improved_version);
      persistLocal({ revisedText: fb.improved_version });
      setTab("compare");
      // Persist to cloud (non-blocking): feedback is shown even if DB is down.
      try {
        await saveWritingFeedback({
          promptId: prompt.id,
          level: prompt.level,
          feedback: fb,
          improvedVersion: fb.improved_version,
        });
        setSavedAt(new Date().toISOString());
      } catch {
        // Cloud save failed — feedback still visible, local buffer intact.
      }
      toast.success("Đã nhận góp ý. Xem lại và viết lại nhé.");
    } catch (cause) {
      // Keep the draft — user can retry without losing their writing.
      setFeedbackError(
        cause instanceof Error ? cause.message : "AI đang bận, thử lại sau.",
      );
    } finally {
      setLoadingFeedback(false);
    }
  }

  async function handleComplete() {
    if (revisedRef.current.trim().length < 10) {
      toast.error("Viết lại bài trước khi hoàn thành.");
      return;
    }
    // Mark checklist + local completed state first (optimistic) so progress is
    // never lost if the cloud sync fails. XP is reconciled after.
    const wasCompleted = completed;
    if (!completed) {
      const allDone = WRITING_CHECKLIST_ITEMS.map(() => true);
      setChecklist(allDone);
      persistLocal({ checklist: allDone });
    }
    setCompleted(true);
    try {
      // Ensure the draft row exists before marking complete.
      await saveWritingDraft({
        promptId: prompt.id,
        level: prompt.level,
        draftText: textRef.current,
        revisedText: revisedRef.current,
      });
      const res = await completeWritingTask({
        promptId: prompt.id,
        level: prompt.level,
        revisedText: revisedRef.current,
      });
      if (!wasCompleted && res.xpEarned > 0) {
        toast.success(`Hoàn thành! +${res.xpEarned} XP`);
        window.dispatchEvent(new Event("envi:xp-refresh"));
      } else {
        toast.success("Đã lưu tiến độ.");
      }
    } catch {
      // Cloud save failed but local progress is intact.
      toast.error(
        "Đã lưu trên thiết bị. Đồng bộ thất bại — sẽ thử lại khi có mạng.",
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        type="button"
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Danh sách đề
      </button>

      <div className="mb-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-serif text-xl font-semibold">{prompt.title}</h1>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
            {prompt.level}
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
            {prompt.category === "it-ba" ? "IT/BA" : "Đời sống"}
          </span>
          {completed ? (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-700">
              ✓ hoàn thành
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {prompt.situation_vi}
        </p>
        <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-foreground">
          {prompt.instruction_en}
        </p>
        {savedAt ? (
          <p className="mt-2 text-[11px] text-muted-foreground">
            {saving ? "Đang lưu..." : `Đã lưu ${new Date(savedAt).toLocaleTimeString("vi-VN")}`}
          </p>
        ) : null}
      </div>

      <div className="mb-4 flex gap-1 rounded-xl bg-muted p-1">
        <button
          type="button"
          onClick={() => setTab("write")}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            tab === "write"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Viết
        </button>
        <button
          type="button"
          onClick={() => setTab("compare")}
          disabled={!feedback}
          className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${
            tab === "compare"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          So sánh v1 / v2
        </button>
      </div>

      {tab === "write" ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <label className="mb-2 block text-xs font-semibold text-foreground">
              Bài viết của bạn (bản nháp)
            </label>
            <textarea
              data-testid="writing-draft"
              value={text}
              onChange={(e) => handleTextChange(e.target.value)}
              rows={8}
              placeholder="Viết bài của bạn ở đây..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {wordCount} từ (yêu cầu ~{prompt.minWords} từ)
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void handleSave()} disabled={saving}>
                  {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                  Lưu nháp
                </Button>
                <Button size="sm" onClick={() => void handleGetFeedback()} disabled={loadingFeedback}>
                  {loadingFeedback ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Xin góp ý AI
                </Button>
              </div>
            </div>
            {feedbackError ? (
              <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {feedbackError} — Bạn vẫn có thể dùng checklist bên dưới để tự rà.
              </p>
            ) : null}
            <SpellCheck text={text} disabled={saving} />
          </div>

          {revised ? (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <label className="mb-2 block text-xs font-semibold text-foreground">
                Viết lại (dựa trên góp ý)
              </label>
              <textarea
                data-testid="writing-revised"
                value={revised}
                onChange={(e) => handleRevisedChange(e.target.value)}
                rows={8}
                placeholder="Viết lại bài của bạn..."
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">
                  {revisedWordCount} từ
                </span>
                <Button size="sm" onClick={() => void handleComplete()} disabled={completed}>
                  <Check className="size-3.5" />
                  {completed ? "Đã hoàn thành" : "Hoàn thành bài"}
                </Button>
              </div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="flex items-center gap-1.5 text-sm font-semibold">
                <Lightbulb className="size-4 text-amber-500" />
                Checklist tự rà
              </h3>
            </div>
            <ul className="space-y-1.5">
              {WRITING_CHECKLIST_ITEMS.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(i)}
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      checklist[i]
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-border bg-background hover:border-primary"
                    }`}
                  >
                    {checklist[i] ? <Check className="size-3" /> : null}
                  </button>
                  <span className={checklist[i] ? "text-muted-foreground line-through" : ""}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="button"
            onClick={() => setShowSample((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground underline hover:text-foreground"
          >
            <RefreshCw className="size-3.5" />
            {showSample ? "Ẩn câu mẫu" : "Xem câu mẫu (sau khi đã thử)"}
          </button>
          {showSample ? (
            <div className="rounded-2xl border border-border bg-muted/40 p-4">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                Câu mẫu — chỉ tham khảo
              </p>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {prompt.sampleAnswer}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {feedback ? (
            <>
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-blue-800">
                  <Sparkles className="size-4" />
                  Góp ý từ AI
                </h3>
                <p className="text-sm text-blue-900">{feedback.overall_vi}</p>
              </div>

              {feedback.errors.length > 0 ? (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="mb-2 text-sm font-semibold">
                    Lỗi cần sửa ({feedback.errors.length})
                  </h3>
                  <ul className="space-y-2">
                    {feedback.errors.map((err, i) => (
                      <li
                        key={i}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800"
                      >
                        <p className="font-medium">{err.error}</p>
                        <p className="text-green-700">→ {err.correction}</p>
                        <p className="mt-0.5 text-xs text-red-600">
                          {err.explanation_vi}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                  Không có lỗi lớn — bài viết của bạn khá tốt!
                </div>
              )}

              {feedback.key_phrases.length > 0 ? (
                <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <h3 className="mb-2 text-sm font-semibold">Cụm từ hữu ích</h3>
                  <div className="flex flex-wrap gap-2">
                    {feedback.key_phrases.map((p, i) => (
                      <span
                        key={i}
                        className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                Bản gốc (v1)
              </h3>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {text}
              </p>
            </div>
            <div className="rounded-2xl border border-green-200 bg-green-50/40 p-4 shadow-sm">
              <h3 className="mb-2 text-xs font-semibold text-green-700">
                Bản cải thiện (v2)
              </h3>
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {revised || feedback?.improved_version || "(chưa có)"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <label className="mb-2 block text-xs font-semibold text-foreground">
              Viết lại của bạn (dựa trên góp ý)
            </label>
            <textarea
              data-testid="writing-revised"
              value={revised}
              onChange={(e) => handleRevisedChange(e.target.value)}
              rows={8}
              placeholder="Viết lại bài của bạn..."
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {revisedWordCount} từ
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => void handleGetFeedback()} disabled={loadingFeedback}>
                  {loadingFeedback ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="size-3.5" />
                  )}
                  Góp ý lại
                </Button>
                <Button size="sm" onClick={() => void handleComplete()} disabled={completed}>
                  <Check className="size-3.5" />
                  {completed ? "Đã hoàn thành" : "Hoàn thành bài"}
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <Lightbulb className="size-4 text-amber-500" />
              Checklist tự rà
            </h3>
            <ul className="space-y-1.5">
              {WRITING_CHECKLIST_ITEMS.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => handleToggleChecklist(i)}
                    className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors ${
                      checklist[i]
                        ? "border-green-500 bg-green-500 text-white"
                        : "border-border bg-background hover:border-primary"
                    }`}
                  >
                    {checklist[i] ? <Check className="size-3" /> : null}
                  </button>
                  <span className={checklist[i] ? "text-muted-foreground line-through" : ""}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}