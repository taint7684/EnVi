"use server";

import { createClient } from "@/lib/supabase/server";
import type { SpeakingTurnRow } from "@/lib/types/speaking";

export async function startSpeakingSession(): Promise<{ sessionId: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("speaking_sessions")
    .insert({ user_id: user.id })
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

  // Award XP for completing a speaking session (50 XP)
  await supabase.rpc("add_xp", {
    user_uuid: user.id,
    xp_amount: 50,
  });
}

export async function logSpeakingLifeline(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  await supabase.rpc("log_activity", {
    p_type: "speaking_lifeline",
    p_block_type: "speaking",
    p_ref_id: sessionId,
    p_duration_sec: 0,
    p_speech_sec: 0,
    p_meta: { max_lifelines: 3 },
  });
}

export async function peekSpeakingSample(sessionId: string): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  await supabase.rpc("add_xp", {
    user_uuid: user.id,
    xp_amount: -5,
  });

  await supabase.rpc("log_activity", {
    p_type: "speaking_sample_peek",
    p_block_type: "speaking",
    p_ref_id: sessionId,
    p_duration_sec: 0,
    p_speech_sec: 0,
    p_meta: { xp_change: -5 },
  });
}