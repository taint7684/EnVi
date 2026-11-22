"use server";

import { createClient } from "@/lib/supabase/server";

export type ErrorSource =
  | "speaking"
  | "mission"
  | "reflex"
  | "writing"
  | "dictation"
  | "grammar"
  | "reading"
  | "pronunciation"
  | "shadowing"
  | "listening";

export type ErrorType =
  | "meaning"
  | "grammar"
  | "vocab"
  | "pronunciation"
  | "fluency"
  | "pragmatics"
  | "listening";

export async function logError(input: {
  userId: string;
  source: ErrorSource;
  sourceRef?: string;
  type: ErrorType;
  patternKey: string;
  original: string;
  correction: string;
  explanationVi?: string;
  severity?: 1 | 2 | 3;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("error_events").insert({
    user_id: input.userId,
    source: input.source,
    source_ref: input.sourceRef ?? null,
    type: input.type,
    pattern_key: input.patternKey,
    original: input.original,
    correction: input.correction,
    explanation_vi: input.explanationVi ?? null,
    severity: input.severity ?? 1,
  });
  if (error) throw new Error(error.message);
}

export type ErrorEventRow = {
  id: string;
  source: string;
  source_ref: string | null;
  type: string;
  pattern_key: string;
  original: string;
  correction: string;
  explanation_vi: string | null;
  severity: number;
  created_at: string;
};

export type ErrorPatternRow = {
  id: string;
  pattern_key: string;
  count: number;
  status: string;
  mastery_streak: number;
  next_check_at: string | null;
  examples: unknown[];
};

export async function getErrors(input: {
  userId: string;
  status?: string;
  source?: string;
  page?: number;
  pageSize?: number;
}): Promise<{ events: ErrorEventRow[]; patterns: ErrorPatternRow[] }> {
  const supabase = await createClient();
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 50;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let q = supabase
    .from("error_events")
    .select("*, patterns:error_patterns(pattern_key, count, status, mastery_streak)")
    .eq("user_id", input.userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (input.source) q = q.eq("source", input.source);

  const { data: events, error } = await q;
  if (error) throw new Error(error.message);

  let pq = supabase
    .from("error_patterns")
    .select("pattern_key, count, status, mastery_streak, next_check_at, examples")
    .eq("user_id", input.userId)
    .order("count", { ascending: false });

  if (input.status) pq = pq.eq("status", input.status);

  const { data: patterns, error: perr } = await pq;
  if (perr) throw new Error(perr.message);

  return {
    events: (events ?? []) as ErrorEventRow[],
    patterns: (patterns ?? []) as ErrorPatternRow[],
  };
}

export async function getPatterns(input: {
  userId: string;
  status?: string;
}): Promise<ErrorPatternRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("error_patterns")
    .select("*")
    .eq("user_id", input.userId)
    .order("count", { ascending: false });
  if (input.status) q = q.eq("status", input.status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as ErrorPatternRow[];
}

export async function updatePattern(input: {
  userId: string;
  patternKey: string;
  status: "new" | "practicing" | "mastered" | "dismissed";
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("error_patterns")
    .update({ status: input.status })
    .eq("user_id", input.userId)
    .eq("pattern_key", input.patternKey);
  if (error) throw new Error(error.message);
}
