-- 0017_s7_listen_pronunciation.sql
-- S7: Shadowing that (STT) + Dictation word-level + Pronunciation Lab.
-- Chi them bang/cot moi, khong xoa du lieu cu.

-- ---------- Dictation: them cot cham theo tu + reveal ----------
alter table public.dictation_attempts
  add column if not exists segment_idx int,
  add column if not exists hint_used boolean not null default false,
  add column if not exists revealed_before_submit boolean not null default false;

-- ---------- Shadowing attempts ----------
create table if not exists public.shadowing_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text,
  segment_idx int,
  transcript text,
  accuracy numeric,
  timing numeric,
  score numeric,
  audio_path text,
  created_at timestamptz not null default now()
);
alter table public.shadowing_attempts enable row level security;
create policy shadowing_attempts_own on public.shadowing_attempts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create index if not exists shadowing_attempts_user_idx on public.shadowing_attempts (user_id, created_at desc);

-- ---------- Pronunciation focuses (noi dung) ----------
create table if not exists public.pronunciation_focuses (
  id text primary key,
  num int not null,
  title_vi text not null,
  description_vi text not null,
  tip_vi text,
  created_at timestamptz not null default now()
);
alter table public.pronunciation_focuses enable row level security;
create policy pronunciation_focuses_read on public.pronunciation_focuses for select to authenticated using (true);

create table if not exists public.pronunciation_items (
  id text primary key,
  focus_id text not null references public.pronunciation_focuses (id) on delete cascade,
  item_type text not null check (item_type in ('pair','word','sentence','passage')),
  target_text text not null,
  options jsonb,
  created_at timestamptz not null default now()
);
alter table public.pronunciation_items enable row level security;
create policy pronunciation_items_read on public.pronunciation_items for select to authenticated using (true);
create index if not exists pronunciation_items_focus_idx on public.pronunciation_items (focus_id);

-- ---------- Pronunciation attempts + progress (nguoi dung) ----------
create table if not exists public.pronunciation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  focus_id text references public.pronunciation_focuses (id) on delete set null,
  item_type text not null,
  target_text text not null,
  transcript text,
  word_results jsonb,
  score int,
  scorer text not null default 'whisper',
  audio_path text,
  created_at timestamptz not null default now()
);
alter table public.pronunciation_attempts enable row level security;
create policy pronunciation_attempts_own on public.pronunciation_attempts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create index if not exists pronunciation_attempts_user_idx on public.pronunciation_attempts (user_id, created_at desc);

create table if not exists public.pronunciation_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  focus_id text not null references public.pronunciation_focuses (id) on delete cascade,
  mastery int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, focus_id)
);
alter table public.pronunciation_progress enable row level security;
create policy pronunciation_progress_own on public.pronunciation_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

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