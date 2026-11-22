"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Download, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type Profile = {
  goal: string;
  minutes_per_day: number;
  voice: string;
  tts_rate: string;
  new_words_per_day: number | null;
  feedback_mode: "safe" | "standard";
};

const DEFAULTS: Profile = {
  goal: "Giao tiếp trong công việc và đời sống",
  minutes_per_day: 180,
  voice: "en-US-JennyNeural",
  tts_rate: "1.0",
  new_words_per_day: 20,
  feedback_mode: "safe",
};

const EXPORT_TABLES = [
  "profiles",
  "decks",
  "deck_words",
  "card_reviews",
  "phrase_reviews",
  "speaking_sessions",
  "speaking_turns",
  "recordings",
  "dictation_attempts",
  "daily_progress",
  "progress_tests",
  "study_plan_progress",
  "writing_drafts",
  "activity_events",
  "xp_ledger",
  "streaks",
  "daily_plans",
  "daily_summary",
  "assessment_results",
  "mission_attempts",
  "fluency_drills",
  "pronunciation_attempts",
  "shadowing_attempts",
  "reading_attempts",
  "grammar_attempts",
  "grammar_mastery",
  "error_events",
  "error_patterns",
  "makeup_lessons",
];

export function SettingsForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile>(DEFAULTS);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || !active) return;
      setUserId(user.id);
      const { data } = await supabase
        .from("profiles")
        .select("goal, minutes_per_day, voice, tts_rate, new_words_per_day, feedback_mode")
        .eq("id", user.id)
        .maybeSingle();
      if (active && data) setProfile({ ...DEFAULTS, ...(data as Profile) });
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  function update<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
  }

  async function handleSave() {
    if (!userId) return;
    setSaving(true);
    setStatus(null);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").upsert({
      id: userId,
      ...profile,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    setStatus(error ? `Lỗi lưu: ${error.message}` : "Đã lưu cài đặt.");
  }

  async function handleExport() {
    if (!userId) return;
    setBusy(true);
    setStatus(null);
    const supabase = createClient();
    const dump: Record<string, unknown> = {};
    for (const table of EXPORT_TABLES) {
      const { data, error } = await supabase.from(table).select("*");
      if (error) {
        dump[table] = { error: error.message };
      } else {
        dump[table] = data;
      }
    }
    const blob = new Blob([JSON.stringify(dump, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `envi-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBusy(false);
    setStatus("Đã xuất dữ liệu (JSON).");
  }

  async function handleDelete() {
    const ok = window.confirm(
      "Xoá vĩnh viễn tài khoản và toàn bộ dữ liệu? Hành động này không thể hoàn tác.",
    );
    if (!ok) return;
    setBusy(true);
    setStatus(null);
    const supabase = createClient();
    const { error } = await supabase.rpc("delete_my_account");
    if (error) {
      setStatus(`Lỗi xoá: ${error.message}`);
      setBusy(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="size-4 animate-spin" /> Đang tải cài đặt...
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-3xl gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Hồ sơ & mục tiêu</CardTitle>
          <CardDescription>
            Cá nhân hoá lộ trình và giọng đọc cho riêng bạn.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="goal">Mục tiêu</Label>
            <Input
              id="goal"
              value={profile.goal}
              onChange={(e) => update("goal", e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="minutes">Phút học mỗi ngày</Label>
            <Input
              id="minutes"
              type="number"
              min={30}
              max={300}
              value={profile.minutes_per_day}
              onChange={(e) =>
                update("minutes_per_day", Number(e.target.value) || 0)
              }
            />
          </div>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="voice">Giọng đọc (Edge TTS voice)</Label>
            <Input
              id="voice"
              value={profile.voice}
              onChange={(e) => update("voice", e.target.value)}
            />
          </div>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="rate">Tốc độ đọc</Label>
            <select
              id="rate"
              value={profile.tts_rate}
              onChange={(e) => update("tts_rate", e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="0.8">0.8x — chậm</option>
              <option value="1.0">1.0x — bình thường</option>
              <option value="1.2">1.2x — nhanh</option>
            </select>
          </div>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="newwords">Số từ mới mỗi ngày</Label>
            <div className="flex items-center gap-2">
              <input
                id="newwords"
                type="number"
                min={0}
                max={500}
                disabled={profile.new_words_per_day == null}
                value={profile.new_words_per_day ?? ""}
                onChange={(e) =>
                  update("new_words_per_day", e.target.value === "" ? null : Number(e.target.value) || 0)
                }
                className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring disabled:opacity-50"
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={profile.new_words_per_day == null}
                onChange={(e) => update("new_words_per_day", e.target.checked ? null : 20)}
              />
              Không giới hạn
            </label>
          </div>
          <div className="grid gap-2 sm:max-w-xs">
            <Label htmlFor="feedback">Chế độ phản hồi Speaking</Label>
            <select
              id="feedback"
              value={profile.feedback_mode}
              onChange={(e) => update("feedback_mode", e.target.value as "safe" | "standard")}
              className="h-8 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="safe">An toàn — không hiện điểm ngay</option>
              <option value="standard">Chuẩn — hiện điểm số</option>
            </select>
          </div>
          {status ? (
            <p className="text-sm text-muted-foreground">{status}</p>
          ) : null}
          <div>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : "Lưu"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dữ liệu của bạn</CardTitle>
          <CardDescription>
            Xuất toàn bộ dữ liệu học hoặc xoá tài khoản vĩnh viễn.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Button variant="outline" onClick={handleExport} disabled={busy}>
            <Download className="size-4" /> Xuất dữ liệu (JSON)
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={busy}>
            <Trash2 className="size-4" /> Xoá tài khoản
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}