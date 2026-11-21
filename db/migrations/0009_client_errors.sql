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
