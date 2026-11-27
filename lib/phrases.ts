import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { DuePhrase, PhraseReviewRow, PhraseRow } from "@/lib/types";

export const SESSION_SIZE = 20;
export const DAILY_NEW_LIMIT = 10;
const NEW_PHRASES_PAGE_SIZE = 100;

export async function getDuePhrases(
  limit = SESSION_SIZE,
  difficulty?: string,
): Promise<DuePhrase[]> {
  const supabase = await createClient();
  const now = new Date();

  const { data: reviews, error: reviewsError } = await supabase
    .from("phrase_reviews")
    .select(
      "id, user_id, phrase_id, ease, interval, due_at, reps, lapses, last_reviewed_at, created_at, updated_at",
    )
    .order("due_at", { ascending: true });

  if (reviewsError) throw new Error(reviewsError.message);

  const allReviews = (reviews ?? []) as PhraseReviewRow[];
  const dueReviews = allReviews.filter(
    (review) => new Date(review.due_at).getTime() <= now.getTime(),
  );
  const reviewedIds = new Set(allReviews.map((review) => review.phrase_id));

  let duePhrases: PhraseRow[] = [];
  if (dueReviews.length > 0) {
    const { data, error: phrasesError } = await supabase
      .from("phrases")
      .select("*")
      .in(
        "id",
        dueReviews.map((review) => review.phrase_id),
      );

    if (phrasesError) throw new Error(phrasesError.message);
    duePhrases = (data ?? []) as PhraseRow[];
  }

  const matchesDifficulty = (phrase: PhraseRow) =>
    !difficulty || phrase.difficulty === difficulty;

  duePhrases = duePhrases.filter(matchesDifficulty);

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const newIntroducedToday = allReviews.filter(
    (review) =>
      new Date(review.created_at).getTime() >= startOfToday.getTime(),
  ).length;

  const newLimit = Math.max(
    0,
    Math.min(limit - duePhrases.length, DAILY_NEW_LIMIT - newIntroducedToday),
  );

  const newPhrases: PhraseRow[] = [];
  if (newLimit > 0) {
    let offset = 0;

    while (newPhrases.length < newLimit) {
      const { data, error: phrasesError } = await supabase
        .from("phrases")
        .select("*")
        .order("created_at", { ascending: true })
        .range(offset, offset + NEW_PHRASES_PAGE_SIZE - 1);

      if (phrasesError) throw new Error(phrasesError.message);

      const page = (data ?? []) as PhraseRow[];
      if (page.length === 0) break;

      for (const phrase of page) {
        if (!reviewedIds.has(phrase.id) && matchesDifficulty(phrase)) {
          newPhrases.push(phrase);
          if (newPhrases.length >= newLimit) break;
        }
      }

      offset += page.length;
    }
  }

  const cards: DuePhrase[] = [];
  const phraseById = new Map(duePhrases.map((phrase) => [phrase.id, phrase]));
  const reviewByPhrase = new Map(
    dueReviews.map((review) => [review.phrase_id, review]),
  );

  for (const review of dueReviews) {
    const phrase = phraseById.get(review.phrase_id);
    if (phrase) cards.push({ phrase, review });
  }

  for (const phrase of newPhrases) {
    cards.push({ phrase, review: reviewByPhrase.get(phrase.id) ?? null });
  }

  return cards.slice(0, limit);
}

export async function getDuePhraseCount(): Promise<{
  due: number;
  new: number;
  total: number;
}> {
  const supabase = await createClient();
  const now = new Date();

  const { data: reviews, error: reviewsError } = await supabase
    .from("phrase_reviews")
    .select("phrase_id, due_at, created_at");

  if (reviewsError) throw new Error(reviewsError.message);

  const allReviews = (reviews ?? []) as Pick<
    PhraseReviewRow,
    "phrase_id" | "due_at" | "created_at"
  >[];

  const due = allReviews.filter(
    (review) => new Date(review.due_at).getTime() <= now.getTime(),
  ).length;
  const reviewedIds = new Set(allReviews.map((review) => review.phrase_id));

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const newIntroducedToday = allReviews.filter(
    (review) =>
      new Date(review.created_at).getTime() >= startOfToday.getTime(),
  ).length;

  const { count: totalPhrases, error: countError } = await supabase
    .from("phrases")
    .select("*", { count: "exact", head: true });

  if (countError) throw new Error(countError.message);

  const newAvailable = Math.max(0, (totalPhrases ?? 0) - reviewedIds.size);
  const newCount = Math.min(
    newAvailable,
    Math.max(0, DAILY_NEW_LIMIT - newIntroducedToday),
  );

  return { due, new: newCount, total: due + newCount };
}

function shuffleArray<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i] = arr[j]!;
    arr[j] = temp!;
  }
  return arr;
}

export async function getReviewPhrases(
  limit = SESSION_SIZE,
  difficulty?: string,
): Promise<DuePhrase[]> {
  const supabase = await createClient();

  const { data: reviews, error: reviewsError } = await supabase
    .from("phrase_reviews")
    .select("phrase_id")
    .order("last_reviewed_at", { ascending: false });

  if (reviewsError) throw new Error(reviewsError.message);

  const ids = (reviews ?? []).map(
    (r) => (r as { phrase_id: string }).phrase_id,
  );
  if (ids.length === 0) return [];

  const { data, error: phrasesError } = await supabase
    .from("phrases")
    .select("*")
    .in("id", ids);

  if (phrasesError) throw new Error(phrasesError.message);

  let phrases = (data ?? []) as PhraseRow[];
  if (difficulty) {
    phrases = phrases.filter((phrase) => phrase.difficulty === difficulty);
  }
  if (phrases.length === 0) return [];

  return shuffleArray(phrases)
    .slice(0, limit)
    .map((phrase) => ({ phrase, review: null }));
}
