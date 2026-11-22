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
