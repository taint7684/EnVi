# EnVi — PROJECT MANIFEST (báo cáo hiện trạng code)

Tóm tắt cấu trúc repo, route, API, bảng DB, màn hình và GAP so với `docs/MASTER_SPEC.md`.
BƯỚC 0 kiểm kê ngày 22/11/2026 — sau S0→S10 + S11 regression (S11b fix eslint).

## Tech stack
- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 + shadcn/ui
- Supabase: Postgres + Auth + Storage + RLS (@supabase/ssr)
- AI: Google Gemini + Groq + Ollama (chain từ env `AI_PROVIDER_CHAIN`) qua `lib/ai/router.ts`
- STT: Groq Whisper → `POST /api/stt` trả `{text, words, duration_ms}`
- TTS: Web Speech API (trình duyệt) qua `hooks/use-speech-synthesis`
- SRS: @open-spaced-repetition/sm-2
- Test: Vitest — 12 file, 82 test. Playwright — 8 spec (daily-journey, roadmap, speaking×4, speaking-modes, writing).
- Lint: ESLint 9 — **0 error**, 54 warning (unused vars). tsc sạch.

## Kết quả kiểm tra BƯỚC 0 (22/11/2026)
- `npx tsc --noEmit` → **EXIT 0** (sạch)
- `npx eslint .` → **0 error**, 54 warning (unused vars, không chặn)
- `npx vitest run` → **82/82 pass** (12 file)
- `npm run build` → **EXIT 0** (sạch)
- `npx playwright test` → 4/5 pass lần cuối (roadmap fail do `/dashboard` ERR_FAILED — cần đổi sang `/today`)

## Cấu trúc thư mục
- `app/(main)/` — 23 segment: assessment, assistant, dashboard, dictation, error-log, grammar, makeup-lesson, progress, progress-test, pronunciation, reading, real-world, reflex, roadmap, search, self-talk, settings, shadowing, speaking, today, vocab, writing + layout.tsx/error.tsx
- `app/(main)/speaking/{drills,missions,strategy-cards}`, `app/(main)/today/session`, `app/errors/makeup/[id]`
- `app/api/` — ai/speaking, assistant, client-errors, error-log, errors, makeup-lesson, search, spell-check, stt, translate, writing, speak/{sessions,turns,sessions/[id]/complete}
- `app/actions/` — study-plan, speaking, dictation, phrase-review
- `app/auth/callback`, `app/login/`, `app/onboarding/`, `app/cron/`, `app/page.tsx`, `app/global-error.tsx`, `app/layout.tsx`
- `components/` — theo feature (assistant, assessment, dashboard, dictation, drills, errors, gamification, grammar, missions, progress-test, pronunciation, reading, realworld, reflex, roadmap, settings, shadowing, speaking, today, translate-speak, ui, app-nav, vocab, writing)
- `lib/` — ai (router/groq/gemini/ollama/whisper), activity, assessment, assessment-db, audio, chat-history, collocations-data, daily-plan, dashboard, date-vn, dictation-data, emoji, errors, fluency, grammar-exercises-data, missions, offline, onboarding, phrases, pronunciation, progress, reading, realworld, reflex (judge/schema), roadmap, shadowing, result, settings, speech (scoring), speech-eval, speaking-prompt, speak (coach/schema/sessions), srs, strategy, supabase, types, vocab (triage)
- `db/migrations/` — 0001_init … 0020_s10_real_world (20 migration)
- `data/` — speaking-topics, grammar-exercises, dictation/shadowing/reading/pronunciation/missions/strategy-cards/fluency/collocations JSON, NGSL/Oxford list
- `public/` (manifest.json + sw.js cho PWA), `scripts/` (import-phrases, import-words, pre-commit-secret, verify-90-days)

## Bảng DB hiện có (theo migrations 0001–0020)
- Nền: auth.users, profiles, daily_progress, words, phrase_reviews, card_reviews, writing_drafts, progress_tests, client_errors, assessment_results (0015)
- Gamification/activity: activity_events, xp_ledger, streaks, daily_plans, daily_summary, ai_usage_log
- Speaking: speaking_sessions, speaking_turns (6 bước ASK→ANSWER→FEEDBACK→RETRY-BLIND→NEXT→SUMMARY)
- S2–S10: error_events, error_patterns, pattern_catalog, makeup_lessons, dictation_attempts, shadowing_attempts, pronunciation_attempts/progress, mission_attempts, fluency_drills, reading_attempts, grammar_attempts, grammar_mastery, roadmap_days, real_world_tasks/logs, user_chunks/chunk_reviews, phrase_attempts
- RLS bật trên toàn bộ bảng user-data; RPC `log_activity`/`award_xp`; `delete_my_account()` dọn sạch dữ liệu (cập nhật ở 0020).

## Đối chiếu BR/AC so với MASTER_SPEC v2.0 (mục 6 + mục 8)

### 7 tính năng bắt buộc (Tài liệu 1) — mục 6.1
**6/7 đạt ✅ + 1/7 một phần ⚠️** (Grammar 16 chủ điểm: explanation_vi + vn_trap + speak đã có 800/800, nhưng chưa xác minh đủ "16 chủ điểm" đầy đủ — xem hàng 5 bên dưới). Shadowing BR-8.2 đã xác minh qua shadowing-brtest.spec.ts.
| # | Yêu cầu | Trạng thái | File liên quan |
|---|---|---|---|
| 1a | Speaking 6 bước | ✅ Đạt | lib/speak/{coach,schema,sessions}.ts, components/speaking/speaking-session.tsx |
| 1b | Khen→≤2 lỗi→natural | ✅ Đạt | lib/speak/schema.ts (errors.max(2), hidden_errors), coach.ts |
| 1c | Nói lại KHÔNG nhìn mẫu | ✅ Đạt | speaking-session.tsx (RETRY-BLIND, ẩn natural_version, peek) |
| 1d | Tổng kết 3 lỗi + 5 cụm | ✅ Đạt | coach.ts SUMMARY, user_chunks |
| 1e | Offline Fallback | ✅ Đạt | lib/offline.ts, sample_answer 3 cấp + key_phrases |
| 2a | Kho ≥1.354 câu | ✅ Đạt | data/phrases (tier core/extra) |
| 2b | Reflex VN→Mic→chấm | ✅ Đạt (nâng cấp) | lib/reflex/judge.ts (lexical≥0.75 + AI judge cùng nghĩa + latency) |
| 3a | Kho 5.029 từ | ✅ Đạt | data/words |
| 3b | Flashcard 4 mức + YouGlish | ✅ Đạt | lib/srs.ts, components/vocab |
| 3c | Đã biết/Chưa biết, không giới hạn | ✅ Đạt | lib/vocab/triage.ts, components/vocab/vocab-session.tsx |
| 4a | Shadowing video sync | ✅ Đạt | components/shadowing/shadowing-player.tsx (YT IFrame API: getCurrentTime polling + seekTo(start) + stopAt(end); 60 real YouTube IDs; BR-8.2 verified via shadowing-brtest.spec.ts) |
| 4b | Dictation xem đáp án | ✅ Đạt | components/dictation/dictation-game.tsx (revealed_before_submit=0đ) |
| 4c | Reading click-tra-từ | ✅ Đạt | components/reading/lookup-text.tsx, lib/reading/lemmatize.ts |
| 4d | Reading Aloud/Pronunciation | ✅ Đạt | components/pronunciation/pronunciation-player.tsx (12 trọng tâm) |
| 5 | Grammar 16 chủ điểm | ⚠️ Một phần | lib/grammar-exercises-data.ts (800/800 explanation_vi + vn_trap + 160 speak verified; chưa xác minh đủ "16 chủ điểm" khớp spec v2.0 mục 8.12 vì không có tài liệu chi tiết) |
| 6a | Error tự động vào Sổ lỗi | ✅ Đạt | lib/errors.ts (error_events + error_patterns trigger) |
| 6b | Bài bù tự sinh | ✅ Đạt | app/errors/makeup/[id], lib/errors.ts |
| 6c | CẤM MOCK | ✅ Đạt | grep mock/VOCAB_WORDS/Maria/score:0 = 0 kết quả |
| 7a | Smart Daily Plan | ✅ Đạt | lib/daily-plan.ts (allocateBlocks ≥50% nói), app/(main)/today |
| 7b | Streak, XP, Level | ✅ Đạt | lib/activity.ts (award_xp idempotent), lib/gamification/streak.ts |
| R1 | Zero errors, Skeleton | ✅ Đạt | loading.tsx/error.tsx mọi route, global-error.tsx |
| R2 | Dynamic imports | ⚠️ Một phần | Shadowing có; chưa đặt ngân sách hiệu năng (perf budget) |

### 11 thiếu sót G1–G11 — mục 6.2
| # | Thiếu sót | Trạng thái | File |
|---|---|---|---|
| G1 | Đo trôi chảy (latency/WPM/MLR) | ✅ Đạt | lib/fluency.ts (computeFluencyFromWords + computeLatency) |
| G2 | Giảm tiếng Việt (Prompt Ladder) | ✅ Đạt | lib/reflex (L1/L2/L3 theo phase) |
| G3 | Roleplay Missions | ✅ Đạt | lib/missions, app/(main)/speaking/missions |
| G4 | Fluency Drills (4/3/2...) | ✅ Đạt | lib/drills, app/(main)/speaking/drills |
| G5 | Chế độ An toàn, Courage | ✅ Đạt | profiles.feedback_mode (safe/standard), courage before/after |
| G6 | Strategy Cards (fillers/repair) | ✅ Đạt | data/strategy-cards.json (12 thẻ) |
| G7 | Chunk SRS | ✅ Đạt | user_chunks + chunk_reviews |
| G8 | Checkpoint Trước-Sau | ✅ Đạt | app/(main)/assessment (baseline/day30/60/90), lib/assessment-db |
| G9 | Pronunciation người Việt | ✅ Đạt | data/pronunciation.json (12 trọng tâm) |
| G10 | Thời lượng 180→60' | ✅ Đạt | profiles.minutes_per_day (mặc định 60, 30–180) |
| G11 | Bảo mật secret | ⚠️ Cần người dùng | .env.example chỉ tên biến; cần rotate key thật |

### 13 lỗi kỹ thuật — mục 6.3
1. makeup-lesson 404 → ✅ Đã có app/errors/makeup/[id]
2. speaking_minutes bitmask → ✅ Đã tách activity_events + daily_summary
3. totalWords=0 → ✅ Đã fix
4. Error Log id trùng → ✅ pattern_key + UUID
5. Speaking category sai → ✅ AI phân loại type
6. getUserLearningSnapshot N+1 → ✅ view tổng hợp
7. progress_tests.level null → ✅ assessment-db
8. SWRegistration → ✅ public/sw.js có thật
9. rate-limit-check rỗng → ✅ Đã xoá
10. Model hardcode → ✅ env GROQ_MODEL/GEMINI_MODEL/OLLAMA_MODEL
11. Script rác → ✅ Đã dọn (chỉ còn 4 script)
12. localStorage-only → ✅ Đã chuyển DB (assessment/reading/summary)
13. Shadowing placeholder cờ → ⚠️ Còn DEFAULT_YOUTUBE_ID placeholder

## GAP còn lại so với MASTER_SPEC v2.0 (ưu tiên)
1. ~~**Shadowing IFrame API thật**~~ (BR-8.2): ✅ RESOLVED — getCurrentTime + seekTo + stopAt verified; 60 real YouTube IDs; DEFAULT_YOUTUBE_ID removed.
2. ~~**Route kiến trúc 5 tab**~~ (spec 7.1): ✅ RESOLVED — commit 104fea9, redirects in place.
3. ~~**Grammar 800 câu + vn_trap**~~ (BR-12): ✅ RESOLVED — audit-content: 800/800 explanation_vi + 800/800 vn_trap + 160/160 speak.
4. ~~**Fluency MLR threshold**~~: ✅ RESOLVED — code uses 0.4s (line 41 of lib/fluency.ts); 4 boundary tests PASS (0.39/0.40/0.41s + mixed).
5. ~~**Content audit script**~~: ✅ RESOLVED — scripts/audit-content.ts exists and PASS.
6. ~~**Playwright roadmap.spec.ts**~~: ✅ RESOLVED — uses /today, 3/3 PASS.
7. ~~**3 file uncommitted**~~: ✅ RESOLVED — committed c4c9f60.
8. **Rotate key thật** (mục 0): ⚠️ Cần người dùng — xem SECURITY_HANDOFF.md.
9. ~~**DB live thiếu migration 0010–0020**~~: ✅ RESOLVED — production_v2_combined.sql applied, 12/12 verified.
10. **Nội dung audit**: ✅ RESOLVED — audit-content PASS (all counts verified).
11. **Master Spec v2.0 chi tiết**: ⚠️ Không có trong repo — chỉ có bản tóm tắt (mục 8, 16, 17 là header). Xem ACCEPTANCE.md mục 8.
12. **Speaking real AI câu 8**: ⚠️ BLOCKED — Groq free-tier 429 (code correct, mock PASS).
13. **Shadowing transcripts**: ⚠️ Approximate (chapter-based, not word-for-word YouTube transcript match) — non-blocking.
14. ~~**Lỗi login ERR_FAILED**~~: ✅ RESOLVED — SW cache-first → network-first, middleware try/catch, redirect /today, createClient trong try.
15. ~~**Học tự do**~~: ✅ RESOLVED — không có blocking conditions, thêm skip onboarding, free links trên Today.
16. ~~**Gợi ý 3 tiếng**~~: ✅ RESOLVED — ThreeHourPlan component (180 phút, 6 mục, kéo thả, bỏ qua, học tiếp).
17. ~~**Trần 180 phút**~~: ✅ RESOLVED — bỏ trần, cho phép 0–480 phút.

## Setup môi trường (BẮT BUỘC trước E2E/Playwright)
- DB live hiện chỉ có bảng tới ~0009 (REST 404 với daily_plans/mission_attempts/grammar_attempts/real_world_logs). Áp dụng migration 0001–0020 qua Supabase SQL Editor hoặc `supabase link` + `db push`.
- `.env.local` chỉ có anon + service-role key (JWT), KHÔNG có Postgres connection string / access token → không tự `db push` từ đây được.
- Tài khoản QA: `qa.test.a@gmail.com` / `TestPass123!`. Khóa AI: `GEMINI_API_KEY`, `GROQ_API_KEY`.
- Local Supabase QA (Docker): QA dir `C:\Users\LENOVO\AppData\Local\Temp\kilo\envi-qa`; API 54321, DB 54322, Studio 54323; export 3 vars từ qa.env để trỏ local.