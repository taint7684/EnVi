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
