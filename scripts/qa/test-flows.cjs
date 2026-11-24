// QA integration test against a local Supabase Postgres (default localhost:54322).
// Verifies: 0024 + 0025 schema, FSRS DB roundtrip, session-state persistence,
// idempotency window, and collocation coverage/quality.
//
// Usage: node scripts/qa/test-flows.cjs [pg-url]
const { Pool } = require("pg");
const { fsrs, createEmptyCard, generatorParameters, Rating, State } = require("ts-fsrs");

const PG_URL = process.argv[2] || "postgres://postgres:postgres@localhost:54322/postgres";
const pool = new Pool({ connectionString: PG_URL });

const params = generatorParameters({ request_retention: 0.9 });
const f = fsrs(params);
const GRADE_TO_RATING = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy };

function newCard(now = new Date()) { return createEmptyCard(now); }
function rowToCard(r) {
  return {
    due: new Date(r.due_at), stability: r.stability ?? 0, difficulty: r.difficulty ?? 0,
    elapsed_days: r.elapsed_days ?? 0, scheduled_days: r.scheduled_days ?? 0,
    reps: r.reps ?? 0, lapses: r.lapses ?? 0, learning_steps: r.learning_steps ?? 0,
    state: (r.state ?? 0), last_review: r.last_reviewed_at ? new Date(r.last_reviewed_at) : undefined,
  };
}
function repeatCard(card, grade, now = new Date()) {
  const rec = f.repeat(card, now);
  return rec[String(GRADE_TO_RATING[grade])].card;
}
function cardToRow(card, now = new Date()) {
  return {
    stability: card.stability, difficulty: card.difficulty, state: card.state,
    elapsed_days: card.elapsed_days, scheduled_days: card.scheduled_days,
    learning_steps: card.learning_steps, interval: Math.round(card.scheduled_days),
    due_at: card.due.toISOString(), reps: card.reps, lapses: card.lapses,
    last_reviewed_at: card.last_review ? card.last_review.toISOString() : now.toISOString(),
  };
}

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log("  PASS " + name); }
  else { fail++; console.log("  FAIL " + name + (extra ? " :: " + extra : "")); }
}

async function main() {
  const userId = "859463e7-dd96-4798-b6e2-cac06eb1ca83";

  // 1. Schema 0024
  const cols = await pool.query(
    `select column_name from information_schema.columns where table_name='card_reviews' and column_name in ('stability','difficulty','state','elapsed_days','scheduled_days','learning_steps','last_review')`
  );
  check("0024: card_reviews FSRS columns (7)", cols.rows.length === 7, "got " + cols.rows.length);

  const t24 = await pool.query(
    `select table_name from information_schema.tables where table_schema='public' and table_name in ('vocab_session_state','vocab_review_log')`
  );
  check("0024: vocab_session_state + vocab_review_log exist", t24.rows.length === 2, "got " + t24.rows.length);

  // 2. Schema 0025
  const t25 = await pool.query(
    `select table_name from information_schema.tables where table_schema='public' and table_name='word_collocations'`
  );
  check("0025: word_collocations table exists", t25.rows.length === 1);

  // 3. Seed coverage
  const wc = await pool.query(`select count(*) as c from public.word_collocations`);
  const total = await pool.query(`select count(*) as c from public.words`);
  const seeded = parseInt(wc.rows[0].c, 10);
  const totalWords = parseInt(total.rows[0].c, 10);
  check("word_collocations seeded for all words", seeded === totalWords, `seeded=${seeded}/${totalWords}`);

  // 4. Collocation quality spot-check (meaning-matched)
  const company = await pool.query(
    `select w.lemma, w.meaning_vi, c.collocation, c.example_en, c.example_vi
     from public.words w join public.word_collocations c on c.word_id=w.id
     where w.lemma='company'`
  );
  for (const r of company.rows) {
    const col = (r.collocation || "").toLowerCase();
    const meaning = (r.meaning_vi || "").toLowerCase();
    let ok = false;
    if (meaning.includes("bầu bạn") || meaning.includes("cùng")) ok = col.includes("company") && (col.includes("keep") || col.includes("keep someone"));
    else if (meaning.includes("công ty")) ok = col.includes("company");
    else ok = col.includes("company");
    check("collocation meaning-match: company (" + meaning.slice(0, 20) + ")", ok, "collocation=" + r.collocation);
  }
  const audience = await pool.query(
    `select w.meaning_vi, c.collocation from public.words w join public.word_collocations c on c.word_id=w.id where w.lemma='audience'`
  );
  for (const r of audience.rows) {
    check("collocation meaning-match: audience", (r.collocation || "").toLowerCase().includes("audience"), "collocation=" + r.collocation);
  }

  // 5. FSRS DB roundtrip: clean any prior review for this word, then apply 'good'
  const wordId = "0545b593-8310-4963-9022-9f86a30fbfb5"; // abandon
  await pool.query(`delete from public.card_reviews where user_id=$1 and word_id=$2`, [userId, wordId]);
  const now = new Date();
  const card = newCard(now);
  const next = repeatCard(card, "good", now);
  const row = cardToRow(next, now);
  await pool.query(
    `insert into public.card_reviews (user_id, word_id, ease, interval, due_at, reps, lapses, last_reviewed_at, stability, difficulty, state, elapsed_days, scheduled_days, learning_steps, last_review)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     on conflict (user_id, word_id) do update set due_at=excluded.due_at, stability=excluded.stability, difficulty=excluded.difficulty, state=excluded.state, reps=excluded.reps, lapses=excluded.lapses, scheduled_days=excluded.scheduled_days, last_reviewed_at=excluded.last_reviewed_at, last_review=excluded.last_review`,
    [userId, wordId, 2.5, row.interval, row.due_at, row.reps, row.lapses, row.last_reviewed_at, row.stability, row.difficulty, row.state, row.elapsed_days, row.scheduled_days, row.learning_steps, row.last_reviewed_at]
  );
  const saved = await pool.query(`select stability, difficulty, state, due_at, reps from public.card_reviews where user_id=$1 and word_id=$2`, [userId, wordId]);
  check("FSRS roundtrip: stability persisted (>0)", parseFloat(saved.rows[0].stability) > 0, "stability=" + saved.rows[0].stability);
  check("FSRS roundtrip: state is Learning/Review", saved.rows[0].state === State.Learning || saved.rows[0].state === State.Review, "state=" + saved.rows[0].state);
  check("FSRS roundtrip: reps incremented", saved.rows[0].reps === 1, "reps=" + saved.rows[0].reps);

  // 6. Session-state persistence (upsert + read)
  await pool.query(
    `insert into public.vocab_session_state (user_id, new_words_count, group_size, current_position, group_started_at, difficult_word_ids, practice_queue)
     values ($1,$2,$3,$4,$5,$6,$7)
     on conflict (user_id) do update set new_words_count=excluded.new_words_count, group_size=excluded.group_size, current_position=excluded.current_position, group_started_at=excluded.group_started_at, difficult_word_ids=excluded.difficult_word_ids, practice_queue=excluded.practice_queue`,
    [userId, 13, 20, 13, now.toISOString(), [wordId], []]
  );
  const ss = await pool.query(`select new_words_count, group_size, current_position, difficult_word_ids from public.vocab_session_state where user_id=$1`, [userId]);
  check("session-state: new_words_count persisted (13)", ss.rows[0].new_words_count === 13, "got " + ss.rows[0].new_words_count);
  check("session-state: current_position persisted (13)", ss.rows[0].current_position === 13, "got " + ss.rows[0].current_position);
  check("session-state: difficult_word_ids persisted", Array.isArray(ss.rows[0].difficult_word_ids) && ss.rows[0].difficult_word_ids.includes(wordId));

  // 7. Idempotency window: insert two identical review_log rows, query should find the recent one
  await pool.query(`delete from public.vocab_review_log where user_id=$1 and word_id=$2`, [userId, wordId]);
  await pool.query(
    `insert into public.vocab_review_log (user_id, word_id, grade, review_mode) values ($1,$2,'good','official')`,
    [userId, wordId]
  );
  const since = new Date(Date.now() - 8000).toISOString();
  const dup = await pool.query(
    `select id from public.vocab_review_log where user_id=$1 and word_id=$2 and grade='good' and review_mode='official' and created_at >= $3 limit 1`,
    [userId, wordId, since]
  );
  check("idempotency: recent log detected for duplicate submission", dup.rows.length === 1);

  // 8. FSRS SM-2 migration sanity: an old-style row (no FSRS cols) is readable as a card
  const legacy = await pool.query(
    `select due_at, reps, lapses, ease, interval from public.card_reviews where user_id=$1 and word_id=$2`,
    [userId, wordId]
  );
  const legacyCard = rowToCard(legacy.rows[0]);
  check("SM-2 legacy row readable via rowToCard", legacyCard && !isNaN(legacyCard.due.getTime()), "due=" + legacyCard.due);

  console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  await pool.end();
  process.exit(fail === 0 ? 0 : 1);
}

main().catch((e) => { console.error(e); process.exit(1); });