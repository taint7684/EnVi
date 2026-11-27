-- Reflex Phrases (1,456 phrases = 26 topics × 7 days × 8 phrases)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Reflex phrases table
CREATE TABLE IF NOT EXISTS public.reflex_phrases (
    id TEXT PRIMARY KEY,
    vi_text TEXT NOT NULL,
    en_text TEXT NOT NULL,
    audio_url TEXT,
    situation_en TEXT NOT NULL,
    en_alternatives TEXT[] NOT NULL DEFAULT '{}',
    keywords TEXT[] NOT NULL DEFAULT '{}',
    sentence_type TEXT NOT NULL CHECK (sentence_type IN ('qa', 'situation', 'continue', 'paraphrase', 'circumlocution')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('A1', 'A2', 'B1', 'B2')),
    level TEXT NOT NULL CHECK (level IN ('L1', 'L2', 'L3')),
    topic TEXT NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
    reflex_reviewed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.reflex_phrases ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Authenticated read reflex phrases" ON public.reflex_phrases;
CREATE POLICY "Authenticated read reflex phrases" ON public.reflex_phrases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full reflex phrases" ON public.reflex_phrases;
CREATE POLICY "Service role full reflex phrases" ON public.reflex_phrases FOR ALL TO service_role USING (true);

-- 4. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_reflex_phrases_topic ON public.reflex_phrases (topic);
CREATE INDEX IF NOT EXISTS idx_reflex_phrases_sentence_type ON public.reflex_phrases (sentence_type);
CREATE INDEX IF NOT EXISTS idx_reflex_phrases_level ON public.reflex_phrases (level);
CREATE INDEX IF NOT EXISTS idx_reflex_phrases_difficulty ON public.reflex_phrases (difficulty);

-- 5. Trigger for updated_at (if needed later)
-- No updated_at column currently, but we can add one if needed