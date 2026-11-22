"use server";

import { createClient } from "@/lib/supabase/server";

export async function setTriageStatus(input: {
  wordId: string;
  status: "known" | "unknown" | "learning";
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  await supabase
    .from("user_word_triage")
    .upsert(
      {
        user_id: user.id,
        word_id: input.wordId,
        status: input.status,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,word_id" },
    );
}
