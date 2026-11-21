-- Writing practice: drafts, feedback, and completed tasks.
-- Each user has at most one draft per (prompt_id, level); feedback is stored
-- as JSON so the UI can show v1 (original) vs v2 (revised) side by side.

create table if not exists public.writing_drafts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  prompt_id text not null,
  level text not null default 'A2',
  draft_text text not null default '',
  revised_text text,
  feedback_json jsonb,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, prompt_id, level)
);

create index if not exists writing_drafts_user_idx
  on public.writing_drafts (user_id, updated_at desc);

alter table public.writing_drafts enable row level security;

drop policy if exists "own writing drafts" on public.writing_drafts;
create policy "own writing drafts"
  on public.writing_drafts
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Streak-aware: writing completion is recorded in daily_progress like other tasks.
-- (daily_progress already exists from 0001_init.sql; no change needed.)