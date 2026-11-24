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

## Known Limitations

### Pronunciation
- No British vs American accent toggle (both use en-US TTS). Could add en-GB voice selection in future.
- Quick test uses TTS for "listen-choose" — relies on browser SpeechSynthesis, not pre-recorded audio.
- No AI pronunciation scoring (phoneme-level). Uses word-level intelligibility scoring via Whisper STT.

### Reading
- 80 passages lack translation/vocabulary/exercises. Future: use Gemini Flash to generate these fields.
- Daily assignment is deterministic (same for all users) — could be personalized based on progress in future.
- No "Bài đã học" (learned passages) filter yet — progress tracking exists but no dedicated filter UI.