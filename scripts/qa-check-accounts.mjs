import pg from "pg";

const c = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" });
await c.connect();
const users = await c.query(`select id, email from auth.users order by created_at limit 10`);
console.log(`auth.users (${users.rows.length} sample):`);
for (const u of users.rows) console.log(`  ${u.id}  ${u.email}`);

const profiles = await c.query(`select count(*)::int n from public.profiles`);
console.log(`\nprofiles count: ${profiles.rows[0].n}`);

const phrases = await c.query(`select count(*)::int n from public.phrases`);
console.log(`phrases count: ${phrases.rows[0].n}`);

// Check reflex columns have data
const reflexData = await c.query(`
  select count(*)::int total,
         count(en_alternatives)::int with_en_alt,
         count(situation_en)::int with_situation,
         count(keywords)::int with_keywords,
         count(reflex_reviewed)::int with_reflex_reviewed
  from public.phrases
`);
console.log(`\nReflex data in phrases:`);
console.log(`  total: ${reflexData.rows[0].total}`);
console.log(`  with en_alternatives: ${reflexData.rows[0].with_en_alt}`);
console.log(`  with situation_en: ${reflexData.rows[0].with_situation}`);
console.log(`  with keywords: ${reflexData.rows[0].with_keywords}`);
console.log(`  with reflex_reviewed: ${reflexData.rows[0].with_reflex_reviewed}`);

await c.end();