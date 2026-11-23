-- 0024: FSRS upgrade for vocabulary
-- Adds FSRS columns to card_reviews, session state table for cross-device persistence

-- FSRS columns on card_reviews
alter table public.card_reviews
  add column if not exists stability real not null default 0,
  add column if not exists difficulty real not null default 0,
  add column if not exists state int not null default 0,
  add column if not exists elapsed_days real not null default 0,
  add column if not exists scheduled_days real not null default 0,
  add column if not exists learning_steps int not null default 0,
  add column if not exists last_review timestamptz;

-- Vocab session state (cross-device persistence for group progress, position, difficult words)
create table if not exists public.vocab_session_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  new_words_count int not null default 0,
  group_size int not null default 20,
  current_position int not null default 0,
  group_started_at timestamptz,
  difficult_word_ids text[] not null default '{}',
  practice_queue text[] not null default '{}',
  updated_at timestamptz not null default now()
);

alter table public.vocab_session_state enable row level security;
create policy vocab_session_state_own on public.vocab_session_state
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Double-submit prevention: unique constraint on (user_id, word_id, review_timestamp_bucket)
-- We use a separate table to track recent reviews for idempotency
create table if not exists public.vocab_review_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  word_id uuid not null references public.words(id) on delete cascade,
  grade text not null check (grade in ('again','hard','good','easy')),
  review_mode text not null default 'official' check (review_mode in ('official','practice')),
  created_at timestamptz not null default now()
);

create index if not exists vocab_review_log_user_word_idx on public.vocab_review_log(user_id, word_id, created_at desc);

alter table public.vocab_review_log enable row level security;
create policy vocab_review_log_own on public.vocab_review_log
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Update delete_my_account
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
begin
  delete from public.vocab_review_log where user_id = uid;
  delete from public.vocab_session_state where user_id = uid;
  delete from public.real_world_logs where user_id = uid;
  delete from public.reading_attempts where user_id = uid;
  delete from public.grammar_attempts where user_id = uid;
  delete from public.grammar_mastery where user_id = uid;
  delete from public.pronunciation_attempts where user_id = uid;
  delete from public.pronunciation_progress where user_id = uid;
  delete from public.shadowing_attempts where user_id = uid;
  delete from public.fluency_drills where user_id = uid;
  delete from public.mission_attempts where user_id = uid;
  delete from public.speaking_turns where user_id = uid;
  delete from public.speaking_sessions where user_id = uid;
  delete from public.error_events where user_id = uid;
  delete from public.error_patterns where user_id = uid;
  delete from public.makeup_lessons where user_id = uid;
  delete from public.card_reviews where user_id = uid;
  delete from public.deck_words where deck_id in (select id from public.decks where user_id = uid);
  delete from public.decks where user_id = uid;
  delete from public.recordings where user_id = uid;
  delete from public.dictation_attempts where user_id = uid;
  delete from public.daily_progress where user_id = uid;
  delete from public.ai_usage_log where user_id = uid;
  delete from public.phrase_reviews where user_id = uid;
  delete from public.user_word_triage where user_id = uid;
  delete from public.assessment_results where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;