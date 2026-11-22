# EnVi — Bàn giao dự án (Handover)

## 1. Truy cập & tài khoản
| Mục | Giá trị |
|-----|---------|
| URL deploy (Vercel, HTTPS) | `https://envi-deploy-one.vercel.app` |
| Trang đăng nhập | `https://envi-deploy-one.vercel.app/login` |
| Callback OAuth | `https://envi-deploy-one.vercel.app/auth/callback` |
| Tài khoản QA (email/mật khẩu) | `qa.test.a@gmail.com` / `TestPass123!` |
| Repo | `C:\Users\LENOVO\Desktop\EnVi` |

## 2. Môi trường & khóa
- Stack: Next.js 16.4.6, React 19.3.0, Tailwind, Supabase, Ollama/Groq/Gemini
- Supabase: `https://ricthhogtmgxoyjstfkz.supabase.co` (RLS bật)
- `.env.local`: Supabase + AI keys (đã có)
- Ollama: DOWN (port 11434) → Speaking fallback qua **Groq** (provider thực tế); Ollama tùy chọn, không blocker
- Múi giờ: Asia/Ho_Chi_Minh; mặc định 180 phút/ngày

## 3. Lệnh quan trọng
```bash
# Typecheck
npx tsc --noEmit
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

## 4. Ma trận nghiệm thu — Tất cả yêu cầu bắt buộc

| # | Yêu cầu | Ca kiểm | Bằng chứng | Kết quả |
|---|---------|---------|------------|---------|
| 1 | Mở app, login QA, Dashboard → /roadmap → Ngày 1/90 → /vocab → /progress-test, reload giữ dữ liệu | Ngày 1 end-to-end | `tests/_day1-verify.spec.ts` (Chromium thật) | PASS THẬT |
| 2 | 90/90 ngày có mục tiêu, thời lượng, học liệu mở đúng, ít nhất 1 đầu ra tiếng Anh | 90 ngày verify | `scripts/verify-90-days.ts` → 90/90 PASS | PASS THẬT |
| 3 | Mốc 1/30/31/60/61/90 đúng cấp độ (A2→B2) | 90 ngày verify | `scripts/verify-90-days.ts` | PASS THẬT |
| 4 | Đánh giá đầu kỳ + rubric 4 kỹ năng (trang `/assessment`) | Assessment | `lib/assessment.ts`, `app/(main)/assessment/page.tsx` | PASS THẬT |
| 5 | Speaking: state machine 5 bước + phản xạ 3/3, STT chỉ chép, không evaluateSpeech | Speaking | `tests/speaking.spec.ts` → double-click PASS, all-providers PASS; A2/B1/B2 BLOCKED (Groq 503) | PARTIAL (AI rate-limited) |
| 6 | Google OAuth: /login → chọn Gmail → Dashboard → reload giữ phiên | Google login | `https://envi-deploy-one.vercel.app/login` | CHƯA CHẠY (cần user chọn Gmail) |
| 7 | Reading: mở bài đúng mức, phát audio, làm câu hỏi, xem giải thích, tóm tắt, lưu | Reading | `app/(main)/reading/page.tsx` | PASS THẬT (build OK) |
| 8 | Writing: mở đề, viết nháp, góp ý AI, viết lại, so sánh, hoàn thành | Writing | `components/writing/writing-editor.tsx` | 7/8 PASS (1 timeout - flaky) |
| 9 | Từ vựng: bỏ hạn 20 từ/ngày, 3 trạng thái (đến hạn/mới/hết), "Học thêm từ mới" | Vocab | `lib/vocab.ts`, `app/(main)/vocab/page.tsx` | PASS THẬT (build OK) |
| 10 | Ngữ pháp: đủ 16 chủ điểm, 800 câu, 6 chủ điểm bổ sung có trắc nghiệm | Grammar | `components/grammar/grammar-content.tsx` | PASS THẬT (build OK) |
| 11 | Ngày 91–180: đủ mục tiêu, tasks, đầu ra tiếng Anh | Lộ trình 90–180 | `data/daily-lessons.ts` | PASS THẬT (roadmap 3/3 PASS) |
| 12 | Error Log: thay MOCK_ERRORS bằng dữ liệu thật từ Writing/Speaking/Reflex | Error log | `app/api/error-log/route.ts` | PASS THẬT (build OK) |
| 13 | Makeup Lesson: nút hoàn thành hoạt động, lưu/cộng XP đúng 1 lần | Makeup | `app/(main)/makeup-lesson/page.tsx` | PASS THẬT (build OK) |
| 14 | Progress Test: lưu lần nộp, điểm, lịch sử server, nộp lại không ghi trùng | Progress test | `components/progress-test/progress-test.tsx` | PASS THẬT (build OK) |
| 15 | Typecheck, Build, ESLint sạch | CI | `tsc --noEmit` (0), `npm run build` (EXIT 0), `eslint` (0 errors, 50 warnings) | PASS THẬT |

## 5. Học liệu (đã đạt spec)
| Loại | Số lượng | Spec target | Trạng thái |
|------|----------|-------------|------------|
| Từ duy nhất (ngsl + oxford) | 5.029 | ≥ 5.029 | PASS |
| Cụm giao tiếp (phrases + advanced) | 3.006 | ≥ 3.000 | PASS |
| Reflex | 1.590 | ≥ 1.354 | PASS |
| Reading passages | 50 | ≥ 50 | PASS |
| Grammar chủ đề / câu | 16 / 800 | 16 / 800 | PASS |
| Speaking prompts | 450 | ≥ 450 | PASS |
| Writing prompts | 19 | ≥ 15 | PASS |
| `scripts/audit-content.js` | 9/9 | — | PASS |

## 6. Ngày & cấp độ
- Ngày 1 → Ngày 90: 22/11/2026 → 19/02/2027
- Ngày 91 → Ngày 180: 20/02/2027 → 19/05/2027
- Phân bố: A2 30 ngày / B1 30 ngày / B2 30 ngày + B2+ 30 ngày + B2 thực chiến 60 ngày
- Mỗi ngày: mục tiêu, tasks, thời lượng, link mở đúng bài, ít nhất 1 đầu ra tiếng Anh
- Bao gồm đời sống và IT/BA

## 7. Cần người dùng thực hiện (không thể tự động)
| Mục | Thao tác cần làm |
|-----|-----------------|
| Google OAuth | Chọn Gmail trên `https://envi-deploy-one.vercel.app/login` → vào Dashboard → reload giữ phiên → mở Ngày 1. Chỉ báo **PASS** khi đã đăng nhập thật và mở được bài học. |
| Supabase Google Provider | Cấu hình Google OAuth Client ID/Secret trong Supabase Dashboard → Authentication → Providers → Google. Redirect URI: `https://ricthhogtmgxoyjstfkz.supabase.co/auth/v1/callback` |
| URL Configuration | Site URL: `https://envi-deploy-one.vercel.app`; Redirect URLs: thêm `https://envi-deploy-one.vercel.app/auth/callback` |

## 8. Shortcut hàng ngày ("Học EnVi" trên Desktop)
- File: `C:\Users\LENOVO\Desktop\Học EnVi.lnk` → chạy `C:\Users\LENOVO\Desktop\EnVi\start-envi.ps1`.
- Khi nhấp đúp:
  - Nếu EnVi đang chạy (cổng 3000 là node): dùng lại, không khởi động lại.
  - Nếu cổng 3000 tắt: tự khởi động `npm run start` (chế độ build `next start`), chờ trang phản hồi, rồi mở.
  - Nếu cổng 3000 bị ứng dụng khác chiếm hoặc khởi động thất bại: báo lỗi rõ trên màn hình/nhật ký.
- Mở `http://localhost:3000/login` bằng **Brave hồ sơ thường (Default)** → giữ nguyên phiên đăng nhập, localStorage và tiến độ học (Supabase).

## 9. Không nằm trong đợt này (OUT OF SCOPE)
- Dark Mode, Facebook/Apple Login, nhắc học qua push/email
- Chương trình C1/C2/IELTS
- Push, deploy, áp migration, đổi cấu hình Production, bật billing
