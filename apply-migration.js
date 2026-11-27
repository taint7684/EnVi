require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
const projectRef = match ? match[1] : 'unknown';
console.log('Project ref:', projectRef);

const connectionString = `postgresql://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.${projectRef}.supabase.co:5432/postgres`;
console.log('Connecting...');

const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

async function run() {
  try {
    await client.connect();
    const sql = fs.readFileSync('supabase/migrations/015_reflex_phrases.sql', 'utf8');
    await client.query(sql);
    console.log('Migration applied successfully!');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await client.end();
  }
}

run();