import pg from "pg";
const c = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "envi_sim" });
await c.connect();

const r = await c.query(`
  select relname as table_name, relrowsecurity as rls_enabled
  from pg_class
  join pg_namespace on pg_namespace.oid = pg_class.relnamespace
  where pg_namespace.nspname = 'public'
    and pg_class.relkind = 'r'
  order by relrowsecurity, relname
`);
const noRls = r.rows.filter((x) => !x.rls_enabled);
console.log(`envi_sim: RLS enabled ${r.rows.length - noRls.length}/${r.rows.length}`);
console.log(`\n=== TABLES WITH RLS DISABLED (${noRls.length}) ===`);
for (const t of noRls) {
  console.log(`  ${t.table_name}`);
  // Check policies
  const p = await c.query(`select policyname, cmd, roles from pg_policies where tablename = $1`, [t.table_name]);
  console.log(`    Policies: ${p.rows.length}`);
  for (const pol of p.rows) console.log(`      ${pol.policyname} (${pol.cmd}, roles=${pol.roles})`);
  // Check grants
  const g = await c.query(`
    select grantee, privilege_type
    from information_schema.role_table_grants
    where table_schema = 'public' and table_name = $1
    order by grantee, privilege_type
  `, [t.table_name]);
  console.log(`    Grants:`);
  for (const row of g.rows) console.log(`      ${row.grantee}: ${row.privilege_type}`);
}
await c.end();