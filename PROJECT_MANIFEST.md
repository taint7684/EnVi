# EnVi — PROJECT MANIFEST (báo cáo hiện trạng code)

Tóm tắt cấu trúc repo, route, API, bảng DB, màn hình và GAP so với `docs/MASTER_SPEC.md`.
Cập nhật sau khi hoàn tất S0 → S10 (S11 = regression + Definition of Done).

## Tech stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase: Postgres + Auth + Storage + RLS (@supabase/ssr)
- AI: Google Gemini (chính) + Groq (fallback) + Ollama (tùy chọn) qua `lib/ai/router.ts`
- STT: Groq Whisper → `POST /api/stt` trả `{text, words, duration_ms}`
- TTS: Web Speech API (trình duyệt) qua `hooks/use-speech-synthesis`
- SRS: @open-spaced-repetition/sm-2
- Test: Vitest (lib/*.test.ts) — 12 file, 82 test. Playwright chưa có spec.
- Lint: ESLint 9 — 1 error có sẵn (react-hooks setState-in-effect tại `app/errors/makeup/[id]/page.tsx:64`), 54 warning. tsc sạch.

## Cấu trúc thư mục
- `app/(main)/` — 23 segment: assessment, assistant, dashboard, dictation, error-log, grammar, makeup-lesson, progress, progress-test, pronunciation, reading, real-world, reflex, roadmap, search, self-talk, settings, shadowing, speaking, today, vocab, writing + layout.tsx/error.tsx
- `app/api/` — ai/speaking, assistant, client-errors, error-log, makeup-lesson, search, spell-check, stt, translate, writing
- `app/actions/` — study-plan, speaking, dictation
- `app/auth/callback`, `app/login/`, `app/page.tsx`, `app/global-error.tsx`, `app/layout.tsx`
- `components/` — theo feature (assistant, dashboard, dictation, gamification, grammar, progress-test, reading, pronunciation, realworld, reflex, roadmap, settings, shadowing, speaking, vocab, translate-speak, ui, app-nav, …)
- `lib/` — ai (router/groq/gemini/ollama/whisper), activity, assessment, audio, chat-history, dashboard, date-vn, dictation-data, emoji, fluency, grammar, gamification, missions, pronunciation, reading, realworld, roadmap, shadowing, speech (scoring), speech-eval, speaking-prompt, srs, supabase, types, vocab
- `db/migrations/` — 0001_init … 0020_s10_real_world
- `data/` — speaking-topics, grammar-exercises, dictation/shadowing/reading/pronunciation/missions/strategy-cards/fluency/collocations JSON, NGSL/Oxford list…
- `public/` (manifest.json + sw.js cho PWA), `scripts/`

## Bảng DB hiện có (theo migrations 0001–0020)
- Nền: auth.users, profiles, daily_progress, words, phrase_reviews, card_reviews, writing_drafts, progress_tests, client_errors
- Gamification/activity: activity_events, xp_ledger, streaks, daily_plans, daily_summary, ai_usage_log
- Speaking: speaking_sessions, speaking_turns (6 bước ASK→ANSWER→FEEDBACK→RETRY-BLIND→NEXT→SUMMARY)
- S2–S10: error_events, error_patterns, pattern_catalog, makeup_lessons, dictation_attempts (S7), shadowing_attempts, pronunciation_attempts/progress, mission_attempts, fluency_drills, reading_attempts, grammar_attempts, grammar_mastery, writing_drafts + kind (S8), roadmap_days + profiles (new_words_per_day/feedback_mode/study_time, S9), real_world_tasks/logs (S10)
- RLS bật trên toàn bộ bảng user-data; RPC `log_activity`/`award_xp`; `delete_my_account()` dọn sạch dữ liệu (cập nhật ở 0020).

## Chức năng đã có (S0 → S10)
- Auth + RLS, onboarding, checkpoint (đánh giá nói), progress dashboard, speaking coach 6 bước, error log + makeup lesson, reflex (L1/L2/L3 + đo latency), vocab (triage/chunk SRS), writing, dictation word-level, shadowing (chấm STT), pronunciation (12 trọng tâm), reading + grammar, missions/drills/strategy cards, roadmap 90 ngày + gamification streak (VN 03:00, streak freeze), real-world bridge, settings (60 phút mặc định, new words/day, feedback mode), PWA.

## Setup môi trường (BẮT BUỘC trước khi chạy E2E/Playwright)
Kiểm tra bằng REST (anon key) cho thấy DB live hiện chỉ có bảng tới ~0009: `profiles`/`words` = 200, nhưng `daily_plans`, `mission_attempts`, `grammar_attempts`, `real_world_logs` = **404**. Nghĩa là migration 0010–0020 CHƯA được áp dụng.
- Áp dụng: mở Supabase → SQL Editor, chạy lần lượt `db/migrations/0001_init.sql` … `0020_s10_real_world.sql` (theo thứ tự), HOẶC `supabase link` + `supabase db push`.
- `.env.local` hiện chỉ có anon + service-role key (JWT), KHÔNG có Postgres connection string / Supabase access token → không thể tự `db push` từ môi trường này.
- Tài khoản QA cho E2E: `qa.test.a@gmail.com` / `TestPass123!` (phải tồn tại trong Auth). Khóa AI: `GEMINI_API_KEY`, `GROQ_API_KEY` đã có.
- Sau khi migrate: `npx playwright test` (tự bật `npm run dev`).

## Còn GAP / nợ kỹ thuật so với MASTER_SPEC v2.0
1. Playwright chưa có spec (E2E) — cần viết flow chính (onboarding → speaking → progress).
2. Nội dung grammar: 800 câu + `vn_trap` đầy đủ là việc nội dung còn lại (explanation_vi đã inline).
3. `.env.local` có giá trị thật (cần rotate key nếu lộ, không commit).
4. `makeup/[id]/page.tsx:64` react-hooks error — nên sửa (state từ server, không setState trong effect).
5. Model AI vẫn có thể hardcode trong `groq.ts` → nên đọc env `GROQ_MODEL`; budget in-memory nên chuyển DB (`ai_usage_log` đã có).
6. `scripts/` còn script rác (debug-*, gen-*, hsk3-*) nên dọn vào `scripts/_archive/`.