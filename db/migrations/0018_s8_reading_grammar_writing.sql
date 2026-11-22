-- 0018_s8_reading_grammar_writing.sql
-- S8: Reading (DB + click-tra) + Grammar (attempts/mastery) + Work Writing (kind).
-- Chi them bang/cot moi.

-- ---------- Reading attempts ----------
create table if not exists public.reading_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  passage_id text not null,
  quiz_score int,
  summary_text text,
  lookups int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.reading_attempts enable row level security;
create policy reading_attempts_own on public.reading_attempts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists reading_attempts_user_idx on public.reading_attempts (user_id, created_at desc);

-- ---------- Grammar attempts + mastery ----------
create table if not exists public.grammar_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null,
  question_id text not null,
  correct boolean not null,
  answer text,
  created_at timestamptz not null default now()
);
alter table public.grammar_attempts enable row level security;
create policy grammar_attempts_own on public.grammar_attempts
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists grammar_attempts_user_idx on public.grammar_attempts (user_id, topic_id);

create table if not exists public.grammar_mastery (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id text not null,
  mastery int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);
alter table public.grammar_mastery enable row level security;
create policy grammar_mastery_own on public.grammar_mastery
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ---------- Work Writing: them loai bai ----------
alter table public.writing_drafts
  add column if not exists kind text not null default 'free';

-- ---------- Cap nhat xoa tai khoan ----------
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not authenticated';
  end if;

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