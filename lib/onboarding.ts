"use server";

import { createClient } from "@/lib/supabase/server";

export async function saveOnboarding(input: {
  goal: string;
  minutesPerDay: number;
}): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { error } = await supabase.from("profiles").upsert(
    {
      id: user.id,
      goal: input.goal,
      minutes_per_day: input.minutesPerDay,
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}
