-- S12h: Reflex core data - them cot en_alternatives, situation_en, keywords
-- Spec yeu cau: cham lexical >= 0.75 tren en_text + en_alternatives,
-- L2 = tinh huong tieng Anh (situation_en), L3 = Q&A,
-- neu chua dat nhung du tu khoa thi AI judge "cung nghia?"

alter table public.phrases
  add column if not exists en_alternatives text[] not null default '{}',
  add column if not exists situation_en text,
  add column if not exists keywords text[] not null default '{}';

-- Index cho truy van nhanh theo level + situation
create index if not exists phrases_level_idx on public.phrases (difficulty);

comment on column public.phrases.en_alternatives is 'Cac cau tra loi dung khac (cham lexical >= 0.75 tren tap hop nay + en_text)';
comment on column public.phrases.situation_en is 'Tinh huong tieng Anh cho L2 (prompt ladder)';
comment on column public.phrases.keywords is 'Tu khoa quan trong (dung de cham khi lexical that bai, AI judge cung nghia)';