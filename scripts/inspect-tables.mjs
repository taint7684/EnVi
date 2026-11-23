import pg from "pg";
const c = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" });
await c.connect();
for (const t of ["decks", "deck_words", "speaking_sessions", "activity_events", "profiles"]) {
  const r = await c.query(
    "select column_name, is_nullable, column_default from information_schema.columns where table_schema='public' and table_name=$1 order by ordinal_position",
    [t],
  );
  console.log(`\n${t}:`);
  for (const row of r.rows) console.log(`  ${row.column_name} (null=${row.is_nullable}${row.column_default ? ", default=" + row.column_default : ""})`);
}
console.log("\n=== NOT NULL without default (must supply) ===");
for (const t of ["decks", "deck_words", "speaking_sessions", "activity_events"]) {
  const r = await c.query(
    "select column_name from information_schema.columns where table_schema='public' and table_name=$1 and is_nullable='NO' and column_default is null",
    [t],
  );
  console.log(`${t}:`, r.rows.map((x) => x.column_name).join(", ") || "(none)");
}
await c.end();