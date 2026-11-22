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