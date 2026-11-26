-- Gamification System (P4)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Achievement definitions (static reference)
CREATE TABLE IF NOT EXISTS public.achievements (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('streak', 'speaking', 'assessment', 'curriculum', 'real_world', 'social')),
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_vi TEXT NOT NULL,
    description_en TEXT NOT NULL,
    icon TEXT NOT NULL,
    tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond')),
    xp_reward INTEGER NOT NULL DEFAULT 0,
    requirement_json JSONB NOT NULL, -- e.g., {"streak_days": 7} or {"total_speaking_min": 600}
    is_hidden BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. User achievements (earned)
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id TEXT NOT NULL REFERENCES public.achievements(id),
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    progress_json JSONB, -- current progress toward achievement
    UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements (user_id);

-- 3. Daily quests (static templates)
CREATE TABLE IF NOT EXISTS public.daily_quest_templates (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL CHECK (category IN ('speaking', 'reflex', 'vocab', 'shadowing', 'picture_talk', 'chunks', 'voice_diary', 'assessment', 'real_world')),
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_vi TEXT NOT NULL,
    description_en TEXT NOT NULL,
    target_metric TEXT NOT NULL, -- e.g., 'speaking_minutes', 'reflex_phrases', 'shadowing_segments'
    target_value INTEGER NOT NULL,
    xp_reward INTEGER NOT NULL DEFAULT 50,
    streak_bonus_xp INTEGER NOT NULL DEFAULT 0, -- bonus for completing N days in a row
    is_weekend_only BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User daily quests (generated daily)
CREATE TABLE IF NOT EXISTS public.user_daily_quests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    quest_date DATE NOT NULL, -- VN timezone, 03:00 cutoff
    template_id TEXT NOT NULL REFERENCES public.daily_quest_templates(id),
    target_value INTEGER NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMPTZ,
    xp_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, quest_date, template_id)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_quests_date ON public.user_daily_quests (user_id, quest_date);

-- 5. Weekly leaderboard snapshots
CREATE TABLE IF NOT EXISTS public.weekly_leaderboard (
    id BIGSERIAL PRIMARY KEY,
    week_num INTEGER NOT NULL CHECK (week_num BETWEEN 1 AND 52),
    year INTEGER NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_xp INTEGER NOT NULL DEFAULT 0,
    speaking_minutes INTEGER NOT NULL DEFAULT 0,
    streak_days INTEGER NOT NULL DEFAULT 0,
    quests_completed INTEGER NOT NULL DEFAULT 0,
    rank INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (week_num, year, user_id)
);

CREATE INDEX IF NOT EXISTS idx_weekly_leaderboard_week ON public.weekly_leaderboard (week_num, year, rank);

-- 6. User profile/stats (denormalized for leaderboard)
CREATE TABLE IF NOT EXISTS public.user_gamification_profile (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name TEXT,
    avatar_url TEXT,
    total_xp INTEGER NOT NULL DEFAULT 0,
    current_level INTEGER NOT NULL DEFAULT 1,
    xp_to_next_level INTEGER NOT NULL DEFAULT 1000,
    current_streak INTEGER NOT NULL DEFAULT 0,
    longest_streak INTEGER NOT NULL DEFAULT 0,
    total_speaking_minutes INTEGER NOT NULL DEFAULT 0,
    total_quests_completed INTEGER NOT NULL DEFAULT 0,
    achievements_unlocked INTEGER NOT NULL DEFAULT 0,
    last_quest_date DATE,
    quest_streak INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_quest_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification_profile ENABLE ROW LEVEL SECURITY;

-- 8. Policies
DROP POLICY IF EXISTS "Authenticated read achievements" ON public.achievements;
CREATE POLICY "Authenticated read achievements" ON public.achievements FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users manage own achievements" ON public.user_achievements;
CREATE POLICY "Users manage own achievements" ON public.user_achievements FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated read quest templates" ON public.daily_quest_templates;
CREATE POLICY "Authenticated read quest templates" ON public.daily_quest_templates FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users manage own daily quests" ON public.user_daily_quests;
CREATE POLICY "Users manage own daily quests" ON public.user_daily_quests FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authenticated read leaderboard" ON public.weekly_leaderboard;
CREATE POLICY "Authenticated read leaderboard" ON public.weekly_leaderboard FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users manage own gamification profile" ON public.user_gamification_profile;
CREATE POLICY "Users manage own gamification profile" ON public.user_gamification_profile FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role
DROP POLICY IF EXISTS "Service role full achievements" ON public.achievements;
CREATE POLICY "Service role full achievements" ON public.achievements FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role full user_achievements" ON public.user_achievements;
CREATE POLICY "Service role full user_achievements" ON public.user_achievements FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role full quest_templates" ON public.daily_quest_templates;
CREATE POLICY "Service role full quest_templates" ON public.daily_quest_templates FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role full user_daily_quests" ON public.user_daily_quests;
CREATE POLICY "Service role full user_daily_quests" ON public.user_daily_quests FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role full weekly_leaderboard" ON public.weekly_leaderboard;
CREATE POLICY "Service role full weekly_leaderboard" ON public.weekly_leaderboard FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role full user_gamification_profile" ON public.user_gamification_profile;
CREATE POLICY "Service role full user_gamification_profile" ON public.user_gamification_profile FOR ALL TO service_role USING (true);

-- 9. Updated_at trigger for profile
DROP TRIGGER IF EXISTS user_gamification_profile_updated_at ON public.user_gamification_profile;
CREATE TRIGGER user_gamification_profile_updated_at
    BEFORE UPDATE ON public.user_gamification_profile
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 10. Seed achievements
INSERT INTO public.achievements (id, category, name_vi, name_en, description_vi, description_en, icon, tier, xp_reward, requirement_json) VALUES
-- Streak achievements
('streak_3', 'streak', 'Khởi đầu tốt', 'Good Start', 'Duy trì chuỗi 3 ngày liên tiếp', 'Maintain a 3-day streak', '🔥', 'bronze', 100, '{"streak_days": 3}'),
('streak_7', 'streak', 'Tuần hoàn hảo', 'Perfect Week', 'Duy trì chuỗi 7 ngày liên tiếp', 'Maintain a 7-day streak', '📅', 'silver', 250, '{"streak_days": 7}'),
('streak_30', 'streak', 'Tháng kiên trì', 'Monthly Warrior', 'Duy trì chuỗi 30 ngày liên tiếp', 'Maintain a 30-day streak', '🏆', 'gold', 1000, '{"streak_days": 30}'),
('streak_90', 'streak', 'B1 Achiever', 'B1 Achiever', 'Duy trì chuỗi 90 ngày - Đạt B1', '90-day streak - Reach B1', '🥇', 'platinum', 5000, '{"streak_days": 90}'),
('streak_180', 'streak', 'B2 Master', 'B2 Master', 'Duy trì chuỗi 180 ngày - Đạt B2', '180-day streak - Reach B2', '💎', 'diamond', 20000, '{"streak_days": 180}'),

-- Speaking achievements
('speak_60', 'speaking', 'Giờ nói đầu tiên', 'First Speaking Hour', 'Tích lũy 60 phút nói', 'Accumulate 60 speaking minutes', '🎤', 'bronze', 200, '{"total_speaking_min": 60}'),
('speak_300', 'speaking', 'Người kể chuyện', 'Storyteller', 'Tích lũy 300 phút nói', 'Accumulate 300 speaking minutes', '📖', 'silver', 500, '{"total_speaking_min": 300}'),
('speak_1000', 'speaking', 'Bậc thầy hội thoại', 'Conversation Master', 'Tích lũy 1000 phút nói', 'Accumulate 1000 speaking minutes', '🗣️', 'gold', 2000, '{"total_speaking_min": 1000}'),

-- Assessment achievements
('assess_first', 'assessment', 'Bước đầu', 'First Steps', 'Hoàn thành bài kiểm tra định vị đầu tiên', 'Complete first placement test', '📝', 'bronze', 150, '{"assessments_completed": 1}'),
('assess_b1', 'assessment', 'Đạt B1', 'Reached B1', 'Đạt trình độ B1 trong bài kiểm tra', 'Achieve B1 level in assessment', '🥈', 'gold', 1000, '{"final_level": "B1"}'),
('assess_b2', 'assessment', 'Đạt B2', 'Reached B2', 'Đạt trình độ B2 trong bài kiểm tra', 'Achieve B2 level in assessment', '🥇', 'diamond', 5000, '{"final_level": "B2"}'),

-- Curriculum achievements
('curric_30', 'curriculum', 'Hoàn thành G1', 'G1 Graduate', 'Hoàn thành 30 ngày đầu tiên', 'Complete first 30 days', '🎓', 'silver', 500, '{"curriculum_day": 30}'),
('curric_90', 'curriculum', 'Người chinh phục B1', 'B1 Conqueror', 'Hoàn thành 90 ngày - Đạt B1', 'Complete 90 days - Reach B1', '🏅', 'gold', 2000, '{"curriculum_day": 90}'),
('curric_180', 'curriculum', 'Người chinh phục B2', 'B2 Conqueror', 'Hoàn thành 180 ngày - Đạt B2', 'Complete 180 days - Reach B2', '👑', 'diamond', 10000, '{"curriculum_day": 180}'),

-- Real World achievements
('rw_1', 'real_world', 'Người dám nói', 'Brave Speaker', 'Hoàn thành 1 nhiệm vụ Real World', 'Complete 1 Real World task', '🌍', 'bronze', 200, '{"real_world_completed": 1}'),
('rw_10', 'real_world', 'Nhà ngoại giao', 'Diplomat', 'Hoàn thành 10 nhiệm vụ Real World', 'Complete 10 Real World tasks', '🤝', 'silver', 1000, '{"real_world_completed": 10}'),
('rw_26', 'real_world', 'Chiến binh thực chiến', 'Battle Hardened', 'Hoàn thành 26 tuần Real World', 'Complete 26 weeks of Real World', '⚔️', 'gold', 5000, '{"real_world_completed": 26}'),

-- Social/Quest achievements
('quest_7', 'social', 'Tuần nhiệm vụ', 'Quest Week', 'Hoàn thành nhiệm vụ hàng ngày 7 ngày liên tiếp', 'Complete daily quests 7 days in a row', '📋', 'silver', 300, '{"quest_streak": 7}'),
('quest_30', 'social', 'Thợ săn nhiệm vụ', 'Quest Hunter', 'Hoàn thành 30 nhiệm vụ hàng ngày', 'Complete 30 daily quests', '🏹', 'gold', 1000, '{"total_quests_completed": 30}'),

-- Shadowing achievements
('shadow_50', 'speaking', 'Shadowing Novice', 'Shadowing Novice', 'Hoàn thành 50 đoạn shadowing', 'Complete 50 shadowing segments', '🎧', 'bronze', 200, '{"shadowing_segments": 50}'),
('shadow_200', 'speaking', 'Shadowing Pro', 'Shadowing Pro', 'Hoàn thành 200 đoạn shadowing', 'Complete 200 shadowing segments', '🎵', 'silver', 500, '{"shadowing_segments": 200}'),

-- Picture Talk achievements
('pic_20', 'speaking', 'Người quan sát', 'Observer', 'Mô tả 20 ảnh Picture Talk', 'Describe 20 Picture Talk images', '🖼️', 'bronze', 200, '{"picture_talk_images": 20}'),
('pic_100', 'speaking', 'Nhà kể chuyện bằng ảnh', 'Visual Storyteller', 'Mô tả 100 ảnh Picture Talk', 'Describe 100 Picture Talk images', '🎨', 'silver', 500, '{"picture_talk_images": 100}'),

-- Voice Diary achievements
('diary_14', 'speaking', 'Hai tuần nhật ký', 'Two-Week Diarist', 'Ghi Voice Diary 14 ngày liên tiếp', 'Voice Diary for 14 consecutive days', '📔', 'silver', 500, '{"voice_diary_streak": 14}'),
('diary_90', 'speaking', 'Kỷ lục nhật ký', 'Diary Legend', 'Ghi Voice Diary 90 ngày', 'Voice Diary for 90 days total', '📚', 'gold', 2000, '{"voice_diary_total": 90}')

ON CONFLICT (id) DO UPDATE SET
    name_vi = EXCLUDED.name_vi,
    name_en = EXCLUDED.name_en,
    description_vi = EXCLUDED.description_vi,
    description_en = EXCLUDED.description_en,
    icon = EXCLUDED.icon,
    tier = EXCLUDED.tier,
    xp_reward = EXCLUDED.xp_reward,
    requirement_json = EXCLUDED.requirement_json;

-- 11. Seed daily quest templates
INSERT INTO public.daily_quest_templates (id, category, name_vi, name_en, description_vi, description_en, target_metric, target_value, xp_reward, streak_bonus_xp) VALUES
('quest_reflex_10', 'reflex', 'Luyện 10 câu phản xạ', 'Practice 10 Reflex phrases', 'Hoàn thành 10 câu trong Reflex hôm nay', 'Complete 10 Reflex phrases today', 'reflex_phrases', 10, 50, 10),
('quest_speaking_15', 'speaking', 'Trò chuyện 15 phút', 'Speak for 15 minutes', 'Tích lũy 15 phút nói trong AI Speaking', 'Accumulate 15 speaking minutes in AI Speaking', 'speaking_minutes', 15, 75, 15),
('quest_shadowing_5', 'shadowing', 'Shadowing 5 đoạn', 'Shadow 5 segments', 'Hoàn thành 5 đoạn Shadowing', 'Complete 5 Shadowing segments', 'shadowing_segments', 5, 50, 10),
('quest_picture_talk_3', 'picture_talk', 'Mô tả 3 ảnh', 'Describe 3 images', 'Hoàn thành 3 ảnh Picture Talk', 'Complete 3 Picture Talk images', 'picture_talk_images', 3, 50, 10),
('quest_chunks_5', 'chunks', 'Luyện 5 cụm từ', 'Practice 5 chunks', 'Thành thạo 5 cụm từ Chunks', 'Master 5 Chunks', 'chunks_mastered', 5, 50, 10),
('quest_voice_diary_1', 'voice_diary', 'Ghi 1 nhật ký giọng', 'Record 1 voice diary', 'Hoàn thành 1 mục Voice Diary 60s', 'Complete 1 Voice Diary entry (60s)', 'voice_diary_entries', 1, 50, 10),
('quest_vocab_20', 'vocab', 'Học 20 từ mới', 'Learn 20 new words', 'Hoàn thành 20 từ vựng hôm nay', 'Complete 20 vocab words today', 'vocab_words', 20, 50, 10),
('quest_real_world_1', 'real_world', 'Nhiệm vụ thực chiến', 'Real World mission', 'Hoàn thành 1 nhiệm vụ Real World tuần này', 'Complete 1 Real World task this week', 'real_world_tasks', 1, 100, 20)

ON CONFLICT (id) DO UPDATE SET
    name_vi = EXCLUDED.name_vi,
    name_en = EXCLUDED.name_en,
    description_vi = EXCLUDED.description_vi,
    description_en = EXCLUDED.description_en,
    target_metric = EXCLUDED.target_metric,
    target_value = EXCLUDED.target_value,
    xp_reward = EXCLUDED.xp_reward,
    streak_bonus_xp = EXCLUDED.streak_bonus_xp;