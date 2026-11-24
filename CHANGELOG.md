# CHANGELOG — EnVi Upgrade (feat/vocab-anki-upgrade)

## Part 1: Vocabulary (Flashcard FSRS + Collocations)

### Build fix: server-only data separation
- **Issue**: `lib/grammar-v2-data.ts`, `lib/reflex-drills-data.ts`, `lib/picture-talk-data.ts` used `node:fs` and were imported by client components → Turbopack build failure.
- **Fix**: Split each into `* -types.ts` (pure types + constants, no fs) and `*-data.ts` (server-only loaders with `import "server-only"`). Client components import from types files; server components (pages) pre-load data and pass as props.

### Collocation generation
- 5,029 words total in `data/words.json`.
- 1,325 collocations pre-generated (from prior session).
- Batch generator: `scripts/work/generate-collocations-batch.cjs` (Groq, resumable, concurrency 2).
- Validation: `scripts/qa/assemble-collocations.cjs` checks all fields + collocation-in-example.
- Coverage target: 5,029/5,029 complete entries.

### Flashcard UI
- Front: English word + POS + IPA + audio button. ✓
- Back: Vietnamese meaning + collocation + example (EN + VI) + YouGlish link. ✓
- Rating bar: Again / Hard / Good / Easy (no "Đã biết/Chưa biết"). ✓
- YouGlish: collocation link + "Nghe từ gốc" fallback. ✓

### Learning flow
- 20-word groups with "Ôn lại nhóm" + "Học tiếp 20 từ" after each group. ✓
- Practice mode (Ôn lại nhóm / Ôn từ khó) doesn't affect official schedule. ✓
- Requeue on "again" (max 2). ✓
- Session state persisted per account (vocab_session_state). ✓
- Idempotency: 8s window in `reviewWord` action. ✓
- Cards loaded up to 100 (can continue past 20/40/60). ✓

## Part 2: Grammar Upgrade

### Current state
- 16 topics in `data/grammar-exercises.json` (30 MCQ + 20 fill each = existing data).
- `data/grammar-v2.jsonl`: 40 lines (partial — 3 topics, 2 types).
- Need: 16 topics × 3 types (translation, error_correction, verb_conjugation) × 20 = 960 questions + 16 mindmaps + 320 mixed.
- Generator updated: `scripts/work/generate-grammar-v2.cjs` now generates 20 per topic per type + mixed practice.
- Components: `grammar-content.tsx`, `exercise-player.tsx`, `mixed-practice.tsx`, `mind-map.tsx` all refactored to use types file + props.

### Issues found
- **Build failure** (node:fs in client) → fixed via types/data split.
- **MixedPractice** called `getGrammarV2Questions()` (fs) in client → now receives `v2Questions` as prop.
- **GrammarContent** called `getMindMap`/`getGrammarV2Questions` (fs) in client → now receives `mindmaps` + `v2Questions` as props.

## Part 3: Reflex Drills

### Current state
- 50 phrases (10/day × 5 days) in `data/reflex-phrases.json`.
- Session modes: morning (learn new), noon (review), evening (review shuffled), review5 (all 5 days).
- Grading: got_it / slow / forgot. Slow/forgot requeue after 3 questions (max 2 requeues).
- Server-side persistence added: `reflex_drill_progress` table (migration 0027) + `app/actions/reflex-drills.ts`.
- Progress saved after each grade (completed_ids, results, queue_position).
- Review5 shows X/50 progress. ✓
- Types/data split for build fix. ✓

### Issues found
- **Build failure** (node:fs in client) → fixed via types/data split.
- **No persistence** → added migration + server actions.
- **No day prop** → added `day` prop to session component.

## Part 4: Shadowing

### Current state
- 60 lessons in `data/shadowing-lessons.json`. All timestamps valid (startTime < endTime, sequential).
- Issue: only 10 unique YouTube videos for 60 lessons → many lessons share mismatched videos.
- TTS mode (default): speaks each sentence individually via Web Speech API. Works as fallback.
- Click sentence → TTS speaks that sentence. ✓
- Click again → replays from start. ✓ (cancel + re-speak)
- Speed control for TTS (0.75x, 1x, 1.25x, 1.5x). ✓
- "Phát tất cả" button for TTS mode. ✓
- "Phát âm máy" / "YouTube video" toggle. ✓
- Video mode: seekTo start, play, stopAt end (stopAtRef). ✓
- Warning note when using YouTube mode (video may not match). ✓
- Audit report: `docs/sharding-video-audit.json`.

### Issues found
- **TTS nested callbacks** (3 levels deep) → refactored to clean recursive `speakQueue`.
- **No TTS speed control in UI** → added speed buttons that work in TTS mode.
- **No play-all button** → added "Phát tất cả" button.
- **Video mismatch** → TTS fallback + warning note. Cannot fix 60 videos without watching each.

### Fixes applied (v2)
- **Unique videos**: 6 → 15 unique YouTube IDs across 60 lessons. `scripts/work/fix-shadowing-videos.cjs` assigns topic-matched videos where found.
- **Real synced transcript**: `sh-morning` replaced with real video (`aQ0w2I0Eb9I`, Listening Time) + real 6-segment transcript matching audio.
- **`videoSynced` flag**: added to `ShadowingLesson` type. `true` only for verified real transcripts (currently 1: sh-morning). UI shows green "đã đồng bộ" badge for synced, amber "tham khảo" warning for unsynced.
- **TTS is authoritative**: default mode `useTTS=true`. UI labels "Đồng bộ 100% · Đọc đúng từng câu". Toggle button renamed to "Dùng video YouTube" / "Phát âm máy (đồng bộ)".
- **Loading state**: YouTube player shows "Đang tải video…" overlay while `!ytReady`.
- **Lint fix**: `speakQueueRef.current` moved to `useEffect` (no ref access during render). `ytReady` now used for loading overlay.

## Part 5: Picture Talk

### Current state
- 8 built-in image sets in `data/picture-talk-images.json` (morning, office, restaurant, street, travel, kitchen, shopping).
- 4 levels: describe, opinion, story, teach. ✓
- Mic recording with Web Speech API (SpeechRecognition). ✓
- Vocabulary hints (15-25 per image). ✓
- Opinion questions (4-6 per image). ✓
- Story starters (2-3 per image). ✓
- Keyword hints after 5s silence. ✓
- Fluency metrics: WPM, word count, pauses. ✓
- "Luyện lại cùng ảnh" / "Sang ảnh mới" buttons. ✓
- Phao cứu sinh (Vietnamese → TTS → repeat). ✓
- Types/data split for build fix. ✓
- Page: `app/(main)/speak/picture-talk/page.tsx`. ✓
- Nav link added. ✓

### Issues found
- **Build failure** (node:fs in client) → fixed via types/data split.
- **Missing retry/next buttons** → added.
- **Missing phao cứu sinh** → added.
- **AI integration ADDED**: Gemini Vision (`callGeminiVision` in `lib/ai/gemini.ts`) + `/api/picture-talk/analyze` route for image upload → vocabulary/questions JSON. Groq Whisper STT (`/api/stt`) integrated via MediaRecorder for audio recording. Fallback: built-in images use pre-made metadata (no AI needed); if Gemini quota exceeded, error shown + user can use built-in images (offline mode).

## Part 6: Mixed Practice (320 dedicated questions)

### Current state
- `data/grammar-mixed.json`: 320 NEW questions (80 per type × 4 types, 16 topics covered).
- Generator: `scripts/work/generate-mixed-practice.cjs` (offline, template-based, no API).
- `mixed-practice.tsx`: loads dedicated 320 questions as primary pool, supplements with existing pool if needed.
- Each question has `id`, `exercise_type`, `topic_id`, and type-specific fields (question/options/answer for MCQ; vi/hints/answer for translation; sentence/error_part/corrected for error_correction; blanks/full for verb_conjugation).
- Coverage: 16 topics × 4 types = 64 cells, all with ≥5 questions each.