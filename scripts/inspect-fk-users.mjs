import pg from "pg";
const c = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" });
await c.connect();
const r = await c.query(`
  select
    con.conname as name,
    rel.relname as table_name,
    att.attname as column_name,
    fn.relname as ref_table,
    fns.nspname as ref_schema,
    case con.confdeltype
      when 'a' then 'NO ACTION'
      when 'r' then 'RESTRICT'
      when 'c' then 'CASCADE'
      when 'n' then 'SET NULL'
      when 'd' then 'SET DEFAULT'
    end as delete_rule
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_class fn on fn.oid = con.confrelid
  join pg_namespace fns on fns.oid = fn.relnamespace
  join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any(con.conkey)
  where con.contype = 'f'
    and fns.nspname = 'auth'
    and fn.relname = 'users'
  order by rel.relname
`);
console.log(`FKs referencing auth.users (${r.rows.length}):`);
for (const row of r.rows) {
  const flag = row.delete_rule === 'CASCADE' ? '✅ cascade' : `⚠️ ${row.delete_rule}`;
  console.log(`  ${row.table_name}.${row.column_name} -> ${row.ref_schema}.${row.ref_table} [${flag}]`);
}
const ae = r.rows.find((x) => x.table_name === 'activity_events');
console.log(`\nactivity_events FK: ${ae ? ae.delete_rule + ' ' + ae.name : 'NOT FOUND'}`);
await c.end();