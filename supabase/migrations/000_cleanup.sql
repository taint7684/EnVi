-- DROP ALL TABLES FROM MIGRATIONS 003-008
-- Run this FIRST in Supabase Dashboard → SQL Editor to clean slate
-- Then run 003 → 008 in order

-- Disable RLS first (to allow drops)
ALTER TABLE IF EXISTS public.curriculum_topics DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.curriculum_layers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.curriculum_weeks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.curriculum_progress DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.curriculum_daily_log DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.mirror_recordings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.mirror_weekly_comparison DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.real_world_task_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.real_world_tasks DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.assessment_questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessment_answers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.oral_mirror_recordings DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.daily_quest_templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.weekly_leaderboard DISABLE ROW LEVEL SECURITY;

ALTER TABLE IF EXISTS public.phrases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.phrase_reviews DISABLE ROW LEVEL SECURITY;

-- Drop tables in dependency order (children first)
DROP TABLE IF EXISTS public.curriculum_daily_log CASCADE;
DROP TABLE IF EXISTS public.curriculum_progress CASCADE;
DROP TABLE IF EXISTS public.curriculum_weeks CASCADE;
DROP TABLE IF EXISTS public.curriculum_layers CASCADE;
DROP TABLE IF EXISTS public.curriculum_topics CASCADE;

DROP TABLE IF EXISTS public.mirror_weekly_comparison CASCADE;
DROP TABLE IF EXISTS public.mirror_recordings CASCADE;

DROP TABLE IF EXISTS public.real_world_tasks CASCADE;
DROP TABLE IF EXISTS public.real_world_task_templates CASCADE;

DROP TABLE IF EXISTS public.assessment_answers CASCADE;
DROP TABLE IF EXISTS public.assessment_sessions CASCADE;
DROP TABLE IF EXISTS public.oral_mirror_recordings CASCADE;
DROP TABLE IF EXISTS public.assessment_questions CASCADE;

DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.weekly_leaderboard CASCADE;
DROP TABLE IF EXISTS public.daily_quest_templates CASCADE;
DROP TABLE IF EXISTS public.achievements CASCADE;

DROP TABLE IF EXISTS public.phrase_reviews CASCADE;
DROP TABLE IF EXISTS public.phrases CASCADE;

-- Drop function if exists (from 003)
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Verify clean
SELECT tablename FROM pg_tables WHERE schemaname = 'public' 
AND tablename IN (
  'curriculum_topics','curriculum_layers','curriculum_weeks','curriculum_progress','curriculum_daily_log',
  'mirror_recordings','mirror_weekly_comparison',
  'real_world_task_templates','real_world_tasks',
  'assessment_questions','assessment_sessions','assessment_answers','oral_mirror_recordings',
  'achievements','daily_quest_templates','user_achievements','weekly_leaderboard',
  'phrases','phrase_reviews'
);