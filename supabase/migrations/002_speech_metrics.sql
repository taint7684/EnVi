-- Unified Speech Metrics Table (Per-Turn)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Create speech_metrics table
CREATE TABLE IF NOT EXISTS public.speech_metrics (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module TEXT NOT NULL CHECK (module IN (
        'reflex', 'speaking', 'picture_talk', 'shadowing',
        'pronunciation', 'reading_aloud', 'voice_diary', 'real_world', 'mirror'
    )),
    ref_id TEXT, -- phrase_id, turn_id, image_id, lesson_id, etc.
    day_index INTEGER, -- curriculum day index (1-180)
    week_index INTEGER, -- curriculum week (1-26)
    layer TEXT CHECK (layer IN ('L1', 'L2', 'L3')),
    topic TEXT, -- curriculum topic key

    -- Timing metrics
    audio_duration_ms INTEGER, -- total speech duration
    onset_latency_ms INTEGER, -- TTS end → first speech detected (VAD)
    vad_confidence REAL, -- 0.0-1.0 VAD confidence

    -- Transcript & accuracy
    transcript TEXT, -- STT result
    reference_text TEXT, -- expected/reference text
    wer REAL, -- Word Error Rate (0.0-1.0)
    cer REAL, -- Character Error Rate (0.0-1.0)

    -- Fluency metrics
    word_count INTEGER,
    wpm REAL, -- Words Per Minute
    pauses_over_3s INTEGER, -- count of pauses > 3 seconds
    filler_count INTEGER, -- um, uh, er, ah, hmm, like, you know

    -- Language detection
    vi_segments INTEGER DEFAULT 0, -- count of Vietnamese segments detected
    detected_language TEXT, -- 'en', 'vi', 'mixed', etc.

    -- Lifeline usage
    lifeline_used BOOLEAN DEFAULT false,
    lifeline_type TEXT, -- 'translate', 'hint', 'sample_peek'

    -- AI Feedback (JSON)
    ai_feedback JSONB, -- { praise, natural_alternative, chunk_to_reuse, errors[], scores{} }

    -- Scoring
    fluency_score REAL, -- 0-100
    accuracy_score REAL, -- 0-100
    prosody_score REAL, -- 0-100

    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_speech_metrics_user_module
    ON public.speech_metrics (user_id, module, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_speech_metrics_user_day
    ON public.speech_metrics (user_id, day_index, module);

CREATE INDEX IF NOT EXISTS idx_speech_metrics_user_week
    ON public.speech_metrics (user_id, week_index, module);

CREATE INDEX IF NOT EXISTS idx_speech_metrics_user_topic
    ON public.speech_metrics (user_id, topic, created_at DESC);

-- 3. Enable RLS
ALTER TABLE public.speech_metrics ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Users can read own speech metrics"
    ON public.speech_metrics FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own speech metrics"
    ON public.speech_metrics FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access"
    ON public.speech_metrics FOR ALL
    TO service_role
    USING (true);

-- 5. Helper function: get North Star metrics for a user
CREATE OR REPLACE FUNCTION public.get_north_star_metrics(p_user_id UUID)
RETURNS TABLE (
    speaking_minutes_today INT,
    speaking_minutes_week INT,
    speaking_sessions_week INT,
    avg_wpm_week REAL,
    avg_latency_ms_week REAL,
    vi_segments_week INT,
    lifeline_used_week INT,
    streak_days INT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_today_start TIMESTAMPTZ := now()::DATE;
    v_week_start TIMESTAMPTZ := (now() - INTERVAL '6 days')::DATE;
BEGIN
    RETURN QUERY
    SELECT
        -- Today speaking minutes
        COALESCE(ROUND(SUM(CASE WHEN created_at >= v_today_start THEN audio_duration_ms ELSE 0 END) / 60000.0)::INT, 0),
        -- Week speaking minutes
        COALESCE(ROUND(SUM(CASE WHEN created_at >= v_week_start THEN audio_duration_ms ELSE 0 END) / 60000.0)::INT, 0),
        -- Week speaking sessions (distinct ref_id groups or sessions)
        COUNT(DISTINCT CASE WHEN created_at >= v_week_start AND module IN ('speaking', 'picture_talk', 'real_world') THEN ref_id END)::INT,
        -- Week weighted WPM
        CASE
            WHEN SUM(CASE WHEN created_at >= v_week_start AND wpm > 0 THEN audio_duration_ms ELSE 0 END) > 0
            THEN ROUND(
                SUM(CASE WHEN created_at >= v_week_start AND wpm > 0 THEN wpm * audio_duration_ms ELSE 0 END) /
                SUM(CASE WHEN created_at >= v_week_start AND wpm > 0 THEN audio_duration_ms ELSE 0 END) * 10
            ) / 10.0
            ELSE NULL
        END,
        -- Week avg onset latency (Reflex only)
        CASE
            WHEN COUNT(CASE WHEN created_at >= v_week_start AND module = 'reflex' AND onset_latency_ms IS NOT NULL THEN 1 END) > 0
            THEN ROUND(AVG(CASE WHEN created_at >= v_week_start AND module = 'reflex' THEN onset_latency_ms END))
            ELSE NULL
        END,
        -- Week VI segments
        COALESCE(SUM(CASE WHEN created_at >= v_week_start THEN vi_segments ELSE 0 END)::INT, 0),
        -- Week lifeline used
        COALESCE(SUM(CASE WHEN created_at >= v_week_start AND lifeline_used THEN 1 ELSE 0 END)::INT, 0),
        -- Streak (from daily_progress)
        (SELECT COALESCE(streak, 0) FROM public.daily_progress WHERE user_id = p_user_id ORDER BY date DESC LIMIT 1)
    FROM public.speech_metrics
    WHERE user_id = p_user_id;
END $$;

GRANT EXECUTE ON FUNCTION public.get_north_star_metrics(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_north_star_metrics(UUID) TO service_role;

-- 6. Helper function: insert speech metric (simplified for client/server)
CREATE OR REPLACE FUNCTION public.log_speech_metric(
    p_module TEXT,
    p_ref_id TEXT DEFAULT NULL,
    p_day_index INT DEFAULT NULL,
    p_layer TEXT DEFAULT NULL,
    p_topic TEXT DEFAULT NULL,
    p_audio_duration_ms INT DEFAULT NULL,
    p_onset_latency_ms INT DEFAULT NULL,
    p_vad_confidence REAL DEFAULT NULL,
    p_transcript TEXT DEFAULT NULL,
    p_reference_text TEXT DEFAULT NULL,
    p_wer REAL DEFAULT NULL,
    p_cer REAL DEFAULT NULL,
    p_word_count INT DEFAULT NULL,
    p_wpm REAL DEFAULT NULL,
    p_pauses_over_3s INT DEFAULT NULL,
    p_filler_count INT DEFAULT NULL,
    p_vi_segments INT DEFAULT 0,
    p_detected_language TEXT DEFAULT NULL,
    p_lifeline_used BOOLEAN DEFAULT false,
    p_lifeline_type TEXT DEFAULT NULL,
    p_ai_feedback JSONB DEFAULT NULL,
    p_fluency_score REAL DEFAULT NULL,
    p_accuracy_score REAL DEFAULT NULL,
    p_prosody_score REAL DEFAULT NULL
) RETURNS BIGINT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_id BIGINT;
    v_week_index INT;
BEGIN
    v_week_index := CASE
        WHEN p_day_index IS NOT NULL AND p_day_index > 0 THEN ((p_day_index - 1) / 7) + 1
        ELSE NULL
    END;

    INSERT INTO public.speech_metrics (
        user_id, module, ref_id, day_index, week_index, layer, topic,
        audio_duration_ms, onset_latency_ms, vad_confidence,
        transcript, reference_text, wer, cer,
        word_count, wpm, pauses_over_3s, filler_count,
        vi_segments, detected_language,
        lifeline_used, lifeline_type, ai_feedback,
        fluency_score, accuracy_score, prosody_score
    ) VALUES (
        auth.uid(), p_module, p_ref_id, p_day_index, v_week_index, p_layer, p_topic,
        p_audio_duration_ms, p_onset_latency_ms, p_vad_confidence,
        p_transcript, p_reference_text, p_wer, p_cer,
        p_word_count, p_wpm, p_pauses_over_3s, p_filler_count,
        p_vi_segments, p_detected_language,
        p_lifeline_used, p_lifeline_type, p_ai_feedback,
        p_fluency_score, p_accuracy_score, p_prosody_score
    ) RETURNING id INTO v_id;

    RETURN v_id;
END $$;

GRANT EXECUTE ON FUNCTION public.log_speech_metric(
    TEXT, TEXT, INT, TEXT, TEXT, INT, INT, REAL, TEXT, TEXT, REAL, REAL,
    INT, REAL, INT, INT, INT, TEXT, BOOLEAN, TEXT, JSONB, REAL, REAL, REAL
) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_speech_metric(
    TEXT, TEXT, INT, TEXT, TEXT, INT, INT, REAL, TEXT, TEXT, REAL, REAL,
    INT, REAL, INT, INT, INT, TEXT, BOOLEAN, TEXT, JSONB, REAL, REAL, REAL
) TO service_role;