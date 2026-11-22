-- 0016_s6_missions_drills.sql
-- S6: Roleplay Missions + Strategy Cards + Fluency Drills.
-- Chi them bang moi, khong xoa du lieu cu.

-- ---------- Strategy Cards (noi dung) ----------
create table if not exists public.strategy_cards (
  id text primary key,
  title_vi text not null,
  explanation_vi text not null,
  phrases jsonb not null default '[]',
  drill text,
  created_at timestamptz not null default now()
);
alter table public.strategy_cards enable row level security;
create policy strategy_cards_read on public.strategy_cards for select to authenticated using (true);

-- ---------- Missions (noi dung) ----------
create table if not exists public.missions (
  id text primary key,
  title_vi text not null,
  title_en text not null,
  category text not null check (category in ('work','life','travel','social')),
  level text not null check (level in ('A2','B1','B2')),
  role_relevance text[] not null default '{}',
  scenario_vi text not null,
  ai_persona jsonb not null,
  objectives jsonb not null default '[]',
  prep_chunks jsonb not null default '[]',
  strategy_card_id text references public.strategy_cards (id) on delete set null,
  max_turns int not null default 10,
  success_rule text not null default '>= objectives-1 done',
  offline_script jsonb not null default '[]',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.missions enable row level security;
create policy missions_read on public.missions for select to authenticated using (true);
create index if not exists missions_category_level_idx on public.missions (category, level);

-- ---------- Fluency Prompts (noi dung) ----------
create table if not exists public.fluency_prompts (
  id text primary key,
  kind text not null check (kind in ('one_minute','picture','quick_fire','eli5','story_chain')),
  prompt_en text not null,
  prompt_vi text,
  level text check (level in ('A2','B1','B2')),
  topic text,
  image_url text,
  created_at timestamptz not null default now()
);
alter table public.fluency_prompts enable row level security;
create policy fluency_prompts_read on public.fluency_prompts for select to authenticated using (true);
create index if not exists fluency_prompts_kind_idx on public.fluency_prompts (kind);

-- ---------- Mission attempts (nguoi dung) ----------
create table if not exists public.mission_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  mission_id text not null references public.missions (id) on delete cascade,
  session_id uuid references public.speaking_sessions (id) on delete set null,
  objectives_done text[] not null default '{}',
  success boolean not null default false,
  difficulty int not null default 1,
  turns int not null default 0,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.mission_attempts enable row level security;
create policy mission_attempts_own on public.mission_attempts
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create index if not exists mission_attempts_user_idx on public.mission_attempts (user_id, created_at desc);

-- ---------- Fluency drills (nguoi dung) ----------
create table if not exists public.fluency_drills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('four_three_two','one_minute','picture','quick_fire','eli5','story_chain')),
  prompt_id text references public.fluency_prompts (id) on delete set null,
  rounds jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table public.fluency_drills enable row level security;
create policy fluency_drills_own on public.fluency_drills
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create index if not exists fluency_drills_user_idx on public.fluency_drills (user_id, created_at desc);

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