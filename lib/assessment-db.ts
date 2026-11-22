"use server";

import { createClient } from "@/lib/supabase/server";
import type { AssessmentResult } from "@/lib/assessment";

export async function saveAssessmentResult(result: AssessmentResult): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { error } = await supabase.from("assessment_results").upsert(
    {
      user_id: user.id,
      milestone: result.milestone,
      level: result.level,
      skills: result.skills,
      total_percent: result.totalPercent,
      estimated_level: result.estimatedLevel,
      notes: result.notes ?? null,
    },
    { onConflict: "user_id,milestone" },
  );
  if (error) throw new Error(error.message);
}

export type AssessmentResultRow = {
  milestone: string;
  level: string;
  skills: unknown[];
  total_percent: number;
  estimated_level: string;
  notes: string | null;
  created_at: string;
};

export async function getAssessmentResults(): Promise<AssessmentResultRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("assessment_results")
    .select("milestone, level, skills, total_percent, estimated_level, notes, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as AssessmentResultRow[];
}

export async function getAssessmentResult(milestone: string): Promise<AssessmentResultRow | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("assessment_results")
    .select("milestone, level, skills, total_percent, estimated_level, notes, created_at")
    .eq("user_id", user.id)
    .eq("milestone", milestone)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return (data ?? null) as AssessmentResultRow | null;
}
