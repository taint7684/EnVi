import "server-only";

import { createClient } from "@/lib/supabase/server";

export async function logActivity(input: {
  type: string;
  blockType?: string;
  refId?: string;
  durationSec?: number;
  speechSec?: number;
  meta?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("log_activity", {
    p_type: input.type,
    p_block_type: input.blockType ?? null,
    p_ref_id: input.refId ?? null,
    p_duration_sec: input.durationSec ?? 0,
    p_speech_sec: input.speechSec ?? 0,
    p_meta: input.meta ?? {},
  });
  if (error) throw new Error(error.message);
}

export async function awardXp(input: {
  reason: string;
  refId: string;
  amount: number;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("award_xp", {
    p_reason: input.reason,
    p_ref_id: input.refId,
    p_amount: input.amount,
  });
  if (error) throw new Error(error.message);
}
