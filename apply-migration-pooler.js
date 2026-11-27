require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = match ? match[1] : 'unknown';
console.log('Project ref:', projectRef);

// Try pooler connection (transaction pooler)
const poolerHost = 'aws-0-us-east-1.pooler.supabase.com';
const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_ROLE_KEY}@${poolerHost}:5432/postgres`;
console.log('Pooler connection:', connectionString.replace(/:[^:@]+@/, ':***@'));

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    await client.connect();
    console.log('Connected!');
    const sql = `
CREATE TABLE IF NOT EXISTS public.reflex_phrases (
    id TEXT PRIMARY KEY,
    vi_text TEXT NOT NULL,
    en_text TEXT NOT NULL,
    audio_url TEXT,
    situation_en TEXT NOT NULL,
    en_alternatives TEXT[] NOT NULL DEFAULT '{}',
    keywords TEXT[] NOT NULL DEFAULT '{}',
    sentence_type TEXT NOT NULL CHECK (sentence_type IN ('qa', 'situation', 'continue', 'paraphrase', 'circumlocution')),
    difficulty TEXT NOT NULL CHECK (difficulty IN ('A1', 'A2', 'B1', 'B2')),
    level TEXT NOT NULL CHECK (level IN ('L1', 'L2', 'L3')),
    topic TEXT NOT NULL REFERENCES public.curriculum_topics(id) ON DELETE CASCADE,
    reflex_reviewed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.reflex_phrases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Authenticated read reflex phrases" ON public.reflex_phrases;
CREATE POLICY "Authenticated read reflex phrases" ON public.reflex_phrases FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Service role full reflex phrases" ON public.reflex_phrases;
CREATE POLICY "Service role full reflex phrases" ON public.reflex_phrases FOR ALL TO service_role USING (true);
CREATE INDEX IF NOT EXISTS idx_reflex_phrases_topic ON public.reflex_phrases (topic);
CREATE INDEX IF NOT EXISTS idx_reflex_phrases_sentence_type ON public.reflex_phrases (sentence_type);
CREATE INDEX IF NOT EXISTS idx_reflex_phrases_level ON public.reflex_phrases (level);
CREATE INDEX IF NOT EXISTS idx_reflex_phrases_difficulty ON public.reflex_phrases (difficulty);
`;
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();