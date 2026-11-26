-- User Notification Preferences Table
-- Run in Supabase Dashboard → SQL Editor

-- 1. User notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_reminder BOOLEAN NOT NULL DEFAULT true,
    streak_reminder BOOLEAN NOT NULL DEFAULT true,
    weekly_report BOOLEAN NOT NULL DEFAULT true,
    reminder_time TIME NOT NULL DEFAULT '20:00',
    timezone TEXT NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- 2. Enable RLS
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;

-- 3. Policies
DROP POLICY IF EXISTS "Users manage own notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Users manage own notification preferences" ON public.user_notification_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full notification preferences" ON public.user_notification_preferences;
CREATE POLICY "Service role full notification preferences" ON public.user_notification_preferences FOR ALL TO service_role USING (true);

-- 4. Index
CREATE INDEX IF NOT EXISTS idx_user_notification_preferences_user ON public.user_notification_preferences (user_id);

-- 5. Updated_at trigger
DROP TRIGGER IF EXISTS user_notification_preferences_updated_at ON public.user_notification_preferences;
CREATE TRIGGER user_notification_preferences_updated_at
    BEFORE UPDATE ON public.user_notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();