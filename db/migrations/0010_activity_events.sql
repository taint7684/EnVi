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
