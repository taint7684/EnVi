-- Phase 9: Phrase Reflex Training
-- Bang phrases luu cau giao tiep thong dung (Anh-Viet)
-- Bang phrase_reviews luu lich su xet duyet theo SM-2 (giong card_reviews)

create table if not exists public.phrases (
  id uuid primary key default gen_random_uuid(),
  vi_text text not null,
  en_text text not null,
  audio_url text,
  topic text not null default 'general',
  difficulty text not null default 'A2',
  created_at timestamptz not null default now()
);

create index if not exists phrases_topic_idx on public.phrases (topic);
create index if not exists phrases_difficulty_idx on public.phrases (difficulty);

-- Cap duy nhat (vi_text, en_text) de import co the upsert chong trung lap
create unique index if not exists phrases_pair_idx on public.phrases (vi_text, en_text);

create table if not exists public.phrase_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  phrase_id uuid not null references public.phrases (id) on delete cascade,
  ease real not null default 2.5,
  interval int not null default 0,
  due_at timestamptz not null default now(),
  reps int not null default 0,
  lapses int not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, phrase_id)
);
create index if not exists phrase_reviews_due_idx on public.phrase_reviews (user_id, due_at);

-- RLS
alter table public.phrases enable row level security;
alter table public.phrase_reviews enable row level security;

-- Phrases: shared content, ai cung doc duoc
drop policy if exists phrases_read on public.phrases;
create policy phrases_read on public.phrases for select to anon, authenticated using (true);

-- phrase_reviews: chi chu so huu
drop policy if exists phrase_reviews_own on public.phrase_reviews;
create policy phrase_reviews_own on public.phrase_reviews
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- updated_at trigger
drop trigger if exists phrase_reviews_set_updated_at on public.phrase_reviews;
create trigger phrase_reviews_set_updated_at
  before update on public.phrase_reviews
  for each row execute function public.set_updated_at();

-- Xoa du lieu phrase khi xoa tai khoan
create or replace function public.delete_phrase_data()
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
  delete from public.phrase_reviews where user_id = uid;
end;
$$;

-- Them xoa du lieu phrase vao ham xoa tai khoan hien co (neu can)
grant execute on function public.delete_phrase_data() to authenticated;
