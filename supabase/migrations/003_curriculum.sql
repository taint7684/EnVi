-- Curriculum System (180-Day Spiral)
-- Run in Supabase Dashboard → SQL Editor

-- 0. Ensure handle_updated_at function exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END $$;

-- 1. Curriculum topics (static reference)
CREATE TABLE IF NOT EXISTS public.curriculum_topics (
    id TEXT PRIMARY KEY,
    round_num INTEGER NOT NULL CHECK (round_num IN (1, 2)),
    topic_order INTEGER NOT NULL,
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    focus_life TEXT,
    focus_work TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Curriculum layers per topic per round
CREATE TABLE IF NOT EXISTS public.curriculum_layers (
    id BIGSERIAL PRIMARY KEY,
    topic_id TEXT NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
    layer TEXT NOT NULL CHECK (layer IN ('L1', 'L2', 'L3')),
    layer_order INTEGER NOT NULL,
    weight_pct INTEGER NOT NULL CHECK (weight_pct BETWEEN 0 AND 100),
    description TEXT,
    starter_chunks TEXT[] NOT NULL DEFAULT '{}',
    starter_openers TEXT[] NOT NULL DEFAULT '{}',
    UNIQUE (topic_id, layer)
);

-- 3. Weekly mapping (26 weeks = 180 days)
CREATE TABLE IF NOT EXISTS public.curriculum_weeks (
    week_num INTEGER PRIMARY KEY CHECK (week_num BETWEEN 1 AND 26),
    topic_id TEXT NOT NULL REFERENCES public.curriculum_topics(id),
    round_num INTEGER NOT NULL CHECK (round_num IN (1, 2)),
    start_day INTEGER NOT NULL,
    end_day INTEGER NOT NULL,
    phase TEXT NOT NULL CHECK (phase IN ('G1','G2','G3','G4','G5')),
    layer_weights JSONB NOT NULL,
    work_topic_pct INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. User curriculum progress
CREATE TABLE IF NOT EXISTS public.curriculum_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    current_day INTEGER NOT NULL DEFAULT 1,
    current_week INTEGER GENERATED ALWAYS AS (LEAST(26, ((current_day - 1) / 7) + 1)) STORED,
    current_phase TEXT GENERATED ALWAYS AS (
        CASE
            WHEN current_day <= 30 THEN 'G1'
            WHEN current_day <= 60 THEN 'G2'
            WHEN current_day <= 90 THEN 'G3'
            WHEN current_day <= 135 THEN 'G4'
            ELSE 'G5'
        END
    ) STORED,
    last_completed_at TIMESTAMPTZ,
    total_speaking_minutes INTEGER NOT NULL DEFAULT 0,
    baseline_latency_ms INTEGER,
    baseline_wpm REAL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Daily study log (minimal, for streak/XP)
CREATE TABLE IF NOT EXISTS public.curriculum_daily_log (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    study_date DATE NOT NULL,
    day_index INTEGER NOT NULL,
    speaking_minutes INTEGER NOT NULL DEFAULT 0,
    modules_completed TEXT[] NOT NULL DEFAULT '{}',
    xp_earned INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, study_date)
);

-- 6. Enable RLS
ALTER TABLE public.curriculum_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_daily_log ENABLE ROW LEVEL SECURITY;

-- 7. Policies (read-only for topics/layers/weeks)
DROP POLICY IF EXISTS "Authenticated read curriculum topics" ON public.curriculum_topics;
CREATE POLICY "Authenticated read curriculum topics" ON public.curriculum_topics FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read curriculum layers" ON public.curriculum_layers;
CREATE POLICY "Authenticated read curriculum layers" ON public.curriculum_layers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated read curriculum weeks" ON public.curriculum_weeks;
CREATE POLICY "Authenticated read curriculum weeks" ON public.curriculum_weeks FOR SELECT TO authenticated USING (true);

-- 8. User progress policies
DROP POLICY IF EXISTS "Users manage own curriculum progress" ON public.curriculum_progress;
CREATE POLICY "Users manage own curriculum progress" ON public.curriculum_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own daily log" ON public.curriculum_daily_log;
CREATE POLICY "Users manage own daily log" ON public.curriculum_daily_log FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. Service role full access
DROP POLICY IF EXISTS "Service role full curriculum" ON public.curriculum_topics;
CREATE POLICY "Service role full curriculum" ON public.curriculum_topics FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full curriculum_layers" ON public.curriculum_layers;
CREATE POLICY "Service role full curriculum_layers" ON public.curriculum_layers FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full curriculum_weeks" ON public.curriculum_weeks;
CREATE POLICY "Service role full curriculum_weeks" ON public.curriculum_weeks FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full curriculum_progress" ON public.curriculum_progress;
CREATE POLICY "Service role full curriculum_progress" ON public.curriculum_progress FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full curriculum_daily_log" ON public.curriculum_daily_log;
CREATE POLICY "Service role full curriculum_daily_log" ON public.curriculum_daily_log FOR ALL TO service_role USING (true);

-- 10. Updated_at trigger
DROP TRIGGER IF EXISTS curriculum_progress_updated_at ON public.curriculum_progress;
CREATE TRIGGER curriculum_progress_updated_at
    BEFORE UPDATE ON public.curriculum_progress
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 11. Seed curriculum_topics (13 topics × 2 rounds = 26 rows)
INSERT INTO public.curriculum_topics (id, round_num, topic_order, name_vi, name_en, focus_life, focus_work) VALUES
-- Round 1: Daily Life (B1)
('topic-01-self', 1, 1, 'Bản thân & Routine', 'Self & Routine', 'Giới thiệu bản thân, thói quen hàng ngày', 'Một ngày làm BA/IT, thói quen & năng suất'),
('topic-02-family', 1, 2, 'Gia đình', 'Family', 'Thành viên, hoạt động cùng gia đình', 'Vai trò gia đình, khác biệt thế hệ, cân bằng'),
('topic-03-friends', 1, 3, 'Bạn bè & Giao tiếp', 'Friends & Communication', 'Tình bạn, gặp gỡ, trò chuyện', 'Mạng lưới, networking ở công ty'),
('topic-04-work-daily', 1, 4, 'Công việc hằng ngày', 'Daily Work', 'Mô tả công việc, đồng nghiệp', 'Họp, báo cáo tiến độ, giải thích yêu cầu'),
('topic-05-hobbies', 1, 5, 'Sở thích & Thời gian rảnh', 'Hobbies & Free Time', 'Sở thích, game, thể thao', 'Vì sao sở thích quan trọng, thuyết phục người khác'),
('topic-06-food', 1, 6, 'Đồ ăn & Nấu ăn', 'Food & Cooking', 'Món ăn, nấu nướng, nhà hàng', 'Văn hóa ẩm thực, lựa chọn lành mạnh, gọi món & phàn nàn'),
('topic-07-home', 1, 7, 'Nhà cửa & Nơi sống', 'Home & Living', 'Nhà, phòng, hàng xóm', 'Thành phố vs quê, nhà ở, làm việc từ xa'),
('topic-08-love', 1, 8, 'Love & Quan hệ', 'Love & Relationships', 'Hẹn hò, bạn đời, chia sẻ', 'Gìn giữ mối quan hệ, cho lời khuyên'),
('topic-09-health', 1, 9, 'Sức khỏe & Cảm xúc', 'Health & Emotions', 'Bệnh, tập thể dục, stress', 'Burnout, xử lý áp lực công việc'),
('topic-10-travel', 1, 10, 'Du lịch', 'Travel', 'Đi chơi, đặt vé, khách sạn', 'Sự cố khi đi du lịch, lên kế hoạch, giới thiệu điểm đến'),
('topic-11-money', 1, 11, 'Tiền & Mua sắm', 'Money & Shopping', 'Chi tiêu, tiết kiệm, deal', 'Quản lý chi tiêu, thương lượng, lựa chọn tiêu dùng'),
('topic-12-tech', 1, 12, 'Công nghệ & Điện thoại', 'Tech & Phone', 'App, mạng xã hội, gadget', 'AI trong công việc, giải thích hệ thống cho non-tech'),
('topic-13-dreams', 1, 13, 'Kế hoạch & Ước mơ', 'Plans & Dreams', 'Mục tiêu cá nhân, bucket list', 'Mục tiêu nghề nghiệp, điều hối tiếc, giả định (If I had…)'),
-- Round 2: Work IT/BA (B2)
('topic-01-self-r2', 2, 1, 'Bản thân & Routine (Nâng cao)', 'Self & Routine (Advanced)', 'Một ngày BA/IT chi tiết', 'Thời gian deep work, ritual sáng/chiều'),
('topic-02-family-r2', 2, 2, 'Gia đình (Nâng cao)', 'Family (Advanced)', 'Cân bằng, ranh giới', 'Work-life integration, remote work policies'),
('topic-03-friends-r2', 2, 3, 'Bạn bè & Networking', 'Friends & Networking', 'Mở rộng quan hệ', 'LinkedIn, coffee chat, mentor/mentee'),
('topic-04-work-daily-r2', 2, 4, 'Công việc chuyên sâu', 'Advanced Work', 'Quy trình, công cụ', 'Sprint planning, retro, estimation, RFC'),
('topic-05-hobbies-r2', 2, 5, 'Sở thích chuyên nghiệp', 'Professional Hobbies', 'Side project, open source', 'Portfolio, personal branding, speaking'),
('topic-06-food-r2', 2, 6, 'Đồ ăn văn hóa', 'Food Culture', 'Team lunch, client dinner', 'Business dining, dietary restrictions, etiquette'),
('topic-07-home-r2', 2, 7, 'Không gian làm việc', 'Workspace', 'Setup desk, ergonomics', 'Office vs home vs coworking, async culture'),
('topic-08-love-r2', 2, 8, 'Quan hệ lâu dài', 'Long-term Relationships', 'Quyết định chung', 'Career moves, relocation, financial planning'),
('topic-09-health-r2', 2, 9, 'Sức khỏe bền vững', 'Sustainable Health', 'Burnout prevention', 'Therapy, boundaries, energy management'),
('topic-10-travel-r2', 2, 10, 'Du lịch công việc', 'Business Travel', 'Conference, offsite', 'Itinerary, expense, timezone management'),
('topic-11-money-r2', 2, 11, 'Tài chính cá nhân', 'Personal Finance', 'Invest, insurance', 'Salary negotiation, equity, tax planning'),
('topic-12-tech-r2', 2, 12, 'Công nghệ nâng cao', 'Advanced Tech', 'Architecture, trade-offs', 'System design, tech debt, AI/ML in product'),
('topic-13-dreams-r2', 2, 13, 'Kế hoạch 5 năm', '5-Year Plan', 'Career vision', 'Promotion path, startup vs corporate, legacy')
ON CONFLICT (id) DO UPDATE SET
    name_vi = EXCLUDED.name_vi,
    name_en = EXCLUDED.name_en,
    focus_life = EXCLUDED.focus_life,
    focus_work = EXCLUDED.focus_work;

-- 12. Seed curriculum_layers (3 layers per topic = 78 rows)
INSERT INTO public.curriculum_layers (topic_id, layer, layer_order, weight_pct, description, starter_chunks, starter_openers) VALUES
-- Round 1 L1 (describe/answer)
('topic-01-self', 'L1', 1, 70, 'Hiện tại đơn, thói quen, thích/không thích', ARRAY['daily_routine', 'wake_up', 'work_habits'], ARRAY['Well, ', 'To be honest, ', 'Actually, ']),
('topic-02-family', 'L1', 1, 70, 'Mô tả thành viên, số lượng', ARRAY['family_members', 'get_along', 'weekend_family'], ARRAY['Let me think, ', 'You know, ', 'So, ']),
('topic-03-friends', 'L1', 1, 70, 'Bạn thân, tần suất gặp', ARRAY['close_friends', 'hang_out', 'make_friends'], ARRAY['Well, ', 'To be honest, ', 'Actually, ']),
('topic-04-work-daily', 'L1', 1, 70, 'Mô tả công việc, role', ARRAY['job_role', 'typical_day', 'team_size'], ARRAY['Let me see, ', 'Basically, ', 'In short, ']),
('topic-05-hobbies', 'L1', 1, 70, 'Sở thích gì, bao giờ làm', ARRAY['free_time', 'hobby_list', 'relax_way'], ARRAY['Well, ', 'You know, ', 'Actually, ']),
('topic-06-food', 'L1', 1, 70, 'Món thích, nấu được gì', ARRAY['favorite_food', 'cook_skill', 'eat_out'], ARRAY['To be honest, ', 'Well, ', 'Actually, ']),
('topic-07-home', 'L1', 1, 70, 'Nhà như nào, phòng nào', ARRAY['home_type', 'room_favorite', 'neighborhood'], ARRAY['Let me think, ', 'Well, ', 'So, ']),
('topic-08-love', 'L1', 1, 70, 'Mối quan hệ hiện tại', ARRAY['relationship_status', 'partner_traits', 'date_idea'], ARRAY['Well, ', 'Actually, ', 'To be honest, ']),
('topic-09-health', 'L1', 1, 70, 'Sức khỏe thể chất, tâm lý', ARRAY['exercise_habit', 'stress_level', 'sleep_quality'], ARRAY['You know, ', 'Well, ', 'Basically, ']),
('topic-10-travel', 'L1', 1, 70, 'Nơi đi, cách đi, ai cùng', ARRAY['last_trip', 'travel_style', 'dream_destination'], ARRAY['Well, ', 'Let me see, ', 'Actually, ']),
('topic-11-money', 'L1', 1, 70, 'Thu chi, tiết kiệm', ARRAY['budget_basics', 'save_money', 'spending_habit'], ARRAY['To be honest, ', 'Well, ', 'Basically, ']),
('topic-12-tech', 'L1', 1, 70, 'Điện thoại, app hay dùng', ARRAY['phone_usage', 'favorite_app', 'screen_time'], ARRAY['Well, ', 'You know, ', 'Actually, ']),
('topic-13-dreams', 'L1', 1, 70, 'Mục tiêu năm nay, bucket list', ARRAY['this_year_goal', 'bucket_list', 'dream_job'], ARRAY['Let me think, ', 'Well, ', 'If I could, ']),
-- Round 1 L2 (story/experience)
('topic-01-self', 'L2', 2, 30, 'Quá khứ, kế hoạch, so sánh', ARRAY['past_routine', 'changed_habit', 'future_plan'], ARRAY['Back then, ', 'Looking back, ', 'First, ']),
('topic-02-family', 'L2', 2, 30, 'Kỷ niệm, thay đổi', ARRAY['childhood_memory', 'family_change', 'family_tradition'], ARRAY['I remember, ', 'It all started when, ', 'First, ']),
('topic-03-friends', 'L2', 2, 30, 'Chuyện bạn bè, mâu thuẫn', ARRAY['friend_story', 'reconnect', 'drift_apart'], ARRAY['There was this time, ', 'Let me tell you, ', 'First, ']),
('topic-04-work-daily', 'L2', 2, 30, 'Dự án, thử thách, học được', ARRAY['project_story', 'work_challenge', 'lesson_learned'], ARRAY['In my last project, ', 'The challenge was, ', 'First, ']),
('topic-05-hobbies', 'L2', 2, 30, 'Hành trình sở thích', ARRAY['started_hobby', 'proud_moment', 'quit_hobby'], ARRAY['I started when, ', 'The best part was, ', 'First, ']),
('topic-06-food', 'L2', 2, 30, 'Trải nghiệm ẩm thực', ARRAY['memorable_meal', 'cooking_fail', 'food_adventure'], ARRAY['One time, ', 'I remember, ', 'First, ']),
('topic-07-home', 'L2', 2, 30, 'Chuyển nhà, sửa chữa', ARRAY['moving_story', 'renovation', 'neighbor_story'], ARRAY['When I moved, ', 'It happened that, ', 'First, ']),
('topic-08-love', 'L2', 2, 30, 'Câu chuyện yêu, chia tay', ARRAY['first_date', 'relationship_lesson', 'make_up'], ARRAY['Our first date, ', 'There was a time, ', 'First, ']),
('topic-09-health', 'L2', 2, 30, 'Bệnh, hồi phục, thay đổi lối sống', ARRAY['health_scare', 'recovery', 'lifestyle_change'], ARRAY['It started when, ', 'The turning point was, ', 'First, ']),
('topic-10-travel', 'L2', 2, 30, 'Sự cố, bài học du lịch', ARRAY['travel_mishap', 'best_trip', 'culture_shock'], ARRAY['Everything went wrong when, ', 'The highlight was, ', 'First, ']),
('topic-11-money', 'L2', 2, 30, 'Quyết định tài chính', ARRAY['big_purchase', 'investment_story', 'saving_goal'], ARRAY['I decided to, ', 'It all began when, ', 'First, ']),
('topic-12-tech', 'L2', 2, 30, 'Dự án tech, debug', ARRAY['debug_story', 'tech_project', 'tool_switch'], ARRAY['I was debugging, ', 'The issue was, ', 'First, ']),
('topic-13-dreams', 'L2', 2, 30, 'Hành trình theo đuổi', ARRAY['pursuit_story', 'pivot_moment', 'regret_lesson'], ARRAY['I used to, ', 'The moment I realized, ', 'First, ']),
-- Round 1 L3 (opinion/argument) - minimal in G1
('topic-01-self', 'L3', 3, 0, 'Ý kiến về work-life balance', ARRAY['balance_opinion', 'routine_philosophy'], ARRAY['In my view, ', 'I believe, ', 'The way I see it, ']),
('topic-02-family', 'L3', 3, 0, 'Quan điểm về gia đình hiện đại', ARRAY['modern_family', 'elderly_care'], ARRAY['I think, ', 'From my perspective, ', 'It seems to me, ']),
('topic-03-friends', 'L3', 3, 0, 'Định nghĩa tình bạn', ARRAY['friendship_quality', 'online_vs_offline'], ARRAY['In my opinion, ', 'I would say, ', 'To my mind, ']),
('topic-04-work-daily', 'L3', 3, 0, 'Cách làm việc hiệu quả', ARRAY['productivity_view', 'meeting_culture'], ARRAY['I believe, ', 'The way I see it, ', 'In my view, ']),
('topic-05-hobbies', 'L3', 3, 0, 'Sở thích vs sự nghiệp', ARRAY['hobby_career', 'passion_vs_job'], ARRAY['I think, ', 'From my perspective, ', 'It seems to me, ']),
('topic-06-food', 'L3', 3, 0, 'Ăn uống lành mạnh', ARRAY['healthy_eating', 'food_ethics'], ARRAY['In my view, ', 'I believe, ', 'The way I see it, ']),
('topic-07-home', 'L3', 3, 0, 'Sống thành phố vs quê', ARRAY['urban_vs_rural', 'remote_work_future'], ARRAY['I think, ', 'In my opinion, ', 'It seems to me, ']),
('topic-08-love', 'L3', 3, 0, 'Yêu xa, kết hôn', ARRAY['long_distance', 'marriage_view'], ARRAY['I believe, ', 'The way I see it, ', 'In my view, ']),
('topic-09-health', 'L3', 3, 0, 'Sức khỏe tâm thần', ARRAY['mental_health', 'therapy_stigma'], ARRAY['In my view, ', 'I think, ', 'From my perspective, ']),
('topic-10-travel', 'L3', 3, 0, 'Du lịch bền vững', ARRAY['sustainable_travel', 'overtourism'], ARRAY['I believe, ', 'In my opinion, ', 'The way I see it, ']),
('topic-11-money', 'L3', 3, 0, 'Tiền hạnh phúc', ARRAY['money_happiness', 'minimalism'], ARRAY['I think, ', 'In my view, ', 'It seems to me, ']),
('topic-12-tech', 'L3', 3, 0, 'AI thay người', ARRAY['ai_impact', 'tech_ethics'], ARRAY['I believe, ', 'The way I see it, ', 'In my opinion, ']),
('topic-13-dreams', 'L3', 3, 0, 'Hối tiếc, giả định', ARRAY['regret_lesson', 'if_i_had'], ARRAY['If I had, ', 'Looking back, ', 'I wish I had, ']),
-- Round 2 layers (weights shift to L2/L3, work focus)
-- Round 2 L1 (reduced weight)
('topic-01-self-r2', 'L1', 1, 10, 'Một ngày BA/IT chi tiết', ARRAY['ba_daily_flow', 'deep_work_block', 'standup_routine'], ARRAY['Well, ', 'To be honest, ', 'Actually, ']),
('topic-02-family-r2', 'L1', 1, 10, 'Cân bằng work-life', ARRAY['boundaries', 'family_time', 'partner_support'], ARRAY['Let me think, ', 'Well, ', 'So, ']),
('topic-03-friends-r2', 'L1', 1, 10, 'Networking, coffee chat', ARRAY['linkedin_outreach', 'coffee_chat', 'mentor_meeting'], ARRAY['Well, ', 'You know, ', 'Actually, ']),
('topic-04-work-daily-r2', 'L1', 1, 10, 'Sprint, retro, estimation', ARRAY['sprint_planning', 'retro_format', 'estimation_poker'], ARRAY['Let me see, ', 'Basically, ', 'In short, ']),
('topic-05-hobbies-r2', 'L1', 1, 10, 'Side project, portfolio', ARRAY['side_project', 'github_profile', 'learning_plan'], ARRAY['Well, ', 'You know, ', 'Actually, ']),
('topic-06-food-r2', 'L1', 1, 10, 'Team lunch, client dinner', ARRAY['business_lunch', 'dietary_needs', 'restaurant_pick'], ARRAY['To be honest, ', 'Well, ', 'Actually, ']),
('topic-07-home-r2', 'L1', 1, 10, 'Setup desk, async culture', ARRAY['desk_setup', 'async_updates', 'focus_time'], ARRAY['Let me think, ', 'Well, ', 'So, ']),
('topic-08-love-r2', 'L1', 1, 10, 'Quyết định chung career', ARRAY['relocation_talk', 'financial_plan', 'support_system'], ARRAY['Well, ', 'Actually, ', 'To be honest, ']),
('topic-09-health-r2', 'L1', 1, 10, 'Burnout prevention', ARRAY['energy_audit', 'therapy_routine', 'boundary_setting'], ARRAY['You know, ', 'Well, ', 'Basically, ']),
('topic-10-travel-r2', 'L1', 1, 10, 'Business travel', ARRAY['conference_prep', 'expense_report', 'timezone_hack'], ARRAY['Well, ', 'Let me see, ', 'Actually, ']),
('topic-11-money-r2', 'L1', 1, 10, 'Salary neg, equity, tax', ARRAY['salary_negotiation', 'equity_basics', 'tax_optimization'], ARRAY['To be honest, ', 'Well, ', 'Basically, ']),
('topic-12-tech-r2', 'L1', 1, 10, 'System design, AI in product', ARRAY['architecture_review', 'ai_feature', 'tech_debt_priority'], ARRAY['Well, ', 'You know, ', 'Actually, ']),
('topic-13-dreams-r2', 'L1', 1, 10, '5-year career vision', ARRAY['promotion_path', 'startup_vs_corp', 'legacy_goal'], ARRAY['Let me think, ', 'Well, ', 'If I could, ']),
-- Round 2 L2 (story at work)
('topic-01-self-r2', 'L2', 2, 40, 'Dự án khó, giải quyết', ARRAY['tough_project', 'stakeholder_conflict', 'technical_decision'], ARRAY['In that project, ', 'The situation was, ', 'First, ']),
('topic-02-family-r2', 'L2', 2, 40, 'Thay đổi vai trò', ARRAY['parenthood_career', 'elderly_care_leave', 'partner_job_change'], ARRAY['When that happened, ', 'It was a period when, ', 'First, ']),
('topic-03-friends-r2', 'L2', 2, 40, 'Mentor, referral, conflict', ARRAY['mentor_story', 'referral_success', 'networking_fail'], ARRAY['There was this person, ', 'I reached out to, ', 'First, ']),
('topic-04-work-daily-r2', 'L2', 2, 40, 'Requirement, scope creep', ARRAY['vague_requirement', 'scope_creep', 'priority_conflict'], ARRAY['The stakeholder wanted, ', 'The challenge was, ', 'First, ']),
('topic-05-hobbies-r2', 'L2', 2, 40, 'Side project to product', ARRAY['mvp_story', 'user_feedback', 'pivot_decision'], ARRAY['I built, ', 'Users said, ', 'First, ']),
('topic-06-food-r2', 'L2', 2, 40, 'Cross-culture dining', ARRAY['cultural_etiquette', 'allergy_incident', 'negotiate_menu'], ARRAY['We were at, ', 'The issue came up when, ', 'First, ']),
('topic-07-home-r2', 'L2', 2, 40, 'Remote work challenges', ARRAY['isolation_story', 'collaboration_tool', 'async_win'], ARRAY['Working from home, ', 'The team struggled with, ', 'First, ']),
('topic-08-love-r2', 'L2', 2, 40, 'Quyết định lớn cùng đối tác', ARRAY['relocation_decision', 'career_break', 'financial_merge'], ARRAY['We discussed, ', 'The turning point was, ', 'First, ']),
('topic-09-health-r2', 'L2', 2, 40, 'Burnout recovery', ARRAY['breakdown_signs', 'recovery_steps', 'new_routine'], ARRAY['It crept up when, ', 'I realized when, ', 'First, ']),
('topic-10-travel-r2', 'L2', 2, 40, 'Conference, offsite', ARRAY['conference_networking', 'offsite_activity', 'speaker_experience'], ARRAY['At the conference, ', 'During the offsite, ', 'First, ']),
('topic-11-money-r2', 'L2', 2, 40, 'Investment, negotiation', ARRAY['first_investment', 'salary_negotiation_story', 'equity_decision'], ARRAY['I negotiated, ', 'The offer was, ', 'First, ']),
('topic-12-tech-r2', 'L2', 2, 40, 'Architecture, incident', ARRAY['incident_response', 'migration_story', 'scaling_challenge'], ARRAY['The alert fired, ', 'We discovered that, ', 'First, ']),
('topic-13-dreams-r2', 'L2', 2, 40, 'Pivot, promotion, startup', ARRAY['career_pivot', 'promotion_journey', 'founder_story'], ARRAY['I decided to, ', 'The moment came when, ', 'First, ']),
-- Round 2 L3 (argument/opinion at work)
('topic-01-self-r2', 'L3', 3, 50, 'Deep work vs meetings', ARRAY['meeting_load', 'focus_time_defense', 'async_first'], ARRAY['In my view, ', 'I strongly believe, ', 'The evidence suggests, ']),
('topic-02-family-r2', 'L3', 3, 50, 'Remote work policies', ARRAY['flexible_hours', 'office_mandate', 'productivity_metrics'], ARRAY['I would argue, ', 'From my perspective, ', 'The data shows, ']),
('topic-03-friends-r2', 'L3', 3, 50, 'Networking ethics', ARRAY['transactional_vs_genuine', 'cold_outreach', 'referral_obligation'], ARRAY['I believe, ', 'In my opinion, ', 'It seems to me, ']),
('topic-04-work-daily-r2', 'L3', 3, 50, 'Agile ceremonies value', ARRAY['standup_necessity', 'retro_actionable', 'estimation_accuracy'], ARRAY['In my view, ', 'I would argue, ', 'The evidence suggests, ']),
('topic-05-hobbies-r2', 'L3', 3, 50, 'Side project on company time', ARRAY['ip_ownership', 'learning_budget', '20_percent_time'], ARRAY['I believe, ', 'From my perspective, ', 'It seems to me, ']),
('topic-06-food-r2', 'L3', 3, 50, 'Company food culture', ARRAY['catered_lunch', 'dietary_inclusion', 'alcohol_policy'], ARRAY['In my view, ', 'I would argue, ', 'The evidence suggests, ']),
('topic-07-home-r2', 'L3', 3, 50, 'Office vs remote', ARRAY['collocation_value', 'async_by_default', 'hub_model'], ARRAY['I believe, ', 'In my opinion, ', 'It seems to me, ']),
('topic-08-love-r2', 'L3', 3, 50, 'Dual career couples', ARRAY['turn_taking', 'relocation_fairness', 'childcare_split'], ARRAY['In my view, ', 'I would argue, ', 'The evidence suggests, ']),
('topic-09-health-r2', 'L3', 3, 50, 'Mental health at work', ARRAY['psychological_safety', 'burnout_responsibility', 'therapy_benefit'], ARRAY['In my view, ', 'I strongly believe, ', 'The data shows, ']),
('topic-10-travel-r2', 'L3', 3, 50, 'Business travel ROI', ARRAY['conference_value', 'offsite_frequency', 'virtual_alternative'], ARRAY['In my view, ', 'I would argue, ', 'The evidence suggests, ']),
('topic-11-money-r2', 'L3', 3, 50, 'Comp transparency', ARRAY['salary_bands', 'equity_refresh', 'performance_pay'], ARRAY['In my view, ', 'I would argue, ', 'The evidence suggests, ']),
('topic-12-tech-r2', 'L3', 3, 50, 'Build vs buy, AI ethics', ARRAY['build_vs_buy', 'ai_bias', 'tech_debt_investment'], ARRAY['In my view, ', 'I would argue, ', 'The evidence suggests, ']),
('topic-13-dreams-r2', 'L3', 3, 70, 'Career philosophy', ARRAY['specialist_vs_generalist', 'impact_vs_title', 'legacy_definition'], ARRAY['If I had to choose, ', 'In my view, ', 'I would argue, '])
ON CONFLICT (topic_id, layer) DO UPDATE SET
    weight_pct = EXCLUDED.weight_pct,
    description = EXCLUDED.description,
    starter_chunks = EXCLUDED.starter_chunks,
    starter_openers = EXCLUDED.starter_openers;

-- 13. Seed curriculum_weeks (26 weeks)
INSERT INTO public.curriculum_weeks (week_num, topic_id, round_num, start_day, end_day, phase, layer_weights, work_topic_pct) VALUES
-- Round 1 (Weeks 1-13, Days 1-91)
(1, 'topic-01-self', 1, 1, 7, 'G1', '{"L1": 70, "L2": 30, "L3": 0}'::jsonb, 10),
(2, 'topic-02-family', 1, 8, 14, 'G1', '{"L1": 70, "L2": 30, "L3": 0}'::jsonb, 10),
(3, 'topic-03-friends', 1, 15, 21, 'G1', '{"L1": 70, "L2": 30, "L3": 0}'::jsonb, 10),
(4, 'topic-04-work-daily', 1, 22, 28, 'G1', '{"L1": 70, "L2": 30, "L3": 0}'::jsonb, 10),
(5, 'topic-05-hobbies', 1, 29, 35, 'G1', '{"L1": 70, "L2": 30, "L3": 0}'::jsonb, 10),
(6, 'topic-06-food', 1, 36, 42, 'G2', '{"L1": 40, "L2": 50, "L3": 10}'::jsonb, 10),
(7, 'topic-07-home', 1, 43, 49, 'G2', '{"L1": 40, "L2": 50, "L3": 10}'::jsonb, 10),
(8, 'topic-08-love', 1, 50, 56, 'G2', '{"L1": 40, "L2": 50, "L3": 10}'::jsonb, 10),
(9, 'topic-09-health', 1, 57, 63, 'G2', '{"L1": 40, "L2": 50, "L3": 10}'::jsonb, 15),
(10, 'topic-10-travel', 1, 64, 70, 'G3', '{"L1": 20, "L2": 50, "L3": 30}'::jsonb, 15),
(11, 'topic-11-money', 1, 71, 77, 'G3', '{"L1": 20, "L2": 50, "L3": 30}'::jsonb, 15),
(12, 'topic-12-tech', 1, 78, 84, 'G3', '{"L1": 20, "L2": 50, "L3": 30}'::jsonb, 15),
(13, 'topic-13-dreams', 1, 85, 91, 'G3', '{"L1": 20, "L2": 50, "L3": 30}'::jsonb, 15),
-- Round 2 (Weeks 14-26, Days 92-180)
(14, 'topic-01-self-r2', 2, 92, 98, 'G4', '{"L1": 10, "L2": 40, "L3": 50}'::jsonb, 30),
(15, 'topic-02-family-r2', 2, 99, 105, 'G4', '{"L1": 10, "L2": 40, "L3": 50}'::jsonb, 30),
(16, 'topic-03-friends-r2', 2, 106, 112, 'G4', '{"L1": 10, "L2": 40, "L3": 50}'::jsonb, 30),
(17, 'topic-04-work-daily-r2', 2, 113, 119, 'G4', '{"L1": 10, "L2": 40, "L3": 50}'::jsonb, 30),
(18, 'topic-05-hobbies-r2', 2, 120, 126, 'G4', '{"L1": 10, "L2": 40, "L3": 50}'::jsonb, 30),
(19, 'topic-06-food-r2', 2, 127, 133, 'G4', '{"L1": 10, "L2": 40, "L3": 50}'::jsonb, 30),
(20, 'topic-07-home-r2', 2, 134, 140, 'G5', '{"L1": 0, "L2": 30, "L3": 70}'::jsonb, 40),
(21, 'topic-08-love-r2', 2, 141, 147, 'G5', '{"L1": 0, "L2": 30, "L3": 70}'::jsonb, 40),
(22, 'topic-09-health-r2', 2, 148, 154, 'G5', '{"L1": 0, "L2": 30, "L3": 70}'::jsonb, 40),
(23, 'topic-10-travel-r2', 2, 155, 161, 'G5', '{"L1": 0, "L2": 30, "L3": 70}'::jsonb, 40),
(24, 'topic-11-money-r2', 2, 162, 168, 'G5', '{"L1": 0, "L2": 30, "L3": 70}'::jsonb, 40),
(25, 'topic-12-tech-r2', 2, 169, 175, 'G5', '{"L1": 0, "L2": 30, "L3": 70}'::jsonb, 40),
(26, 'topic-13-dreams-r2', 2, 176, 180, 'G5', '{"L1": 0, "L2": 30, "L3": 70}'::jsonb, 40)
ON CONFLICT (week_num) DO UPDATE SET
    topic_id = EXCLUDED.topic_id,
    round_num = EXCLUDED.round_num,
    start_day = EXCLUDED.start_day,
    end_day = EXCLUDED.end_day,
    phase = EXCLUDED.phase,
    layer_weights = EXCLUDED.layer_weights,
    work_topic_pct = EXCLUDED.work_topic_pct;