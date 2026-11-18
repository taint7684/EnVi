-- Phase 10 Group 5: Progress Tests
-- Luu ket qua bai kiem tra tien do (20 cau ngau nhien, cham diem)
-- moi lan lam bai = 1 ban ghi de theo doi tien bo theo thoi gian

create table if not exists public.progress_tests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  score int not null,
  total int not null,
  level text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists progress_tests_user_idx
  on public.progress_tests (user_id, created_at desc);

-- RLS
alter table public.progress_tests enable row level security;

-- Chi chu so huu doc/ghi
drop policy if exists progress_tests_own on public.progress_tests;
create policy progress_tests_own on public.progress_tests
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Xoa du lieu bai kiem tra khi xoa tai khoan
create or replace function public.delete_progress_test_data()
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
  delete from public.progress_tests where user_id = uid;
end;
$$;

grant execute on function public.delete_progress_test_data() to authenticated;