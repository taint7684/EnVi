import pg from "pg";
const c3 = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "envi_sim3" });
await c3.connect();
const t3 = (await c3.query(`select table_name from information_schema.tables where table_schema='public' order by table_name`)).rows.map(r=>r.table_name);

const c2 = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "envi_sim2" });
await c2.connect();
const t2 = (await c2.query(`select table_name from information_schema.tables where table_schema='public' order by table_name`)).rows.map(r=>r.table_name);

const extra = t3.filter(t => !t2.includes(t));
const missing = t2.filter(t => !t3.includes(t));
console.log(`envi_sim3 (combined): ${t3.length} tables`);
console.log(`envi_sim2 (individual): ${t2.length} tables`);
console.log(`\nExtra in combined: ${extra.join(", ") || "(none)"}`);
console.log(`Missing from combined: ${missing.join(", ") || "(none)"}`);
await c3.end(); await c2.end();