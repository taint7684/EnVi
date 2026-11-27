"use server";

import { createClient } from "@/lib/supabase/server";
import { lookupCandidates } from "./lemmatize";
import type { ReadingPassage, ReadingProgress, DailyReadingAssignment } from "./types";

export type WordLookup = {
  word: string;
  ipa: string | null;
  meaning: string;
  pos: string | null;
  found: boolean;
};

export async function lookupWord(raw: string): Promise<WordLookup> {
  const supabase = await createClient();
  const candidates = lookupCandidates(raw);
  for (const c of candidates) {
    const { data } = await supabase
      .from("words")
      .select("lemma, ipa, meaning_vi, pos")
      .ilike("lemma", c)
      .limit(1);
    const row = data && data[0];
    if (row) {
      return {
        word: raw,
        ipa: row.ipa ?? null,
        meaning: row.meaning_vi,
        pos: row.pos ?? null,
        found: true,
      };
    }
  }
  return { word: raw, ipa: null, meaning: "", pos: null, found: false };
}

export type ReadingAttemptInput = {
  passageId: string;
  quizScore: number;
  summaryText?: string;
  lookups?: number;
  mode?: "read_aloud" | "comprehension" | "exercises";
};

export async function saveReadingAttempt(
  input: ReadingAttemptInput,
): Promise<{ id: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Bạn cần đăng nhập.");

  const { data, error } = await supabase
    .from("reading_attempts")
    .insert({
      user_id: user.id,
      passage_id: input.passageId,
      quiz_score: input.quizScore,
      summary_text: input.summaryText?.slice(0, 4000) ?? null,
      lookups: input.lookups ?? 0,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return { id: data.id as string };
}

export async function getReadingProgress(): Promise<Record<string, ReadingProgress>> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return {};

  const { data: attempts } = await supabase
    .from("reading_attempts")
    .select("passage_id, quiz_score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (!attempts || attempts.length === 0) return {};

  // Group by passage_id
  const grouped: Record<string, Array<{ score: number; date: string }>> = {};
  for (const a of attempts) {
    if (!grouped[a.passage_id]) grouped[a.passage_id] = [];
    grouped[a.passage_id]!.push({
      score: Number(a.quiz_score ?? 0),
      date: a.created_at ?? "",
    });
  }

  const result: Record<string, ReadingProgress> = {};
  for (const [passageId, entries] of Object.entries(grouped)) {
    const latest = entries[0]!;
    const totalEntries = entries.length;
    const maxScore = Math.max(...entries.map((e) => e.score));
    const status =
      totalEntries >= 3 ? "completed" : totalEntries >= 1 ? "in_progress" : "new";

    result[passageId] = {
      passageId,
      readAloud: totalEntries >= 1,
      comprehension: totalEntries >= 1,
      exercises: totalEntries >= 2,
      quizScore: maxScore,
      totalQuestions: 0,
      completedAt: latest.date ?? null,
      status,
    };
  }
  return result;
}

/**
 * Get daily reading assignment: 2 passages per day, cycling through the pool.
 * Uses a deterministic date-based selection so all users get the same daily set.
 */
export async function getDailyReadingPassages(
  allPassages: ReadingPassage[],
): Promise<DailyReadingAssignment> {
  const today = new Date().toISOString().slice(0, 10);
  const dateNum = Math.floor(
    new Date(today + "T00:00:00Z").getTime() / (1000 * 60 * 60 * 24),
  );
  const pool = allPassages.length;
  if (pool === 0) return { date: today, passageIds: [] };

  const idx1 = dateNum % pool;
  const idx2 = (dateNum + 1) % pool;

  return {
    date: today,
    passageIds: [allPassages[idx1]!.id, allPassages[idx2]!.id],
  };
}