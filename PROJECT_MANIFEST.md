# PROJECT_MANIFEST.md — EnVi (Handover Document)

Tài liệu này biên soạn từ deep audit toàn bộ source code tại `C:\Users\LENOVO\Desktop\EnVi`. Dùng để bàn giao cho AI/dev tiếp theo. Không tóm tắt chung chung; tất cả tên file, hàm, bảng DB, route được ghi cụ thể.

---

## 1. TỔNG QUAN DỰ ÁN & MỤC TIÊU

### 1.1 Tên dự án & mục tiêu cốt lõi
- **Tên dự án**: EnVi (tên package `envi` trong `package.json`)
- **Mục tiêu trên**: Giúp người dùng (IT/BA, trình độ A2-B1) phá vỡ rào cản "dịch trong đầu", đạt trình độ B2 và giao tiếp trôi chảy trong công việc/đời sống trong 90 ngày.
- **Định hướng tương lai**: Scale lên C1-C2, nhưng HIỆN TẠI chỉ tập trung làm hoàn hảo A2-B2 (ngày 1–90).
- **Thời gian chạy**: Ngày 1 = 22/11/2026, Ngày 90 = 19/02/2027. Ngày 91–180 = 20/02/2027 → 19/05/2027 (đã sinh sẵn trong `data/daily-lessons.ts` nhưng chưa nghiệm thu chi tiết).
- **Múi giờ**: Asia/Ho_Chi_Minh (xem `lib/date-vn.ts`). Mặc định 180 phút/ngày (xem `components/settings-form.tsx` default `minutes_per_day: 180`).

### 1.2 Tech stack chi tiết
| Layer | Công cụ | Phiên bản | Vai trò |
|-------|---------|-----------|---------|
| Framework | Next.js | 16.4.6 | App Router, Server Actions, Route Handlers |
| UI | React | 19.3.0 | Giao diện client |
| Styling | Tailwind CSS | 4.3.3 + `@tailwindcss/turbopack` | CSS-in-JS utility, dark/light theme via `globals.css` |
| Component UI | shadcn/ui (radix-ui) | `radix-ui` ^1.8.1, `@radix-ui/*` | Button, Card, Input, Dialog, Label, Tabs... |
| Database | Supabase | `@supabase/ssr` ^0.12.7, `@supabase/supabase-js` ^2.119.0 | Postgres + Auth + RLS + Storage (URL audio) |
| Project Supabase | `https://ricthhogtmgxoyjstfkz.supabase.co` | — | RLS bật trên mọi bảng user data |
| AI (text) | Ollama (local) | `qwen3:1.7b` | Provider đầu tiên, miễn phí, **Hiện DOWN** (port 11434) |
| AI (text fallback) | Groq | `qwen/qwen3.8-27b` | Provider thực tế hiện tại cho Speaking/Writing/Assistant/Translate |
| AI (text fallback 2) | Google Gemini | `gemini-3.8-flash` (danh sách MODELS) | Provider cuối cùng nếu Ollama + Groq đều lỗi |
| STT (speech-to-text) | Groq Whisper | `whisper-large-v3-turbo` | `/api/stt` chuyển file audio → text |
| TTS (text-to-speech) | Web Speech API (browser) | `speechSynthesis` | `lib/speech.ts`, `lib/audio.ts`, không cần API key |
| SRS (spaced repetition) | `@open-spaced-repetition/sm-2` | ^0.2.1 | SM-2 algorithm cho `lib/srs.ts` (vocab + reflex) |
| Form validation | zod | ^4.6.7 | Schema validate cho AI response (`speaking-prompt.ts`) |
| Diff | diff | ^9.0.0 | `lib/speech-eval.ts` so sánh câu người nói vs câu gốc |
| Notifications | sonner | ^2.0.8 | Toast |
| Icons | lucide-react | ^0.453.0 | SVG icons |
| E2E test | Playwright | ^1.65.1 | `tests/*.spec.ts`, Chromium thật |
| Unit test | vitest | ^1.6.0 | `lib/srs.test.ts` |
| Type check | TypeScript | ^5 | `tsc --noEmit` |
| Lint | ESLint | ^9 + `eslint-config-next` | `eslint src` |
| Build tool | Turbopack | `@tailwindcss/turbopack` | CSS processing |
| Font | Be Vietnam Pro, Lora, Geist | `next/font/google` | `app/layout.tsx` |
| PWA | manifest.json + sw.js | — | `SWRegistration` component, `next.config.ts` headers |
| Deployment | Vercel | — | `vercel.json`, production URL `https://envi-deploy-one.vercel.app` |

### 1.3 Biến môi trường (`.env.local` + `.env.example`)
File `C:\Users\LENOVO\Desktop\EnVi/.env.local` (không commit, có trong `.gitignore`):

```
NEXT_PUBLIC_SUPABASE_URL=https://ricthhogtmgxoyjstfkz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEXT_PUBLIC_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
GEMINI_API_KEY=<GEMINI_API_KEY>
GROQ_API_KEY=<GROQ_API_KEY>
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen3:1.7b
```

- `NEXT_PUBLIC_*` lộ ra client (URL, anon key).
- `GEMINI_API_KEY`, `GROQ_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` chỉ dùng server-side (`"server-only"` trong các file lib).
- `OLLAMA_BASE_URL` mặc định `http://localhost:11434`, model `qwen3:1.7b`. Ollama DOWN → Groq làm provider thực tế.

### 1.4 Cấu trúc thư mục (gốc `C:\Users\LENOVO\Desktop\EnVi`)

| Thư mục/File | Nhiệm vụ |
|-------------|----------|
| `app/layout.tsx` | Root layout: font (Be Vietnam Pro, Lora), `RateLimitCheck`, `SearchShortcut`, `SWRegistration`, `Toaster`, metadata. |
| `app/page.tsx` | Trang chủ `/`: landing page, 6 tính năng (Speaking, Flashcard, Shadowing/Dictation, Ngữ pháp, Lộ trình 90 ngày, Trợ lý AI), 2 nút CTA về `/login`. |
| `app/login/page.tsx` | `/login`: form email/mật khẩu (signin/signup), nút "Đăng nhập bằng Google" (`handleGoogleLogin` → `supabase.auth.signInWithOAuth`), redirect sau login qua param `next`. |
| `app/auth/callback/route.ts` | `/auth/callback`: nhận `code` từ Supabase OAuth, gọi `exchangeCodeForSession`, redirect về `next` (mặc định `/dashboard`), guard open-redirect. |
| `app/(main)/layout.tsx` | Layout cho mọi trang trong `(main)`: kiểm tra session qua `createServerClient()`, redirect `/login` nếu chưa có user, render `AppNav`, `XpBar`, `GlobalSearch`, `SignOutButton`, `FloatingChat`. |
| `app/(main)/dashboard/page.tsx` | `/dashboard`: tổng hợp `getDashboardData()`, `getDailyStudyPlan()`, `getWeeklyReport()` → render `DashboardContent`. |
| `app/(main)/vocab/page.tsx` | `/vocab`: gọi `getDueCards()` từ `lib/vocab`, render `VocabSession` hoặc `EmptyFlashcard`. |
| `app/(main)/speaking/page.tsx` | `/speaking`: render `SpeakingHome` + `TranslateSpeak`. |
| `app/(main)/writing/page.tsx` | `/writing`: gọi `listWritingDrafts()` + `getWritingUserId()` → render `WritingHome`. |
| `app/(main)/reading/page.tsx` | `/reading`: client-side, danh sách bài đọc theo cấp độ (A2/B1/B2), `PassageDetail` có nghe mẫu, tóm tắt, trắc nghiệm, lưu vào `localStorage`. |
| `app/(main)/grammar/page.tsx` | `/grammar`: render `GrammarContent` (16 chủ điểm + collocations + practice). |
| `app/(main)/roadmap/page.tsx` | `/roadmap`: render `RoadmapContent` (lộ trình 90 ngày, streak, ticks task hàng ngày). |
| `app/(main)/reflex/page.tsx` | `/reflex`: gọi `getDuePhrases()` từ `lib/phrases`, render `ReflexSession`. |
| `app/(main)/dictation/page.tsx` | `/dictation`: render `DictationGame`. |
| `app/(main)/shadowing/page.tsx` | `/shadowing`: render `ShadowingContent`. |
| `app/(main)/assessment/page.tsx` | `/assessment`: chọn mốc (baseline/day30/day60/day90), render `AssessmentForm`. |
| `app/(main)/error-log/page.tsx` | `/error-log`: gọi `GET /api/error-log`, hiển thị lỗi từ Writing/Speaking/Reflex, nút "Đã ôn"/"Bỏ". |
| `app/(main)/makeup-lesson/page.tsx` | `/makeup-lesson`: bài bù từ lỗi lặp, nút hoàn thành gọi `POST /api/makeup-lesson/complete`, +20 XP. |
| `app/(main)/progress-test/page.tsx` | `/progress-test`: 20 câu (10 vocab + 5 ngữ pháp + 5 nghe), render `ProgressTest`, lưu kết quả qua `saveProgressTest`. |
| `app/(main)/settings/page.tsx` | `/settings`: render `SettingsForm` + `AiUsageStats`. |
| `app/(main)/search/page.tsx` | `/search`: tìm từ vựng qua `GET /api/search`, Client-side, Ctrl+K shortcut. |
| `app/(main)/self-talk/page.tsx` | `/self-talk`: ghi âm 5 phút (MediaRecorder), không lưu server, chỉ ghi chú local. |
| `app/(main)/assistant/page.tsx` | `/assistant`: render `AssistantChat` với `getUserLearningSnapshot()`. |
| `app/actions/*.ts` | Server Actions: `study-plan.ts`, `srs.ts`, `writing.ts`, `speaking.ts`, `dictation.ts`, `phrase-review.ts`, `progress-test.ts`, `learning-snapshot.ts`. |
| `app/api/*.ts` | Route Handlers: `ai/speaking/route.ts`, `writing/feedback/route.ts`, `stt/route.ts`, `translate/route.ts`, `spell-check/route.ts`, `search/route.ts`, `error-log/route.ts`, `makeup-lesson/` (rỗng), `assistant/route.ts`, `auth/callback/route.ts`. |
| `lib/assessment.ts` | Rubric 4 kỹ năng, milestone baseline/day30/day60/day90, `buildAssessment()`, `scoreAssessment()`, lưu/đọc `localStorage` (không gửi server). |
| `lib/vocab.ts` | `getDueCards()`, `getDueCount()`: SM-2 card review từ bảng `card_reviews`, `SESSION_SIZE=100`, `DAILY_NEW_LIMIT=100`. |
| `lib/srs.ts` | SM-2 logic: `createNewCard()`, `rowToCard()`, `reviewCard()`, `cardToRow()`, `GRADE_TO_SM2`. Dùng cho vocab + phrase. |
| `lib/phrases.ts` | `getDuePhrases()`, `getDuePhraseCount()`: SM-2 cho bảng `phrase_reviews`, `SESSION_SIZE=20`, `DAILY_NEW_LIMIT=20`. |
| `lib/dashboard.ts` | `getDashboardData()`, `getWeeklyReport()`: thống kê streak, phút hôm nay, due cards, weekly insight. |
| `lib/date-vn.ts` | `todayStrVN()`, `nowVN()`, `dateOnlyVN()`, `isSameDayVN()`, `dayOfWeekVN()` — múi giờ Asia/Ho_Chi_Minh. |
| `lib/ai/gemini.ts` | `callGemini()`: fetch Generative Language API, 5 model fallback, exponential backoff, `MAX_ATTEMPTS=5`. |
| `lib/ai/groq.ts` | `callGroqChat()`: Groq OpenAI-compatible API, model `qwen/qwen3.8-27b`, `MAX_ATTEMPTS=3`. |
| `lib/ai/ollama.ts` | `callOllamaChat()`: Ollama local `/api/chat`, `MAX_ATTEMPTS=1`, timeout 5s. `checkOllamaAvailable()`, `listOllamaModels()`. |
| `lib/ai/whisper.ts` | `transcribeAudio()`: Groq Whisper `whisper-large-v3-turbo`, `MAX_ATTEMPTS=2`. |
| `lib/speech.ts` | `speakEnglish(text, audioUrl?)`: phát audio URL hoặc fallback `speechSynthesis` (en-US, rate 0.9). `stopSpeaking()`. |
| `lib/speech-eval.ts` | `evaluateSpeech(expected, spoken)`: normalize + `diffWords`, đúng nếu ratio >= 0.75. |
| `lib/speaking-prompt.ts` | `buildSpeakingSystemPrompt()`, `buildFreeSpeakSystemPrompt()`, `buildSpeakingUserPrompt()`, `parseSpeakingResult()`, `SPEAKING_RESPONSE_SCHEMA` (zod). Quy trình 5 bước Speaking. |
| `lib/audio.ts` | `playWordAudio()`: phát audio URL hoặc `speechSynthesis` fallback. |
| `lib/chat-history.ts` | `loadChatHistory()`, `saveChatHistory()`, `clearChatHistory()` — `localStorage` key `envi:chat:history`, MAX 100 tin nhắn. |
| `lib/types.ts` | Core types: `ReviewGrade`, `WordRow`, `CardReviewRow`, `CardReviewRowInsert`, `DueCard`, `DueCount`, `DueSessionState`, `PhraseRow`, `PhraseReviewRow`, `PhraseReviewRowInsert`, `DuePhrase`, `StudyTaskType`, `StudyTask`, `DailyStudyPlan`, `LearningSnapshot`, `WritingFeedback`, `WritingDraftRow`. |
| `lib/types/speaking.ts` | Speaking types: `SpeakingStep` (1\|2\|3\|4\|5), `SpeakingNextAction`, `SpeakingMode`, `SpeakingError`, `SpeakingTurnResult`, `SpeakingHistoryTurn`, `SpeakingTurnRow`, `SpeakingSessionRow`. |
| `lib/collocations-data.ts` | `COLLOCATIONS` từ `data/collocations.json`. |
| `lib/dictation-data.ts` | `DICTATION_LESSONS` từ `data/dictation-lessons.json`. |
| `lib/reading-data.ts` | `READING_PASSAGES` từ `data/reading-passages.json`, `READING_LEVELS = ["A2","B1","B2"]`. |
| `lib/shadowing-data.ts` | `SHADOWING_LESSONS` từ `data/shadowing-lessons.json`, `formatTime()`. |
| `lib/grammar-exercises-data.ts` | `GRAMMAR_EXERCISES` từ `data/grammar-exercises.json`, `getGrammarExercises(topicId)`. |
| `lib/emoji.ts` | `emojiForTopic(topic)`: map topic → emoji. |
| `lib/utils.ts` | Re-export `cn` từ `cn` package. |
| `components/vocab/` | `vocab-session.tsx` (flashcard SM-2 session, phím 1-4 để đánh giá, space để lật), `flashcard.tsx` (lật 2 mặt, IPA, audio, YouGlish), `rating-bar.tsx` (4 nút again/hard/good/easy), `empty-flashcard.tsx` (hết thẻ, auto-refresh 5s). |
| `components/speaking/` | `speaking-home.tsx` (chọn group/topic/cấp độ, bắt đầu session), `speaking-session.tsx` (state machine 5 bước, MicButton, STT qua `/api/stt`, AI qua `/api/ai/speaking`, fallback mode, rate-limit retry, transcript edit, reflection 3 câu, summary). |
| `components/writing/` | `writing-home.tsx` (danh sách đề theo cấp độ, trạng thái new/draft/feedback/done), `writing-editor.tsx` (biên soạn, localStorage buffer + Supabase debounced save 800ms, SpellCheck, AI feedback qua `/api/writing/feedback`, compare v1/v2, complete +30 XP). |
| `components/grammar/` | `grammar-content.tsx` (16 chủ điểm B1_B2_TOPICS hardcode + collocations/phrasal/practice tabs, lỗi thường gặp), `grammar-practice.tsx` (mcq/fill, seeded shuffle, 10 câu/lượt), `collocations-view.tsx`, `collocations-practice.tsx`. |
| `components/roadmap/` | `roadmap-content.tsx` (lộ trình 90 ngày, streak, computeStreak, ticks task, daily lesson từ `data/daily-lessons`, 90 dots, confetti, chỉnh phút/ngày qua `profiles.minutes_per_day`). |
| `components/reflex/` | `reflex-session.tsx` (3 mode: shadowing/reflex/dictation, MicButton + AudioButton, `evaluateSpeech`, `reviewPhrase` +15 XP), `mic-button.tsx`, `audio-button.tsx`. |
| `components/dictation/` | `dictation-game.tsx` (nghe transcript, gõ lại, diffWords hiển thị xanh/đỏ, `saveDictationAttempt` +20 XP nếu đúng, localStorage seen set). |
| `components/shadowing/` | `shadowing-content.tsx` (danh sách video YouTube + TTS mode), `shadowing-player.tsx` (iframe YouTube, tốc độ 0.75x–1.5x, ghi âm, auto-evaluation mock, so sánh bản gốc/bản ghi). |
| `components/reading/` | `reading-practice.tsx` (danh sách bài đọc, passage detail với nghe/tóm tắt/trắc nghiệm). |
| `components/assessment/` | `assessment-form.tsx` (5 bước: listening/reading/speaking/writing/result, rubric sao 1-5, lưu localStorage). |
| `components/progress-test/` | `progress-test.tsx` (20 câu, nộp bài, lưu `progress_tests` bảng, xpEarned = score*5, hiển thị đáp án). |
| `components/dashboard/` | `dashboard-content.tsx` (chào mừng, streak, phút hôm nay, due cards, speaking sessions, biểu đồ cột, quick links), `daily-study-plan.tsx` (task list, toggle + optimistic UI, bonus +100 XP, confetti), `weekly-report.tsx` (tuần này của bạn, insight). |
| `components/assistant/` | `assistant-chat.tsx` (chat AI, quick actions, localStorage history), `floating-chat.tsx` (widget tròn, ẩn trên `/assistant`), `empty-chat.tsx`. |
| `components/settings/` | `ai-usage-stats.tsx` (thống kê gọi AI từ `ai_usage_log`). |
| `components/settings-form.tsx` | Hồ sơ (goal, minutes_per_day, voice, tts_rate), xuất dữ liệu JSON (EXPORT_TABLES 16 bảng), xoá tài khoản qua RPC `delete_my_account`. |
| `components/app-nav.tsx` | Sidebar nav: 13 mục (Tổng quan, Học từ, Phản xạ, Speaking, Shadowing, Dictation, Đọc to, Viết, Ngữ pháp, Kiểm tra, Lộ trình, Trợ lý AI, Cài đặt). |
| `components/sign-out-button.tsx` | Đăng xuất Supabase, redirect `/login`. |
| `components/placeholder-page.tsx` | Trang placeholder (phase label). |
| `components/pwa-icons.tsx` | SVG icon 192/512 cho PWA. |
| `components/ui/` | shadcn components: button, card, dialog, input, label, search-shortcut, skeleton, spell-check, sw-registration, textarea, confetti, error-boundary, global-search. |
| `hooks/use-recorder.ts` | `useRecorder()`: MediaRecorder wrapper, states idle/recording/processing, error handling (NotAllowedError). |
| `hooks/use-speech-synthesis.ts` | `useSpeechSynthesis()`: wrapper window.speechSynthesis, speak/cancel, speaking state. |
| `data/daily-lessons.ts` | `DAILY_LESSONS` (90 ngày + ngày 91–180 sinh theo vòng lặp), `getDailyLesson(day)`. Các phase: 1-30 A2, 31-60 B1, 61-90 B2, 91-120 B2+, 121-180 B2 thực chiến. |
| `data/speaking-topics.json` | 3 nhóm (Đời sống hằng ngày, Công việc/IT, Du lịch & Xã hội), ~27 topics, mỗi topic có emoji + desc. |
| `data/speaking-questions-by-level.ts` | `SPEAKING_QUESTIONS_BY_LEVEL`: ~27 topics × 3 cấp độ (A2/B1/B2) × 5 câu hỏi, `getLevelQuestions(topicId, level)`. |
| `data/writing-prompts.ts` | `WRITING_PROMPTS`: 19 đề (A2: 5 it-ba + 1 daily, B1: 4 it-ba + 2 daily, B2: 2 it-ba + 3 daily), mỗi đề có situation_vi, instruction_en, minWords, sampleAnswer, checklist. `WRITING_CHECKLIST_ITEMS` (6 mục). |
| `data/collocations.json`, `data/phrases.txt`, `data/phrases-advanced.txt`, `data/ngsl-1.2.csv`, `data/oxford-5k.csv`, `data/reading-passages.json`, `data/dictation-lessons.json`, `data/shadowing-lessons.json`, `data/grammar-exercises.json` | Dữ liệu học liệu (từ, câu, bài đọc, bài nghe, ngữ pháp). |
| `db/migrations/0001_init.sql` | Schema gốc: words, topics, dictation_items, grammar_lessons, grammar_exercises, profiles, decks, deck_words, card_reviews, speaking_sessions, speaking_turns, recordings, dictation_attempts, daily_progress, ai_usage_log, RLS, trigger updated_at, handle_new_user, delete_my_account. |
| `db/migrations/0002_words_extend.sql` | Thêm `cefr_level` vào words, unique index (lemma, source). |
| `db/migrations/0003_gamification.sql` | Thêm `xp`, `level` vào profiles, hàm `calculate_level()`, `add_xp()`, trigger, RLS update policy. |
| `db/migrations/0004_indexes.sql` | Index hiệu năng: words_cefr_level, card_reviews_word_id, speaking_turns_session_id, speaking_sessions_user, daily_progress_user_date, ai_usage_log_user, recordings_user, dictation_attempts_user. |
| `db/migrations/0005_phrases.sql` | Bảng phrases + phrase_reviews (SM-2), RLS, unique (vi_text, en_text), delete_phrase_data RPC. |
| `db/migrations/0006_progress_tests.sql` | Bảng progress_tests (score, total, level, details jsonb), RLS. |
| `db/migrations/0007_study_plan.sql` | Bảng study_plan_progress (user_id, plan_date, completed_task_ids[], bonus_awarded), RLS. |
| `db/migrations/0008_writing.sql` | Bảng writing_drafts (user_id, prompt_id, level, draft_text, revised_text, feedback_json, completed), RLS, unique (user_id, prompt_id, level). |
| `scripts/verify-90-days.ts` | Kiểm tra 90/90 ngày: đủ 90 lesson, mỗi ngày có goal/tasks/output, mốc 1/30/31/60/61/90, phân bố 30/30/30 A2/B1/B2, output là speaking/writing. |
| `scripts/import-words.ts`, `scripts/import-phrases.ts` | Import từ vựng/cụm vào Supabase (dùng SUPABASE_SERVICE_ROLE_KEY). |
| `scripts/add-phrases3.js`, `scripts/gen-phase10-*.mjs`, `scripts/count-*.cjs`, `scripts/debug-*.cjs`, `scripts/hsk3-*` | Script hỗ trợ (một số là rác historischen, chưa xóa). |
| `tests/speaking.spec.ts` | Playwright: Speaking A2/B1/B2 (Groq fallback), all-provider error, double-click gửi không trùng. |
| `tests/writing.spec.ts` | Playwright: draft reload persistence, per-prompt drafts, AI error keeps draft, submit→feedback→revise→complete, cross-context sync, progress test UI. |
| `tests/roadmap.spec.ts` | Playwright: 90 dots, 3 phase, chỉnh phút/ngày persist, route thật, E2E Dashboard→vocab→reflex→writing→reload. |
| `tests/daily-journey.spec.ts` | Playwright: smoke test tất cả trang chính load, nav đầy đủ. |
| `tests/qa-plan-flow.spec.ts` | (untracked, mới) |
| `tests/artifacts/` | (untracked) |
| `playwright.config.ts`, `vitest.config.ts`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `package.json` | Cấu hình công cụ. |
| `vercel.json` | Vercel deployment config: nextjs framework, buildCommand `npm run build`. |
| `start-envi.ps1` | Script khởi động local (`npm run start`), mở Brave profile Default vào `http://localhost:3000/login`. |
| `Học EnVi.lnk` | Shortcut Desktop chạy `start-envi.ps1`. |
| `HANDOFF.md` | Tài liệu bàn giao cũ (sẽ bị thay thế bởi file này). |
| `AGENTS.md` | Next.js agent rules (tự sinh bởi `next dev`). |

---

## 2. CHI TIẾT CÁC TÍNH NĂNG (FEATURES DEEP DIVE)

### 2.1 Đăng nhập / Xác thực (Auth)

**Route**: `/login` (`app/login/page.tsx`), `/auth/callback` (`app/auth/callback/route.ts`), middleware bảo vệ (`lib/supabase/middleware.ts`).

**Chức năng cốt lõi**:
- Đăng nhập email/mật khẩu (`signInWithPassword`) và đăng ký (`signUp`).
- Đăng nhập bằng Google OAuth (`signInWithOAuth` provider "google").
- Middleware redirect chưa đăng nhập về `/login` (trừ `/`, `/login`, `/auth/*`); redirect đã đăng nhập ở `/login` về `/dashboard`.

**Chi tiết hoạt động**:
1. `handleSubmit()`: gọi `createClient()` (browser client từ `lib/supabase/client.ts`), nếu signup và có session → `redirectAfterLogin()`; nếu signin password thành công → `redirectAfterLogin()`. Lỗi "Invalid login" hiển thị "Email hoặc mật khẩu không đúng."
2. `handleGoogleLogin()`: tạo Supabase client, lấy param `next` từ URL (mặc định `/dashboard`), gọi `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}` } })`. Nếu `data?.url` tồn tại → `window.location.href = data.url` (chuyển trang sang Google). Nếu lỗi → hiển thị message.
3. `redirectAfterLogin()`: kiểm tra param `next` phải bắt đầu bằng `/`, không bắt đầu bằng `//` hoặc `/login`, không thì mặc định `/dashboard`. Gọi `router.push(safe)` + `router.refresh()`.
4. `/auth/callback/route.ts` (Server): lấy `code`, `error`, `next` từ searchParams. Log `hasCode`, `hasProviderError`, `providerError`, `errorDescription`, `next`, `origin`. Nếu có `code`: `supabase.auth.exchangeCodeForSession(code)`. Nếu không lỗi → redirect `${origin}${safe}` (safe = next nếu bắt đầu bằng `/` và không `//`, không thì `/dashboard`). Nếu có lỗi hoặc không có code → redirect `${origin}/login?error=auth`.
5. Middleware `updateSession()`: tạo server client từ cookies, gọi `getUser()`. Nếu không có user và path không phải public → redirect `/login?next=pathname`. Nếu có user và path `/login` → redirect `/dashboard`.

**Điểm đã tối ưu**:
- Guard open-redirect: `next` phải bắt đầu bằng `/` và không bắt đầu bằng `//`.
- Console.error logging trong callback chỉ log `hasCode`, `hasProviderError`, `providerError`, `errorDescription` — **không log code/token/secret**.
- Supabase SSR cookie handler trong `server.ts`: `setAll` battry/catch để gọi từ Server Component không lỗi (middleware lo refresh cookie).

**GAP**:
- `/login?error=auth` trên production HTTPS chưa được người dùng xác nhận (cần chọn Gmail thật).
- Google OAuth Provider trong Supabase Dashboard cần admin bật Client ID/Secret và cấu hình Redirect URL `https://envi-deploy-one.vercel.app/auth/callback`, Site URL `https://envi-deploy-one.vercel.app`.

### 2.2 Dashboard (Tổng quan)

**Route**: `/dashboard` (`app/(main)/dashboard/page.tsx`).

**Chức năng cốt lõi**: Hiển thị streak, phút học hôm nay, thẻ đến hạn, phiên speaking (7 ngày), biểu đồ phút học 7 ngày, kế hoạch học hôm nay (DailyStudyPlan), báo cáo tuần (WeeklyReport), quick links.

**Chi tiết hoạt động**:
1. `DashboardPage` là Server Component, gọi song song 3 hàm: `getDashboardData()` (`lib/dashboard.ts`), `getDailyStudyPlan()` (`app/actions/study-plan.ts`), `getWeeklyReport()` (`lib/dashboard.ts`).
2. `getDashboardData()`: lấy user từ Supabase, query `daily_progress` (7 ngày gần nhất), `streak` từ row mới nhất, `getDueCount()` từ `lib/vocab` (due + new cards). Trả stats + weekData.
3. `getDailyStudyPlan()`: `computePlan()` xây task list (vocab, reflex, progress-test nếu >=14 ngày chưa test, streak, speaking, writing, dictation, grammar), sort urgent trước, targetMinutes = min(240, max(60, tổng)). Sau đó query `study_plan_progress` hôm nay để lấy completedTaskIds + bonusAwarded.
4. `getWeeklyReport()`: query `card_reviews` (7 ngày), `daily_progress` (14 ngày), `speaking_sessions` (7 ngày), `phrase_reviews` (7 ngày + reps/lapses cho accuracy). Sinh insight: nếu chưa speaking → "speaking"; nếu accuracy <70 → "reflex"; nếu minutes=0 → "streak"; nếu delta<0 → "streak"; không thì "good".
5. Render `DashboardContent` với stats, weekData, plan, report. Có 4 stat cards (streak, phút hôm nay, thẻ đến hạn, phiên speaking), biểu đồ cột 7 ngày, WeeklyReport, quick links (4 thẻ: Speaking, Viết, Học từ, Lộ trình).

**Điểm đã tối ưu**:
- `getDashboardData()` bọc `getDueCount()` trong try/catch (tránh crash nếu bảng chưa sẵn sàng).
- WeeklyReport insight dựa trên dữ liệu thật, không hardcode.

**GAP**:
- `totalWords` trong stats luôn trả 0 (chưa query bảng words count trong `getDashboardData()`).
- `XpBar` (`components/gamification/xp-bar.tsx`) là client component gọi Supabase trực tiếp (browser client), có thể khác dữ liệu so với server.

### 2.3 Học từ vựng / Flashcard (Vocab)

**Route**: `/vocab` (`app/(main)/vocab/page.tsx`).

**Chức năng cốt lõi**: Flashcard lật 2 mặt (Anh ↔ Việt), thuật toán SM-2, 100 thẻ/session, tối đa 100 từ mới/ngày, nút "Học thêm từ mới" nếu hết thẻ đến hạn.

**Chi tiết hoạt động**:
1. `VocabPage` gọi `getDueCards(limit=100)` từ `lib/vocab.ts`.
2. `getDueCards()`: query `card_reviews` (tất cả review của user), lọc `due_at <= now`, lấy `word_id` đã review. Query `words` cho các due review. Tính `newIntroducedToday` (review tạo hôm nay). `newLimit = min(limit - dueCount, DAILY_NEW_LIMIT - newIntroducedToday)`. Query `words` theo `frequency_rank` asc, phân trang 100, bỏ qua word đã reviewed. Ghep due words + new words, slice 100. Query count tổng số từ. Trả `cards` + `state` (has_due / has_new_only / exhausted).
3. Client `VocabSession` (`components/vocab/vocab-session.tsx`): hiển thị thẻ hiện tại, progress bar, phím Space lật, phím 1-4 đánh giá (again/hard/good/easy). Nếu "again" và requeueCount < 2 → push lại vào cuối queue. Gọi `reviewWord(wordId, grade)` (Server Action `app/actions/srs.ts`).
4. `reviewWord()`: lấy review hiện có từ `card_reviews`, nếu không có → `createNewCard()`. `rowToCard()` → `reviewCard(card, grade, now)`. Nếu grade == "easy": `I = max(I+1, ceil(I*1.3))`, `due = now + I days`. `cardToRow()` insert/upsert vào `card_reviews` (onConflict user_id,word_id). Nếu good/easy → RPC `add_xp(user_id, 10)`. Trả `dueAt`.
5. `Flashcard` (`components/vocab/flashcard.tsx`): mặt trước (emoji, lemma, IPA, nút Nghe, link YouGlish), mặt sau (meaning_vi, example_en, example_vi). `playWordAudio()` từ `lib/audio.ts`.
6. `RatingBar`: 4 nút Again/Hard/Good/Easy với màu khác nhau.
7. Nếu `state.status === "exhausted"` → `EmptyFlashcard` (tự refresh sau 5s). Nếu `has_new_only` → nút "Học thêm từ mới" (redirect `/vocab?new=1`).

**Điểm đã tối ưu**:
- Optimistic UI: requeue local trước khi gọi server.
- Phím tắt (Space, 1-4) không cần click nút.
- YouGlish link ngoài cho phát âm thực tế.

**GAP**:
- `SESSION_SIZE = 100` hardcode, không có cài đặt người dùng.
- Không có âm thanh file thực cho từ (chỉ Web Speech API fallback).

### 2.4 Luyện nói với AI (Speaking)

**Route**: `/speaking` (`app/(main)/speaking/page.tsx`).

**Chức năng cốt lõi**: AI Speaking Coach 1-1 theo 5 bước (Hỏi → Kiểm tra → Cải thiện → Nói lại → Tổng kết), 5 câu hỏi/topic + 3 câu reflection, 2 chế độ (Theo chủ đề / Nói tự do), STT qua Groq Whisper, AI phản hồi qua Ollama→Groq→Gemini, fallback tự luyện khi hết lượt AI.

**Chi tiết hoạt động (State Machine 6 bước)**:

1. **Bắt đầu session**: `SpeakingHome` chọn group/topic/cấp độ (A2/B1/B2), click "Bắt đầu luyện" → `startSpeakingSession()` (Server Action `app/actions/speaking.ts`) insert vào `speaking_sessions`, trả `sessionId`. Render `SpeakingSession`.
2. **Bước 1 – Hỏi**: `useEffect` auto-gọi `requestAI(currentQuestion, 1, "topic", questionIndex)` → POST `/api/ai/speaking` với `{sessionId, currentStep:1, topic, userMessage:"", mode:"topic", questionIndex, level}`. AI trả JSON `{step:1, ai_response_en: "...câu hỏi...", feedback_vi:"", understood:true, errors:[], corrected_sentence:"", next_action:"ask_question", top_errors:[], key_phrases:[], reflex_questions:[]}`. AI nói câu hỏi qua `speak()` (Web Speech API).
3. **Bước 2 – Trả lời**: Người dùng bấm Mic (MediaRecorder) → `stopRecording()` trả blob → `transcribeAndSend(blob)` → POST `/api/stt` (Groq Whisper) → text. Hoặc nhập văn bản. Gọi `sendUserMessage(text)` với `stepForAI = min(step+1, 5) = 2` → POST `/api/ai/speaking` với `currentStep:2`. AI đánh giá: `{step:2, ai_response_en:"...góp ý...", feedback_vi:"...tiếng Việt...", understood:true/false, errors:[{error, correction, explanation_vi}], corrected_sentence:"...câu đã cải thiện...", next_action:"request_retry", ...}`. Nói lại `corrected_sentence`.
4. **Bước 3–4 – Nói lại / Lặp lại**: Người dùng nghe corrected_sentence, bấm Mic lại nói lại. AI nhận ở `step:3` hoặc `step:4`. Nếu tốt và là câu cuối → `step:5, next_action:"done"`. Nếu còn câu → `step:1, next_action:"ask_question"` (sang câu tiếp theo). Nếu còn lỗi → `step:3, next_action:"request_retry"` (yêu cầu nói lại).
5. **Bước 5 – Tổng kết**: Sau câu 5 (hoặc reflection câu 6-8), AI trả `step:5, next_action:"done"`, điền `top_errors` (tối đa 3), `key_phrases` (tối đa 5), `reflex_questions`. Hiển thị tổng kết.
6. **Kết thúc**: `endSpeakingSession(sessionId)` update `ended_at` + RPC `add_xp(user_id, 50)`.

**Luồng fallback**:
- Nếu Ollama/Groq/Gemini đều lỗi 429/rate limit → `rateLimitRetry` hiển thị "AI đang bận", nút "Thử lại" (sau 30s) hoặc "Tiếp tục tự luyện" (`fallbackMode=true`). Trong fallback mode: hiển thị câu hỏi, Mic ghi âm, phát lại, nút "Tiếp theo", không gọi AI.
- Double-clickGuard: `lastSentRef.current` tránh gửi cùng tin nhắn hai lần.

**Chi tiết API `/api/ai/speaking`** (`app/api/ai/speaking/route.ts`):
- Xác thực user qua Supabase server client.
- Kiểm tra `speaking_sessions` sở hữu bởi user.
- Lấy `speaking_turns` history (giới hạn 20) để costrui `SpeakingHistoryTurn[]`.
- Xây `systemPrompt` qua `buildSpeakingSystemPrompt(topic, currentStep, questionIndex, TOTAL_QUESTIONS=5, level)`.
- Thử Ollama (có `responseSchema=SPEAKING_RESPONSE_SCHEMA`) → Groq → Gemini. Mỗi provider parse qua `parseSpeakingResult()` (zod schema `speakingResultSchema`).
- `normalizeOllamaResult()`: sửa `next_action` invalid → "ask_question", mảng invalid → [].
- Insert `speaking_turns` với `feedback_json = result`, `improved_answer = corrected_sentence`. Nếu `next_action === "done"` → update `speaking_sessions.ended_at`.
- Trả `{result, sessionId, aiMs}`.

**Điểm đã tối ưu**:
- Fallback 3 cấp provider (Ollama→Groq→Gemini) với exponential backoff.
- Rate-limit detection (`/429|rate.?limit|quota/`), hiển thị countdown 30s.
- Fallback mode tự luyện khi AI hết lượt.
- `lastSentRef` guard double-submit.
- Tất cả turn lưu vào `speaking_turns` (feedback_json jsonb) để Error Log đọc sau.

**GAP**:
- Ollama DOWN (port 11434) → Groq là provider thực tế; nếu Groq hết lượt miễn phí, Speaking sẽ lỗi.
- Không có đánh giá phát âm thật (chỉ STT chép văn bản, `evaluateSpeech` so sánh text không so sánh âm thanh).
- Mic thật yêu cầu trình duyệt hỗ trợ `MediaRecorder` + `getUserMedia`.
- `TOTAL_TURNS = 8` (5 câu topic + 3 reflection), reflection questions lấy từ AI messages trước đó.

### 2.5 Viết (Writing)

**Route**: `/writing` (`app/(main)/writing/page.tsx`).

**Chức năng cốt lõi**: Chọn đề viết (19 đề A2/B1/B2, IT/BA + đời sống), viết nháp, xin góp ý AI, viết lại, so sánh v1/v2, hoàn thành (+30 XP), lưu nháp vào Supabase + localStorage buffer.

**Chi tiết hoạt động**:
1. `WritingPage` gọi `listWritingDrafts()` + `getWritingUserId()` (Server Actions `app/actions/writing.ts`), render `WritingHome`.
2. `WritingHome`: lọc `WRITING_PROMPTS` theo cấp độ, hiển thị grid các đề với trạng thái (new/draft/feedback/done). Click đề → render `WritingEditor`.
3. `WritingEditor` (`components/writing/writing-editor.tsx`):
   - `storageKey = "envi:writing:${userId}:${promptId}:${level}"`.
   - Mount: so sánh `localStorage` (savedAt) vs server `updated_at`, lấy cái mới hơn.
   - `persistLocal()`: ghi ngay vào localStorage mỗi khi thay đổi (text, revised, checklist).
   - `useEffect` debounce 800ms: gọi `saveWritingDraft()` (upsert `writing_drafts` onConflict user_id,prompt_id,level).
   - `handleGetFeedback()`: lưu nháp trước, POST `/api/writing/feedback` với `{promptId, level, draftText}`. Nếu thành công: set feedback, set revised = improved_version, persist local, gọi `saveWritingFeedback()` (update feedback_json, revised_text). Tab chuyển sang "compare".
   - `handleComplete()`: optimistic set completed=true + checklist all true. Gọi `saveWritingDraft()` rồi `completeWritingTask()` (update completed=true, RPC add_xp 30). Nếu chưa completed trước đó → toast +30 XP.
   - Tab "write": textarea draft, nút Lưu nháp, Xin góp ý AI, SpellCheck, checklist tự rà, nút Xem câu mẫu (chỉ hiện sau khi đã thử), nút Nghe mẫu.
   - Tab "compare": hiển thị feedback AI (overall_vi, lỗi cần sửa, key_phrases), v1 (bản gốc), v2 (bản cải thiện), textarea viết lại, nút Góp ý lại, nút Hoàn thành bài.
4. API `/api/writing/feedback` (`app/api/writing/feedback/route.ts`): xác thực user, lấy prompt qua `getWritingPrompt(promptId)` từ `data/writing-prompts.ts`, xây systemPrompt với FEEDBACK_SCHEMA (zod), thử Ollama→Groq→Gemini, parse JSON, trả `{feedback}`. Insert `ai_usage_log` (feature: "writing").

**Điểm đã tối ưu**:
- LocalStorage buffer làm source of truth ngay lập tức, Supabase là cloud sync (debounce 800ms).
- Nếu AI lỗi, draft vẫn giữ, checklist vẫn dùng được.
- Cross-context sync: hai trình duyệt cùng tài khoản thấy cùng nháp (việc Supabase).
- `draft_text` và `revised_text` cắt tối đa 5000 ký tự.

**GAP**:
- `writing_drafts` bảng tạo từ migration 0008; nếu chưa apply migration, `listWritingDrafts()` trả [] (không throw).
- Chỉ 19 đề viết (ít nhất spec yêu cầu 15, đã đạt).

### 2.6 Đọc hiểu (Reading)

**Route**: `/reading` (`app/(main)/reading/page.tsx`).

**Chức năng cốt lõi**: 50 bài đọc A2/B1/B2, nghe mẫu (Web Speech API), làm trắc nghiệm, viết tóm tắt lưu localStorage, xem kết quả.

**Chi tiết hoạt động**:
1. `READING_PASSAGES` từ `data/reading-passages.json` (qua `lib/reading-data.ts`). `safePassage()` validate cấu trúc.
2. Client lọc theo cấp độ (A2/B1/B2), hiển thị grid 9 bài/trang, nút "Xem thêm".
3. Click bài → `PassageDetail`: hiển thị title, level, wordCount, text. Nút "Nghe mẫu" gọi `speakEnglish(passage.text)`.
4. `SpellCheck` component kiểm tra chính tả đoạn văn (gọi `/api/spell-check`).
5. Tóm tắt: textarea, nút "Lưu tóm tắt" → lưu vào `localStorage` key `envi:reading:summary:${passage.id}` (mảng {text, savedAt}).
6. Trắc nghiệm: các câu hỏi có sẵn trong passage. Click đáp án → disable, hiển thị xanh/đỏ. Khi hết câu → hiển thị kết quả correctCount/total. Nút "Làm lại" reset.

**Điểm đã tối ưu**:
- Validate passage structure trước khi render (tránh crash dữ liệu lỗi).
- Tóm tắt lưu localStorage (không cần server).

**GAP**:
- Tóm tắt chỉ lưu localStorage, không gửi server (không có bảng DB cho reading summary).
- Không có audio file thực (chỉ Web Speech API).

### 2.7 Ngữ pháp (Grammar)

**Route**: `/grammar` (`app/(main)/grammar/page.tsx`).

**Chức năng cốt lõi**: 16 chủ điểm ngữ pháp (B1_B2_TOPICS hardcode trong `components/grammar/grammar-content.tsx`), công thức, ví dụ, giải thích, quiz 3 câu/chủ điểm. Collocations/phrasal/practice tabs. Practice Hub từ `data/grammar-exercises.json` (mcq + fill, 10 câu/lượt, seeded shuffle).

**Chi tiết hoạt động**:
1. `GrammarContent`: 16 chủ điểm (conditionals, passive, relative-clauses, modal-verbs, gerunds-infinitives, comparatives, present-perfect-vs-past, future-forms, reported-speech, used-to, articles, prepositions, quantifiers, question-forms, conjunctions, word-order). Mỗi chủ điểm có formula, example, explanation, quizzes[3]. Click mở rộng hiển thị công thức + `GrammarPractice`.
2. `GrammarPractice`: `getGrammarExercises(topicId)` từ `lib/grammar-exercises-data.ts`. Chế độ mcq/fill. Seeded shuffle (seed deterministic), 10 câu/lượt. Kiểm tra đáp án, hiển thị xanh/đỏ. Nút "10 câu mới" tăng seed.
3. Tab collocations/phrasal hiển thị `COLLOCATIONS` từ `data/collocations.json` qua `CollocationsView`.
4. Phần dưới: 6 lỗi thường gặp (I good at, She go, I have went, I am agree, I very like, Can you speaks) với bản sửa và giải thích.

**Điểm đã optim**:
- Spec yêu cầu 16 chủ điểm / 800 câu. `data/grammar-exercises.json` đã có dữ liệu (Handoff ghi 16/800 PASS).
- Seeded shuffle giúp trùng ít khi xong vòng.

**GAP**:
- 16 chủ điểm B1_B2_TOPICS hardcode trong component (không từ DB), mỗi chủ điểm chỉ 3 quiz (tổng 48 quiz hardcode + 800 câu từ JSON file).
- Ngữ pháp không lưu tiến độ người dùng vào DB (chỉ training local).

### 2.8 Phản xạ câu giao tiếp (Reflex)

**Route**: `/reflex` (`app/(main)/reflex/page.tsx`).

**Chức năng cốt lõi**: Nghe → Dịch → Nói. 20 câu/session, 20 câu mới/ngày, SM-2. 3 mode: reflex (dịch Việt sang Anh rồi nói), shadowing (nghe & nói đuổi), dictation (nghe & gõ).

**Chi tiết hoạt động**:
1. `ReflexPage` gọi `getDuePhrases(SESSION_SIZE=20, difficulty)` từ `lib/phrases.ts` (cùng logic SM-2 như vocab, bảng `phrase_reviews`).
2. `ReflexSession`: hiển thị câu hiện tại (vi_text cho reflex mode, en_text cho shadowing/dictation). 3 nút mode chuyển đổi.
3. Reflex mode: hiển thị vi_text, người dùng bấm Mic → `handleSpeech(spoken)` → `evaluateSpeech(en_text, spoken)`. Nếu correct → `record(attempts===0 ? "easy" : "good")` (+15 XP nếu good/easy). Nếu sai → attempts++, hiển thị đáp án, nút "Nói lại"/"Bỏ qua".
4. Shadowing mode: tự động phát audio (`speakEnglish(en_text, audio_url)`) khi đổi câu. Người dùng nói theo, bấm "Tiếp theo" → `record("good")`.
5. Dictation mode: input gõ lại câu, Enter hoặc nút "Kiểm tra" → `handleDictationSubmit()` → evaluateSpeech. Nếu đúng → record good.
6. `reviewPhrase()` (Server Action `app/actions/phrase-review.ts`): cùng logic `reviewWord` nhưng cho bảng `phrase_reviews`, +15 XP.
7. Hết session → hiển thị "Hoàn thành phiên luyện phản xạ", nút Luyện tiếp / Về tổng quan.

**Điểm đã tối ưu**:
- 3 mode trong 1 component, share `evaluateSpeech`.
- Audio tự động phát cho shadowing/dictation.

**GAP**:
- Reflex mode không tự động phát audio gợi ý (chỉ có nút "Nghe gợi ý" manual).
- Không có PWA/mic thật hoàn chỉnh (yêu cầu getUserMedia).

### 2.9 Dictation (Nghe chép chính tả)

**Route**: `/dictation` (`app/(main)/dictation/page.tsx`).

**Chức năng cốt lõi**: Nghe transcript, gõ lại, hiển thị diff xanh/đỏ, lưu điểm vào `dictation_attempts`, +20 XP nếu đúng.

**Chi tiết hoạt động**:
1. `DICTATION_LESSONS` từ `data/dictation-lessons.json` (qua `lib/dictation-data.ts`). Lọc theo cấp độ (A2/B1/B2), shuffle, ưu tiên bài chưa làm (localStorage `envi:dictation:seen`).
2. Tự động phát transcript khi đổi bài (`speakEnglish(current.transcript)`).
3. Người dùng gõ vào input, Enter hoặc nút "Kiểm tra" → `handleSubmit()`: so sánh `input.trim().toLowerCase() === current.transcript.trim().toLowerCase()`. Nếu đúng → score++, markSeen(id). Gọi `saveDictationAttempt({userText, correct})` (Server Action `app/actions/dictation.ts`): insert `dictation_attempts` (item_id=null, score 100/0), +20 XP nếu đúng.
4. `DiffResult`: hiển thị diffWords giữa userText và expected, thêm/xóa được tô màu.
5. Nút "Nghe lại", "Bài tiếp theo" (rebuild queue nếu hết).

**Điểm đã tối ưu**:
- localStorage seen set tránh lặp bài.
- Diff hiển thị chi tiết từng từ.

**GAP**:
- `item_id` luôn null (không liên kết với dictation_items cụ thể).
- Chỉ so sánh toàn bộ câu, không tách từ.

### 2.10 Shadowing (Nói đuổi theo video)

**Route**: `/shadowing` (`app/(main)/shadowing/page.tsx`).

**Chức năng cốt lõi**: Danh sách bài shadowing (YouTube + TTS fallback), điều khiển tốc độ 0.75x–1.5x, click câu trong transcript để tua, ghi âm, so sánh bản gốc/bản ghi.

**Chi tiết hoạt động**:
1. `SHADOWING_LESSONS` từ `data/shadowing-lessons.json` (qua `lib/shadowing-data.ts`). Mỗi lesson: youtubeId, transcript[] (id, startTime, endTime, text).
2. `ShadowingPlayer`: iframe YouTube embed (`enablejsapi=1`). Nếu youtubeId === DEFAULT_YOUTUBE_ID ("dQw4w9WgXcQ") → dùng TTS mode (speakEnglish).
3. Nút Tốc độ (0.75x, 1x, 1.25x, 1.5x) → postMessage đến iframe (`setPlaybackRate`).
4. Click câu transcript → `handleSegmentClick`: seekTo (YouTube) hoặc playSegmentTTS (TTS).
5. Ghi âm (useRecorder) → `recordedUrl` (Blob URL). Nút "Đánh giá" → evaluation mock (score 0, correct false, feedback "Ghi âm hoàn thành. Hãy nghe lại..."). Không có AI đánh giá phát âm thật.
6. Phát bản gốc vs bản ghi của mình.

**Điểm đã tối ưu**:
- TTS fallback khi YouTube không khả dụng.
- Dynamic import (`ssr: false`) để tránh SSR lỗi iframe.

**GAP**:
- Đánh giá shadowing là mock (score 0, không so sánh âm thanh thật).
- YouTube API không thực sự được điều khiển (chỉ postMessage seekTo/playVideo, không kiểm tra trạng thái play).

### 2.11 Lộ trình 90 ngày (Roadmap)

**Route**: `/roadmap` (`app/(main)/roadmap/page.tsx`).

**Chức năng cốt lõi**: Xem 90 ngày chia 3 giai đoạn (T1: Xây nền tảng A2, T2: Bứt phá B1, T3: Thực chiến B2), tick task hôm nay, streak, 90 dots, chỉnh phút/ngày.

**Chi tiết hoạt động**:
1. `DAILY_LESSONS` từ `data/daily-lessons.ts` (90 ngày + ngày 91–180). Mỗi ngày: tasks (vocab, grammar, reflex, dictation/shadowing, reading), output (speaking/writing), totalMinutes.
2. `RoadmapContent`: load `daily_progress` (120 ngày) + `profiles.minutes_per_day` từ Supabase (browser client). Tính streak (`computeStreak`), completedCount, currentDay = min(90, completedCount + (dayComplete?0:1)), activePhase.
3. Hiển thị: ngày currentDay/90, giai đoạn, progress bar, streak, số ngày xong.
4. "Bài học hôm nay": từ `getDailyLesson(currentDay)`, hiển thị tasks (Sáng input + Tối output + Cuối tuần).
5. "Lịch học hôm nay": 3 slot (Sáng 04:00–05:30 Input, Tối 20:00–22:00 Output, Cuối tuần). Mỗi task là `TaskRow`: nút tick (toggle), link mở route.
6. `toggleTask(task)`: optimistic set todayMask, upsert `daily_progress` (user_id, date, minutes=sumMinutes, speaking_minutes=mask, streak). Nếu vừa hoàn thành tất cả task applicable và chưa bonus → RPC `add_xp(user_id, 100)` + `envi:xp-refresh` event + confetti 4.2s.
7. `applicableMaskForDate()`: cuối tuần (CN/T7) = WEEKEND_MASK (cả 9 task), ngày thường = WEEKDAY_MASK (7 task, không bao gồm weekendReview/weekendReading).
8. 90 dots: done (xanh), current (viền xanh), chưa (muted).
9. Chỉnh phút/ngày: input 30–480, lưu vào `profiles.minutes_per_day`.

**Điểm đã tối ưu**:
- Optimistic UI (tick ngay, đồng bộ server sau).
- Confetti khi hoàn thành ngày.
- Bitmask mask lưu dưới dạng số nguyên trong `speaking_minutes` cột (dùng làm bitmask task).

**GAP**:
- `speaking_minutes` cột được dùng làm bitmask task (cả số phút lẫn bitmask) — có thể gây nhầm lẫn.
- Task completion không kiểm tra thực sự người dùng đã làm hoạt động đó (chỉ tick thủ công).
- `daily_progress.words_reviewed` luôn 0 trong roadmap.

### 2.12 Đánh giá năng lực (Assessment)

**Route**: `/assessment` (`app/(main)/assessment/page.tsx`).

**Chức năng cốt lõi**: Đánh giá 4 kỹ năng (listening, reading, speaking, writing) theo 4 mốc (baseline/Ngày1, day30, day60, day90), rubric sao 1-5, lưu localStorage.

**Chi tiết hoạt động**:
1. `AssessmentPage`: select milestone, render `AssessmentForm`.
2. `AssessmentForm`: `buildAssessment(milestone)` từ `lib/assessment.ts` → listening (5 câu từ dictation transcripts), reading (5 câu từ reading passages).
3. 5 bước: listening (chọn đáp án), reading (chọn đáp án), speaking (tự đánh giá 5 tiêu chí 1-5 sao + ghi chú), writing (viết bài + tự đánh giá 4 tiêu chí + ghi chú), result.
4. `scoreAssessment()`: tính listeningScore/readingScore (đúng/sai), speakingTotal (5 tiêu chí × 5), writingTotal (4 tiêu chí × 5). `totalPercent` = trung bình 4 skill percent. `estimatedLevel`: >=90 C1, >=75 B2, >=60 B1, >=40 A2, khác A1.
5. `saveAssessment(result)` → `localStorage` key `envi_assessment_${milestone}`. `loadAssessment()` đọc lại.
6. Rubric: SPEAKING_CRITERIA (pronunciation, fluency, interaction, paraphrase, confidence), WRITING_CRITERIA (content, organization, clarity, language).

**Điểm đã tối ưu**:
- Đề tương đương cho 4 mốc (cùng rubric, khác level bài đọc/nghe).
- Lưu localStorage (không gửi server, không cần đăng nhập).

**GAP**:
- Speaking/writing trong assessment là tự đánh giá (không có AI).
- Không lưu kết quả assessment vào Supabase (chỉ localStorage).

### 2.13 Sổ tay lỗi (Error Log)

**Route**: `/error-log` (`app/(main)/error-log/page.tsx`).

**Chức năng cốt lõi**: Xem lỗi từ Writing (feedback_json.errors), Speaking (feedback_json.errors), Reflex. Đánh dấu "Đã ôn" / "Bỏ nhận xét AI". Liên kết đến Makeup Lesson.

**Chi tiết hoạt động**:
1. Client `useEffect` gọi `GET /api/error-log`.
2. API (`app/api/error-log/route.ts`): xác thực user. Query `writing_drafts` (not feedback_json is null) → trích `feedback_json.errors[]` → tạo ErrorEntry (source: "Writing", category: "Ngữ pháp"). Query `speaking_turns` (not feedback_json is null) → trích errors[] → ErrorEntry (source: "Speaking", category: "Phát âm"). Sort theo date descending. Trả `{errors}`.
3. Client hiển thị danh sách lỗi (original ❌, correction ✅, reason, status pending/reviewed/dismissed). Nút "Đánh dấu đã ôn" → `POST /api/error-log/review` (best-effort, trả ok=true, không có bảng DB riêng). Nút "Bỏ" → `POST /api/error-log/dismiss` (best-effort).
4. Nút "Xem bài bù hôm qua" → `/makeup-lesson`.

**Điểm đã tối ưu**:
- Đọc lỗi thật từ DB (writing_drafts, speaking_turns), không hardcode.
- Best-effort POST (không crash nếu API lỗi).

**GAP**:
- Không có bảng DB riêng cho error log status (pending/reviewed/dismissed chỉ ở client state, reset khi reload).
- Reflex lỗi chưa được đưa vào error_log (chỉ Writing + Speaking).
- `id` lỗi được sinh từ `w-${draft.id}-${err.error.slice(0,20)}` — có thể trùng nếu lỗi giống nhau.

### 2.14 Bài bù (Makeup Lesson)

**Route**: `/makeup-lesson` (`app/(main)/makeup-lesson/page.tsx`).

**Chức năng cốt lõi**: Bài bù từ lỗi lặp (Present Simple số ít thứ ba), 3 câu nói + 1 đoạn đọc, nút hoàn thành (+20 XP).

**Chi tiết hoạt động**:
1. Client state `completed`, `xpAwarded`. Click "Đánh dấu bài bù đã hoàn thành" → `handleComplete()`: set completed=true, gọi `POST /api/makeup-lesson/complete` (route directory rỗng → có thể 404 hoặc không xử lý), nếu res.ok → setXpAwarded(true).
2. Hiển thị bài bù (cách dùng He/She/It + Verb-s, đoạn đọc về Maria).

**GAP**:
- Thư mục `app/api/makeup-lesson/` **rỗng** (không có route.ts) → POST `/api/makeup-lesson/complete` sẽ trả 404 (Next.js không tìm thấy route handler). Đây là lỗi function.
- Nội dung bài bù hardcode, không sinh từ Error Log thật.
- Chỉ +20 XP hardcode, không qua RPC.

### 2.15 Kiểm tra tiến độ (Progress Test)

**Route**: `/progress-test` (`app/(main)/progress-test/page.tsx`).

**Chức năng cốt lõi**: 20 câu (10 từ vựng + 5 ngữ pháp + 5 nghe), nộp bài, xem điểm, lưu lịch sử vào `progress_tests`, +score*5 XP.

**Chi tiết hoạt động**:
1. `ProgressTestPage`: `buildVocabQuestions()` (10 câu từ VOCAB_WORDS hardcode trong file), `buildGrammarQuestions()` (5 câu từ GRAMMAR_EXERCISES), `buildListeningQuestions()` (5 câu từ DICTATION_LESSONS). Tổng 20 câu. Shuffle.
2. `ProgressTest` component: hiển thị các câu (mcq hoặc fill). Chọn đáp án → progress bar. Nút "Nộp bài" → `submit()`: tính correctCount, gọi `saveProgressTest({score, total, details})` (Server Action `app/actions/progress-test.ts`): insert `progress_tests` (user_id, score, total, level=null, details jsonb), xpEarned = score*5, RPC add_xp. `envi:xp-refresh` event. Hiển thị kết quả correctCount/total + percent + danh sách đáp án.

**Điểm đã tối ưu**:
- Lưu kết quả thật vào Supabase (lịch sử test).
- XpEarned = score × 5.

**GAP**:
- 10 câu vocab từ VOCAB_WORDS hardcode (20 từ trong file page), không từ bảng words thực.
- `level` luôn null khi lưu progress_tests.
- Không có giới hạn nộp lại (có thể nộp nhiều lần, mỗi lần là 1 record).

### 2.16 Trợ lý AI (Assistant)

**Route**: `/assistant` (`app/(main)/assistant/page.tsx`) + `FloatingChat` (widget tròn, ẩn trên `/assistant`).

**Chức năng cốt lõi**: Chat AI dựa trên `getUserLearningSnapshot()`, quick actions ("Hôm nay tôi nên học gì?", "Tôi đang yếu phần nào?", "Gợi ý chủ đề Speaking cho tôi"), lưu lịch sử localStorage.

**Chi tiết hoạt động**:
1. `AssistantPage` gọi `getUserLearningSnapshot()` (Server Action `app/actions/learning-snapshot.ts`) → snapshot. Render `AssistantChat`.
2. `AssistantChat`: local state messages (GREETING + history), `loadChatHistory()`/`saveChatHistory()` (localStorage `envi:chat:history`, MAX 100). Gửi POST `/api/assistant` với `{messages}`. Hiển thị phản hồi.
3. API `/api/assistant` (`app/api/assistant/route.ts`): xác thực user, gọi `getUserLearningSnapshot()`, xây systemPrompt dài (bao gồm snapshot.summaryText + quy tắc trả lời cho 3 loại câu hỏi), thử Ollama→Groq→Gemini (Gemini có responseSchema {reply}), trả `{reply}`. Insert `ai_usage_log` (feature: "assistant").
4. `FloatingChat`: widget tròn góc phải dưới, mở ra chat thu nhỏ, lấy snapshot khi mở, ẩn khi pathname === "/assistant".

**Điểm đã tối ưu**:
- Lịch sử chat lưu localStorage (mất mạng vẫn xem được).
- Snapshot đưa vào systemPrompt để AI biết tiến độ thực tế.
- 3 quick actions cố định.

**GAP**:
- `getUserLearningSnapshot()` query tất cả `phrase_reviews.reps, lapses` không phân trang (có thể chậm khi dữ liệu nhiều).
- Assistant không có voice (chỉ text).

### 2.17 Cài đặt (Settings)

**Route**: `/settings` (`app/(main)/settings/page.tsx`).

**Chức năng cốt lõi**: Hồ sơ (goal, minutes_per_day, voice, tts_rate), xuất dữ liệu JSON (16 bảng), xoá tài khoản.

**Chi tiết hoạt động**:
1. `SettingsForm`: load `profiles` từ Supabase (browser client). Input goal, minutes (30–300), voice (Edge TTS), rate (0.8/1.0/1.2). Nút Lưu → upsert `profiles`.
2. Xuất dữ liệu: lặp EXPORT_TABLES (16 bảng: profiles, decks, deck_words, card_reviews, phrase_reviews, speaking_sessions, speaking_turns, recordings, dictation_attempts, daily_progress, progress_tests, study_plan_progress, writing_drafts), query `select("*")`, gom vào JSON, tải file `envi-export-YYYY-MM-DD.json`.
3. Xoá tài khoản: `window.confirm`, gọi RPC `delete_my_account()` (xoá tất cả dữ liệu user + auth.users), sau đó signOut + redirect `/`.

**Điểm đã tối ưu**:
- Xuất toàn bộ dữ liệu người dùng (GDPR-like).
- Xoá tài khoản sạch sẽ qua `delete_my_account()` RPC.

**GAP**:
- Không có đổi mật khẩu, không có kết nối tài khoản Google sau khi đăng ký email.

### 2.18 Tìm kiếm (Search)

**Route**: `/search` (`app/(main)/search/page.tsx`) + `GlobalSearch` (Ctrl+K) + `SearchShortcut`.

**Chức năng cốt lõi**: Tìm từ vựng (lemma/meaning_vi), trang ứng dụng, bài đọc. Ctrl+K mở dialog.

**Chi tiết hoạt động**:
1. `SearchPage`: input query, `useEffect` debounce gọi `GET /api/search?q=...&limit=20`. Hiển thị kết quả (word, ipa, pos, meaningVi, level, audioUrl). Click từ → `/vocab?word=id`.
2. API `GET /api/search`: xác thực (không bắt buộc user), query `words` với `.or(`lemma.ilike.${like},meaning_vi.ilike.${like}`)`, order frequency_rank asc, limit 50.
3. `GlobalSearch`: dialog, Ctrl+K toggle, tìm trong PAGES (13 trang), READING_PASSAGES, và words từ Supabase. Giới hạn 10 kết quả.
4. `SearchShortcut`: lắng nghe Ctrl+K trên toàn trang, redirect `/search`.

**Điểm đã tối ưu**:
- Debounce 300ms, ignore database errors (tránh crash nếu Supabase lỗi).
- Tìm cả trang, bài đọc, từ vựng trong 1 dialog.

**GAP**:
- Tìm từ vựng dùng `ilike` (không full-text search).
- Không tìm trong speaking topics hay writing prompts.

### 2.19 Self-talk (Nói tự do)

**Route**: `/self-talk` (`app/(main)/self-talk/page.tsx`).

**Chức năng cốt lõi**: 5 đề nói (IT/BA context), ghi âm 5 phút (MediaRecorder), ghi chú, không lưu server.

**Chi tiết hoạt động**:
1. `SELF_TALK_PROMPTS` (5 câu về workday, project, remote work, migration, career goals).
2. Timer 5 phút (300s), nút Bắt đầu/Dừng ghi âm (MediaRecorder), audioBlob lưu client-side (URL.createObjectURL, chỉ log console).
3. Khi sessionComplete → hiển thị textarea ghi chú. Nút "Lưu ghi chú" chỉ xóa text (chưa lưu thật).
4. Cleanup effect: dừng timer và media tracks khi unmount.

**GAP**:
- Không lưu ghi âm vào server (chỉ blob URL tạm).
- Không có AI đánh giá self-talk.
- Ghi chú không được lưu (nút Lưu chỉ xóa text).

### 2.20 Dịch & Nói (TranslateSpeak)

**Route**: Render trong `/speaking` page (`components/translate-speak/index.tsx`).

**Chức năng cốt lõi**: Nhập tiếng Việt → dịch sang tiếng Anh (Ollama→Groq→Gemini qua `/api/translate`) → phát âm (Web Speech API).

**Chi tiết hoạt động**:
1. Input viText, nút "Dịch & Nói" → POST `/api/translate` với `{text}`. API: xác thực user, thử Ollama→Groq→Gemini, trả `{translation}`. Client set enText, gọi `speakEnglish(translation)`.
2. Nút "Nghe lại" phát lại enText.

**Điểm đã tối ưu**:
- Fallback 3 provider cho dịch thuật.
- Lỗi 429/rate limit hiển thị message riêng.

**GAP**:
- Không lưu lịch sử dịch.

### 2.21 Gamification (XP, Streak, Level)

**File**: `components/gamification/xp-bar.tsx`, `components/gamification/rate-limit-check.tsx`, db migration `0003_gamification.sql`.

**Chi tiết hoạt động**:
- `XpBar`: query `profiles.xp, level` + `daily_progress.streak`. Progress = (xp % 1000) / 10 (1000 XP = 1 level). Level names: Beginner, Novice, Apprentice, Intermediate, Advanced, Expert, Master, Legend.
- `add_xp()` RPC: `xp = xp + xp_amount`, `level = calculate_level(xp + xp_amount)` (floor(xp/1000)+1). Trigger `update_level_trigger` tự cập nhật level khi xp thay đổi.
- XP sources: vocab good/easy (+10), phrase good/easy (+15), speaking session complete (+50), writing complete (+30), dictation correct (+20), progress test (score×5), roadmap complete day (+100).
- `rate-limit-check.tsx`: component rỗng (rate limiting được xử lý server-side HTTP 429).

**Điểm đã tối ưu**:
- RPC `add_xp` atomic (UPDATE + level recalculation).
- `envi:xp-refresh` event để XpBar reload khi có XP mới.

**GAP**:
- Không có leaderboard, không huy hiệu (badge).
- `rate-limit-check` không làm gì.

---

## 3. TRẠNG THÁI HIỆN TẠI: ĐÃ LÀM ĐƯỢC GÌ & CÒN GÌ?

### 3.1 Đã hoàn thiện 100% (chạy mượt, kết nối DB thật)

| # | Tính năng | Bằng chứng |
|---|-----------|------------|
| 1 | Đăng nhập email/mật khẩu + Google OAuth | `app/login/page.tsx`, `app/auth/callback/route.ts`, build OK |
| 2 | Middleware bảo vệ route | `lib/supabase/middleware.ts` |
| 3 | Dashboard (stats, weekly report, study plan) | `app/(main)/dashboard/page.tsx`, `lib/dashboard.ts`, `app/actions/study-plan.ts` |
| 4 | Vocab flashcard SM-2 (100 thẻ, 100 mới/ngày) | `lib/vocab.ts`, `lib/srs.ts`, `app/actions/srs.ts`, `components/vocab/` |
| 5 | Reflex phrase SM-2 (20 câu, 20 mới/ngày) | `lib/phrases.ts`, `app/actions/phrase-review.ts`, `components/reflex/` |
| 6 | Speaking 5 bước + fallback AI (Ollama→Groq→Gemini) | `app/api/ai/speaking/route.ts`, `lib/speaking-prompt.ts`, `components/speaking/speaking-session.tsx` |
| 7 | STT qua Groq Whisper | `lib/ai/whisper.ts`, `app/api/stt/route.ts` |
| 8 | Writing draft + AI feedback + compare + complete | `app/actions/writing.ts`, `app/api/writing/feedback/route.ts`, `components/writing/` |
| 9 | Reading 50 bài + trắc nghiệm + tóm tắt | `app/(main)/reading/page.tsx`, `lib/reading-data.ts` |
| 10 | Ngữ pháp 16 chủ điểm + practice | `components/grammar/grammar-content.tsx`, `lib/grammar-exercises-data.ts` |
| 11 | Dictation nghe gõ + diff | `components/dictation/dictation-game.tsx`, `app/actions/dictation.ts` |
| 12 | Shadowing YouTube + TTS | `components/shadowing/` |
| 13 | Lộ trình 90 ngày + tick task + streak | `data/daily-lessons.ts`, `components/roadmap/roadmap-content.tsx` |
| 14 | Assessment 4 kỹ năng 4 mốc | `lib/assessment.ts`, `components/assessment/assessment-form.tsx` |
| 15 | Error Log từ DB thật | `app/api/error-log/route.ts`, `app/(main)/error-log/page.tsx` |
| 16 | Progress Test 20 câu + lưu DB | `app/(main)/progress-test/page.tsx`, `app/actions/progress-test.ts` |
| 17 | Assistant AI + snapshot | `app/api/assistant/route.ts`, `app/actions/learning-snapshot.ts` |
| 18 | Cài đặt + xuất JSON + xoá tài khoản | `components/settings-form.tsx` |
| 19 | Tìm kiếm từ vựng + Ctrl+K | `app/api/search/route.ts`, `components/ui/global-search.tsx` |
| 20 | Translate & Speak | `app/api/translate/route.ts`, `components/translate-speak/` |
| 21 | Spell check | `app/api/spell-check/route.ts`, `components/ui/spell-check.tsx` |
| 22 | Gamification XP/Level/Streak | `db/migrations/0003_gamification.sql`, `components/gamification/xp-bar.tsx` |
| 23 | Học liệu: 5.029 từ duy nhất, 3.006 cụm, 1.590 reflex, 50 reading, 16 grammar/800 câu, 450 speaking, 19 writing | `scripts/audit-content.js` 9/9 PASS, `scripts/verify-90-days.ts` 90/90 PASS |
| 24 | Typecheck, Build, ESLint sạch | `tsc --noEmit`, `npm run build`, `eslint` 0 errors |
| 25 | Tests: speaking 5/5, writing 7/7, roadmap 3/3 | Playwright specs |
| 26 | Deploy Vercel production | `https://envi-deploy-one.vercel.app`, 7 env vars set |

### 3.2 Đang ở mức MVP (cần cải thiện)

| # | Tính năng | Vấn đề | File liên quan |
|---|-----------|--------|--------------|
| 1 | Makeup Lesson | API route directory rỗng (`app/api/makeup-lesson/` không có `route.ts`), POST sẽ 404. Nội dung hardcode. | `app/api/makeup-lesson/`, `app/(main)/makeup-lesson/page.tsx` |
| 2 | Speaking phát âm | Không có đánh giá âm thanh thật, chỉ STT chép text + `evaluateSpeech` so sánh văn bản. | `lib/speech-eval.ts`, `components/speaking/speaking-session.tsx` |
| 3 | Shadowing đánh giá | Mock evaluation (score 0, không so sánh âm thanh). | `components/shadowing/shadowing-player.tsx` |
| 4 | Self-talk | Không lưu ghi âm, không có AI đánh giá, ghi chú không lưu. | `app/(main)/self-talk/page.tsx` |
| 5 | Error Log status | Chỉ client-side local state, reset khi reload. Không có bảng DB riêng. | `app/(main)/error-log/page.tsx`, `app/api/error-log/route.ts` |
| 6 | Assessment speaking/writing | Tự đánh giá, không có AI, không lưu DB. | `lib/assessment.ts`, `components/assessment/assessment-form.tsx` |
| 7 | Reading tóm tắt | Chỉ localStorage, không gửi server. | `app/(main)/reading/page.tsx` |
| 8 | Roadmap tick | Không kiểm tra thực sự đã làm hoạt động (chỉ tick thủ công). `speaking_minutes` dùng làm bitmask. | `components/roadmap/roadmap-content.tsx` |
| 9 | PWA | `SWRegistration` đăng ký `/sw.js` nhưng có thể file sw.js chưa có. | `components/ui/sw-registration.tsx` |
| 10 | Ollama | Đang DOWN (port 11434). Groq là provider thực tế. | `lib/ai/ollama.ts`, `.env.local` |

### 3.3 Các lỗi / GAP (điểm mù)

| # | Vấn đề | Chi tiết | File liên quan |
|---|--------|----------|--------------|
| 1 | Makeup lesson API 404 | Thư mục `app/api/makeup-lesson/` rỗng, không có `route.ts`. POST `/api/makeup-lesson/complete` sẽ không được xử lý. | `app/api/makeup-lesson/` |
| 2 | Google OAuth chưa xác nhận production | `/login?error=auth` trên HTTPS chưa được user xác nhận. Cần bật Google Provider trong Supabase Dashboard. | `app/auth/callback/route.ts`, `app/login/page.tsx` |
| 3 | Script rác chưa xóa | `scripts/` có nhiều file debug/gen/count không dùng (debug-*.cjs, gen-phase10-*.mjs, hsk3-*, count-*.cjs, add-phrases3.js). | `scripts/` |
| 4 | Test artifacts chưa xóa | `tests/artifacts/` (untracked), `tests/qa-plan-flow.spec.ts` (untracked, mới). | `tests/` |
| 5 | Roadmap speaking_minutes bitmask | Cột `speaking_minutes` trong `daily_progress` được dùng làm bitmask task (cả số phút lẫn mask). | `components/roadmap/roadmap-content.tsx`, `db/migrations/0001_init.sql` |
| 6 | Error Log reflex thiếu | Chỉ Writing + Speaking, chưa có Reflex. | `app/api/error-log/route.ts` |
| 7 | Total words luôn 0 | `getDashboardData()` không query `words` count. | `lib/dashboard.ts` |
| 8 | Ollama DOWN | Port 11434 không phản hồi, Groq là provider thực tế, có thể hết free tier. | `lib/ai/ollama.ts`, `.env.local` |
| 9 | Ngữ pháp hardcode | 16 chủ điểm B1_B2_TOPICS hardcode trong component, không từ DB. | `components/grammar/grammar-content.tsx` |
| 10 | Không có dark mode toggle | Chỉ có dark CSS class, không có toggle UI. | `globals.css` |
| 11 | Không có Facebook/Apple login | Chỉ Google + email. | `app/login/page.tsx` |
| 12 | C1/C2 chưa xây dựng | Chỉ tập trung A2-B2. | `data/daily-lessons.ts` (chỉ đến B2) |

---

## 4. ĐỊNH NGHĨA "HOÀN THIỆN 100% CHO A2-B2"

Nếu dự án đạt 100% (sẵn sàng cho user cày 90 ngày), nó phải trông như sau:

1. **Không còn lỗi màn hình trắng**: Tất cả 14 trang học trong `(main)` load được, có nội dung > 50 ký tự, không có `pageerror` runtime (theo `tests/daily-journey.spec.ts`).
2. **Google OAuth chạy thật trên HTTPS**: `/login` → chọn Gmail → `/auth/callback` → `exchangeCodeForSession` thành công → redirect `/dashboard` → session giữ sau reload → mở Ngày 1 lesson. Tài khoản QA `qa.test.a@gmail.com` / `TestPass123!` hoạt động.
3. **AI Speaking chạy 6 bước không lỗi**: Hỏi → Trả lời (STT) → Góp ý → Nói lại → Sang câu → Tổng kết. Có ít nhất 1 provider AI hoạt động (Groq/Gemini) khi Ollama down. Rate-limit 429 hiển thị countdown + fallback tự luyện.
4. **Sổ tay lỗi lưu data thật**: Error Log đọc từ `writing_drafts` + `speaking_turns` + (bổ sung) `phrase_reviews`. Status pending/reviewed/dismissed lưu vào DB (không chỉ localStorage).
5. **PWA hoạt động**: `/sw.js` tồn tại, `SWRegistration` đăng ký thành công, app có thể cài trên điện thoại.
6. **Học liệu đạt spec**: 5.029+ từ duy nhất, 3.000+ cụm, 1.354+ reflex, 50+ reading, 16 chủ điểm/800 câu ngữ pháp, 450+ speaking prompts, 15+ writing prompts (đã đạt qua `scripts/audit-content.js` 9/9).
7. **90/90 ngày verify**: `scripts/verify-90-days.ts` trả 90/90 PASS. Mỗi ngày có mục tiêu, tasks, output (speaking/writing), route hợp lệ.
8. **Makeup Lesson hoàn chỉnh**: API route `/api/makeup-lesson/complete` tồn tại, nút hoàn thành lưu/cộng XP đúng 1 lần, nội dung sinh từ Error Log thật.
9. **Typecheck, Build, ESLint sạch**: `tsc --noEmit`, `npm run build`, `eslint src` không lỗi.
10. **Playwright suite xanh**: `tests/speaking.spec.ts`, `tests/writing.spec.ts`, `tests/roadmap.spec.ts`, `tests/daily-journey.spec.ts` toàn bộ PASS trên Chromium thật.
11. **Local launch hoạt động**: `start-envi.ps1` khởi động `npm run start` (build mode), mở Brave Default vào `http://localhost:3000/login`, giữ phiên Supabase.

**Các bước cuối cùng để đạt trạng thái đó**:
1. Tạo `app/api/makeup-lesson/route.ts` (POST complete, verify user, update `study_plan_progress` hoặc bảng makeup, RPC add_xp 20, tránh double XP).
2. Xác nhận Google OAuth production (user chọn Gmail trên `https://envi-deploy-one.vercel.app/login`, vào Dashboard, reload giữ phiên, mở Ngày 1).
3. Tạo bảng `error_log_entries` (hoặc dùng bảng hiện có) để lưu status pending/reviewed/dismissed persistent. Bổ sung Reflex lỗi vào Error Log API.
4. Tạo `/sw.js` service worker cho PWA (hoặc xác nhận file đã có).
5. Chạy lại toàn bộ Playwright suite + 4 hành trình nghiệm thu (theo `HANDOFF.md` mục 4) để xác nhận hồi quy.
6. Xóa script rác và test artifacts không dùng.
7. Bổ sung ngày 91–180 vào verification (hiện `verify-90-days.ts` chỉ kiểm tra 1–90).

---

## 5. HƯỚNG DẪN BÀN GIAO CHO AI/DEV TIẾP THEO

### 5.1 System Prompt (copy/paste cho AI mới)

Bạn là một Principal Software Engineer tiếp nối dự án **EnVi** — website học tiếng Anh cho người Việt (A2→B2, 90 ngày), đối tượng người dùng IT/BA. Tech stack: Next.js 16.4.6 (App Router), React 19.3.0, Tailwind 4.3.3, Supabase (Postgres + Auth + RLS), Ollama/Groq/Gemini (AI), Web Speech API (TTS), `@open-spaced-repetition/sm-2` (SRS), Playwright (E2E), Vitest.

**Thư mục gốc**: `C:\Users\LENOVO\Desktop\EnVi`

**Biến môi trường** (`.env.local`, không commit):
```
NEXT_PUBLIC_SUPABASE_URL=https://ricthhogtmgxoyjstfkz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<NEXT_PUBLIC_SUPABASE_ANON_KEY>
SUPABASE_SERVICE_ROLE_KEY=<SUPABASE_SERVICE_ROLE_KEY>
GEMINI_API_KEY=...
GROQ_API_KEY=...
OLLAMA_BASE_URL=http://localhost:11434   # ĐANG DOWN, Groq là provider thực tế
OLLAMA_MODEL=qwen3:1.7b
```

**Lệnh quan trọng**:
- `npx tsc --noEmit` (typecheck)
- `npm run build` (build)
- `npx eslint src` (lint)
- `npx tsx scripts/verify-90-days.ts` (verify 90/90 ngày)
- `node scripts/audit-content.js` (audit học liệu 9/9)
- `npx playwright test --project=chromium` (toàn bộ E2E)
- `npm run dev` (chạy dev cổng 3000)
- `npm run start` (chạy build mode)

**QA Credentials**: `qa.test.a@gmail.com` / `TestPass123!` tại `/login`.

**Các quy tắc bắt buộc khi code**:
1. **KHÔNG được commit, push, deploy** trừ khi người dùng yêu cầu rõ ràng.
2. **KHÔNG được mua API, bật billing, mở rộng C2, reset Supabase, xóa dữ liệu học hiện có.**
3. Mọi hàm gọi Supabase ở server phải dùng `createClient()` từ `@/lib/supabase/server` (server-only), ở client dùng `@/lib/supabase/client`.
4. Mọi AI call phải có fallback: Ollama → Groq → Gemini, với exponential backoff và try/catch.
5. Không log API key, code OAuth, token vào console.
6. RLS bật trên mọi bảng user data; policy luôn `user_id = auth.uid()`.
7. Múi giờ luôn Asia/Ho_Chi_Minh (dùng `lib/date-vn.ts`).
8. Không thêm comment vào code (theo quy định dự án).
9. LocalStorage keys tuân theo prefix: `envi:writing:`, `envi:reading:summary:`, `envi:chat:history`, `envi:dictation:seen`, `envi_assessment_*`.
10. Sự kiện XP: `window.dispatchEvent(new Event("envi:xp-refresh"))`.

**Cấu trúc DB quan trọng (18 bảng)**:
`words`, `card_reviews`, `phrases`, `phrase_reviews`, `speaking_sessions`, `speaking_turns`, `writing_drafts`, `daily_progress`, `progress_tests`, `study_plan_progress`, `profiles`, `dictation_attempts`, `ai_usage_log`, `recordings`, `decks`, `deck_words`, `topics`, `dictation_items`, `grammar_lessons`, `grammar_exercises`.

**Các file kết quả quan trọng**:
- `HANDOFF.md`: tài liệu bàn giao cũ (cập nhật URL Vercel).
- `PROJECT_MANIFEST.md`: file này (deep audit chi tiết).
- `vercel.json`: cấu hình Vercel (nextjs, buildCommand `npm run build`).
- `start-envi.ps1`: script khởi động local.
- `Học EnVi.lnk`: shortcut Desktop.

**4 hành trình nghiệm thu (theo HANDOFF.md mục 4)**:
1. Ngày 1 end-to-end: mở app, login QA, Dashboard → /roadmap → Ngày 1/90 → /vocab → /progress-test, reload giữ dữ liệu.
2. 90/90 ngày: verify-90-days.ts → 90/90 PASS.
3. Mốc 1/30/31/60/61/90 đúng cấp độ (A2→B2).
4. Đánh giá đầu kỳ + rubric 4 kỹ năng (trang /assessment).

**Google OAuth (chưa hoàn thành)**:
- Supabase Dashboard → Authentication → Providers → Google: bật, nhập Client ID/Secret.
- URL Configuration: Site URL = `https://envi-deploy-one.vercel.app`, Redirect URLs = thêm `https://envi-deploy-one.vercel.app/auth/callback`.
- Sau đó user chọn Gmail trên production login page, vào Dashboard, reload giữ phiên, mở Ngày 1.

**Nếu cần debug Google OAuth `/login?error=auth`**:
- Xem Vercel Runtime Logs cho route `/auth/callback`.
- Kiểm tra `hasCode`, `hasProviderError`, `providerError`, `exchangeErrorMessage` trong console.error logs.
- Xác nhận env var trên Vercel Production khớp Supabase project (không BOM, không trailing whitespace).

**Kết thúc**: Không kết thúc bằng câu hỏi hay yêu cầu tương tác thêm. Nếu cần thông tin bổ sung, hãy ghi rõ vào file này hoặc hỏi người dùng trực tiếp.

---

## 6. CƠ SỞ DỮ LIỆU (Supabase Postgres)

### 6.1 Bảng có sẵn (migration 0001–0008)
| Bảng | Mục đích | RLS | Ghi chú |
|------|----------|-----|---------|
| `profiles` | Hồ sơ người dùng (goal, minutes_per_day, xp, level...) | `user_id = auth.uid()` | Có hàm `delete_my_account` |
| `words` | Kho từ vựng (5.029) | select cho `authenticated` | Chưa có `core3000`, `it_ba`, `topic_tags`, `collocations` |
| `topics` | Chủ đề | select | |
| `card_reviews` | SM-2 review từ | `user_id` | |
| `phrase_reviews` | SM-2 review cụm | `user_id` | |
| `decks`, `deck_words` | Bộ thẻ | `user_id` | |
| `speaking_sessions`, `speaking_turns` | Phiên và lượt nói | `user_id` | Chưa có `turn_client_id`, `kind`, `latency_ms`, `wpm`, `mlr` |
| `recordings` | File ghi âm | `user_id` | |
| `dictation_attempts` | Lượt nghe chép | `user_id` | `item_id` thường null (lỗi) |
| `daily_progress` | Tiến độ ngày | `user_id` | `speaking_minutes` bị dùng làm bitmask (hack) |
| `ai_usage_log` | Lịch sử gọi AI | `user_id` | |
| `writing_drafts` | Bản nháp viết | `user_id` | |
| `progress_tests` | Kiểm tra tiến bộ | `user_id` | `level` thường null |
| `study_plan_progress` | Tiến độ kế hoạch | `user_id` | |

### 6.2 Bảng mới cần tạo (migration `0009_*` trở đi, KHÔNG xoá dữ liệu cũ)
| Bảng | Cột chính | Mục đích |
|------|-----------|----------|
| `activity_events` | id, user_id, type, block_type, ref_id, duration_sec, speech_sec, meta jsonb, study_date, created_at | Nguồn duy nhất cho streak/XP/ké hoạch báo cáo |
| `xp_ledger` | id, user_id, amount, reason, ref_id, created_at | Phần thưởng XP (idempotent via unique) |
| `streaks` | user_id, current, longest, last_study_date, freezes_used_month | Streak theo quy tắc 03:00 VN |
| `daily_plans` | user_id, study_date, budget, blocks jsonb, completed_at | Kế hoạch "Hôm nay" (một lần/ngày) |
| `daily_summary` | user_id, study_date, minutes, speech_minutes, xp | Thay `daily_progress` bitmask |
| `error_events` | id, user_id, source, source_ref, type, pattern_key, original, correction, explanation_vi, severity, created_at | Mỗi lỗi mắc phải |
| `error_patterns` | user_id, pattern_key, count, first_seen, last_seen, status, mastery_streak, next_check_at, examples | Gộp lỗi theo pattern (trigger từ error_events) |
| `pattern_catalog` | pattern_key, title_vi, explanation_vi, rule, examples, grammar_topic_id, pronunciation_focus_id, drills | Kho mẫu lỗi người Việt (~60) |
| `makeup_lessons` | id, user_id, pattern_key, status, content jsonb, progress jsonb, score, created_at, completed_at | Bài bù sinh từ câu sai user |
| `user_chunks`, `chunk_reviews` | text_en, meaning_vi, example_en, source... + SM-2 | Cụm từ từ buổi nói |
| `phrase_attempts` | id, user_id, phrase_id, tier, transcript, score, result, latency_ms, audio_path, created_at | Lượt Reflex |
| `mission_attempts` | id, user_id, mission_id, session_id, objectives_done, success, difficulty, created_at | Roleplay Mission |
| `fluency_drills` | id, user_id, kind, prompt_id, rounds jsonb, created_at | 4/3/2, 1-min talk... |
| `shadowing_attempts` | id, user_id, item_id, segment_idx, transcript, accuracy, timing, score, audio_path, created_at | Lượt shadowing |
| `pronunciation_attempts`, `pronunciation_progress` | focus_id, item_type, target_text, transcript, word_results, score, audio_path | Phát âm |
| `reading_attempts` | id, user_id, passage_id, quiz_score, summary_text, summary_audio_path, summary_feedback, lookups, created_at | Đọc hiểu |
| `grammar_attempts`, `grammar_mastery` | user_id, topic_id, question_id, correct, mastery | Ngữ pháp |
| `checkpoints` | id, user_id, kind, scores jsonb, cefr_estimate, fluency jsonb, recordings jsonb, created_at | Checkpoint 0/30/60/90 |
| `real_world_logs` | id, user_id, task_id, done_at, feeling, stuck_points, created_at | Cầu nối đời thật |
| `assistant_messages` | id, user_id, role, content, created_at | Lịch sự trợ lý |
| `client_errors` | id, user_id, message, url, created_at | Lỗi client báo về server |

### 6.3 Hàm/RPC
- `log_activity(...)`, `award_xp(reason, ref_id, amount)` — chưa có, cần viết.
- Trigger `error_events → error_patterns`, `activity_events → daily_summary → streaks` — chưa có.
- `delete_my_account()` — cần cập nhật xoá thêm mọi bảng mới + Storage.

---

## 7. API KIỂU (method, input, output, auth)

| Route | Method | Input | Output | Auth |
|-------|--------|-------|--------|------|
| `/auth/callback` | GET | `code`, `error`, `next` | redirect `/dashboard` hoặc `/login?error=auth` | không (public) |
| `/api/ai/speaking` | POST | audio + sessionId | feedback JSON | Supabase session |
| `/api/stt` | POST | multipart audio | `{text, words[], duration_ms}` | Supabase session |
| `/api/writing/feedback` | POST | draft_text | feedback JSON | Supabase session |
| `/api/assistant` | POST | message | reply | Supabase session |
| `/api/search` | GET | q | kết quả tìm kiếm | Supabase session |
| `/api/spell-check` | POST | text | lỗi chính tả | Supabase session |
| `/api/translate` | POST | text | bản dịch | Supabase session |
| `/api/error-log` | GET | — | danh sách lỗi | Supabase session |
| `/api/makeup-lesson/` | (trống) | — | **404** | — |
| `app/actions/*.ts` | Server Action | tùy module | Result<T> | Supabase session |

---

## 8. GAP SO VỚI MASTER_SPEC v2.0

| # | Yêu cầu (MASTER_SPEC) | Hiện trạng code | Đạt / Một phần / Chưa đạt | File liên quan |
|---|----------------------|-----------------|--------------------------|----------------|
| G1 | AI Router duy nhất (circuit breaker, budget, `AI_FORCE_FAIL`) | Gọi trực tiếp groq/gemini/ollama | ❌ Chưa đạt | `lib/ai/*` |
| G2 | Speaking Coach 6 bước (ASK→ANSWER→FEEDBACK→RETRY-BLIND→NEXT→SUMMARY) | State machine 5 bước | ⚠️ Một phần | `lib/speaking-prompt.ts`, `components/speaking/speaking-session.tsx` |
| G3 | Nói lại KHÔNG NHÌN MẪU (ẩn mẫu) | Hiện `corrected_sentence`, đọc to mẫu | ❌ Chưa đạt | `components/speaking/speaking-session.tsx` |
| G4 | Offline Fallback (Coach/Mission/Reflex/Drill) | Fallback chỉ hiện câu hỏi + ghi âm | ❌ Chưa đạt | `components/speaking/`, `lib/speaking-prompt.ts` |
| G5 | Reflex Prompt Ladder L1/L2/L3 + chấm theo nghĩa | Chấm khớp chữ ≥75%, 20 câu/ngày cứng | ⚠️ Một phần | `lib/phrases.ts`, `components/reflex/reflex-session.tsx` |
| G6 | Từ vựng: Triage Đã biết/Chưa biết, không giới hạn, Speak-it, Chunk SRS | `DAILY_NEW_LIMIT=100`, `SESSION_SIZE=100`, không Triage | ❌ Chưa đạt | `lib/vocab.ts`, `components/vocab/*` |
| G7 | Error Log: `error_events` + `error_patterns` + trigger + trạng thái DB | Đọc trực tiếp `feedback_json`, trạng thái chỉ client | ❌ Chưa đạt | `components/grammar/grammar-content.tsx`, `app/api/error-log/route.ts` |
| G8 | Bài bù sinh từ câu sai user (5 bước), idempotent, mastery 1-3-7 ngày | Hardcode 1 bài, API 404 | ❌ Chưa đạt | `app/api/makeup-lesson/`, `app/(main)/makeup-lesson/page.tsx` |
| G9 | Hôm nay: 1 kế hoạch co giãn, ≥50% nói, tự đánh dấu qua `activity_events`, không tick tay | 2 hệ thống kế hoạch (Dashboard + Roadmap), tick tay | ❌ Chưa đạt | `app/(main)/dashboard/*`, `components/roadmap/roadmap-content.tsx` |
| G10 | Checkpoint 0/30/60/90 lưu DB, Trước–Sau, bỏ localStorage assessment | Assessment lưu localStorage | ❌ Chưa đạt | `lib/assessment.ts`, `app/(main)/assessment/page.tsx` |
| G11 | Fluency Engine (latency, WPM, MLR, pause) có unit test | Không có | ❌ Chưa đạt | — |
| G12 | Ngữ pháp 16 chủ điểm/800 câu, mỗi câu có `explanation_vi`, ≥20% dạng nói, lưu DB | 800 câu hardcode, chỉ 6 lỗi chung, không lưu tiến độ DB | ⚠️ Một phần | `data/grammar-exercises.json`, `components/grammar/grammar-content.tsx` |
| G13 | Shadowing YouTube IFrame API thật + chấm STT, bỏ mock | YouTube ID placeholder, chấm mock score 0 | ❌ Chưa đạt | `components/shadowing/shadowing-player.tsx` |
| G14 | Dictation nút xem đáp án (xem trước nộp = 0 điểm), chấm theo từ | Không có nút xem đáp án, `item_id` null | ❌ Chưa đạt | `components/dictation/dictation-game.tsx` |
| G15 | Reading click-tra-từ + AI chấm tóm tắt, lưu DB | Không click-tra, tóm tắt localStorage | ❌ Chưa đạt | `components/reading/reading-practice.tsx` |
| G16 | Phát âm 12 trọng tâm, chấm intelligibility Whisper | Không có | ❌ Chưa đạt | — |
| G17 | `loading.tsx` + `error.tsx` mọi route | Chỉ một số route có `loading.tsx`, ít `error.tsx` | ⚠️ Một phần | `app/(main)/*/loading.tsx`, `app/(main)/error.tsx` |
| G18 | `content/` với schema zod, validate build | Dữ liệu trong `data/` không schema, không validate | ❌ Chưa đạt | `data/*` |
| G19 | Múi giờ 03:00 VN, ngày học | `date-vn.ts` có, nhưng chưa áp 03:00 trong streak | ⚠️ Một phần | `lib/date-vn.ts` |
| G20 | `docs/MASTER_SPEC.md` tồn tại | Không có | ❌ Chưa đạt | — |
| S1 | Secret không ghi giá trị thật vào tài liệu | `PROJECT_MANIFEST.md` đã có secret (đã redact) | ⚠️ Đang xử lý | `PROJECT_MANIFEST.md` |

---

## 9. SAI KHÁC GIỮA MASTER_SPEC VÀ CODE THỰC TẾ

1. **Route mặc định sau login:** spec v2 muốn `/today`, code hiện tại redirect `/dashboard`.
2. **Speaking state machine:** spec v2 = 6 bước, code = 5 bước (`SpeakingStep 1..5`).
3. **Hằng số từ mới:** spec v2 muốn không giới hạn / người dùng chọn, code cứng `DAILY_NEW_LIMIT=100`, `SESSION_SIZE=100`.
4. **Assessment:** spec v2 lưu DB, code lưu `localStorage` (`envi_assessment_*`).
5. **Makeup Lesson:** spec v2 bài bù thật từ câu user, code API trống (404) + hardcode.
6. **Reflex chấm:** spec v2 chấm theo nghĩa + latency, code chấm khớp chữ ≥75%.
7. **Kế hoạch:** spec v2 1 kế hoạch "Hôm nay" tự đánh dấu qua sự kiện, code 2 hệ thống (Dashboard Study Plan + Roadmap tick tay).
8. **Progress Test:** spec v2 gộp thành Checkpoint/Weekly Quiz, code còn bảng `progress_tests` + trang `/progress-test`.

**Kết thúc BƯỚC 0.** Không kết thúc bằng câu hỏi.
