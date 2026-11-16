"use server";

import { createClient } from "@/lib/supabase/server";
import type { SpeakingTurnRow } from "@/lib/types/speaking";

export async function startSpeakingSession(
  topicId?: string,
): Promise<{ sessionId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("speaking_sessions")
    .insert({ user_id: user.id, topic_id: topicId ?? null })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return { sessionId: data.id as string };
}

export async function getSpeakingHistory(
  sessionId: string,
): Promise<SpeakingTurnRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("speaking_turns")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as SpeakingTurnRow[];
}

export async function endSpeakingSession(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { error } = await supabase
    .from("speaking_sessions")
    .update({ ended_at: new Date().toISOString() })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);
}