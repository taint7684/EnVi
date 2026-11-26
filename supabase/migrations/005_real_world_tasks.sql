-- Real World Weekly Tasks (Exposure Ladder)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Task templates (static reference)
CREATE TABLE IF NOT EXISTS public.real_world_task_templates (
    id TEXT PRIMARY KEY,
    phase TEXT NOT NULL CHECK (phase IN ('G1','G2','G3','G4','G5')),
    category TEXT NOT NULL CHECK (category IN ('voice_note', 'language_exchange', 'workplace', 'presentation', 'call')),
    title_vi TEXT NOT NULL,
    title_en TEXT NOT NULL,
    scenario_vi TEXT NOT NULL,
    scenario_en TEXT NOT NULL,
    ai_persona JSONB NOT NULL,
    prep_openers TEXT[] NOT NULL DEFAULT '{}',
    prep_rescues TEXT[] NOT NULL DEFAULT '{}',
    success_criteria JSONB NOT NULL DEFAULT '{}',
    xp_reward INTEGER NOT NULL DEFAULT 20,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Weekly generated tasks per user
CREATE TABLE IF NOT EXISTS public.real_world_weekly_tasks (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    week_num INTEGER NOT NULL CHECK (week_num BETWEEN 1 AND 26),
    template_id TEXT NOT NULL REFERENCES public.real_world_task_templates(id),
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    due_by TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    audio_storage_path TEXT,
    audio_duration_sec REAL,
    transcript TEXT,
    wpm REAL,
    pauses_over_3s INTEGER,
    vi_segments INTEGER DEFAULT 0,
    lifeline_used BOOLEAN DEFAULT false,
    courage_before INTEGER CHECK (courage_before BETWEEN 1 AND 10),
    courage_after INTEGER CHECK (courage_after BETWEEN 1 AND 10),
    hardest_part TEXT,
    ai_feedback JSONB,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
    UNIQUE (user_id, week_num, template_id)
);

CREATE INDEX IF NOT EXISTS idx_real_world_tasks_user_week
    ON public.real_world_weekly_tasks (user_id, week_num);

ALTER TABLE public.real_world_weekly_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own real world tasks" ON public.real_world_weekly_tasks;
CREATE POLICY "Users manage own real world tasks"
    ON public.real_world_weekly_tasks FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full real world" ON public.real_world_weekly_tasks;
CREATE POLICY "Service role full real world"
    ON public.real_world_weekly_tasks FOR ALL
    TO service_role
    USING (true);

-- 3. Seed task templates (12 templates across 5 phases)
INSERT INTO public.real_world_task_templates (id, phase, category, title_vi, title_en, scenario_vi, scenario_en, ai_persona, prep_openers, prep_rescues, success_criteria, xp_reward) VALUES
-- G1: Voice note to self
('g1-voice-self', 'G1', 'voice_note',
 'Ghi âm 60s cho chính mình',
 '60s voice note to self',
 'Kể về hôm nay: làm gì, cảm thấy thế nào, kế hoạch mai',
 'Tell me about your day: what you did, how you felt, plans for tomorrow',
 '{"name": "You", "role": "Self-reflection", "personality": "Curious, non-judgmental", "accent_hint": "Neutral", "speaking_speed": "normal"}'::jsonb,
 ARRAY['Well, today I...', 'To be honest, today was...', 'Let me think... this morning I...'],
 ARRAY['What I mean is...', 'In other words...', 'Let me rephrase...'],
 '{"min_duration_sec": 45, "max_vi_segments": 2, "required_chunks": ["today_i", "felt", "tomorrow_i_will"]}'::jsonb,
 20),
-- G1: Voice note to friend
('g1-voice-friend', 'G1', 'voice_note',
 'Gửi voice note 60s cho bạn',
 '60s voice note to friend',
 'Nhắn tin giọng cho bạn thân: hôm nay thế nào, hỏi bạn họ',
 'Send a voice message to a close friend: how was your day, ask about theirs',
 '{"name": "Friend", "role": "Close friend", "personality": "Warm, interested", "accent_hint": "Neutral", "speaking_speed": "normal"}'::jsonb,
 ARRAY['Hey! So today I...', 'You won''t believe what happened...', 'Quick update: today I...'],
 ARRAY['What I meant was...', 'Let me put it differently...', 'In short...'],
 '{"min_duration_sec": 45, "max_vi_segments": 1, "required_chunks": ["today_i", "how_about_you", "talk_soon"]}'::jsonb,
 20),
-- G2: Language exchange intro
('g2-exchange-intro', 'G2', 'language_exchange',
 'Language exchange: giới thiệu bản thân',
 'Language exchange: introduce yourself',
 'Trò chuyện 15 phút với người mới: giới thiệu, nghề nghiệp, sở thích',
 '15-min chat with new partner: introduce yourself, job, hobbies',
 '{"name": "Partner", "role": "Language exchange partner", "personality": "Friendly, patient, curious", "accent_hint": "Various", "speaking_speed": "slow"}'::jsonb,
 ARRAY['Hi, I''m... and I work as...', 'Well, I''ve been learning English for...', 'To be honest, I want to improve...'],
 ARRAY['What I mean is...', 'Let me rephrase...', 'In other words...'],
 '{"min_duration_sec": 600, "max_vi_segments": 0, "required_chunks": ["im_a", "work_as", "hobby_is", "learning_because"]}'::jsonb,
 30),
-- G2: Language exchange daily
('g2-exchange-daily', 'G2', 'language_exchange',
 'Language exchange: ngày điển hình',
 'Language exchange: typical day',
 'Mô tả một ngày điển hình, hỏi ngày của đối phương',
 'Describe a typical day, ask about theirs',
 '{"name": "Partner", "role": "Language exchange partner", "personality": "Engaged, asks follow-ups", "accent_hint": "Various", "speaking_speed": "normal"}'::jsonb,
 ARRAY['My day usually starts with...', 'After work I usually...', 'Let me walk you through my day...'],
 ARRAY['What I meant was...', 'Let me explain...', 'Put simply...'],
 '{"min_duration_sec": 600, "max_vi_segments": 0, "required_chunks": ["usually_i", "after_that_i", "then_i", "what_about_you"]}'::jsonb,
 30),
-- G3: Workplace small talk
('g3-work-smalltalk', 'G3', 'workplace',
 'Small talk tại work',
 'Workplace small talk',
 'Trò chuyện 2-3 câu với đồng nghiệp/người nước ngoài: cuối tuần, caffee, thời tiết',
 '2-3 sentences with colleague/foreigner: weekend, coffee, weather',
 '{"name": "Colleague", "role": "Coworker", "personality": "Casual, brief", "accent_hint": "Various", "speaking_speed": "normal"}'::jsonb,
 ARRAY['How was your weekend?', 'Good morning! Coffee?', 'Nice weather today, right?'],
 ARRAY['I mean...', 'What I''m saying is...', 'Let me put it this way...'],
 '{"min_duration_sec": 30, "max_vi_segments": 0, "required_chunks": ["weekend_was", "coffee_sounds", "weather_is"]}'::jsonb,
 20),
-- G3: Meeting update
('g3-meeting-update', 'G3', 'workplace',
 'Cập nhật 1-2 câu trong họp',
 'Meeting update 1-2 sentences',
 'Báo cáo tiến độ 1-2 câu trong daily standup/họp team',
 'Give a 1-2 sentence progress update in standup/team meeting',
 '{"name": "Team", "role": "Team members", "personality": "Professional, listening", "accent_hint": "Various", "speaking_speed": "normal"}'::jsonb,
 ARRAY['Yesterday I completed...', 'Today I''m focusing on...', 'No blockers at the moment.'],
 ARRAY['What I mean is...', 'In short...', 'To clarify...'],
 '{"min_duration_sec": 20, "max_vi_segments": 0, "required_chunks": ["yesterday_i", "today_i_will", "no_blockers"]}'::jsonb,
 20),
-- G4: Presentation 2 minutes
('g4-presentation', 'G4', 'presentation',
 'Trình bày 2 phút trong họp',
 '2-minute presentation in meeting',
 'Trình bày ý tưởng/báo cáo 2 phút: vấn đề, giải pháp, lợi ích',
 'Present idea/report for 2 minutes: problem, solution, benefits',
 '{"name": "Audience", "role": "Meeting attendees", "personality": "Attentive, may ask questions", "accent_hint": "Various", "speaking_speed": "normal"}'::jsonb,
 ARRAY['The problem we''re facing is...', 'My proposal is to...', 'This would help by...'],
 ARRAY['Let me clarify...', 'What I mean is...', 'Put another way...'],
 '{"min_duration_sec": 90, "max_vi_segments": 0, "required_chunks": ["problem_is", "proposal_is", "benefit_is", "because", "for_example"]}'::jsonb,
 50),
-- G4: Demo feature
('g4-demo-feature', 'G4', 'presentation',
 'Demo tính năng 2 phút',
 '2-minute feature demo',
 'Demo feature cho stakeholder: giới thiệu, hướng dẫn, giá trị',
 'Demo feature to stakeholder: intro, walkthrough, value',
 '{"name": "Stakeholder", "role": "Client/Product Owner", "personality": "Curious, evaluates value", "accent_hint": "Various", "speaking_speed": "normal"}'::jsonb,
 ARRAY['Let me show you...', 'First, you click...', 'The benefit for you is...'],
 ARRAY['What I meant was...', 'Let me rephrase...', 'In other words...'],
 '{"min_duration_sec": 90, "max_vi_segments": 0, "required_chunks": ["let_me_show", "first_you", "benefit_is", "saves_time", "as_you_see"]}'::jsonb,
 50),
-- G5: Work call
('g5-work-call', 'G5', 'call',
 'Cuộc gọi 15 phút chủ đề công việc',
 '15-min work call',
 'Gọi/video call 15 phút: thảo luận yêu cầu, đàm phán, quyết định',
 '15-min call/video: discuss requirements, negotiate, decide',
 '{"name": "Counterpart", "role": "Client/PM/Stakeholder", "personality": "Professional, has agenda", "accent_hint": "Various", "speaking_speed": "normal"}'::jsonb,
 ARRAY['Thanks for the call. Let''s start with...', 'I''d like to clarify...', 'My concern is...'],
 ARRAY['Let me put it differently...', 'What I mean is...', 'Can we agree on...?'],
 '{"min_duration_sec": 600, "max_vi_segments": 0, "required_chunks": ["thanks_for", "clarify", "concern_is", "propose", "agree_on", "next_step"]}'::jsonb,
 100),
-- G5: Interview
('g5-interview', 'G5', 'call',
 'Phỏng vấn/Phỏng vấn người khác',
 'Interview / Interviewing',
 'Phỏng vấn 15 phút: hỏi kinh nghiệm, kỹ năng, phù hợp văn hóa',
 '15-min interview: ask experience, skills, culture fit',
 '{"name": "Candidate", "role": "Interviewee", "personality": "Prepared, slightly nervous", "accent_hint": "Various", "speaking_speed": "normal"}'::jsonb,
 ARRAY['Tell me about your experience with...', 'How do you handle...?', 'Why this role?'],
 ARRAY['What I''m looking for is...', 'Let me rephrase the question...', 'Could you give an example?'],
 '{"min_duration_sec": 600, "max_vi_segments": 0, "required_chunks": ["experience_with", "handle_by", "interested_because", "for_example", "team_fit"]}'::jsonb,
 100)
ON CONFLICT (id) DO UPDATE SET
    title_vi = EXCLUDED.title_vi,
    title_en = EXCLUDED.title_en,
    scenario_vi = EXCLUDED.scenario_vi,
    scenario_en = EXCLUDED.scenario_en,
    ai_persona = EXCLUDED.ai_persona,
    prep_openers = EXCLUDED.prep_openers,
    prep_rescues = EXCLUDED.prep_rescues,
    success_criteria = EXCLUDED.success_criteria,
    xp_reward = EXCLUDED.xp_reward;

-- 4. Weekly generator function (deterministic, based on user_id + week_num)
CREATE OR REPLACE FUNCTION public.generate_weekly_real_world_tasks(p_user_id UUID, p_week_num INT)
RETURNS SETOF public.real_world_weekly_tasks LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_progress RECORD;
    v_phase TEXT;
    v_templates TEXT[];
    v_selected TEXT;
    v_due_by TIMESTAMPTZ;
    v_rec RECORD;
BEGIN
    -- Get user's current phase from curriculum_progress
    SELECT current_phase INTO v_phase FROM public.curriculum_progress WHERE user_id = p_user_id;
    IF v_phase IS NULL THEN
        v_phase := 'G1';
    END IF;

    -- Get templates for this phase
    SELECT ARRAY_AGG(id ORDER BY id) INTO v_templates
    FROM public.real_world_task_templates
    WHERE phase = v_phase;

    IF v_templates IS NULL OR ARRAY_LENGTH(v_templates, 1) = 0 THEN
        RETURN;
    END IF;

    -- Deterministic selection based on user_id + week_num (stable assignment)
    v_selected := v_templates[((p_user_id::TEXT || p_week_num::TEXT)::BIT(32)::INT % ARRAY_LENGTH(v_templates, 1)) + 1];

    -- Due by end of the week (Sunday 23:59:59 UTC) - calculate from week 1 start (Jan 3, 2026 = first Sunday)
    -- Week 1: Jan 3 - Jan 9, Week 2: Jan 10 - Jan 16, etc.
    v_due_by := (DATE '2026-01-03' + (p_week_num - 1) * INTERVAL '7 days' + INTERVAL '6 days 23:59:59') AT TIME ZONE 'UTC';

    INSERT INTO public.real_world_weekly_tasks (user_id, week_num, template_id, due_by)
    VALUES (p_user_id, p_week_num, v_selected, v_due_by)
    ON CONFLICT (user_id, week_num, template_id) DO UPDATE SET
        due_by = EXCLUDED.due_by
    RETURNING * INTO v_rec;

    RETURN NEXT v_rec;
END $$;

GRANT EXECUTE ON FUNCTION public.generate_weekly_real_world_tasks(UUID, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.generate_weekly_real_world_tasks(UUID, INT) TO service_role;