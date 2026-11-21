"use server";

import { createClient } from "@/lib/supabase/server";
import type { WritingDraftRow, WritingFeedback } from "@/lib/types";

export async function getWritingDraft(
  promptId: string,
  level: string,
): Promise<WritingDraftRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("writing_drafts")
    .select("*")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .eq("level", level)
    .maybeSingle();

  if (error && /does not exist|schema cache|relation/i.test(error.message)) {
    return null;
  }
  return (data as WritingDraftRow | null) ?? null;
}

export async function listWritingDrafts(): Promise<WritingDraftRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("writing_drafts")
    .select("*")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (error) {
    // Bảng chưa được tạo (migration 0008 chưa chạy) → trả rỗng, không throw.
    if (/does not exist|schema cache|relation/i.test(error.message)) {
      return [];
    }
    throw new Error(error.message);
  }
  return (data as WritingDraftRow[] | null) ?? [];
}

export async function getWritingUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

export async function saveWritingDraft(params: {
  promptId: string;
  level: string;
  draftText: string;
  revisedText?: string;
}): Promise<{ ok: true; updatedAt: string }> {
  const { promptId, level, draftText, revisedText } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const now = new Date().toISOString();
  const payload: Record<string, unknown> = {
    user_id: user.id,
    prompt_id: promptId,
    level,
    draft_text: draftText.slice(0, 5000),
    updated_at: now,
  };
  if (typeof revisedText === "string" && revisedText.length > 0) {
    payload.revised_text = revisedText.slice(0, 5000);
  }
  const { error } = await supabase
    .from("writing_drafts")
    .upsert(payload, { onConflict: "user_id,prompt_id,level" });
  if (error) throw new Error(error.message);
  return { ok: true, updatedAt: now };
}

export async function saveWritingFeedback(params: {
  promptId: string;
  level: string;
  feedback: WritingFeedback;
  improvedVersion: string;
}): Promise<void> {
  const { promptId, level, feedback, improvedVersion } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data: existing } = await supabase
    .from("writing_drafts")
    .select("draft_text")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .eq("level", level)
    .maybeSingle();

  const record = existing as { draft_text: string } | null;
  if (!record) throw new Error("Không tìm thấy bản nháp. Hãy lưu nháp trước.");

  const { error } = await supabase
    .from("writing_drafts")
    .update({
      feedback_json: feedback,
      revised_text: improvedVersion.slice(0, 5000),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .eq("level", level);
  if (error) throw new Error(error.message);
}

export async function completeWritingTask(params: {
  promptId: string;
  level: string;
  revisedText: string;
}): Promise<{ ok: true; xpEarned: number }> {
  const { promptId, level, revisedText } = params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data: existing } = await supabase
    .from("writing_drafts")
    .select("id, completed")
    .eq("user_id", user.id)
    .eq("prompt_id", promptId)
    .eq("level", level)
    .maybeSingle();

  const record = existing as { id: string; completed: boolean } | null;
  if (!record) throw new Error("Không tìm thấy bản nháp.");

  let xpEarned = 0;
  if (!record.completed) {
    const { error } = await supabase
      .from("writing_drafts")
      .update({
        revised_text: revisedText.slice(0, 5000),
        completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);
    if (error) throw new Error(error.message);
    xpEarned = 30;
    await supabase.rpc("add_xp", {
      user_uuid: user.id,
      xp_amount: xpEarned,
    });
  } else {
    const { error } = await supabase
      .from("writing_drafts")
      .update({
        revised_text: revisedText.slice(0, 5000),
        updated_at: new Date().toISOString(),
      })
      .eq("id", record.id);
    if (error) throw new Error(error.message);
  }

  return { ok: true, xpEarned };
}

export async function countCompletedWriting(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from("writing_drafts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("completed", true);

  if (error && /does not exist|schema cache|relation/i.test(error.message)) {
    return 0;
  }
  return count ?? 0;
}