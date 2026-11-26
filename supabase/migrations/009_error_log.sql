-- Error Log & Makeup Lessons (Closed-loop error system)
-- Run in Supabase Dashboard → SQL Editor

-- 1. Error events table (every user mistake)
CREATE TABLE IF NOT EXISTS public.error_events (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    module TEXT NOT NULL CHECK (module IN ('reflex', 'speaking', 'picture_talk', 'shadowing', 'chunks', 'voice_diary', 'pronunciation', 'grammar', 'writing', 'reading', 'dictation')),
    phrase_id TEXT,
    ref_id TEXT, -- session_id, recording_id, etc.
    
    -- Error classification
    error_type TEXT NOT NULL CHECK (error_type IN ('pronunciation', 'grammar', 'vocabulary', 'fluency', 'meaning', 'vi_segment', 'latency', 'other')),
    severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('minor', 'major', 'critical')),
    
    -- What happened
    expected TEXT,
    actual TEXT,
    user_transcript TEXT,
    ai_feedback JSONB,
    
    -- Context
    layer TEXT CHECK (layer IN ('L1', 'L2', 'L3')),
    topic_id TEXT,
    difficulty TEXT CHECK (difficulty IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2')),
    
    -- Metrics
    latency_ms INTEGER,
    wpm REAL,
    pauses_over_3s INTEGER,
    vi_segments INTEGER DEFAULT 0,
    lifeline_used BOOLEAN DEFAULT false,
    
    -- Status
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_makeup', 'mastered', 'dismissed')),
    makeup_count INTEGER NOT NULL DEFAULT 0,
    last_makeup_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_events_user_status ON public.error_events (user_id, status);
CREATE INDEX IF NOT EXISTS idx_error_events_user_type ON public.error_events (user_id, error_type);
CREATE INDEX IF NOT EXISTS idx_error_events_user_created ON public.error_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_events_phrase ON public.error_events (user_id, phrase_id) WHERE phrase_id IS NOT NULL;

-- 2. Error patterns table (aggregated patterns per user)
CREATE TABLE IF NOT EXISTS public.error_patterns (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pattern_key TEXT NOT NULL, -- e.g., "pronunciation:/θ/", "grammar:present_perfect", "vocabulary:phrasal_verbs"
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('pronunciation', 'grammar', 'vocabulary', 'fluency', 'meaning')),
    count INTEGER NOT NULL DEFAULT 1,
    first_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_seen TIMESTAMPTZ NOT NULL DEFAULT now(),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'improving', 'mastered')),
    mastery_streak INTEGER NOT NULL DEFAULT 0, -- consecutive days without this error
    mastery_level INTEGER NOT NULL DEFAULT 0, -- 0=never, 1=1day, 2=3days, 3=7days, 4=14days, 5=30days
    UNIQUE (user_id, pattern_key)
);

CREATE INDEX IF NOT EXISTS idx_error_patterns_user_status ON public.error_patterns (user_id, status);

-- 3. Pattern catalog (system-wide known error patterns for Vietnamese learners)
CREATE TABLE IF NOT EXISTS public.pattern_catalog (
    id TEXT PRIMARY KEY, -- e.g., "pronunciation:th_unvoiced", "grammar:present_perfect_vs_past"
    pattern_type TEXT NOT NULL CHECK (pattern_type IN ('pronunciation', 'grammar', 'vocabulary', 'fluency', 'meaning')),
    name_vi TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_vi TEXT NOT NULL,
    description_en TEXT NOT NULL,
    examples JSONB NOT NULL DEFAULT '[]', -- [{expected: "...", wrong: "...", correction: "..."}]
    tips_vi TEXT[],
    tips_en TEXT[],
    difficulty TEXT NOT NULL CHECK (difficulty IN ('A1', 'A2', 'B1', 'B2')),
    is_vietnamese_specific BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Makeup lessons table (5-step closed loop)
CREATE TABLE IF NOT EXISTS public.makeup_lessons (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    error_event_id BIGINT NOT NULL REFERENCES public.error_events(id) ON DELETE CASCADE,
    pattern_id BIGINT REFERENCES public.error_patterns(id) ON DELETE SET NULL,
    
    -- 5 steps
    step INTEGER NOT NULL DEFAULT 1 CHECK (step BETWEEN 1 AND 5),
    step1_awareness_done BOOLEAN NOT NULL DEFAULT false, -- Review error + AI explanation
    step2_drill_done BOOLEAN NOT NULL DEFAULT false, -- Targeted drill
    step3_shadowing_done BOOLEAN NOT NULL DEFAULT false, -- Shadowing correct form
    step4_production_done BOOLEAN NOT NULL DEFAULT false, -- Free production
    step5_verification_done BOOLEAN NOT NULL DEFAULT false, -- Verify mastery
    
    -- Step data
    step_data JSONB NOT NULL DEFAULT '{}',
    verification_score REAL, -- 0-1
    
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'mastered', 'needs_review')),
    completed_at TIMESTAMPTZ,
    mastered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_makeup_lessons_user_status ON public.makeup_lessons (user_id, status);
CREATE INDEX IF NOT EXISTS idx_makeup_lessons_error_event ON public.makeup_lessons (error_event_id);

-- 5. Updated_at trigger
DROP TRIGGER IF EXISTS error_events_updated_at ON public.error_events;
CREATE TRIGGER error_events_updated_at
    BEFORE UPDATE ON public.error_events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS makeup_lessons_updated_at ON public.makeup_lessons;
CREATE TRIGGER makeup_lessons_updated_at
    BEFORE UPDATE ON public.makeup_lessons
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. RLS
ALTER TABLE public.error_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.error_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pattern_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.makeup_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own error events" ON public.error_events;
CREATE POLICY "Users manage own error events" ON public.error_events FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users manage own error patterns" ON public.error_patterns;
CREATE POLICY "Users manage own error patterns" ON public.error_patterns FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users read pattern catalog" ON public.pattern_catalog;
CREATE POLICY "Users read pattern catalog" ON public.pattern_catalog FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Users manage own makeup lessons" ON public.makeup_lessons;
CREATE POLICY "Users manage own makeup lessons" ON public.makeup_lessons FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role full error events" ON public.error_events;
CREATE POLICY "Service role full error events" ON public.error_events FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full error patterns" ON public.error_patterns;
CREATE POLICY "Service role full error patterns" ON public.error_patterns FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full pattern catalog" ON public.pattern_catalog;
CREATE POLICY "Service role full pattern catalog" ON public.pattern_catalog FOR ALL TO service_role USING (true);

DROP POLICY IF EXISTS "Service role full makeup lessons" ON public.makeup_lessons;
CREATE POLICY "Service role full makeup lessons" ON public.makeup_lessons FOR ALL TO service_role USING (true);

-- 7. Seed pattern catalog (12 pronunciation + common grammar/vocab patterns for Vietnamese learners)
INSERT INTO public.pattern_catalog (id, pattern_type, name_vi, name_en, description_vi, description_en, examples, tips_vi, tips_en, difficulty, is_vietnamese_specific) VALUES
-- Pronunciation patterns (12 key Vietnamese errors)
('pronunciation:th_unvoiced', 'pronunciation', 'Th không thanh /θ/', 'Voiceless TH /θ/', 'Phát âm /θ/ như "th" trong "think" - người Việt thường đọc thành "t" hoặc "s"', 'Voiceless TH /θ/ as in "think" - Vietnamese learners often say "t" or "s"', '[{"expected": "think /θɪŋk/", "wrong": "tink /tɪŋk/ or sink /sɪŋk/", "correction": "Răng cắn nhẹ môi dưới, thổi khí ra"}]', '["Đặt lưỡi giữa hai răng cửa", "Thổi khí nhẹ, không rung dây thanh", "Tập: think, three, thumb, mouth"]', '["Place tongue between teeth", "Blow air gently, no vocal cord vibration", "Practice: think, three, thumb, mouth"]', 'A1', true),
('pronunciation:th_voiced', 'pronunciation', 'Th có thanh /ð/', 'Voiced TH /ð/', 'Phát âm /ð/ như "th" trong "this" - người Việt thường đọc thành "d" hoặc "z"', 'Voiced TH /ð/ as in "this" - Vietnamese learners often say "d" or "z"', '[{"expected": "this /ðɪs/", "wrong": "dis /dɪs/ or zis /zɪs/", "correction": "Răng cắn nhẹ môi dưới, rung dây thanh"}]', '["Đặt lưỡi giữa hai răng cửa", "Rung dây thanh khi thổi khí", "Tập: this, that, the, mother"]', '["Place tongue between teeth", "Vibrate vocal cords while blowing", "Practice: this, that, the, mother"]', 'A1', true),
('pronunciation:final_consonants', 'pronunciation', 'Phụ âm cuối từ', 'Final consonants', 'Người Việt thường không phát âm phụ âm cuối (p, t, k, s, d, g...)', 'Vietnamese learners often drop final consonants (p, t, k, s, d, g...)', '[{"expected": "stop /stɒp/", "wrong": "sto /stəʊ/", "correction": "Giữ mô hình miệng, nghe rõ âm cuối"}]', '["Giữ hình dáng miệng sau âm cuối", "Tập nói chậm, nghe chính mình", "Tập: stop, work, need, book"]', '["Hold mouth shape after final sound", "Practice slowly, listen to yourself", "Practice: stop, work, need, book"]', 'A2', true),
('pronunciation:v_w', 'pronunciation', 'V và W', 'V vs W', 'Người Việt không phân biệt /v/ (cắn môi) và /w/ (mở tròn miệng)', 'Vietnamese learners confuse /v/ (bite lip) and /w/ (round lips)', '[{"expected": "very /veri/", "wrong": "weri /weri/", "correction": "Răng trên cắn môi dưới cho V"}]', '["V: Răng trên cắn nhẹ môi dưới", "W: Mở tròn miệng, không cắn môi", "Tập: very, work, week, voice"]', '["V: Top teeth bite bottom lip", "W: Round lips, no teeth contact", "Practice: very, work, week, voice"]', 'A1', true),
('pronunciation:r_l', 'pronunciation', 'R và L', 'R vs L', 'Phân biệt /r/ (lưỡi cuộn) và /l/ (lưỡi chạm răng)', 'Distinguish /r/ (curled tongue) and /l/ (tongue touches teeth)', '[{"expected": "right /raɪt/", "wrong": "light /laɪt/", "correction": "Lưỡi cuộn lên cho R, chạm răng cho L"}]', '["R: Lưỡi cuộn lên không chạm đâu", "L: Đuôi lưỡi chạm răng cửa trên", "Tập: right, light, read, lead"]', '["R: Curl tongue up, no contact", "L: Tongue tip touches upper teeth", "Practice: right, light, read, lead"]', 'A2', true),
('pronunciation:z_s', 'pronunciation', 'Z và S', 'Z vs S', 'Phân biệt /z/ (có thanh) và /s/ (không thanh)', 'Distinguish /z/ (voiced) and /s/ (voiceless)', '[{"expected": "zoo /zuː/", "wrong": "sue /suː/", "correction": "Rung dây thanh cho Z"}]', '["Z: Rung dây thanh", "S: Không rung, chỉ thổi khí", "Tập: zoo, sue, rose, rice"]', '["Z: Vocal cords vibrate", "S: No vibration, just air", "Practice: zoo, sue, rose, rice"]', 'A2', true),
('pronunciation:ed_endings', 'pronunciation', 'Định ngữ -ed', '-ed endings', 'Phát âm -ed: /t/, /d/, /ɪd/ tùy âm trước', 'Pronounce -ed: /t/, /d/, /ɪd/ depending on preceding sound', '[{"expected": "walked /wɔːkt/", "wrong": "walk-ed /wɔːkɪd/", "correction": "Sau k/c/p/f/s/sh/ch/th: đọc /t/"}]', '["Sau k/c/p/f/s/sh/ch/th: /t/", "Sau âm còn lại (trừ t/d): /d/", "Sau t/d: /ɪd/", "Tập: walked, played, wanted"]', '["After k/c/p/f/s/sh/ch/th: /t/", "After other voiced sounds: /d/", "After t/d: /ɪd/", "Practice: walked, played, wanted"]', 'A2', true),
('pronunciation:schwa', 'pronunciation', 'Âm schwa /ə/', 'Schwa /ə/', 'Âm yếu /ə/ trong từ nhiều âm tiết - người Việt đọc tất cả âm tiết rõ', 'Weak schwa /ə/ in multi-syllable words - Vietnamese read all syllables clearly', '[{"expected": "about /əˈbaʊt/", "wrong": "a-bout /eɪ baʊt/", "correction": "Âm tiết yếu: đọc nhẹ, nhanh, không rõ"}]', '["Âm tiết không trọng âm: đọc /ə/", "Nhanh, nhẹ, miệng mở vừa", "Tập: about, problem, today, banana"]', '["Unstressed syllables: read /ə/", "Quick, light, mouth slightly open", "Practice: about, problem, today, banana"]', 'B1', true),
('pronunciation:linking', 'pronunciation', 'Nối âm', 'Linking sounds', 'Nối phụ âm cuối từ trước với nguyên âm từ sau', 'Link final consonant to next vowel', '[{"expected": "turn off /tɜːr nɒf/", "wrong": "turn... off /tɜːr... ɒf/", "correction": "Nói liền mạch, không ngắt quãng"}]', '["Phụ âm cuối + nguyên âm đầu: nối liền", "Tập nói câu nhanh, không tách từ", "Tập: turn on, pick up, look at"]', '["Final consonant + initial vowel: link", "Practice sentences smoothly", "Practice: turn on, pick up, look at"]', 'B1', true),
('pronunciation:stress', 'pronunciation', 'Trọng âm từ/câu', 'Word/Sentence stress', 'Trọng âm sai làm người nghe khó hiểu - tiếng Việt không có trọng âm', 'Wrong stress makes speech hard to understand - Vietnamese has no stress', '[{"expected": "REcord (n) vs reCORD (v)", "wrong": "record vs record (ngang)", "correction": "Mở to miệng, to głos, kéo dài ở âm tiết trọng"}', '["Từ 2 âm tiết: danh từ trọng âm 1, động từ trọng âm 2", "Từ câu: từ mang ý nghĩa trọng, từ chức năng nhẹ", "Tập: PREsent vs preSENT, IMportant"]', '["2-syllable: noun stress 1st, verb stress 2nd", "Sentence: content words stressed", "Practice: PREsent vs preSENT, IMportant"]', 'B1', true),
('pronunciation:intonation', 'pronunciation', 'Ngữ điệu câu', 'Sentence intonation', 'Ngữ điệu hỏi/khẳng định/mệnh lệnh - tiếng Việt dùng thanh điệu từ', 'Question/statement/command intonation - Vietnamese uses word tones', '[{"expected": "You're coming? ↗", "wrong": "You're coming ↘ (như câu khẳng định)", "correction": "Câu hỏi Yes/No: giọng lên cuối"} ]', '["Câu hỏi Yes/No: giọng lên ↗", "Câu hỏi Wh-: giọng xuống ↘", "Câu khẳng định: giọng xuống ↘", "Tập: Are you ready? What time?"]', '["Yes/No questions: rising ↗", "Wh-questions: falling ↘", "Statements: falling ↘", "Practice: Are you ready? What time?"]', 'B1', true),
('pronunciation:ng_nk', 'pronunciation', 'NG và NK', 'NG vs NK', 'Phân biệt /ŋ/ (ng) và /ŋk/ (nk) cuối từ', 'Distinguish /ŋ/ (ng) and /ŋk/ (nk) at word end', '[{"expected": "sing /sɪŋ/ vs sink /sɪŋk/", "wrong": "sing /sɪŋk/ thêm k", "correction": "NG: không có k, NK: có k nhẹ"}]', '["NG: Chỉ /ŋ/, lưỡi chạm vòm mềm", "NK: /ŋk/, có k nhẹ ở cuối", "Tập: sing, sink, ring, rink"]', '["NG: Just /ŋ/, tongue to soft palate", "NK: /ŋk/, light k at end", "Practice: sing, sink, ring, rink"]', 'A2', true),

-- Grammar patterns
('grammar:present_perfect_vs_past', 'grammar', 'Present Perfect vs Past Simple', 'Present Perfect vs Past Simple', 'Phân biệt quá khứ đơn và hiện tại hoàn thành', 'Distinguish Past Simple and Present Perfect', '[{"expected": "I have worked here for 5 years", "wrong": "I worked here for 5 years (nếu vẫn còn làm)", "correction": "for/since + hành động còn tiếp tục = Present Perfect"}]', '["for/since + hành động còn tiếp tục: Present Perfect", "Thời gian cụ thể trong quá khứ: Past Simple", "Tập: I have lived here since 2020 vs I lived there in 2019"]', '["for/since + ongoing action: Present Perfect", "Specific past time: Past Simple", "Practice: I have lived here since 2020 vs I lived there in 2019"]', 'B1', false),
('grammar:articles', 'grammar', 'Mạo từ a/an/the', 'Articles a/an/the', 'Người Việt không có mạo từ - thường bỏ qua hoặc dùng sai', 'Vietnamese has no articles - often omitted or misused', '[{"expected": "I need a pen", "wrong": "I need pen", "correction": "Danh từ số ít không xác định: a/an"}]', '["Danh từ số ít lần đầu nhắc: a/an", "Đã biết/duy nhất: the", "Danh từ số nhiều/chung: không mạo từ", "Tập: a book, the book, books"]', '["First mention singular: a/an", "Known/unique: the", "Plural/general: no article", "Practice: a book, the book, books"]', 'A2', false),
('grammar:prepositions', 'grammar', 'Giới từ in/on/at', 'Prepositions in/on/at', 'Giới từ chỉ thời gian/địa điểm - người Việt dịch từng từ', 'Time/place prepositions - Vietnamese translate word by word', '[{"expected": "in the morning, on Monday, at 9am", "wrong": "in Monday, at the morning", "correction": "in: tháng/năm/buổi; on: ngày; at: giờ cụ thể"}]', '["in: months/years/parts of day", "on: days/dates", "at: specific times", "Practice: in January, on Monday, at 9am"]', 'A2', false),
('grammar:conditionals', 'grammar', 'Câu điều kiện', 'Conditionals', 'Type 0, 1, 2, 3 - người Việt thường trộn lẫn', 'Type 0, 1, 2, 3 conditionals - Vietnamese learners mix them', '[{"expected": "If I were you, I would go", "wrong": "If I am you, I will go", "correction": "Type 2: If + past, would + V"}]', '["Type 0: If + present, present (luôn đúng)", "Type 1: If + present, will + V (có thể xảy ra)", "Type 2: If + past, would + V (giả định hiện tại)", "Type 3: If + past perfect, would have + V3 (giả định quá khứ)"]', '["Type 0: If + present, present (always true)", "Type 1: If + present, will + V (possible)", "Type 2: If + past, would + V (hypothetical present)", "Type 3: If + past perfect, would have + V3 (hypothetical past)"]', 'B2', false),

-- Vocabulary patterns
('vocabulary:phrasal_verbs', 'vocabulary', 'Phrasal verbs', 'Phrasal verbs', 'Động từ ghép - người Việt học từ đơn lẻ', 'Phrasal verbs - Vietnamese learn single words', '[{"expected": "give up, look forward to, run out of", "wrong": "stop, wait, finish", "correction": "Học theo cụm, không học từ đơn"}]', '["Học theo cụm: verb + particle", "Nhiều nghĩa tùy ngữ cảnh", "Tập: give up, look forward to, run out of, put off"]', '["Learn as chunks: verb + particle", "Multiple meanings by context", "Practice: give up, look forward to, run out of, put off"]', 'B1', false),
('vocabulary:collocations', 'vocabulary', 'Collocations (cụm từ đi kèm)', 'Collocations', 'Tự nhiên hơn khi dùng từ đi kèm đúng', 'More natural with correct word partners', '[{"expected": "make a decision, take a break, have lunch", "wrong": "do a decision, make a break, eat lunch", "correction": "Học từ theo cặp: make/take/have + danh từ"}]', '["Học theo cặp: make/take/have/do + danh từ", "Không dịch từng từ", "Tập: make a mistake, take a chance, have a meeting"]', '["Learn pairs: make/take/have/do + noun", "Don not translate word by word", "Practice: make a mistake, take a chance, have a meeting"]', 'B1', false)
ON CONFLICT (id) DO NOTHING;

-- 8. Function to trigger pattern creation from error event
CREATE OR REPLACE FUNCTION public.process_error_event(
    p_user_id UUID,
    p_module TEXT,
    p_error_type TEXT,
    p_expected TEXT,
    p_actual TEXT,
    p_pattern_key TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO public.error_patterns (user_id, pattern_key, pattern_type, count, first_seen, last_seen)
    VALUES (p_user_id, p_pattern_key, p_error_type, 1, now(), now())
    ON CONFLICT (user_id, pattern_key) DO UPDATE SET
        count = error_patterns.count + 1,
        last_seen = now(),
        status = 'active';
END $$;

GRANT EXECUTE ON FUNCTION public.process_error_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_error_event(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO service_role;