-- 0025: word_collocations — meaning-matched collocation + example per word
-- Source of truth for content lives in data/word-collocations.json (committed, reproducible).
-- Seeded via scripts/qa/seed-collocations.mjs. Readable by all authenticated users.

create table if not exists public.word_collocations (
  word_id uuid primary key references public.words(id) on delete cascade,
  collocation text not null,
  example_en text not null,
  example_vi text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists word_collocations_collocation_idx
  on public.word_collocations (collocation);

alter table public.word_collocations enable row level security;

drop policy if exists word_collocations_read on public.word_collocations;
create policy word_collocations_read on public.word_collocations
  for select to authenticated
  using (true);

grant select on public.word_collocations to authenticated;

-- Keep updated_at fresh on updates
create or replace function public.touch_word_collocations_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists word_collocations_touch on public.word_collocations;
create trigger word_collocations_touch
  before update on public.word_collocations
  for each row execute function public.touch_word_collocations_updated_at();