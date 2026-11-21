# CHANGELOG.md — EnVi

## [Unreleased] — MASTER_SPEC v2.0 (A2 → B2)
- Bắt đầu thực hiện theo MASTER_SPEC v2.0.
- Rotate secret: xoá giá trị thật khỏi PROJECT_MANIFEST.md (thay bằng tên biến).
- Thêm DECISIONS.md, CHANGELOG.md.
- Kết quả kiểm kho BƯỚC 0: tsc sạch, eslint sạch (app), build pass, vitest 11/11, playwright 18 fail / 6 không chạy (baseline, chủ yếu auth chưa cấu hình).

## [v1.0] — Trước MASTER_SPEC (hiện trạng code)
- Auth: email/mật khẩu + Google OAuth, middleware bảo vệ, callback debug logging.
- Dashboard, Vocab (SM-2), Speaking (state machine 5 bước), Writing (localStorage buffer + Supabase debounce), Reading, Grammar (16 chủ điểm hardcode), Roadmap 90 ngày, Reflex, Dictation, Shadowing (mock), Assessment, Progress Test, Error Log (đọc feedback_json), Makeup Lesson (hardcode/404), Assistant, Settings, Search, PWA.
- Deploy Vercel `https://envi-deploy-one.vercel.app`, 7 env vars.
- Test: speaking 5/5, writing 7/7, roadmap 3/3 (Playwright baseline giờ bị lỗi auth).
- KEY RẠO: PROJECT_MANIFEST.md chứa giá trị thật SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY, GEMINI_API_KEY, anon key → đã redact.
