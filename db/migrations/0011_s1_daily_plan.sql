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
