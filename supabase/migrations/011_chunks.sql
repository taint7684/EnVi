-- Chunks Table (180 days × 5 chunks = 900 chunks)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Chunks table
CREATE TABLE IF NOT EXISTS public.chunks (
    id TEXT PRIMARY KEY,
    day_index INTEGER NOT NULL CHECK (day_index BETWEEN 1 AND 180),
    chunk_key TEXT NOT NULL,
    vi_text TEXT NOT NULL,
    en_text TEXT NOT NULL,
    category TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('A2', 'B1', 'B2')),
    example_context TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (day_index, chunk_key)
);

-- 2. Enable RLS
ALTER TABLE public.chunks ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Authenticated read chunks" ON public.chunks;
CREATE POLICY "Authenticated read chunks" ON public.chunks FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Service role full chunks" ON public.chunks;
CREATE POLICY "Service role full chunks" ON public.chunks FOR ALL TO service_role USING (true);

-- 4. Indexes
CREATE INDEX IF NOT EXISTS idx_chunks_day_index ON public.chunks (day_index);
CREATE INDEX IF NOT EXISTS idx_chunks_chunk_key ON public.chunks (chunk_key);
CREATE INDEX IF NOT EXISTS idx_chunks_category ON public.chunks (category);
CREATE INDEX IF NOT EXISTS idx_chunks_difficulty ON public.chunks (difficulty);