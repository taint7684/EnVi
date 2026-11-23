import pg from "pg";

const client = new pg.Client({
  host: "127.0.0.1",
  port: 54322,
  user: "postgres",
  password: "postgres",
  database: "postgres",
});

await client.connect();
const res = await client.query(`
  select table_name from information_schema.tables
  where table_schema = 'public' order by table_name
`);
console.log(`=== envi-qa public tables (${res.rows.length}) ===`);
for (const r of res.rows) console.log(`  ${r.table_name}`);

// Check phrases columns
const cols = await client.query(`
  select column_name from information_schema.columns
  where table_schema = 'public' and table_name = 'phrases'
  order by column_name
`);
console.log(`\n=== phrases columns (${cols.rows.length}) ===`);
for (const r of cols.rows) console.log(`  ${r.column_name}`);

// Count phrases
try {
  const cnt = await client.query(`select count(*)::int as n from public.phrases`);
  console.log(`\nphrases row count: ${cnt.rows[0].n}`);
} catch (e) {
  console.log(`\nphrases count error: ${e.message.slice(0, 80)}`);
}

await client.end();