-- Phase 8: Performance - Database Indexes
-- Add missing indexes for frequently queried columns

-- Words table: index on lemma for search (already exists: words_lemma_idx)
-- Add index on cefr_level for filtering
CREATE INDEX IF NOT EXISTS words_cefr_level_idx ON public.words (cefr_level);

-- Card reviews: ensure index on user_id + due_at exists
-- Already exists: card_reviews_due_idx (user_id, due_at)
-- Add index on word_id for lookups
CREATE INDEX IF NOT EXISTS card_reviews_word_id_idx ON public.card_reviews (word_id);

-- Speaking turns: index on session_id for history queries
CREATE INDEX IF NOT EXISTS speaking_turns_session_id_idx ON public.speaking_turns (session_id);

-- Speaking sessions: index on user_id + created_at
CREATE INDEX IF NOT EXISTS speaking_sessions_user_idx ON public.speaking_sessions (user_id, created_at DESC);

-- Daily progress: index on user_id + date
CREATE INDEX IF NOT EXISTS daily_progress_user_date_idx ON public.daily_progress (user_id, date DESC);

-- AI usage log: index on user_id + created_at
CREATE INDEX IF NOT EXISTS ai_usage_log_user_idx ON public.ai_usage_log (user_id, created_at DESC);

-- Recordings: index on user_id
CREATE INDEX IF NOT EXISTS recordings_user_idx ON public.recordings (user_id, created_at DESC);

-- Dictation attempts: index on user_id
CREATE INDEX IF NOT EXISTS dictation_attempts_user_idx ON public.dictation_attempts (user_id, created_at DESC);