"use server";

import { createClient } from "@/lib/supabase/server";

export async function awardDictationXp(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Bạn cần đăng nhập.");

  // Award XP for completing a dictation exercise (20 XP)
  await supabase.rpc("add_xp", {
    user_uuid: user.id,
    xp_amount: 20,
  });
}