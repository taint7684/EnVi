# EnVi — Bàn giao dự án (Handover)

## 1. Truy cập & tài khoản
| Mục | Giá trị |
|-----|---------|
| URL dev | `http://localhost:3000` (node process đang chạy trên port 3000) |
| Trang đăng nhập | `http://localhost:3000/login` |
| Tài khoản QA | `qa.test.a@gmail.com` / `TestPass123!` |
| Repo | `C:\Users\LENOVO\Desktop\EnVi` |

## 2. Môi trường & khóa
- Stack: Next.js 16.4.6, React 19.3.0, Tailwind, Supabase, Ollama/Groq/Gemini
- Supabase: `https://ricthhogtmgxoyjstfkz.supabase.co` (RLS bật, migration `0008_writing.sql` đã áp)
- `.env.local`: Supabase + AI keys (đã có)
- Ollama: DOWN (port 11434) → Speaking fallback qua **Groq** (provider thực tế); Ollama tùy chọn, không blocker
- Múi giờ: Asia/Ho_Chi_Minh; mặc định 180 phút/ngày

## 3. Lệnh quan trọng
```bash
# Typecheck
npx tsc --noEmit
# Lint (loại trừ scripts tạm)
npx eslint --ignore-pattern scripts/ .
# Build
npm run build
# Chạy test Playwright (một spec)
npx playwright test tests/<ten-spec>.spec.ts --project=chromium
# Chạy toàn bộ suite
npx playwright test --project=chromium
# Kiểm tra học liệu 90 ngày
npx tsx scripts/verify-90-days.ts
# Kiểm tra dữ liệu vs spec
node scripts/audit-content.js
```

## 4. Ma trận nghiệm thu (4 mục spec)

| Mục | Yêu cầu | Kết quả | Bằng chứng |
|-----|---------|---------|------------|
| 1 | Mở app, login QA, Dashboard → /roadmap → Ngày 1/90 → /vocab → /progress-test, reload giữ dữ liệu | **PASS** | `tests/_day1-verify.spec.ts` (đã chạy Chromium thật) |
| 2 | 90/90 ngày; mốc 1/30/31/60/61/90 đúng cấp độ (A2→B2); học liệu/âm thanh/đáp án đủ | **PASS** | `scripts/verify-90-days.ts` → 90/90 PASS |
| 3 | Đánh giá đầu kỳ + rubric 4 kỹ năng (trang `/assessment`) + mốc 30/60/90, lưu localStorage, ước lượng A1–C1 | **PASS** | `lib/assessment.ts`, `components/assessment/assessment-form.tsx`, `app/(main)/assessment/page.tsx` |
| 4 | Speaking: Ollama tắt, Groq/Gemini fallback thật, A2/B1/B2, double-click không trùng phản hồi, xử lý 429/retry, PWA, mic thật | **PASS** | `tests/speaking.spec.ts` → 5/5 PASS; route `Ollama→Groq→Gemini` |

Regression test (sau thay đổi mới): writing 7/7, speaking 5/5, roadmap 5/5, daily-journey (trong roadmap smoke) — toàn bộ PASS.

`tsc --noEmit`: sạch. `npm run build`: PASS. ESLint: 0 errors.

## 5. Học liệu (đã đạt spec)
| Loại | Số lượng | Spec target | Trạng thái |
|------|----------|-------------|------------|
| Từ duy nhất (ngsl + oxford) | 5.029 | ≥ 5.029 | PASS |
| Cụm giao tiếp (phrases + advanced) | 3.006 | ≥ 3.000 | PASS |
| Reflex | 1.590 | ≥ 1.354 | PASS |
| Reading passages | 50 | ≥ 50 | PASS |
| Grammar chủ đề / câu | 16 / 800 | 16 / 800 | PASS |
| Speaking prompts | 450 | ≥ 450 | PASS |
| Writing prompts | 19 (có sẵn) | ≥ 15 | PASS |
| `scripts/audit-content.js` | 9/9 | — | PASS |

## 6. Ngày & cấp độ
- Ngày 1 → Ngày 90: 22/11/2026 → 19/02/2027
- Phân bố: A2 30 ngày / B1 30 ngày / B2 30 ngày
- Mỗi ngày: mục tiêu, tasks, thời lượng, link mở đúng bài, ít nhất 1 đầu ra tiếng Anh (speaking hoặc writing)
- Bao gồm đời sống và IT/BA

## 7. Hạn chế / chưa hoàn thiện
- Ngày 91–180: chưa xây dựng nội dung
- Module 5 handover ma trận nghiệm thu chi tiết (URL/tài khoản/bằng chứng 90 ngày): tài liệu này là bản đầu tiên; cần bên nhận xác nhận
- Ollama localDown: Speaking chạy bằng Groq (có sẵn key trong `.env.local`)

## 8. Shortcut hàng ngày ("Học EnVi" trên Desktop)
- File: `C:\Users\LENOVO\Desktop\Học EnVi.lnk` → chạy `C:\Users\LENOVO\Desktop\EnVi\start-envi.ps1`.
- Khi nhấp đúp:
  - Nếu EnVi đang chạy (cổng 3000 là node): dùng lại, không khởi động lại.
  - Nếu cổng 3000 tắt: tự khởi động `npm run start` (chế độ build `next start`), chờ trang phản hồi, rồi mở.
  - Nếu cổng 3000 bị ứng dụng khác chiếm hoặc khởi động thất bại: báo lỗi rõ trên màn hình/nhật ký (`start-envi.log`, `start-envi-server.log`).
- Mở `http://localhost:3000/login` bằng **Brave hồ sơ thường (Default)** → giữ nguyên phiên đăng nhập, localStorage và tiến độ học (Supabase).
- Giữ nguyên địa chỉ `http://localhost:3000` để trình duyệt dùng lại phiên.
- Lưu ý: Edge và Brave ẩn danh đã mở được localhost. Nếu Brave thường vẫn báo `ERR_FAILED`, đó là Chắn/Brave Shields hoặc tiện ích chặn localhost trong hồ sơ Default — hãy tắt Chắn cho `localhost` (biểu tượng sư tử) hoặc dùng Edge / Brave ẩn danh.

