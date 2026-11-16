-- EnVi — Phase 1: bo sung cho bang words
-- 0001_init.sql da tao cot needs_review (default true) nen khong them lai.
-- Moi thay doi schema di qua migration moi, KHONG sua 0001_init.sql.

alter table public.words add column if not exists cefr_level text;

-- Uu tien Oxford khi trung NGSL: moi (lemma, source) la duy nhat de upsert.
create unique index if not exists words_lemma_source_uidx
  on public.words (lemma, source);

create index if not exists words_source_idx on public.words (source);