-- Mirror Recordings (Weekly Before/After)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Mirror recordings table
CREATE TABLE IF NOT EXISTS public.mirror_recordings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_num INTEGER NOT NULL CHECK (week_num BETWEEN 1 AND 26),
    question_key TEXT NOT NULL CHECK (question_key IN (
        'self_intro', 'work_description', 'weekend_recap', 'topic_weekly'
    )),
    question_text_en TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    audio_duration_sec REAL,
    file_size_bytes INTEGER,
    
    -- Metrics
    wpm REAL,
    word_count INTEGER,
    pauses_over_3s INTEGER,
    filler_count INTEGER,
    vi_segments INTEGER DEFAULT 0,
    onset_latency_ms INTEGER,
    
    -- Transcript
    transcript TEXT,
    detected_language TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, week_num, question_key)
);

CREATE INDEX IF NOT EXISTS idx_mirror_recordings_user_week
    ON public.mirror_recordings (user_id, week_num);

ALTER TABLE public.mirror_recordings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own mirror recordings" ON public.mirror_recordings;
CREATE POLICY "Users manage own mirror recordings"
    ON public.mirror_recordings FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full mirror" ON public.mirror_recordings;
CREATE POLICY "Service role full mirror"
    ON public.mirror_recordings FOR ALL
    TO service_role
    USING (true);

-- 2. Weekly Mirror Comparison View
-- Compares each week to Week 1 baseline
CREATE OR REPLACE VIEW public.weekly_mirror_comparison AS
SELECT
    m1.user_id,
    m1.week_num AS current_week,
    m1.question_key,
    m1.wpm AS current_wpm,
    m1.pauses_over_3s AS current_pauses,
    m1.vi_segments AS current_vi_segments,
    m1.onset_latency_ms AS current_latency,
    m1.audio_duration_sec AS current_duration,
    m1.transcript AS current_transcript,
    m1.storage_path AS current_storage_path,
    m0.wpm AS week1_wpm,
    m0.pauses_over_3s AS week1_pauses,
    m0.vi_segments AS week1_vi_segments,
    m0.onset_latency_ms AS week1_latency,
    m0.audio_duration_sec AS week1_duration,
    m0.transcript AS week1_transcript,
    m0.storage_path AS week1_storage_path,
    CASE 
        WHEN m0.wpm IS NOT NULL AND m0.wpm > 0 
        THEN ROUND((((m1.wpm - m0.wpm) / m0.wpm) * 100)::numeric, 1) 
        ELSE NULL 
    END AS wpm_change_pct,
    (m1.pauses_over_3s - m0.pauses_over_3s) AS pause_change,
    (m1.vi_segments - m0.vi_segments) AS vi_change,
    (m1.onset_latency_ms - m0.onset_latency_ms) AS latency_change
FROM public.mirror_recordings m1
LEFT JOIN public.mirror_recordings m0
    ON m0.user_id = m1.user_id
    AND m0.week_num = 1
    AND m0.question_key = m1.question_key
WHERE m1.week_num > 1;

GRANT SELECT ON public.weekly_mirror_comparison TO authenticated;
GRANT SELECT ON public.weekly_mirror_comparison TO service_role;