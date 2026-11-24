-- 0026: Grammar upgrade — new exercise types, mind maps, mixed practice, wrong-answer tracking
-- Supports 4 exercise types (mcq, translation, error_correction, verb_conjugation) + mixed mode

-- Wrong answer tracking for review
create table if not exists public.grammar_wrong_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text not null,
  question_id text not null,
  exercise_type text not null check (exercise_type in ('mcq','translation','error_correction','verb_conjugation','mixed')),
  question_text text not null,
  correct_answer text not null,
  user_answer text not null,
  explanation_vi text,
  created_at timestamptz not null default now()
);

create index if not exists grammar_wrong_user_topic_idx on public.grammar_wrong_answers(user_id, topic_id);

alter table public.grammar_wrong_answers enable row level security;
create policy grammar_wrong_own on public.grammar_wrong_answers
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Grammar session progress (resume mid-session)
create table if not exists public.grammar_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id text,
  exercise_type text not null,
  mode text not null default 'topic' check (mode in ('topic','mixed','review_wrong')),
  total_questions int not null default 0,
  answered int not null default 0,
  correct int not null default 0,
  question_order jsonb not null default '[]',
  current_index int not null default 0,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists grammar_sessions_user_idx on public.grammar_sessions(user_id, updated_at desc);

alter table public.grammar_sessions enable row level security;
create policy grammar_sessions_own on public.grammar_sessions
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Update delete_my_account to include new tables
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
as $$
declare
  uid uuid := auth.uid();
begin
  delete from public.grammar_wrong_answers where user_id = uid;
  delete from public.grammar_sessions where user_id = uid;
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