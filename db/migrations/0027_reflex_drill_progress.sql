-- 0027: Reflex Drills progress persistence
-- Saves per-account learning progress for reflex drills (morning/noon/evening/review5 modes).

CREATE TABLE IF NOT EXISTS reflex_drill_progress (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day INTEGER NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('morning', 'noon', 'evening', 'review5')),
    completed_ids TEXT[] NOT NULL DEFAULT '{}',
    results JSONB NOT NULL DEFAULT '[]',
    queue_position INTEGER NOT NULL DEFAULT 0,
    total_count INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, day, mode)
);

ALTER TABLE reflex_drill_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own reflex drill progress"
    ON reflex_drill_progress FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);