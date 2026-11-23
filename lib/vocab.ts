import "server-only";

import { createClient } from "@/lib/supabase/server";
import { buildReviewForecast, type ForecastDay } from "@/lib/review-forecast";
import type {
  CardReviewRow,
  DueCard,
  DueCount,
  DueSessionState,
  VocabSessionState,
  WordRow,
} from "@/lib/types";

export const GROUP_SIZE = 20;
const NEW_WORDS_PAGE_SIZE = 100;

type SupabaseServer = Awaited<ReturnType<typeof createClient>>;

export async function getReviewForecast(days = 7): Promise<ForecastDay[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: reviews } = await supabase
    .from("card_reviews")
    .select("due_at")
    .eq("user_id", user.id)
    .order("due_at", { ascending: true });

  const dueAtList = (reviews ?? []).map((r) => (r as { due_at: string }).due_at);
  return buildReviewForecast(dueAtList, new Date(), days);
}

export async function getSessionState(): Promise<VocabSessionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      new_words_count: 0,
      group_size: GROUP_SIZE,
      current_position: 0,
      group_started_at: null,
      difficult_word_ids: [],
      practice_queue: [],
    };
  }

  const { data } = await supabase
    .from("vocab_session_state")
    .select("new_words_count, group_size, current_position, group_started_at, difficult_word_ids, practice_queue")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!data) {
    return {
      new_words_count: 0,
      group_size: GROUP_SIZE,
      current_position: 0,
      group_started_at: null,
      difficult_word_ids: [],
      practice_queue: [],
    };
  }

  const row = data as {
    new_words_count: number;
    group_size: number;
    current_position: number;
    group_started_at: string | null;
    difficult_word_ids: string[] | null;
    practice_queue: string[] | null;
  };

  return {
    new_words_count: row.new_words_count,
    group_size: row.group_size,
    current_position: row.current_position,
    group_started_at: row.group_started_at,
    difficult_word_ids: row.difficult_word_ids ?? [],
    practice_queue: row.practice_queue ?? [],
  };
}

export async function getDueCards(
  limit = 100,
): Promise<{ cards: DueCard[]; state: DueSessionState; sessionState: VocabSessionState }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      cards: [],
      state: { status: "exhausted", newCount: 0 },
      sessionState: await getSessionState(),
    };
  }

  const sessionState = await getSessionState();

  const { data: reviews } = await supabase
    .from("card_reviews")
    .select("word_id, due_at, stability, difficulty, state, reps, lapses, elapsed_days, scheduled_days, learning_steps, last_reviewed_at, ease, interval")
    .eq("user_id", user.id)
    .order("due_at", { ascending: true });

  const now = new Date();
  const dueReviews = (reviews ?? []).filter(
    (r) => new Date((r as { due_at: string }).due_at) <= now,
  );
  const reviewedIds = new Set((reviews ?? []).map((r) => (r as { word_id: string }).word_id));

  const dueWordIds = dueReviews.map((r) => (r as { word_id: string }).word_id);

  const dueCards: DueCard[] = [];
  if (dueWordIds.length > 0) {
    const { data: words } = await supabase
      .from("words")
      .select("*")
      .in("id", dueWordIds);
    const wordMap = new Map<string, WordRow>();
    for (const w of words ?? []) wordMap.set((w as WordRow).id, w as WordRow);
    const reviewMap = new Map<string, CardReviewRow>();
    for (const r of reviews ?? []) reviewMap.set((r as { word_id: string }).word_id, r as CardReviewRow);

    for (const r of dueReviews) {
      const rev = r as { word_id: string };
      const word = wordMap.get(rev.word_id);
      if (word) {
        dueCards.push({ word, review: reviewMap.get(rev.word_id) ?? null });
      }
    }
  }

  const remaining = Math.max(0, limit - dueCards.length);
  const newCards: DueCard[] = [];

  if (remaining > 0) {
    let offset = 0;
    while (newCards.length < remaining && offset < 10000) {
      const { data: words } = await supabase
        .from("words")
        .select("*")
        .order("frequency_rank", { ascending: true, nullsFirst: false })
        .range(offset, offset + NEW_WORDS_PAGE_SIZE - 1);

      if (!words || words.length === 0) break;

      for (const w of words as WordRow[]) {
        if (!reviewedIds.has(w.id)) {
          newCards.push({ word: w, review: null });
          if (newCards.length >= remaining) break;
        }
      }
      offset += NEW_WORDS_PAGE_SIZE;
    }
  }

  const cards = [...dueCards, ...newCards];
  const sliced = cards.slice(0, limit);

  let state: DueSessionState;
  if (sliced.length === 0) {
    state = { status: "exhausted", newCount: 0 };
  } else if (dueCards.length === 0 && newCards.length > 0) {
    state = { status: "has_new_only", newCount: newCards.length };
  } else {
    state = { status: "has_due", dueCount: dueCards.length, newCount: newCards.length };
  }

  return { cards: sliced, state, sessionState };
}

export async function getDueCount(): Promise<DueCount> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { due: 0, new: 0, total: 0 };

  const { data: reviews } = await supabase
    .from("card_reviews")
    .select("due_at")
    .eq("user_id", user.id);

  const now = new Date();
  const due = (reviews ?? []).filter(
    (r) => new Date((r as { due_at: string }).due_at) <= now,
  ).length;

  const { count: totalWords } = await supabase
    .from("words")
    .select("id", { count: "exact", head: true });

  return { due, new: (totalWords ?? 0) - (reviews ?? []).length, total: totalWords ?? 0 };
}