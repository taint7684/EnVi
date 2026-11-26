-- Create phrases table (if not exists) + add sentence_type
-- Run in Supabase Dashboard → SQL Editor

-- 1. Create phrases table
CREATE TABLE IF NOT EXISTS public.phrases (
    id TEXT PRIMARY KEY,
    vi_text TEXT NOT NULL,
    en_text TEXT NOT NULL,
    audio_url TEXT,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    level TEXT CHECK (level IN ('L1', 'L2', 'L3')),
    en_alternatives TEXT[] NOT NULL DEFAULT '{}',
    situation_en TEXT,
    keywords TEXT[] NOT NULL DEFAULT '{}',
    reflex_reviewed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sentence_type TEXT CHECK (sentence_type IN ('qa', 'situation', 'continue', 'paraphrase', 'circumlocution'))
);

-- 2. Enable RLS
ALTER TABLE public.phrases ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Authenticated read phrases" ON public.phrases;
CREATE POLICY "Authenticated read phrases" ON public.phrases FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full phrases" ON public.phrases;
CREATE POLICY "Service role full phrases" ON public.phrases FOR ALL TO service_role USING (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_phrases_topic ON public.phrases(topic);
CREATE INDEX IF NOT EXISTS idx_phrases_level ON public.phrases(level);
CREATE INDEX IF NOT EXISTS idx_phrases_difficulty ON public.phrases(difficulty);
CREATE INDEX IF NOT EXISTS idx_phrases_sentence_type ON public.phrases(sentence_type);

-- 5. phrase_reviews table (for FSRS)
CREATE TABLE IF NOT EXISTS public.phrase_reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phrase_id TEXT NOT NULL REFERENCES public.phrases(id) ON DELETE CASCADE,
    ease REAL NOT NULL DEFAULT 2.5,
    interval INTEGER NOT NULL DEFAULT 0,
    due_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reps INTEGER NOT NULL DEFAULT 0,
    lapses INTEGER NOT NULL DEFAULT 0,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, phrase_id)
);

ALTER TABLE public.phrase_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own phrase reviews" ON public.phrase_reviews;
CREATE POLICY "Users manage own phrase reviews" ON public.phrase_reviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full phrase_reviews" ON public.phrase_reviews;
CREATE POLICY "Service role full phrase_reviews" ON public.phrase_reviews FOR ALL TO service_role USING (true);

CREATE INDEX IF NOT EXISTS idx_phrase_reviews_user_due ON public.phrase_reviews(user_id, due_at);

-- 6. handle_updated_at trigger for phrase_reviews
DROP TRIGGER IF EXISTS phrase_reviews_updated_at ON public.phrase_reviews;
CREATE TRIGGER phrase_reviews_updated_at
    BEFORE UPDATE ON public.phrase_reviews
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();