-- Assessment & Placement (P3)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Assessment questions (static reference)
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id TEXT PRIMARY KEY,
    section TEXT NOT NULL CHECK (section IN ('vocab', 'grammar', 'listening', 'speaking')),
    skill TEXT NOT NULL, -- e.g., 'A1_vocab', 'A2_grammar', 'B1_listening', 'B2_speaking'
    difficulty TEXT NOT NULL CHECK (difficulty IN ('A1', 'A2', 'B1', 'B2')),
    question_type TEXT NOT NULL CHECK (question_type IN ('mcq', 'fill_blank', 'reorder', 'speaking_prompt')),
    prompt_text TEXT NOT NULL,
    prompt_audio_url TEXT,
    options JSONB, -- for MCQ: [{"text": "...", "correct": true}, ...]
    correct_answer TEXT, -- for fill_blank/reorder
    expected_keywords TEXT[], -- for speaking evaluation
    cefr_level TEXT NOT NULL CHECK (cefr_level IN ('A1', 'A2', 'B1', 'B2')),
    weight INTEGER NOT NULL DEFAULT 1, -- scoring weight
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Assessment sessions (per user attempt)
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    current_question_index INTEGER NOT NULL DEFAULT 0,
    estimated_level TEXT CHECK (estimated_level IN ('A1', 'A2', 'B1', 'B2')),
    final_level TEXT CHECK (final_level IN ('A1', 'A2', 'B1', 'B2')),
    total_score REAL,
    section_scores JSONB, -- {"vocab": 0.8, "grammar": 0.6, ...}
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user ON public.assessment_sessions (user_id, status);

-- 3. Assessment answers (per question response)
CREATE TABLE IF NOT EXISTS public.assessment_answers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id BIGINT NOT NULL REFERENCES public.assessment_sessions(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL REFERENCES public.assessment_questions(id),
    user_answer TEXT,
    user_audio_path TEXT, -- for speaking questions
    is_correct BOOLEAN,
    score REAL, -- 0.0 to 1.0
    latency_ms INTEGER,
    vi_segments INTEGER DEFAULT 0,
    wpm REAL,
    ai_feedback JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_assessment_answers_session ON public.assessment_answers (session_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_user ON public.assessment_answers (user_id);

-- 4. Oral Mirror recordings (weekly placement check)
CREATE TABLE IF NOT EXISTS public.oral_mirror_recordings (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id BIGINT REFERENCES public.assessment_sessions(id) ON DELETE SET NULL,
    week_num INTEGER CHECK (week_num BETWEEN 1 AND 26),
    prompt_key TEXT NOT NULL, -- e.g., 'self_intro', 'work_demo', 'opinion_topic'
    prompt_text_en TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    audio_duration_sec REAL,
    
    -- Auto metrics
    wpm REAL,
    word_count INTEGER,
    pauses_over_3s INTEGER,
    filler_count INTEGER,
    vi_segments INTEGER DEFAULT 0,
    onset_latency_ms INTEGER,
    transcript TEXT,
    detected_language TEXT,
    
    -- CEFR scoring
    cefr_scores JSONB, -- {"fluency": 0.7, "accuracy": 0.6, "prosody": 0.8, "vocab_range": 0.5}
    estimated_level TEXT CHECK (estimated_level IN ('A1', 'A2', 'B1', 'B2')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_oral_mirror_user_week ON public.oral_mirror_recordings (user_id, week_num);

-- 5. Enable RLS
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.oral_mirror_recordings ENABLE ROW LEVEL SECURITY;

-- 6. Policies
DROP POLICY IF EXISTS "Authenticated read assessment questions" ON public.assessment_questions;
CREATE POLICY "Authenticated read assessment questions" ON public.assessment_questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users manage own assessment sessions" ON public.assessment_sessions;
CREATE POLICY "Users manage own assessment sessions" ON public.assessment_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own assessment answers" ON public.assessment_answers;
CREATE POLICY "Users manage own assessment answers" ON public.assessment_answers FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own oral mirror" ON public.oral_mirror_recordings;
CREATE POLICY "Users manage own oral mirror" ON public.oral_mirror_recordings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Service role
DROP POLICY IF EXISTS "Service role full assessment" ON public.assessment_questions;
CREATE POLICY "Service role full assessment" ON public.assessment_questions FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role full assessment_sessions" ON public.assessment_sessions;
CREATE POLICY "Service role full assessment_sessions" ON public.assessment_sessions FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role full assessment_answers" ON public.assessment_answers;
CREATE POLICY "Service role full assessment_answers" ON public.assessment_answers FOR ALL TO service_role USING (true);
DROP POLICY IF EXISTS "Service role full oral_mirror" ON public.oral_mirror_recordings;
CREATE POLICY "Service role full oral_mirror" ON public.oral_mirror_recordings FOR ALL TO service_role USING (true);

-- 7. Seed assessment questions (30 adaptive questions across 4 sections)
INSERT INTO public.assessment_questions (id, section, skill, difficulty, question_type, prompt_text, options, correct_answer, expected_keywords, cefr_level, weight, order_index) VALUES
-- VOCAB SECTION (8 questions)
('vocab_a1_1', 'vocab', 'A1_vocab', 'A1', 'mcq', 'What do you do in the morning?', '[{"text": "I wake up at 7 AM.", "correct": true}, {"text": "I am wake up at 7 AM.", "correct": false}, {"text": "I waking up at 7 AM.", "correct": false}]', NULL, NULL, 'A1', 1, 1),
('vocab_a1_2', 'vocab', 'A1_vocab', 'A1', 'mcq', 'My sister ___ a teacher.', '[{"text": "is", "correct": true}, {"text": "are", "correct": false}, {"text": "am", "correct": false}]', NULL, NULL, 'A1', 1, 2),
('vocab_a2_1', 'vocab', 'A2_vocab', 'A2', 'mcq', 'I ___ to the gym three times a week.', '[{"text": "go", "correct": true}, {"text": "going", "correct": false}, {"text": "goes", "correct": false}]', NULL, NULL, 'A2', 1, 3),
('vocab_a2_2', 'vocab', 'A2_vocab', 'A2', 'fill_blank', 'I usually ___ breakfast at 8 AM.', NULL, 'have', NULL, 'A2', 1, 4),
('vocab_b1_1', 'vocab', 'B1_vocab', 'B1', 'mcq', 'The project was challenging, but we managed to ___ it on time.', '[{"text": "complete", "correct": true}, {"text": "finish", "correct": false}, {"text": "end", "correct": false}]', NULL, NULL, 'B1', 2, 5),
('vocab_b1_2', 'vocab', 'B1_vocab', 'B1', 'fill_blank', 'I need to ___ my English skills for the job.', NULL, 'improve', NULL, 'B1', 2, 6),
('vocab_b2_1', 'vocab', 'B2_vocab', 'B2', 'mcq', 'The new policy will ___ significant changes to our workflow.', '[{"text": "implement", "correct": false}, {"text": "entail", "correct": true}, {"text": "cause", "correct": false}]', NULL, NULL, 'B2', 3, 7),
('vocab_b2_2', 'vocab', 'B2_vocab', 'B2', 'fill_blank', 'We need to ___ the risks before launching.', NULL, 'mitigate', NULL, 'B2', 3, 8),

-- GRAMMAR SECTION (8 questions)
('grammar_a1_1', 'grammar', 'A1_grammar', 'A1', 'mcq', 'She ___ to work every day.', '[{"text": "goes", "correct": true}, {"text": "go", "correct": false}, {"text": "going", "correct": false}]', NULL, NULL, 'A1', 1, 9),
('grammar_a1_2', 'grammar', 'A1_grammar', 'A1', 'mcq', '___ you like coffee?', '[{"text": "Do", "correct": true}, {"text": "Are", "correct": false}, {"text": "Does", "correct": false}]', NULL, NULL, 'A1', 1, 10),
('grammar_a2_1', 'grammar', 'A2_grammar', 'A2', 'mcq', 'I ___ English for two years.', '[{"text": "have been learning", "correct": true}, {"text": "am learning", "correct": false}, {"text": "learn", "correct": false}]', NULL, NULL, 'A2', 1, 11),
('grammar_a2_2', 'grammar', 'A2_grammar', 'A2', 'reorder', 'Put the words in order: "yesterday / I / went / to / the / store"', NULL, 'I went to the store yesterday', NULL, 'A2', 1, 12),
('grammar_b1_1', 'grammar', 'B1_grammar', 'B1', 'mcq', 'If I ___ more time, I would travel.', '[{"text": "had", "correct": true}, {"text": "have", "correct": false}, {"text": "will have", "correct": false}]', NULL, NULL, 'B1', 2, 13),
('grammar_b1_2', 'grammar', 'B1_grammar', 'B1', 'fill_blank', 'By the time you arrive, I ___ the report.', NULL, 'will have finished', NULL, 'B1', 2, 14),
('grammar_b2_1', 'grammar', 'B2_grammar', 'B2', 'mcq', 'Not only ___ the project on time, but we also exceeded expectations.', '[{"text": "did we complete", "correct": true}, {"text": "we completed", "correct": false}, {"text": "we did complete", "correct": false}]', NULL, NULL, 'B2', 3, 15),
('grammar_b2_2', 'grammar', 'B2_grammar', 'B2', 'fill_blank', 'Had I known the risks, I ___ differently.', NULL, 'would have acted', NULL, 'B2', 3, 16),

-- LISTENING SECTION (7 questions)
('listening_a1_1', 'listening', 'A1_listening', 'A1', 'mcq', 'Listen: "My name is John. I am from London." Where is he from?', '[{"text": "London", "correct": true}, {"text": "Paris", "correct": false}, {"text": "New York", "correct": false}]', NULL, NULL, 'A1', 1, 17),
('listening_a1_2', 'listening', 'A1_listening', 'A1', 'mcq', 'Listen: "I wake up at 7 o''clock." What time does he wake up?', '[{"text": "7 o''clock", "correct": true}, {"text": "8 o''clock", "correct": false}, {"text": "6 o''clock", "correct": false}]', NULL, NULL, 'A1', 1, 18),
('listening_a2_1', 'listening', 'A2_listening', 'A2', 'mcq', 'Listen to the conversation. What is the man''s job?', '[{"text": "Engineer", "correct": true}, {"text": "Doctor", "correct": false}, {"text": "Teacher", "correct": false}]', NULL, NULL, 'A2', 1, 19),
('listening_a2_2', 'listening', 'A2_listening', 'A2', 'fill_blank', 'Listen: "The meeting is scheduled for ___ at 3 PM."', NULL, 'Thursday', NULL, 'A2', 1, 20),
('listening_b1_1', 'listening', 'B1_listening', 'B1', 'mcq', 'Listen to the announcement. What is the main change?', '[{"text": "New deadline", "correct": true}, {"text": "New location", "correct": false}, {"text": "New speaker", "correct": false}]', NULL, NULL, 'B1', 2, 21),
('listening_b1_2', 'listening', 'B1_listening', 'B1', 'fill_blank', 'Listen: "We need to submit the report by ___."', NULL, 'Friday', NULL, 'B1', 2, 22),
('listening_b2_1', 'listening', 'B2_listening', 'B2', 'mcq', 'Listen to the discussion. What is the speaker''s opinion?', '[{"text": "The proposal is feasible but risky.", "correct": true}, {"text": "The proposal should be rejected.", "correct": false}, {"text": "The proposal is perfect.", "correct": false}]', NULL, NULL, 'B2', 3, 23),

-- SPEAKING SECTION (7 questions - adaptive prompts)
('speaking_a1_1', 'speaking', 'A1_speaking', 'A1', 'speaking_prompt', 'Introduce yourself in 30 seconds: name, age, where you live.', NULL, NULL, ARRAY['name', 'age', 'live', 'from'], 'A1', 1, 24),
('speaking_a1_2', 'speaking', 'A1_speaking', 'A1', 'speaking_prompt', 'Describe your daily routine in 40 seconds.', NULL, NULL, ARRAY['wake up', 'breakfast', 'work', 'sleep'], 'A1', 1, 25),
('speaking_a2_1', 'speaking', 'A2_speaking', 'A2', 'speaking_prompt', 'Talk about your hobbies and free time activities for 60 seconds.', NULL, NULL, ARRAY['hobby', 'free time', 'like', 'enjoy', 'weekend'], 'A2', 2, 26),
('speaking_a2_2', 'speaking', 'A2_speaking', 'A2', 'speaking_prompt', 'Describe a memorable trip you took. What happened?', NULL, NULL, ARRAY['went', 'visited', 'saw', 'enjoyed', 'was'], 'A2', 2, 27),
('speaking_b1_1', 'speaking', 'B1_speaking', 'B1', 'speaking_prompt', 'Explain your job/studies and a challenge you faced. How did you solve it? (90s)', NULL, NULL, ARRAY['work', 'challenge', 'solved', 'because', 'result'], 'B1', 3, 28),
('speaking_b1_2', 'speaking', 'B1_speaking', 'B1', 'speaking_prompt', 'Give your opinion: Is it better to work in an office or remotely? Why? (90s)', NULL, NULL, ARRAY['think', 'believe', 'office', 'remote', 'advantage', 'disadvantage'], 'B1', 3, 29),
('speaking_b2_1', 'speaking', 'B2_speaking', 'B2', 'speaking_prompt', 'Present a 2-minute argument: Should companies require employees to return to office? Structure: claim, evidence, counter-argument, conclusion.', NULL, NULL, ARRAY['argue', 'evidence', 'however', 'therefore', 'conclude', 'perspective'], 'B2', 4, 30)
ON CONFLICT (id) DO UPDATE SET
    section = EXCLUDED.section,
    skill = EXCLUDED.skill,
    difficulty = EXCLUDED.difficulty,
    question_type = EXCLUDED.question_type,
    prompt_text = EXCLUDED.prompt_text,
    options = EXCLUDED.options,
    correct_answer = EXCLUDED.correct_answer,
    expected_keywords = EXCLUDED.expected_keywords,
    cefr_level = EXCLUDED.cefr_level,
    weight = EXCLUDED.weight,
    order_index = EXCLUDED.order_index;