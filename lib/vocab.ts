import "server-only";

import { createClient } from "@/lib/supabase/server";
import type {
  CardReviewRow,
  DueCard,
  DueCount,
  DueSessionState,
  WordRow,
} from "@/lib/types";

export const SESSION_SIZE = 100;
export const DAILY_NEW_LIMIT = 100;

const NEW_WORDS_PAGE_SIZE = 100;

export async function getDueCards(
  limit = SESSION_SIZE,
): Promise<{ cards: DueCard[]; state: DueSessionState }> {
  const supabase = await createClient();
  const now = new Date();

  const { data: reviews, error: reviewsError } = await supabase
    .from("card_reviews")
    .select(
      "id, user_id, word_id, ease, interval, due_at, reps, lapses, last_reviewed_at, created_at, updated_at",
    )
    .order("due_at", { ascending: true });

  if (reviewsError) throw new Error(reviewsError.message);

  const allReviews = (reviews ?? []) as CardReviewRow[];
  const dueReviews = allReviews.filter(
    (review) => new Date(review.due_at).getTime() <= now.getTime(),
  );
  const reviewedIds = new Set(allReviews.map((review) => review.word_id));

  let dueWords: WordRow[] = [];
  if (dueReviews.length > 0) {
    const { data, error: wordsError } = await supabase
      .from("words")
      .select("*")
      .in(
        "id",
        dueReviews.map((review) => review.word_id),
      );

    if (wordsError) throw new Error(wordsError.message);
    dueWords = (data ?? []) as WordRow[];
  }

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const newIntroducedToday = allReviews.filter(
    (review) =>
      new Date(review.created_at).getTime() >= startOfToday.getTime(),
  ).length;

  const newLimit = Math.max(
    0,
    Math.min(limit - dueWords.length, DAILY_NEW_LIMIT - newIntroducedToday),
  );

  const newWords: WordRow[] = [];
  if (newLimit > 0) {
    let offset = 0;

    while (newWords.length < newLimit) {
      const { data, error: wordsError } = await supabase
        .from("words")
        .select("*")
        .order("frequency_rank", { ascending: true, nullsFirst: false })
        .range(offset, offset + NEW_WORDS_PAGE_SIZE - 1);

      if (wordsError) throw new Error(wordsError.message);

      const page = (data ?? []) as WordRow[];
      if (page.length === 0) break;

      for (const word of page) {
        if (!reviewedIds.has(word.id)) {
          newWords.push(word);
          if (newWords.length >= newLimit) break;
        }
      }

      offset += page.length;
    }
  }

  const cards: DueCard[] = [];
  const wordById = new Map(dueWords.map((word) => [word.id, word]));
  const reviewByWord = new Map(
    dueReviews.map((review) => [review.word_id, review]),
  );

  for (const review of dueReviews) {
    const word = wordById.get(review.word_id);
    if (word) cards.push({ word, review });
  }

  for (const word of newWords) {
    cards.push({ word, review: reviewByWord.get(word.id) ?? null });
  }

  const sliced = cards.slice(0, limit);

  // Determine session state for UI
  const { count: totalWords, error: countError } = await supabase
    .from("words")
    .select("*", { count: "exact", head: true });

  if (countError) throw new Error(countError.message);

  const total = totalWords ?? 0;
  const learnedCount = reviewedIds.size;
  const remainingNew = Math.max(0, total - learnedCount);

  let state: DueSessionState;
  if (dueWords.length > 0) {
    state = {
      status: "has_due",
      dueCount: dueWords.length,
      newCount: remainingNew,
    };
  } else if (remainingNew > 0) {
    state = {
      status: "has_new_only",
      newCount: remainingNew,
    };
  } else {
    state = {
      status: "exhausted",
      newCount: 0,
    };
  }

  return { cards: sliced, state };
}

export async function getDueCount(): Promise<DueCount> {
  const supabase = await createClient();
  const now = new Date();

  const { data: reviews, error: reviewsError } = await supabase
    .from("card_reviews")
    .select("word_id, due_at, created_at");

  if (reviewsError) throw new Error(reviewsError.message);

  const allReviews = (reviews ?? []) as Pick<
    CardReviewRow,
    "word_id" | "due_at" | "created_at"
  >[];

  const due = allReviews.filter(
    (review) => new Date(review.due_at).getTime() <= now.getTime(),
  ).length;
  const reviewedIds = new Set(allReviews.map((review) => review.word_id));

  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const newIntroducedToday = allReviews.filter(
    (review) =>
      new Date(review.created_at).getTime() >= startOfToday.getTime(),
  ).length;

  const { count: totalWords, error: countError } = await supabase
    .from("words")
    .select("*", { count: "exact", head: true });

  if (countError) throw new Error(countError.message);

  const newAvailable = Math.max(0, (totalWords ?? 0) - reviewedIds.size);
  const newCount = Math.min(
    newAvailable,
    Math.max(0, DAILY_NEW_LIMIT - newIntroducedToday),
  );

  return { due, new: newCount, total: due + newCount };
}