-- Vocab Reviews Table for Flashcard FSRS tracking
-- Run in Supabase Dashboard → SQL Editor

-- 1. Vocab reviews table
CREATE TABLE IF NOT EXISTS public.vocab_reviews (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    card_id TEXT NOT NULL, -- References phrases.id or chunks.id
    grade TEXT NOT NULL CHECK (grade IN ('again', 'hard', 'good', 'easy')),
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.vocab_reviews ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Users manage own vocab reviews" ON public.vocab_reviews;
CREATE POLICY "Users manage own vocab reviews" ON public.vocab_reviews FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full vocab reviews" ON public.vocab_reviews;
CREATE POLICY "Service role full vocab reviews" ON public.vocab_reviews FOR ALL TO service_role USING (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_user ON public.vocab_reviews (user_id);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_card ON public.vocab_reviews (card_id);
CREATE INDEX IF NOT EXISTS idx_vocab_reviews_reviewed_at ON public.vocab_reviews (reviewed_at);