import { readFileSync } from "node:fs";

const envFile = readFileSync(".env.local", "utf-8");
function getEnv(name) {
  const line = envFile.split(/\r?\n/).find((l) => l.startsWith(name + "="));
  return line ? line.slice(name.length + 1).trim() : "";
}

const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const headers = { apikey: key, Authorization: `Bearer ${key}`, "User-Agent": "EnVi-Audit/1.0" };

// Tables referenced in migrations 0001-0023
const tables = [
  "profiles", "words", "phrases", "user_words", "user_phrases",
  "daily_plans", "daily_summary", "streaks", "xp_ledger", "activity_events",
  "speaking_sessions", "speaking_turns", "speaking_turns_v2",
  "writing_submissions", "writing_drafts",
  "grammar_exercises", "grammar_topic_progress",
  "reading_passages", "reading_progress",
  "shadowing_lessons", "shadowing_progress",
  "pronunciation_groups", "pronunciation_progress",
  "dictation_exercises", "dictation_progress",
  "progress_tests", "progress_test_attempts",
  "vocab_reviews", "error_log", "makeup_lessons",
  "missions", "mission_progress",
  "fluency_prompts", "fluency_sessions",
  "strategy_cards", "strategy_card_progress",
  "reflex_phrases", "reflex_progress",
  "study_plans", "roadmap_progress",
  "client_errors", "activity_events_v2",
  "assessment_results", "checkpoint_results",
  "user_roles", "user_preferences",
  "lesson_completions", "daily_lessons",
  "speaking_topics", "speaking_questions",
  "writing_prompts", "writing_checklist",
  "vocab_lists", "vocab_items",
  "grammar_topics", "grammar_questions",
  "reading_questions", "reading_audio",
  "shadowing_transcripts", "shadowing_audio",
  "pronunciation_exercises",
  "dictation_audio", "dictation_transcripts",
  "progress_test_questions",
  "error_log_entries", "makeup_lesson_progress",
  "mission_steps", "mission_progress_v2",
  "fluency_drills", "fluency_progress",
  "strategy_card_reviews",
];

async function checkTable(table) {
  try {
    const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=1`, { headers });
    if (res.ok || res.status === 200) return { table, status: "EXISTS" };
    if (res.status === 404) return { table, status: "MISSING" };
    return { table, status: `ERR_${res.status}` };
  } catch (e) {
    return { table, status: "ERR" };
  }
}

const results = [];
for (const t of tables) {
  results.push(await checkTable(t));
}

const existing = results.filter(r => r.status === "EXISTS").map(r => r.table);
const missing = results.filter(r => r.status === "MISSING").map(r => r.table);
const errors = results.filter(r => r.status.startsWith("ERR")).map(r => `${r.table}(${r.status})`);

console.log(`=== Table Check (${tables.length} checked) ===`);
console.log(`EXISTS (${existing.length}):`, existing.join(", "));
console.log(`MISSING (${missing.length}):`, missing.join(", "));
if (errors.length) console.log(`ERRORS (${errors.length}):`, errors.join(", "));