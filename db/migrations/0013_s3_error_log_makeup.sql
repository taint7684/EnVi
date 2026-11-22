-- 0013_s3_error_log_makeup.sql
-- S3: So tay loi + Bai bu thuc (khong hardcode, sinh tu loi cua chinh user).
-- Chi them bang moi, khong xoa du lieu cu.

-- ---------- Su kien loi (moi lan mac loi) ----------
create table if not exists public.error_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  source text not null check (source in ('speaking','mission','reflex','writing','dictation','grammar','reading','pronunciation','shadowing','listening')),
  source_ref uuid,
  type text not null check (type in ('meaning','grammar','vocab','pronunciation','fluency','pragmatics','listening')),
  pattern_key text not null,
  original text not null,
  correction text not null,
  explanation_vi text,
  severity int not null default 1 check (severity between 1 and 3),
  created_at timestamptz not null default now()
);
alter table public.error_events enable row level security;
create policy error_events_own on public.error_events for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists error_events_user_created_idx on public.error_events(user_id, created_at desc);
create index if not exists error_events_user_pattern_idx on public.error_events(user_id, pattern_key);

-- ---------- Mau loi gop theo nguoi dung ----------
create table if not exists public.error_patterns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pattern_key text not null,
  count int not null default 1,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  status text not null default 'new' check (status in ('new','practicing','mastered','dismissed')),
  mastery_streak int not null default 0,
  next_check_at timestamptz,
  examples jsonb not null default '[]',
  unique (user_id, pattern_key)
);
alter table public.error_patterns enable row level security;
create policy error_patterns_own on public.error_patterns for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists error_patterns_user_status_idx on public.error_patterns(user_id, status);
create index if not exists error_patterns_user_next_check_idx on public.error_patterns(user_id, next_check_at);

-- ---------- Catalog mau loi (noi dung, chia cho tat ca nguoi dung) ----------
create table if not exists public.pattern_catalog (
  id uuid primary key default gen_random_uuid(),
  pattern_key text unique not null,
  title_vi text not null,
  explanation_vi text not null,
  rule text,
  examples jsonb not null default '[]',
  grammar_topic_id uuid,
  pronunciation_focus_id uuid,
  drills jsonb not null default '[]',
  created_at timestamptz not null default now()
);
alter table public.pattern_catalog enable row level security;
create policy pattern_catalog_read on public.pattern_catalog for select to authenticated using (true);

-- ---------- Bai bu (sinh tu loi cua chinh user) ----------
create table if not exists public.makeup_lessons (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  pattern_key text not null,
  status text not null default 'ready' check (status in ('ready','in_progress','done','skipped')),
  content jsonb not null default '{}',
  progress jsonb not null default '{}',
  score int,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
alter table public.makeup_lessons enable row level security;
create policy makeup_lessons_own on public.makeup_lessons for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create index if not exists makeup_lessons_user_status_idx on public.makeup_lessons(user_id, status);

-- ---------- Trigger: error_events -> error_patterns ----------
create or replace function public.sync_error_patterns()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_pattern record;
  v_examples jsonb;
begin
  select * into v_pattern
  from public.error_patterns
  where user_id = NEW.user_id and pattern_key = NEW.pattern_key
  for update;

  if v_pattern is null then
    insert into public.error_patterns (
      user_id, pattern_key, count, first_seen, last_seen, status, mastery_streak, next_check_at, examples
    ) values (
      NEW.user_id, NEW.pattern_key, 1, NEW.created_at, NEW.created_at, 'new', 0,
      NEW.created_at + interval '1 day', jsonb_build_array(jsonb_build_object('original', NEW.original, 'correction', NEW.correction, 'at', NEW.created_at))
    );
    return NEW;
  end if;

  update public.error_patterns
  set count = count + 1,
      last_seen = NEW.created_at,
      status = case when status = 'dismissed' then status else 'new' end
  where id = v_pattern.id;

  select coalesce(examples, '[]'::jsonb) into v_examples from public.error_patterns where id = v_pattern.id;
  v_examples := v_examples || jsonb_build_array(jsonb_build_object('original', NEW.original, 'correction', NEW.correction, 'at', NEW.created_at));
  if jsonb_array_length(v_examples) > 5 then
    v_examples := v_examples #- '{0}';
  end if;

  update public.error_patterns
  set examples = v_examples
  where id = v_pattern.id;

  return NEW;
end;
$$;

create trigger trg_sync_error_patterns
after insert on public.error_events
for each row execute function public.sync_error_patterns();

-- ---------- Cap nhat xoa tai khoan ----------
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
  delete from public.profiles where id = uid;
  delete from auth.users where id = uid;
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
