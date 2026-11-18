-- Phase 11 Group 1: Daily Study Plan
-- Luu tien do hoan thanh ke hoach hoc hang ngay cua user.
-- Moi user co toi da 1 ban ghi/ngay (unique user_id + plan_date).
-- bonus_awarded danh dau da cong 100 XP cho ngay do chua (chong farm XP).

create table if not exists public.study_plan_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  completed_task_ids text[] not null default '{}',
  bonus_awarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, plan_date)
);

create index if not exists study_plan_progress_user_date_idx
  on public.study_plan_progress (user_id, plan_date desc);

-- RLS: chi chu so huu
alter table public.study_plan_progress enable row level security;

drop policy if exists study_plan_progress_own on public.study_plan_progress;
create policy study_plan_progress_own on public.study_plan_progress
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- updated_at trigger
drop trigger if exists study_plan_progress_set_updated_at on public.study_plan_progress;
create trigger study_plan_progress_set_updated_at
  before update on public.study_plan_progress
  for each row execute function public.set_updated_at();

-- Xoa du lieu ke hoach khi xoa tai khoan
create or replace function public.delete_study_plan_data()
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
  delete from public.study_plan_progress where user_id = uid;
end;
$$;

grant execute on function public.delete_study_plan_data() to authenticated;