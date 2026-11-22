-- 0012_s2_speaking_coach.sql
-- S2: Speaking Coach 6 buoc + Fluency Engine luu DB + Offline Fallback.
-- Chi them cot/bang moi, khong xoa du lieu cu.

-- ---------- Cot moi tren speaking_sessions ----------
alter table public.speaking_sessions
  add column if not exists mode text not null default 'coach',
  add column if not exists topic_id uuid references public.topics (id) on delete set null,
  add column if not exists level text,
  add column if not exists feedback_mode text not null default 'safe',
  add column if not exists offline boolean not null default false,
  add column if not exists courage_before smallint,
  add column if not exists courage_after smallint,
  add column if not exists summary_json jsonb;

-- ---------- Cot moi tren speaking_turns ----------
alter table public.speaking_turns
  add column if not exists turn_client_id uuid,
  add column if not exists question_id uuid,
  add column if not exists kind text not null default 'answer',
  add column if not exists attempt_no int not null default 1,
  add column if not exists transcript_edited boolean not null default false,
  add column if not exists duration_ms int,
  add column if not exists latency_ms int,
  add column if not exists wpm numeric,
  add column if not exists mlr numeric,
  add column if not exists pause_count int,
  add column if not exists hints_used int not null default 0,
  add column if not exists peeked boolean not null default false,
  add column if not exists retry_eval_json jsonb,
  add column if not exists provider text,
  add column if not exists ai_ms int;

create index if not exists speaking_turns_client_idx on public.speaking_turns (turn_client_id);
create index if not exists speaking_turns_session_idx on public.speaking_turns (session_id, created_at);

-- ---------- Bang cau hoi speaking (noi dung) ----------
create table if not exists public.speaking_topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  group_id text,
  title_vi text not null,
  title_en text not null,
  emoji text,
  desc text,
  theme_week int,
  created_at timestamptz not null default now()
);
alter table public.speaking_topics enable row level security;
create policy speaking_topics_read on public.speaking_topics for select to authenticated using (true);

create table if not exists public.speaking_questions (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.speaking_topics (id) on delete cascade,
  level text not null check (level in ('A2','B1','B2')),
  question_en text not null,
  question_vi text,
  sample_answer_a2 text,
  sample_answer_b1 text,
  sample_answer_b2 text,
  key_phrases text[] not null default '{}',
  created_at timestamptz not null default now()
);
alter table public.speaking_questions enable row level security;
create policy speaking_questions_read on public.speaking_questions for select to authenticated using (true);
create index if not exists speaking_questions_topic_level_idx on public.speaking_questions (topic_id, level);

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

  delete from public.speaking_turns where user_id = uid;
  delete from public.speaking_sessions where user_id = uid;
  delete from public.card_reviews where user_id = uid;
  delete from public.deck_words where deck_id in (select id from public.decks where user_id = uid);
  delete from public.decks where user_id = uid;
  delete from public.recordings where user_id = uid;
  delete from public.dictation_attempts where user_id = uid;
  delete from public.daily_progress where user_id = uid;
  delete from public.ai_usage_log where user_id = uid;
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
