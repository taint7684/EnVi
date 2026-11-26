-- Picture Talk Sets (52 sets = 26 topics × 2 layers L1/L2)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Picture Talk image sets table
CREATE TABLE IF NOT EXISTS public.picture_talk_sets (
    id BIGSERIAL PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
    layer TEXT NOT NULL CHECK (layer IN ('L1', 'L2')),
    round_num INTEGER NOT NULL CHECK (round_num IN (1, 2)),
    image_set_id TEXT NOT NULL UNIQUE,
    images JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (topic_id, layer)
);

-- 2. Enable RLS
ALTER TABLE public.picture_talk_sets ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Authenticated read picture talk sets" ON public.picture_talk_sets;
CREATE POLICY "Authenticated read picture talk sets" ON public.picture_talk_sets FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full picture talk sets" ON public.picture_talk_sets;
CREATE POLICY "Service role full picture talk sets" ON public.picture_talk_sets FOR ALL TO service_role USING (true);

-- 4. Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_picture_talk_sets_topic_layer ON public.picture_talk_sets (topic_id, layer);
CREATE INDEX IF NOT EXISTS idx_picture_talk_sets_image_set_id ON public.picture_talk_sets (image_set_id);