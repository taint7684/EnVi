import pg from "pg";

const c = new pg.Client({ host: "127.0.0.1", port: 54322, user: "postgres", password: "postgres", database: "postgres" });
await c.connect();

const TEST_UUID = "00000000-0000-0000-0000-000000000099";
const TEST_EMAIL = "qa.delete@test.local";

// Clean up any leftover from previous runs
await c.query(`delete from auth.users where id = $1`, [TEST_UUID]);

// 1. Create throwaway user (trigger handle_new_user creates profile automatically)
await c.query(`insert into auth.users (id, email) values ($1, $2)`, [TEST_UUID, TEST_EMAIL]);
console.log("1. Created test user + profile (via trigger)");

// 2. Insert test data across multiple tables that delete_my_account touches
await c.query(`
  insert into public.decks (user_id, name, description)
  values ($1, 'test deck', 'test deck desc')
`, [TEST_UUID]);
const deck = (await c.query(`select id from public.decks where user_id = $1`, [TEST_UUID])).rows[0];
await c.query(`
  insert into public.deck_words (deck_id, word_id)
  select $1, id from public.words limit 1
`, [deck.id]);
console.log("2. Inserted deck + deck_words (tests deck_words deletion)");

// Insert a speaking session
await c.query(`
  insert into public.speaking_sessions (user_id, mode, level)
  values ($1, 'coach', 'A2')
`, [TEST_UUID]);
console.log("3. Inserted speaking_session");

// Insert an activity event (from 0010)
await c.query(`
  insert into public.activity_events (user_id, type, study_date)
  values ($1, 'vocab_review', current_date)
`, [TEST_UUID]);
console.log("4. Inserted activity_event");

// 3. Set JWT claims to simulate authenticated user, then call delete_my_account()
await c.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify({ sub: TEST_UUID, role: "authenticated" })]);
console.log("5. Set JWT claims for test user");

// Verify data exists BEFORE deletion
const before = await c.query(`
  select
    (select count(*) from public.profiles where id = $1)::int as profiles,
    (select count(*) from public.decks where user_id = $1)::int as decks,
    (select count(*) from public.deck_words dw join public.decks d on dw.deck_id = d.id where d.user_id = $1)::int as deck_words,
    (select count(*) from public.speaking_sessions where user_id = $1)::int as speaking_sessions,
    (select count(*) from public.activity_events where user_id = $1)::int as activity_events
`, [TEST_UUID]);
console.log("6. Before deletion:", JSON.stringify(before.rows[0]));

// 4. Call delete_my_account()
await c.query(`select public.delete_my_account()`);
console.log("7. delete_my_account() called");

// 5. Verify data is GONE
const after = await c.query(`
  select
    (select count(*) from public.profiles where id = $1)::int as profiles,
    (select count(*) from public.decks where user_id = $1)::int as decks,
    (select count(*) from public.speaking_sessions where user_id = $1)::int as speaking_sessions,
    (select count(*) from public.activity_events where user_id = $1)::int as activity_events,
    (select count(*) from auth.users where id = $1)::int as auth_users
`, [TEST_UUID]);
console.log("8. After deletion:", JSON.stringify(after.rows[0]));

const b = before.rows[0];
const a = after.rows[0];
const allGone = a.profiles === 0 && a.decks === 0 && a.speaking_sessions === 0 && a.activity_events === 0 && a.auth_users === 0;
console.log(`\n=== DELETE ACCOUNT TEST: ${allGone ? "PASS ✅" : "FAIL ❌"} ===`);
if (!allGone) console.log("Remaining data:", JSON.stringify(a));

// Cleanup any leftover
await c.query(`delete from auth.users where id = $1`, [TEST_UUID]);
await c.end();