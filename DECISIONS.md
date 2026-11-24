# DECISIONS.md — EnVi Development Decisions

## Pronunciation Workshop (Part 7)

### Decision: 12 sound groups covering Vietnamese-learner pain points
Chose 12 groups based on common Vietnamese pronunciation errors: /θ/ vs /ð/, /ʃ/ vs /s/, /r/ vs /l/, /v/ vs /w/, final consonants, ending -s/-ed, long/short vowels, consonant clusters, /ŋ/ vs /n/, word stress, linking. Each group has minimal pairs, mouth guide, example words/phrases/sentences, and quick test.

### Decision: 5-step pedagogical flow
Steps: Learn → Minimal Pairs → Words/Phrases → Sentences → Quick Test. This follows the "listen → imitate → record → compare" principle. Each step builds on the previous.

### Decision: Use existing `pronunciation_attempts` + `pronunciation_progress` tables
No new migration needed — the existing tables from migration 0017 support the workshop flow. Added `quick_test` as a new `item_type` value.

### Decision: Types/data split (same pattern as Grammar/Picture Talk)
- `types.ts` (pure types, no fs) — imported by client components.
- `content.ts` (server-only, imports JSON) — imported by server pages.
- `server.ts` (server actions) — handles DB operations.
This avoids the `node:fs` in client bundle build failure.

### Decision: URL-based deep linking
`/pronunciation?focus=<id>` uses search params instead of dynamic routes. Simpler, no `[id]` folder needed, and works with static generation.

## Reading Daily (Part 8)

### Decision: 2-tab interface (Đọc to + Đọc hiểu)
User requested separate modes. Tabs provide clear separation: "Đọc to" focuses on pronunciation practice (TTS + recording), "Đọc hiểu + Bài tập" focuses on comprehension (questions + exercises + summary).

### Decision: Deterministic daily assignment
`getDailyReadingPassages()` uses date-based modulo selection to give 2 passages per day. All users get the same daily set, no DB table needed for daily assignments. Cycles through all 80 passages.

### Decision: Optional fields for backward compatibility
`translation`, `vocabulary`, `exercises`, `sentences` are optional in the ReadingPassage type. Existing 80 passages work without them. UI handles absence gracefully (hides translation button, hides vocab section, skips exercises).

### Decision: Sentence splitting at render time
Instead of pre-computing `sentences` array in data, `splitSentences()` splits at render time. This means all 80 passages immediately support sentence-by-sentence reading without data migration.

### Decision: Use existing `reading_attempts` table
No new migration needed. The existing table from migration 0018 supports reading progress. Added optional `mode` field to `saveReadingAttempt` (not stored in DB, used for client-side tracking).

### Decision: Removed `reading-practice.tsx`
The old component was no longer imported by any page (replaced by `reading/page.tsx`). Removed to avoid confusion and implicit-any lint errors.

## Speaking AI Upgrade (Part 9)

### Decision: Gemini-first priority chain
Changed default `AI_PROVIDER_CHAIN` from `groq,gemini,ollama` to `gemini,groq,openrouter,ollama`. Gemini Flash is prioritized because it's free-tier friendly and higher quality for feedback. Groq is fallback, OpenRouter :free is last resort before Ollama.

### Decision: OpenRouter as 3rd provider
Added `lib/ai/openrouter.ts` for OpenRouter `:free` models (default: `google/gemma-2-9b-it:free`). This provides a free backup when both Gemini and Groq fail. Requires `OPENROUTER_API_KEY` env (optional — provider fails gracefully if key missing).

### Decision: Fallback mode is first-class, not error state
Instead of treating AI failure as an error, the fallback mode is a full practice mode with:
- Pre-made sample answers (10 topics × 5 questions, A2 level)
- TTS for questions and samples
- Recording + playback
- "Nói lại" step (speak again after seeing sample)
- Summary with key phrases

This follows the principle: "AI is enhancement, not requirement for learning."

### Decision: Fallback samples in separate data file
`data/speaking-fallback-samples.ts` contains pre-made sample answers + keywords. Kept separate from `speaking-questions-by-level.ts` to avoid coupling. Function `getFallbackQuestion(topicId, level, index)` returns sample for any question index.

### Decision: Router logging for observability
Added `console.warn`/`console.error` in router for provider fallback chain. This helps debug which provider was used and why fallback was triggered.

## Known Limitations

### Pronunciation
- No British vs American accent toggle (both use en-US TTS). Could add en-GB voice selection in future.
- Quick test uses TTS for "listen-choose" — relies on browser SpeechSynthesis, not pre-recorded audio.
- No AI pronunciation scoring (phoneme-level). Uses word-level intelligibility scoring via Whisper STT.

### Reading
- 80 passages lack translation/vocabulary/exercises. Future: use Gemini Flash to generate these fields.
- Daily assignment is deterministic (same for all users) — could be personalized based on progress in future.
- No "Bài đã học" (learned passages) filter yet — progress tracking exists but no dedicated filter UI.

### Speaking AI
- OpenRouter free models may have lower quality than Gemini/Groq — router tries Gemini first.
- Fallback samples only cover A2 level and 10 topics. B1/B2 and other topics use generic questions.
- No OpenRouter API key in current env — OpenRouter provider will fail until key is added.
- Fallback mode does not save individual turn feedback to DB (only session-level completion).
- FreeSpeak mode in fallback uses generic DEFAULT_QUESTIONS (not topic-specific).