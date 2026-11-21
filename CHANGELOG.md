# CHANGELOG.md — EnVi

## [S0] — An toàn & nền móng (22/11/2026)
- `lib/ai/router.ts`: AI Router (provider chain, circuit breaker, health-cache Ollama, budget, `AI_FORCE_FAIL`, zod + repair, `AiUnavailableError`).
- `lib/result.ts`: `Result<T>`, `ok/err`, `asArray`, `safeJson`, `safeJsonResult`.
- Mọi route con `(main)`: `loading.tsx` + `error.tsx` (`RouteError`, `"use client"`).
- `app/api/client-errors/route.ts` + `db/migrations/0009_client_errors.sql` (RLS).
- `scripts/pre-commit-secret.mjs` + pre-commit hook; `package.json` script `precommit`; `.eslintignore`.
- Xoá `components/gamification/rate-limit-check.tsx` + import trong `app/layout.tsx`; xoá scripts rác (`add-phrases3.js`, `gen-phase10-*`, `gen-phase10b-*`).
- Kiểm kho: tsc sạch, eslint 0 lỗi, build pass, vitest 11/11. Commit `b3d64b9`.

## [Unreleased] — MASTER_SPEC v2.0 (A2 → B2)

## [v1.0] — Trước MASTER_SPEC (hiện trạng code)
- Auth: email/mật khẩu + Google OAuth, middleware bảo vệ, callback debug logging.
- Dashboard, Vocab (SM-2), Speaking (state machine 5 bước), Writing (localStorage buffer + Supabase debounce), Reading, Grammar (16 chủ điểm hardcode), Roadmap 90 ngày, Reflex, Dictation, Shadowing (mock), Assessment, Progress Test, Error Log (đọc feedback_json), Makeup Lesson (hardcode/404), Assistant, Settings, Search, PWA.
- Deploy Vercel `https://envi-deploy-one.vercel.app`, 7 env vars.
- Test: speaking 5/5, writing 7/7, roadmap 3/3 (Playwright baseline giờ bị lỗi auth).
- KEY RẠO: PROJECT_MANIFEST.md chứa giá trị thật SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, GEMINI_API_KEY, anon key → đã redact.
