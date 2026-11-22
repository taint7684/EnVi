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