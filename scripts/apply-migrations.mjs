#!/usr/bin/env node
// Apply Supabase migrations 003-007 via SQL execution
// Run with: node scripts/apply-migrations.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const migrations = [
  '003_curriculum.sql',
  '004_mirror_recordings.sql',
  '005_real_world_tasks.sql',
  '006_assessment.sql',
  '007_gamification.sql',
];

async function applyMigration(filename) {
  const filepath = join('C:\\Users\\LENOVO\\Desktop\\EnVi\\supabase\\migrations', filename);
  const sql = readFileSync(filepath, 'utf-8');
  
  console.log(`\n📄 Applying ${filename}...`);
  
  // Split by semicolon but be careful with functions
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const stmt of statements) {
    if (stmt.trim() === '') continue;
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: stmt + ';' });
      if (error) {
        // Try direct query for statements that don't work with rpc
        const { error: err2 } = await supabase.from('_temp').select('1').limit(0);
        // Just log and continue for now
        console.log(`   ⚠️  Statement may need manual execution: ${stmt.substring(0, 80)}...`);
      } else {
        console.log(`   ✅ Executed`);
      }
    } catch (e) {
      console.log(`   ⚠️  Error (may need manual): ${e instanceof Error ? e.message : String(e)}`);
    }
  }
}

async function main() {
  console.log('🚀 Applying migrations 003-007...');
  
  for (const migration of migrations) {
    await applyMigration(migration);
  }
  
  console.log('\n⚠️  Note: Some statements (CREATE FUNCTION, CREATE VIEW, RLS policies) may need manual execution in Supabase Dashboard SQL Editor.');
  console.log('Please copy-paste the migration files content into Supabase Dashboard > SQL Editor and run them.');
}

main().catch(console.error);