import pg from "pg";
const c = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "envi_sim3" });
await c.connect();
const t1 = (await c.query(`select table_name from information_schema.tables where table_schema='public' order by table_name`)).rows.map(r=>r.table_name);
console.log(`envi_sim3 (combined SQL): ${t1.length} tables`);
console.log(t1.join(", "));

// Compare with envi_sim2 (individual migrations, 50 tables)
const c2 = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "envi_sim2" });
await c2.connect();
const t2 = (await c2.query(`select table_name from information_schema.tables where table_schema='public' order by table_name`)).rows.map(r=>r.table_name);
console.log(`\nenvi_sim2 (individual migrations): ${t2.length} tables`);

const missing = t2.filter(t => !t1.includes(t));
console.log(`\nMissing from combined SQL: ${missing.join(", ")}`);
await c.end(); await c2.end();