-- EnVi initial schema
-- Bật RLS trên mọi bảng dữ liệu người dùng. File audio lưu Storage, DB chỉ giữ URL.

create extension if not exists "pgcrypto";

-- ---------- Shared content ----------
create table if not exists public.words (
  id uuid primary key default gen_random_uuid(),
  lemma text not null,
  ipa text,
  pos text,
  meaning_vi text not null,
  example_en text,
  example_vi text,
  image_url text,
  audio_url text,
  topic text,
  frequency_rank int,
  source text,
  needs_review boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists words_lemma_idx on public.words (lower(lemma));

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  title_vi text,
  order_index int not null default 0,
  min_level text
);

create table if not exists public.dictation_items (
  id uuid primary key default gen_random_uuid(),
  title text,
  audio_url text,
  transcript text not null,
  level text,
  created_at timestamptz not null default now()
);

create table if not exists public.grammar_lessons (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  tense text,
  content jsonb,
  order_index int not null default 0
);

create table if not exists public.grammar_exercises (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.grammar_lessons (id) on delete cascade,
  prompt text not null,
  answer text,
  options jsonb,
  explanation text
);

-- ---------- User data ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  goal text,
  minutes_per_day int not null default 120,
  voice text not null default 'en-US-JennyNeural',
  tts_rate text not null default '1.0',
  locale text not null default 'vi',
  consent_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.deck_words (
  deck_id uuid not null references public.decks (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  primary key (deck_id, word_id)
);

create table if not exists public.card_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  ease real not null default 2.5,
  interval int not null default 0,
  due_at timestamptz not null default now(),
  reps int not null default 0,
  lapses int not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word_id)
);
create index if not exists card_reviews_due_idx on public.card_reviews (user_id, due_at);

create table if not exists public.speaking_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.speaking_turns (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.speaking_sessions (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  step int not null,
  question text,
  user_answer_text text,
  audio_url text,
  feedback_json jsonb,
  improved_answer text,
  created_at timestamptz not null default now()
);

create table if not exists public.recordings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null check (type in ('shadowing', 'reading', 'speaking')),
  ref_id uuid,
  audio_url text not null,
  duration_seconds numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.dictation_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id uuid references public.dictation_items (id) on delete set null,
  user_text text,
  score numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.daily_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  minutes int not null default 0,
  words_reviewed int not null default 0,
  speaking_minutes int not null default 0,
  streak int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, date)
);

create table if not exists public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete cascade,
  feature text not null,
  model text,
  prompt_tokens int,
  completion_tokens int,
  cost_estimate numeric,
  created_at timestamptz not null default now()
);

-- ---------- updated_at trigger ----------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists card_reviews_set_updated_at on public.card_reviews;
create trigger card_reviews_set_updated_at
  before update on public.card_reviews
  for each row execute function public.set_updated_at();

-- ---------- Tạo profile khi có user mới ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Xoá tài khoản + toàn bộ dữ liệu ----------
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

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.decks enable row level security;
alter table public.deck_words enable row level security;
alter table public.card_reviews enable row level security;
alter table public.speaking_sessions enable row level security;
alter table public.speaking_turns enable row level security;
alter table public.recordings enable row level security;
alter table public.dictation_attempts enable row level security;
alter table public.daily_progress enable row level security;
alter table public.ai_usage_log enable row level security;

alter table public.words enable row level security;
alter table public.topics enable row level security;
alter table public.dictation_items enable row level security;
alter table public.grammar_lessons enable row level security;
alter table public.grammar_exercises enable row level security;

-- Shared content: ai cũng đọc được
drop policy if exists words_read on public.words;
create policy words_read on public.words for select to anon, authenticated using (true);

drop policy if exists topics_read on public.topics;
create policy topics_read on public.topics for select to anon, authenticated using (true);

drop policy if exists dictation_items_read on public.dictation_items;
create policy dictation_items_read on public.dictation_items for select to anon, authenticated using (true);

drop policy if exists grammar_lessons_read on public.grammar_lessons;
create policy grammar_lessons_read on public.grammar_lessons for select to anon, authenticated using (true);

drop policy if exists grammar_exercises_read on public.grammar_exercises;
create policy grammar_exercises_read on public.grammar_exercises for select to anon, authenticated using (true);

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid());

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles for insert to authenticated with check (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated using (id = auth.uid());

-- decks
drop policy if exists decks_own on public.decks;
create policy decks_own on public.decks for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists deck_words_own on public.deck_words;
create policy deck_words_own on public.deck_words for all to authenticated
  using (exists (select 1 from public.decks d where d.id = deck_id and d.user_id = auth.uid()))
  with check (exists (select 1 from public.decks d where d.id = deck_id and d.user_id = auth.uid()));

-- card_reviews
drop policy if exists card_reviews_own on public.card_reviews;
create policy card_reviews_own on public.card_reviews for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- speaking_sessions
drop policy if exists speaking_sessions_own on public.speaking_sessions;
create policy speaking_sessions_own on public.speaking_sessions for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- speaking_turns
drop policy if exists speaking_turns_own on public.speaking_turns;
create policy speaking_turns_own on public.speaking_turns for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- recordings
drop policy if exists recordings_own on public.recordings;
create policy recordings_own on public.recordings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- dictation_attempts
drop policy if exists dictation_attempts_own on public.dictation_attempts;
create policy dictation_attempts_own on public.dictation_attempts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- daily_progress
drop policy if exists daily_progress_own on public.daily_progress;
create policy daily_progress_own on public.daily_progress for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ai_usage_log
drop policy if exists ai_usage_log_own on public.ai_usage_log;
create policy ai_usage_log_own on public.ai_usage_log for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

grant execute on function public.delete_my_account() to authenticated;