// Test backup/restore on QA local (envi-qa postgres DB)
// 1. Backup: pg_dump-equivalent via SQL COPY
// 2. Drop a table
// 3. Restore from backup
// 4. Verify
import pg from "pg";
import { writeFileSync, readFileSync, unlinkSync } from "fs";

const conn = { host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" };
const BACKUP_FILE = "C:\\Users\\LENOVO\\Desktop\\EnVi\\scripts\\_backup_test.sql";

// === STEP 1: BACKUP ===
console.log("=== STEP 1: BACKUP ===");
const c1 = new pg.Client(conn);
await c1.connect();

// Get table list
const tables = (await c1.query(`
  select tablename from pg_tables where schemaname = 'public' order by tablename
`)).rows.map((r) => r.tablename);
console.log(`  Tables to back up: ${tables.length}`);

// Dump schema + data for each table
let dump = "-- Backup of envi-qa public schema\n";
dump += "-- Generated: " + new Date().toISOString() + "\n\n";

for (const t of tables) {
  // Schema
  const cols = (await c1.query(`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = $1
    order by ordinal_position
  `, [t])).rows;
  dump += `-- Table: ${t}\n`;
  dump += `create table if not exists public.${t} (\n`;
  dump += cols.map((c) => `  ${c.column_name} ${c.data_type}${c.is_nullable === 'NO' ? ' not null' : ''}${c.column_default ? ' default ' + c.column_default : ''}`).join(",\n");
  dump += "\n);\n";

  // Data
  const rows = (await c1.query(`select * from public.${t}`)).rows;
  if (rows.length > 0) {
    const cols2 = Object.keys(rows[0]);
    dump += `insert into public.${t} (${cols2.join(", ")}) values\n`;
    dump += rows.map((r) => `  (${cols2.map((c) => {
      const v = r[c];
      if (v === null) return "null";
      if (typeof v === "number") return String(v);
      if (typeof v === "boolean") return v ? "true" : "false";
      if (v instanceof Date) return `'${v.toISOString()}'`;
      return `'${String(v).replace(/'/g, "''")}'`;
    }).join(", ")})`).join(",\n");
    dump += ";\n";
  }
  dump += "\n";
}

writeFileSync(BACKUP_FILE, dump, "utf8");
console.log(`  Backup written to: ${BACKUP_FILE}`);
console.log(`  Backup size: ${dump.length} chars`);

// Record row counts before
const beforeCounts = {};
for (const t of ["profiles", "words", "phrases", "daily_plans", "activity_events", "speaking_sessions"]) {
  try {
    const r = await c1.query(`select count(*)::int n from public.${t}`);
    beforeCounts[t] = r.rows[0].n;
  } catch { beforeCounts[t] = "N/A"; }
}
console.log("  Before counts:", JSON.stringify(beforeCounts));
await c1.end();

// === STEP 2: DROP A TABLE ===
console.log("\n=== STEP 2: DROP daily_plans (simulate failure) ===");
const c2 = new pg.Client(conn);
await c2.connect();
await c2.query(`drop table if exists public.daily_plans cascade`);
console.log("  Dropped daily_plans");
const check = await c2.query(`select count(*)::int n from information_schema.tables where table_schema='public' and table_name='daily_plans'`);
console.log(`  daily_plans exists after drop: ${check.rows[0].n > 0 ? "YES" : "NO ✅ (dropped)"}`);

// Also drop activity_events
await c2.query(`drop table if exists public.activity_events cascade`);
console.log("  Dropped activity_events");
await c2.end();

// === STEP 3: RESTORE ===
console.log("\n=== STEP 3: RESTORE from backup ===");
const c3 = new pg.Client(conn);
await c3.connect();
const restoreSQL = readFileSync(BACKUP_FILE, "utf8");
try {
  await c3.query(restoreSQL);
  console.log("  Restore completed ✅");
} catch (e) {
  console.log(`  Restore error: ${e.message.slice(0, 200)}`);
}
await c3.end();

// === STEP 4: VERIFY ===
console.log("\n=== STEP 4: VERIFY ===");
const c4 = new pg.Client(conn);
await c4.connect();
const afterCounts = {};
for (const t of ["profiles", "words", "phrases", "daily_plans", "activity_events", "speaking_sessions"]) {
  try {
    const r = await c4.query(`select count(*)::int n from public.${t}`);
    afterCounts[t] = r.rows[0].n;
  } catch { afterCounts[t] = "N/A (missing)"; }
}
console.log("  After counts:", JSON.stringify(afterCounts));

// Compare
console.log("\n=== COMPARISON ===");
let allMatch = true;
for (const t of Object.keys(beforeCounts)) {
  const match = beforeCounts[t] === afterCounts[t];
  if (!match) allMatch = false;
  console.log(`  ${t}: before=${beforeCounts[t]} after=${afterCounts[t]} ${match ? "✅" : "❌ MISMATCH"}`);
}
console.log(`\n=== BACKUP/RESTORE TEST: ${allMatch ? "PASS ✅" : "FAIL ❌"} ===`);

// Cleanup
unlinkSync(BACKUP_FILE);
console.log("  Backup file cleaned up");
await c4.end();