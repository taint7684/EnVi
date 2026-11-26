// Restore script: import JSON backup into a target database
// Usage: node scripts/restore-production.mjs <backup.json> [target_db_url]
// If no target_db_url, restores to local QA (127.0.0.1:54322, postgres)
import pg from "pg";
import { readFileSync } from "fs";

const backupFile = process.argv[2];
if (!backupFile) {
  console.error("Usage: node scripts/restore-production.mjs <backup.json> [target_db_url]");
  process.exit(1);
}

const targetUrl = process.argv[3];
let client;

if (targetUrl) {
  // Restore to remote (Production or other)
  client = new pg.Client({ connectionString: targetUrl });
} else {
  // Restore to local QA for testing
  client = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" });
}

const data = JSON.parse(readFileSync(backupFile, "utf8"));
console.log(`=== RESTORE FROM BACKUP ===`);
console.log(`Backup timestamp: ${data.timestamp}`);
console.log(`Tables in backup: ${data.tableCount}`);
console.log(`Total rows: ${data.totalRows}`);
console.log(`Target: ${targetUrl ?? "local QA (127.0.0.1:54322)"}`);

await client.connect();

// Disable triggers temporarily for faster restore
await client.query(`set session_replication_role = 'replica'`);

let restored = 0, errors = 0;
for (const [table, rows] of Object.entries(data.tables)) {
  if (!rows || rows.length === 0) {
    console.log(`  ⏭️ ${table}: 0 rows (skip)`);
    continue;
  }
  const cols = Object.keys(rows[0]);
  const BATCH = 500;
  try {
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const placeholders = batch.map((_, bi) => `(${cols.map((_, j) => `$${bi * cols.length + j + 1}`).join(",")})`).join(",");
      const sql = `insert into public.${table} (${cols.join(",")}) values ${placeholders} on conflict do nothing`;
      const values = batch.flatMap((r) => cols.map((c) => {
        const v = r[c];
        if (v === null || v === undefined) return null;
        if (typeof v === "object") return JSON.stringify(v);
        return v;
      }));
      await client.query(sql, values);
    }
    restored += rows.length;
    console.log(`  ✅ ${table}: ${rows.length} rows restored`);
  } catch (e) {
    errors++;
    console.log(`  ❌ ${table}: ${e.message.slice(0, 100)}`);
  }
}

await client.query(`set session_replication_role = 'origin'`);
await client.end();

console.log(`\n=== RESTORE RESULT ===`);
console.log(`Restored: ${restored} rows across ${data.tableCount} tables`);
console.log(`Errors: ${errors}`);
console.log(`Status: ${errors === 0 ? "✅ SUCCESS" : "⚠️ PARTIAL"}`);