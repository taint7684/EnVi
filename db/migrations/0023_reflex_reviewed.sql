-- S12i: Reflex core data - them cot reflex_reviewed de danh dau noi dung AI sinh
-- reviewed = false cho noi dung AI chua duoc duyet; app van dung duoc
-- reviewed = true khi user/admin da duyet chat luong

alter table public.phrases
  add column if not exists reflex_reviewed boolean not null default false;

comment on column public.phrases.reflex_reviewed is 'false = AI-generated content (en_alternatives/situation_en/keywords) chua duoc duyet; true = da review';