-- Feature Flags System (Server-Side)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Create feature_flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
    key TEXT PRIMARY KEY,
    enabled BOOLEAN NOT NULL DEFAULT false,
    rollout_pct INTEGER NOT NULL DEFAULT 0 CHECK (rollout_pct BETWEEN 0 AND 100),
    target_groups TEXT[] NOT NULL DEFAULT '{}', -- e.g., ['beta', 'internal']
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Enable RLS
ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- 3. Policy: authenticated users can read flags
CREATE POLICY "Authenticated users can read feature flags"
    ON public.feature_flags FOR SELECT
    TO authenticated
    USING (true);

-- 4. Policy: only service role can modify
CREATE POLICY "Service role manages feature flags"
    ON public.feature_flags FOR ALL
    TO service_role
    USING (true);

-- 5. Add updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_updated_at
    BEFORE UPDATE ON public.feature_flags
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Seed default flags (idempotent)
INSERT INTO public.feature_flags (key, enabled, rollout_pct, target_groups, description) VALUES
    ('reflex_pure_only', true, 100, '{}', 'Default to pure mode only; hide VI→EN reflex mode'),
    ('picture_talk_mandatory_retry', true, 100, '{}', 'Require retry after feedback in Picture Talk'),
    ('speaking_freetalk_default', true, 100, '{}', 'Free Talk is default mode (no scoring)'),
    ('vocab_3000_filter', true, 100, '{}', 'Show only top 3000 words by default'),
    ('grammar_translation_hidden', true, 100, '{}', 'Hide VI→EN grammar translation exercises'),
    ('reading_hidden', true, 100, '{}', 'Hide Reading module from /today'),
    ('writing_hidden', true, 100, '{}', 'Hide Writing module from /today'),
    ('listening_hidden', true, 100, '{}', 'Hide Listening module from /today'),
    ('self_talk_hidden', true, 100, '{}', 'Hide old Self-Talk (replaced by Voice Diary)'),
    ('progress_test_hidden', true, 100, '{}', 'Hide 14-day progress test'),
    ('shadowing_weekly_sentence', true, 100, '{}', 'Use weekly curriculum sentence for Shadowing warmup'),
    ('mirror_recordings', true, 100, '{}', 'Enable weekly Mirror recordings'),
    ('real_world_ladder', true, 100, '{}', 'Enable Real-World weekly tasks'),
    ('assessment_cefr_rubric', true, 100, '{}', 'Use CEFR speaking rubric for assessments'),
    ('xp_speaking_seconds', true, 100, '{}', 'XP based on speaking seconds, not passive actions')
ON CONFLICT (key) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    rollout_pct = EXCLUDED.rollout_pct,
    target_groups = EXCLUDED.target_groups,
    description = EXCLUDED.description,
    updated_at = now();

-- 7. Helper function to check flag (for server-side use)
CREATE OR REPLACE FUNCTION public.is_feature_enabled(p_key TEXT, p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_flag RECORD;
    v_in_group BOOLEAN := false;
BEGIN
    SELECT * INTO v_flag FROM public.feature_flags WHERE key = p_key;
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    IF NOT v_flag.enabled THEN
        RETURN false;
    END IF;
    IF v_flag.rollout_pct >= 100 THEN
        RETURN true;
    END IF;
    IF v_flag.rollout_pct <= 0 THEN
        RETURN false;
    END IF;
    -- Simple deterministic rollout by user_id hash
    IF p_user_id IS NOT NULL THEN
        -- Use last 2 hex chars of UUID as 0-255, map to 0-99
        DECLARE
            v_hash INT := (('x' || substr(p_user_id::TEXT, 25, 2))::BIT(8)::INT) % 100;
        BEGIN
            RETURN v_hash < v_flag.rollout_pct;
        END;
    ELSE
        RETURN false;
    END IF;
END $$;

GRANT EXECUTE ON FUNCTION public.is_feature_enabled(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_feature_enabled(TEXT, UUID) TO service_role;