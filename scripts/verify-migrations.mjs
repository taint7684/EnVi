#!/usr/bin/env node
// Verify Supabase migrations 003-007 applied
// Run with: node scripts/verify-migrations.mjs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tablesToCheck = [
  // 003_curriculum.sql
  'curriculum_topics',
  'curriculum_weeks',
  // 004_mirror_recordings.sql
  'mirror_recordings',
  // mirror_weekly_comparison is a VIEW, not a table
  // 005_real_world_tasks.sql
  'real_world_task_templates',
  'real_world_weekly_tasks',
  // 006_assessment.sql
  'assessment_questions',
  'assessment_sessions',
  'assessment_answers',
  'oral_mirror_recordings',
  // 007_gamification.sql
  'achievements',
  'daily_quest_templates',
  'user_achievements',
  'weekly_leaderboard',
];

async function verifyTable(tableName) {
  try {
    const { data, error } = await supabase.from(tableName).select('*').limit(1);
    if (error) {
      if (error.code === '42P01') { // undefined_table
        return { table: tableName, exists: false, error: 'Table does not exist' };
      }
      return { table: tableName, exists: false, error: error.message };
    }
    return { table: tableName, exists: true, rowCount: data?.length || 0 };
  } catch (e) {
    return { table: tableName, exists: false, error: e instanceof Error ? e.message : String(e) };
  }
}

async function main() {
  console.log('🔍 Verifying Supabase migrations 003-007...\n');
  
  const results = [];
  for (const table of tablesToCheck) {
    const result = await verifyTable(table);
    results.push(result);
    const status = result.exists ? '✅' : '❌';
    const info = result.exists ? `(${result.rowCount} rows)` : `ERROR: ${result.error}`;
    console.log(`${status} ${table} ${info}`);
  }
  
  console.log('\n📊 Summary:');
  const passed = results.filter(r => r.exists).length;
  const failed = results.filter(r => !r.exists).length;
  console.log(`   Passed: ${passed}/${tablesToCheck.length}`);
  console.log(`   Failed: ${failed}/${tablesToCheck.length}`);
  
  if (failed > 0) {
    console.log('\n❌ Missing tables:');
    results.filter(r => !r.exists).forEach(r => console.log(`   - ${r.table}: ${r.error}`));
    process.exit(1);
  } else {
    console.log('\n✅ All migrations 003-007 verified!');
  }
}

main().catch(console.error);