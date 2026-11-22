# EnVi — PROJECT MANIFEST (báo cáo hiện trạng code)

Tóm tắt cấu trúc repo, route, API, bảng DB, màn hình và GAP so với `docs/MASTER_SPEC.md`.

## Tech stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase: Postgres + Auth + Storage + RLS (@supabase/ssr)
- AI: Google Gemini (chính) + Groq (fallback) + Ollama (tùy chọn) qua `lib/ai/router.ts`
- STT: Groq Whisper (`whisper-large-v3-turbo`, `verbose_json` chưa dùng)
- TTS: Web Speech API (trình duyệt)
- SRS: @open-spaced-repetition/sm-2
- Test: Vitest (lib/*.test.ts), Playwright chưa có spec
- Lint: ESLint 9 (0 errors, 48 warnings), tsc sạch

## Cấu trúc thư mục
- `app/(main)/` — 21 segment: assessment, assistant, dashboard, dictation, error-log, grammar, layout.tsx, makeup-lesson, progress-test, reading, reflex, roadmap, search, self-talk, settings, shadowing, speaking, today, vocab, writing, error.tsx
- `app/api/` — ai/speaking, assistant, client-errors, error-log, makeup-lesson (thiếu route.ts → 404), search, spell-check, stt, translate, writing
- `app/actions/` — study-plan, speaking (+ các action khác)
- `app/auth/` — callback
- `app/login/`, `app/page.tsx` (trang root), `app/global-error.tsx`, `app/layout.tsx`
- `components/` — assistant, dashboard, dictation, gamification, grammar, progress-test, reading, reflex, roadmap, settings, shadowing, speaking, ui, vocab, translate-speak, app-nav, sign-out-button, today, error-boundary, global-search, spell-check, empty-flashcard
- `lib/` — ai (router, groq, gemini, ollama, whisper), activity, assessment, audio, chat-history, dashboard, date-vn, dictation-data, emoji, fluency + fluency.test, grammar-exercises-data, offline, phrases, reading-data, result, srs + srs.test, speech-eval, speech, speaking-prompt, supabase (client, server, middleware), types, types/speaking, utils, vocab
- `db/migrations/` — 0001_init … 0010_activity_events (activity_events, xp_ledger, streaks, daily_plans, daily_summary, log_activity, award_xp)
- `data/` — speaking-topics.json, speaking-questions-by-level, daily-lessons.ts, …
- `scripts/` — import-words, import-phrases + các script rác (debug-*, gen-phase10-*, hsk3-*) cần dọn vào scripts/_archive/
- `public/`, `.next/`, `node_modules/`

## Bảng DB hiện có (theo migrations 0001–0010)
- auth.users (Supabase Auth)
- profiles, daily_progress (bitmask speaking_minutes — cần migrate sang activity_events/daily_summary)
- words, phrase_reviews, card_reviews
- speaking_sessions, speaking_turns (feedback_json — lỗi chưa tách ra error_events)
- writing_drafts, progress_tests
- activity_events, xp_ledger, streaks, daily_plans, daily_summary (từ 0010)
- client_errors (từ 0009)

## Các GAP chính so với MASTER_SPEC v2.0
1. `.env.example` lộ giá trị thật Supabase URL/anon key → đã sửa (chỉ giữ tên biến)
2. Chưa có `docs/MASTER_SPEC.md` → đã tạo
3. Speaking 5 bước → cần 6 bước (ASK→ANSWER→FEEDBACK→RETRY-BLIND→NEXT→SUMMARY)
4. Error Log đọc trực tiếp `feedback_json` → cần bảng `error_events`, `error_patterns`, `pattern_catalog`, `makeup_lessons`
5. `makeup-lesson` API 404 → cần build thực
6. Fluency metrics chưa lưu DB (`lib/fluency.ts` chỉ pure function)
7. Reflex khớp chữ, chưa L1/L2/L3, chưa đo latency lưu DB
8. Từ vựng `DAILY_NEW_LIMIT=100` cứng, chưa Triage Đã biết/Chưa biết, chưa Chunk SRS
9. 13 tab menu → cần 5 tab + redirect route cũ
10. Nội dung hardcode (VOCAB_WORDS, progress_tests, assessment) → CẤM MOCK, chuyển sang DB
11. Chưa có Offline Fallback, missions, drills, pronunciation, checkpoint, roadmap DB
12. `.env.local` có giá trị thật (cần rotate key, không commit)

## Sai khác MASTER_SPEC vs code thực tế
- `lib/ai/router.ts` đã có provider chain, circuit breaker, cache, AiUnavailableError, AI_FORCE_FAIL (khớp spec) — nhưng model hardcode trong groq.ts (`qwen/qwen3.8-27b`) nên chuyển sang env `GROQ_MODEL`; budget hiện là in-memory Map nên chuyển sang DB/`ai_usage_log`.
- `lib/activity.ts` đã có `logActivity`/`awardXp` gọi RPC `log_activity`/`award_xp` (khớp spec).
- `stt/route.ts` chỉ trả `text`, chưa trả `words` có timestamp → cần `response_format=verbose_json`, `timestamp_granularities=["word"]`.
- `app/actions/study-plan.ts` dùng `daily_progress` + `study_plan_progress` (tick tay) → cần gộp sang `daily_plans`/`daily_summary`/`activity_events`, không tick tay.
- `error-log/route.ts` id dễ trùng (`w-${draft.id}-…`) → cần UUID + `pattern_key`.
- `app/(main)/layout.tsx` sidebar 13 mục, link `/dashboard` → cần 5 tab + redirect.
