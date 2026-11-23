-- ============================================================
-- EnVi v2 — PRODUCTION MIGRATION SCRIPT (AUTO-GENERATED)
-- Commit: c4c9f60
-- Target: Supabase Production (ricthhogtmgxoyjstfkz)
-- Generated: 2026-11-23
-- ============================================================
--
-- BEFORE RUNNING:
--   1. Backup: Supabase Dashboard → Database → Backups → Create backup
--   2. Run this ENTIRE script in Supabase SQL Editor (single transaction)
--   3. If ANY statement fails, the transaction rolls back — nothing applied
--   4. After success, run the VERIFICATION QUERIES at the bottom
--
-- MIGRATION ORDER (tested on QA simulation, 16/16 applied ✅):
--   0009_client_errors.sql → 0010_activity_events.sql → 0011_s1_daily_plan.sql → 0012_s2_speaking_coach.sql → 0013_s3_error_log_makeup.sql → 0014_s4_reflex_vocab_v2.sql → 0015_s5_onboarding_checkpoint.sql → 0016_s6_missions_drills.sql → 0017_s7_listen_pronunciation.sql → 0018_s8_reading_grammar_writing.sql → 0019_s9_roadmap_gamification.sql → 0020_s10_real_world.sql → 0021_default_180_minutes.sql → 0022_reflex_core_fields.sql → 0023_reflex_reviewed.sql → 0004_indexes.sql
--
-- NOTE: deck_words already exists in Production (from 0001, 2 cols, RLS enabled).
--       No Step 0 needed. All migrations use IF NOT EXISTS (idempotent).
--
-- MID-FAILURE HANDLING:
--   If the script fails, note the last "-- ✅ APPLIED: XXXX" before the error.
--   Run DIAGNOSTIC QUERIES (§A) to see what was created.
--   Fix the failing migration, then re-run the ENTIRE script (safe — idempotent).
-- ============================================================

begin;

-- ------------------------------------------------------------
-- ✅ APPLIED: 0009_client_errors.sql
-- ------------------------------------------------------------
-- 0009_client_errors.sql
-- Bảng ghi lỗi client báo về server (dùng cho mục "khong man trang").
-- Chi muc va RLS duoc them. KHONG xoa du lieu cu.

create table if not exists public.client_errors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  message text not null,
  url text not null,
  created_at timestamptz default now()
);

alter table public.client_errors enable row level security;

create policy "users can insert their own client errors"
  on public.client_errors for insert
  with check (auth.uid() = user_id);

create policy "users can read their own client errors"
  on public.client_errors for select
  using (auth.uid() = user_id);

create index if not exists idx_client_errors_user_created
  on public.client_errors(user_id, created_at desc);

-- ------------------------------------------------------------
-- ✅ APPLIED: 0010_activity_events.sql
-- ------------------------------------------------------------
-- 0010_activity_events.sql
-- Nguồn du nhat cho streak / XP / ke hoach "Hom nay" / bao cao.
-- KHONG xoa du lieu cu. Chi them bang moi va ham moi.

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  block_type text,
  ref_id uuid,
  duration_sec integer not null default 0,
  speech_sec integer not null default 0,
  meta jsonb not null default '{}',
  study_date date not null,
  created_at timestamptz not null default now()
);

alter table public.activity_events enable row level security;
create policy "users insert own activity events"
  on public.activity_events for insert
  with check (auth.uid() = user_id);
create policy "users read own activity events"
  on public.activity_events for select
  using (auth.uid() = user_id);
create index if not exists idx_activity_events_user_study
  on public.activity_events(user_id, study_date desc);
create index if not exists idx_activity_events_user_created
  on public.activity_events(user_id, created_at desc);

create table if not exists public.xp_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  amount integer not null,
  reason text not null,
  ref_id text not null,
  created_at timestamptz not null default now(),
  unique (user_id, reason, ref_id)
);

alter table public.xp_ledger enable row level security;
create policy "users insert own xp"
  on public.xp_ledger for insert
  with check (auth.uid() = user_id);
create policy "users read own xp"
  on public.xp_ledger for select
  using (auth.uid() = user_id);
create index if not exists idx_xp_ledger_user
  on public.xp_ledger(user_id, created_at desc);

create table if not exists public.streaks (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current integer not null default 0,
  longest integer not null default 0,
  last_study_date date,
  freezes_used_month integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.streaks enable row level security;
create policy "users own streak"
  on public.streaks for all
  using (auth.uid() = user_id);

create table if not exists public.daily_plans (
  user_id uuid references auth.users(id) on delete cascade not null,
  study_date date not null,
  budget integer not null default 60,
  blocks jsonb not null default '[]',
  completed_at timestamptz,
  primary key (user_id, study_date)
);

alter table public.daily_plans enable row level security;
create policy "users own daily plan"
  on public.daily_plans for all
  using (auth.uid() = user_id);

create table if not exists public.daily_summary (
  user_id uuid references auth.users(id) on delete cascade not null,
  study_date date not null,
  minutes integer not null default 0,
  speech_minutes integer not null default 0,
  xp integer not null default 0,
  primary key (user_id, study_date)
);

alter table public.daily_summary enable row level security;
create policy "users own daily summary"
  on public.daily_summary for all
  using (auth.uid() = user_id);

-- Ham log_activity: ghi mot suat hoat don. study_date theo quy tac 03:00 VN
-- (gio < 3h => gan vao ngay hom qua).
create or replace function public.log_activity(
  p_type text,
  p_block_type text,
  p_ref_id uuid,
  p_duration_sec integer,
  p_speech_sec integer,
  p_meta jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_study_date date;
  v_now timestamptz := now() at time zone 'Asia/Ho_Chi_Minh';
begin
  if extract(hour from v_now) < 3 then
    v_study_date := (v_now - interval '1 day')::date;
  else
    v_study_date := v_now::date;
  end if;

  insert into public.activity_events (
    user_id, type, block_type, ref_id, duration_sec, speech_sec, meta, study_date, created_at
  )
  values (
    auth.uid(), p_type, p_block_type, p_ref_id, p_duration_sec, p_speech_sec, p_meta, v_study_date, v_now
  );
end;
$$;

-- Ham award_xp: idempotent qua xp_ledger (unique user_id, reason, ref_id).
create or replace function public.award_xp(
  p_reason text,
  p_ref_id text,
  p_amount integer
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inserted integer;
begin
  insert into public.xp_ledger (user_id, amount, reason, ref_id, created_at)
  values (auth.uid(), p_amount, p_reason, p_ref_id, now() at time zone 'Asia/Ho_Chi_Minh')
  on conflict (user_id, reason, ref_id) do nothing;

  get diagnostics v_inserted = row_count;
  if v_inserted > 0 then
    update public.profiles
    set xp = xp + p_amount,
        level = public.calculate_level(xp + p_amount),
        updated_at = now()
    where id = auth.uid();
  end if;
end;
$$;

grant execute on function public.log_activity(text, text, uuid, integer, integer, jsonb) to authenticated;
grant execute on function public.award_xp(text, text, integer) to authenticated;

-- ------------------------------------------------------------
-- ✅ APPLIED: 0011_s1_daily_plan.sql
-- ------------------------------------------------------------
-- 0011_s1_daily_plan.sql
-- S1: Hôm nay / Smart Daily Plan + sự kiện, XP, streak.
-- Chỉ them cot/bang moi, KHONG xoa du lieu cu.

-- Cot moi tren profiles (S1 can)
alter table public.profiles
  add column if not exists role text,
  add column if not exists goals text[],
  add column if not exists current_level text,
  add column if not exists phase text,
  add column if not exists current_day int not null default 1,
  add column if not exists new_words_per_day int,
  add column if not exists new_phrases_per_day int,
  add column if not exists feedback_mode text not null default 'safe',
  add column if not exists theme text not null default 'system',
  add column if not exists study_time text,
  add column if not exists onboarded_at timestamptz,
  add column if not exists promise_text text,
  add column if not exists streak_freezes_left int not null default 2;

-- Mac dinh minutes_per_day = 60 (spec 8.1: goi dau la 60, cho phep 30-180)
alter table public.profiles
  alter column minutes_per_day set default 60;

-- RLS cho cot moi duoc bao bang chinh sach profiles hien co (id = auth.uid())
-- Khong can them policy moi.

-- daily_plans, daily_summary, streaks, xp_ledger, activity_events da co tu 0010.
-- Them cot bonus_awarded vao daily_summary (spec 8.1: bonus ngay chi cong 1 lan).
alter table public.daily_summary
  add column if not exists bonus_awarded boolean not null default false;

-- Ham log_activity / award_xp da co tu 0010.

-- ------------------------------------------------------------
-- ✅ APPLIED: 0012_s2_speaking_coach.sql
-- ------------------------------------------------------------
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
  "desc" text,
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

-- ------------------------------------------------------------
-- ✅ APPLIED: 0013_s3_error_log_makeup.sql
-- ------------------------------------------------------------
-- 0013_s3_error_log_makeup.sql
-- S3: So tay loi + Bai bu thuc (khong hardcode, sinh tu loi cua chinh user).
-- Chi them bang moi, khong xoa du lieu cu.

-- ---------- Su kien loi (moi lan mac loi) ----------
create table if not exists public.error_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null check (source in ('speaking','mission','reflex','writing','dictation','grammar','reading','pronunciation','shadowing','listening')),
  source_ref uuid,
  type text not null check (type in ('meaning','grammar','vocab','pronunciation','fluency','pragmatics','listening')),
  pattern_key text not null,
  original text not null,
  correction text not null,
  explanation_vi text,
  severity int not null default 1 check (severity between 1 and 3),
  created_at timestamptz not null default now()
);
alter table public.error_events enable row level security;
create policy error_events_own on public.error_events for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists error_events_user_created_idx on public.error_events(user_id, created_at desc);
create index if not exists error_events_user_pattern_idx on public.error_events(user_id, pattern_key);

-- ---------- Mau loi gop theo nguoi dung ----------
create table if not exists public.error_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pattern_key text not null,
  count int not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','practicing','mastered','dismissed')),
  mastery_streak int not null default 0,
  next_check_at timestamptz,
  examples jsonb not null default '[]',
  unique (user_id, pattern_key)
);
alter table public.error_patterns enable row level security;
create policy error_patterns_own on public.error_patterns for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists error_patterns_user_status_idx on public.error_patterns(user_id, status);
create index if not exists error_patterns_user_next_check_idx on public.error_patterns(user_id, next_check_at);

-- ---------- Catalog mau loi (noi dung, chia cho tat ca nguoi dung) ----------
create table if not exists public.pattern_catalog (
  id uuid primary key default gen_random_uuid(),
  pattern_key text unique not null,
  title_vi text not null,
  explanation_vi text not null,
  rule text,
  examples jsonb not null default '[]',
  grammar_topic_id uuid,
  pronunciation_focus_id uuid,
  drills jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table public.pattern_catalog enable row level security;
create policy pattern_catalog_read on public.pattern_catalog for select to authenticated using (true);

-- ---------- Bai bu (sinh tu loi cua chinh user) ----------
create table if not exists public.makeup_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pattern_key text not null,
  status text not null default 'ready' check (status in ('ready','in_progress','done','skipped')),
  content jsonb not null default '{}',
  progress jsonb not null default '{}',
  score int,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.makeup_lessons enable row level security;
create policy makeup_lessons_own on public.makeup_lessons for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists makeup_lessons_user_status_idx on public.makeup_lessons(user_id, status);

-- ---------- Trigger: error_events -> error_patterns ----------
create or replace function public.sync_error_patterns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_pattern record;
  v_examples jsonb;
begin
  select * into v_pattern
  from public.error_patterns
  where user_id = NEW.user_id and pattern_key = NEW.pattern_key
  for update;

  if v_pattern is null then
    insert into public.error_patterns (
      user_id, pattern_key, count, first_seen, last_seen, status, mastery_streak, next_check_at, examples
    ) values (
      NEW.user_id, NEW.pattern_key, 1, NEW.created_at, NEW.created_at, 'new', 0,
      NEW.created_at + interval '1 day', jsonb_build_array(jsonb_build_object('original', NEW.original, 'correction', NEW.correction, 'at', NEW.created_at))
    );
    return NEW;
  end if;

  update public.error_patterns
  set count = count + 1,
      last_seen = NEW.created_at,
      status = case when status = 'dismissed' then status else 'new' end
  where id = v_pattern.id;

  select coalesce(examples, '[]'::jsonb) into v_examples from public.error_patterns where id = v_pattern.id;
  v_examples := v_examples || jsonb_build_array(jsonb_build_object('original', NEW.original, 'correction', NEW.correction, 'at', NEW.created_at));
  if jsonb_array_length(v_examples) > 5 then
    v_examples := v_examples #- '{0}';
  end if;

  update public.error_patterns
  set examples = v_examples
  where id = v_pattern.id;

  return NEW;
end;
$$;

create trigger trg_sync_error_patterns
after insert on public.error_events
for each row execute function public.sync_error_patterns();

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
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;

-- ------------------------------------------------------------
-- ✅ APPLIED: 0014_s4_reflex_vocab_v2.sql
-- ------------------------------------------------------------
-- 0014_s4_reflex_vocab_v2.sql
-- S4: Reflex v2 (L1/L2/L3, cham theo nghia, latency) + Vocab v2 (Triage, khong gihan, Chunk SRS).
-- Chi them cot moi, khong xoa du lieu cu.

-- ---------- Phrases: them level, latency, meaning_score ----------
alter table public.phrases
  add column if not exists level text check (level in ('L1','L2','L3'));
alter table public.phrases
  add column if not exists latency_ms int;
alter table public.phrases
  add column if not exists meaning_score real check (meaning_score between 0 and 1);
create index if not exists phrases_level_idx on public.phrases (level);

-- ---------- Phrase reviews: them meaning_score, latency_ms ----------
alter table public.phrase_reviews
  add column if not exists meaning_score real check (meaning_score between 0 and 1);
alter table public.phrase_reviews
  add column if not exists latency_ms int;

-- ---------- Words: them triage_status, chunk_index ----------
alter table public.words
  add column if not exists triage_status text check (triage_status in ('unknown','known','learning')) default 'unknown';
alter table public.words
  add column if not exists chunk_index int;
create index if not exists words_triage_status_idx on public.words (triage_status);
create index if not exists words_chunk_index_idx on public.words (chunk_index);

-- ---------- Triage per-user (Da biet/Chua biet) ----------
create table if not exists public.user_word_triage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  word_id uuid not null references public.words (id) on delete cascade,
  status text not null check (status in ('known','unknown','learning')) default 'unknown',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, word_id)
);
alter table public.user_word_triage enable row level security;
create policy user_word_triage_own on public.user_word_triage
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create index if not exists user_word_triage_user_status_idx on public.user_word_triage (user_id, status);

-- trigger updated_at
drop trigger if exists user_word_triage_set_updated_at on public.user_word_triage;
create trigger user_word_triage_set_updated_at
  before update on public.user_word_triage
  for each row execute function public.set_updated_at();

-- ---------- Cap nhat xoa tai khoan (neu ham chua co) ----------
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
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;

-- ------------------------------------------------------------
-- ✅ APPLIED: 0015_s5_onboarding_checkpoint.sql
-- ------------------------------------------------------------
-- 0015_s5_onboarding_checkpoint.sql
-- S5: Onboarding + Checkpoint 0/30/60/90 (Truoc-Sau) + bo localStorage assessment.
-- Them bang assessment_results, cap nhat profiles neu can.

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  milestone text not null check (milestone in ('baseline','day30','day60','day90')),
  level text not null,
  skills jsonb not null default '[]',
  total_percent int not null,
  estimated_level text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (user_id, milestone)
);
alter table public.assessment_results enable row level security;
create policy assessment_results_own on public.assessment_results
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create index if not exists assessment_results_user_milestone_idx on public.assessment_results(user_id, milestone);

-- Cap nhat xoa tai khoan
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

-- ------------------------------------------------------------
-- ✅ APPLIED: 0016_s6_missions_drills.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- ✅ APPLIED: 0017_s7_listen_pronunciation.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- ✅ APPLIED: 0018_s8_reading_grammar_writing.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- ✅ APPLIED: 0019_s9_roadmap_gamification.sql
-- ------------------------------------------------------------
-- 0019_s9_roadmap_gamification.sql
-- S9: Roadmap 90 ngay (DB) + Settings (new_words_per_day, feedback_mode).
-- Chi them bang/cot moi.

-- ---------- Roadmap 90 ngay (noi dung) ----------
create table if not exists public.roadmap_days (
  day int primary key,
  phase text not null,
  week int,
  theme text,
  goal_vi text,
  blocks jsonb,
  output_task text,
  check (day between 1 and 120)
);
alter table public.roadmap_days enable row level security;
create policy roadmap_days_read on public.roadmap_days for select to authenticated using (true);

-- ---------- Profiles: them tuy chon hoc ----------
alter table public.profiles
  add column if not exists new_words_per_day int,
  add column if not exists feedback_mode text not null default 'safe',
  add column if not exists study_time text;

-- Mac dinh minutes_per_day = 60 theo spec (chi ap dung cho user moi; khong ghi de user cu).
alter table public.profiles
  alter column minutes_per_day set default 60;

-- ------------------------------------------------------------
-- ✅ APPLIED: 0020_s10_real_world.sql
-- ------------------------------------------------------------
-- 0020_s10_real_world.sql
-- S10: Real-world Bridge (P2) — nhip cau ra doi that.
-- Chi them bang moi.

create table if not exists public.real_world_tasks (
  id text primary key,
  step int not null,
  title_vi text not null,
  description_vi text not null,
  sort_order int not null default 0
);
alter table public.real_world_tasks enable row level security;
create policy real_world_tasks_read on public.real_world_tasks for select to authenticated using (true);

create table if not exists public.real_world_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  task_id text not null references public.real_world_tasks (id) on delete cascade,
  feeling smallint,
  stuck_points text,
  created_at timestamptz not null default now()
);
alter table public.real_world_logs enable row level security;
create policy real_world_logs_own on public.real_world_logs
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists real_world_logs_user_idx on public.real_world_logs (user_id, created_at desc);

-- Cap nhat xoa tai khoan
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

-- ------------------------------------------------------------
-- ✅ APPLIED: 0021_default_180_minutes.sql
-- ------------------------------------------------------------
-- S11d: mac dinh minutes_per_day = 180 phut cho tai khoan moi.
-- User cu giu nguyen config da chon (khong ghi de). User moi se nhan 180.
-- Spec 8.1 goc la 60, nhung quyet dinh cuoi: tai khoan moi mac dinh 180 phut.

alter table public.profiles alter column minutes_per_day set default 180;

-- ------------------------------------------------------------
-- ✅ APPLIED: 0022_reflex_core_fields.sql
-- ------------------------------------------------------------
-- S12h: Reflex core data - them cot en_alternatives, situation_en, keywords
-- Spec yeu cau: cham lexical >= 0.75 tren en_text + en_alternatives,
-- L2 = tinh huong tieng Anh (situation_en), L3 = Q&A,
-- neu chua dat nhung du tu khoa thi AI judge "cung nghia?"

alter table public.phrases
  add column if not exists en_alternatives text[] not null default '{}',
  add column if not exists situation_en text,
  add column if not exists keywords text[] not null default '{}';

-- Index cho truy van nhanh theo level + situation
create index if not exists phrases_level_idx on public.phrases (difficulty);

comment on column public.phrases.en_alternatives is 'Cac cau tra loi dung khac (cham lexical >= 0.75 tren tap hop nay + en_text)';
comment on column public.phrases.situation_en is 'Tinh huong tieng Anh cho L2 (prompt ladder)';
comment on column public.phrases.keywords is 'Tu khoa quan trong (dung de cham khi lexical that bai, AI judge cung nghia)';

-- ------------------------------------------------------------
-- ✅ APPLIED: 0023_reflex_reviewed.sql
-- ------------------------------------------------------------
-- S12i: Reflex core data - them cot reflex_reviewed de danh dau noi dung AI sinh
-- reviewed = false cho noi dung AI chua duoc duyet; app van dung duoc
-- reviewed = true khi user/admin da duyet chat luong

alter table public.phrases
  add column if not exists reflex_reviewed boolean not null default false;

comment on column public.phrases.reflex_reviewed is 'false = AI-generated content (en_alternatives/situation_en/keywords) chua duoc duyet; true = da review';

-- ------------------------------------------------------------
-- ✅ APPLIED: 0004_indexes.sql
-- ------------------------------------------------------------
-- Phase 8: Performance - Database Indexes
-- Add missing indexes for frequently queried columns

-- Words table: index on lemma for search (already exists: words_lemma_idx)
-- Add index on cefr_level for filtering
CREATE INDEX IF NOT EXISTS words_cefr_level_idx ON public.words (cefr_level);

-- Card reviews: ensure index on user_id + due_at exists
-- Already exists: card_reviews_due_idx (user_id, due_at)
-- Add index on word_id for lookups
CREATE INDEX IF NOT EXISTS card_reviews_word_id_idx ON public.card_reviews (word_id);

-- Speaking turns: index on session_id for history queries
CREATE INDEX IF NOT EXISTS speaking_turns_session_id_idx ON public.speaking_turns (session_id);

-- Speaking sessions: index on user_id + created_at
CREATE INDEX IF NOT EXISTS speaking_sessions_user_idx ON public.speaking_sessions (user_id, created_at DESC);

-- Daily progress: index on user_id + date
CREATE INDEX IF NOT EXISTS daily_progress_user_date_idx ON public.daily_progress (user_id, date DESC);

-- AI usage log: index on user_id + created_at
CREATE INDEX IF NOT EXISTS ai_usage_log_user_idx ON public.ai_usage_log (user_id, created_at DESC);

-- Recordings: index on user_id
CREATE INDEX IF NOT EXISTS recordings_user_idx ON public.recordings (user_id, created_at DESC);

-- Dictation attempts: index on user_id
CREATE INDEX IF NOT EXISTS dictation_attempts_user_idx ON public.dictation_attempts (user_id, created_at DESC);

commit;

-- ============================================================
-- §2: POST-RUN VERIFICATION QUERIES
-- Run AFTER migration succeeds (outside the transaction)
-- ============================================================

-- §A: DIAGNOSTIC — Run this if migration fails, to see what was applied
-- select table_name from information_schema.tables where table_schema = 'public' order by table_name;
-- select column_name from information_schema.columns where table_schema = 'public' and table_name = 'phrases' order by column_name;
-- select column_name, column_default from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'minutes_per_day';

-- §B: VERIFICATION — All should return expected values

-- B1: Table count (expect 50)
select count(*) as table_count from information_schema.tables where table_schema = 'public';

-- B2: deck_words exists (expect true)
select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'deck_words') as deck_words_exists;

-- B3: daily_plans exists (expect true)
select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'daily_plans') as daily_plans_exists;

-- B4: activity_events exists (expect true)
select exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'activity_events') as activity_events_exists;

-- B5: Reflex columns on phrases (expect 7 true)
select
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='en_alternatives') as en_alternatives,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='situation_en') as situation_en,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='keywords') as keywords,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='reflex_reviewed') as reflex_reviewed,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='level') as level,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='latency_ms') as latency_ms,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='phrases' and column_name='meaning_score') as meaning_score;

-- B6: profiles.minutes_per_day default (expect 180)
select column_default from information_schema.columns
where table_schema='public' and table_name='profiles' and column_name='minutes_per_day';

-- B7: speaking_sessions new columns (expect 7 true)
select
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='mode') as mode,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='level') as level,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='feedback_mode') as feedback_mode,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='offline') as offline,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='courage_before') as courage_before,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='courage_after') as courage_after,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='speaking_sessions' and column_name='summary_json') as summary_json;

-- B8: writing_drafts.kind (expect true)
select exists(select 1 from information_schema.columns where table_schema='public' and table_name='writing_drafts' and column_name='kind') as kind_exists;

-- B9: RLS enabled on all tables (expect 50/50)
select
  (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and c.relrowsecurity) as rls_enabled,
  (select count(*)::int from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r') as total_tables;

-- B10: Data integrity (expect words=5029, phrases=1354)
select
  (select count(*)::int from public.words) as words_count,
  (select count(*)::int from public.phrases) as phrases_count;

-- B11: RPC functions exist (expect 3 true)
select
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='award_xp') as award_xp,
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='delete_my_account') as delete_my_account,
  exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='log_activity') as log_activity;

-- B12: deck_words RLS (expect true)
select exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname='deck_words' and c.relrowsecurity) as deck_words_rls;

-- ============================================================
-- §3: EXPECTED RESULTS
-- ============================================================
-- B1: 50
-- B2: true
-- B3: true
-- B4: true
-- B5: 7x true
-- B6: 180
-- B7: 7x true
-- B8: true
-- B9: 50, 50
-- B10: 5029, 1354
-- B11: 3x true
-- B12: true
-- ============================================================
