# EnVi — MASTER SPEC v2.0 (A2 → B2, mục tiêu: NÓI TỰ TIN & TRÔI CHẢY)

Tài liệu chuẩn duy nhất (Single Source of Truth) của dự án EnVi. Thay thế `HANDOFF.md`.
`PROJECT_MANIFEST.md` chỉ còn là báo cáo hiện trạng code, mọi quyết định sản phẩm lấy theo file này.
Phiên bản: 2.0 — 22/11/2026. Phạm vi: A2 → B2, lộ trình 90 ngày + vòng duy trì sau ngày 90.

---

## 0. CẢNH BÁO BẢO MẬT — LÀM NGAY TRƯỚC MỌI VIỆC KHÁC

`PROJECT_MANIFEST.md` (Tài liệu 2) đang ghi **giá trị thật** của `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GEMINI_API_KEY`, anon key và mật khẩu tài khoản QA. Tài liệu này đã được dán vào chat/AI, nên coi như **đã lộ**.

1. Supabase Dashboard → Project Settings → API: **tạo lại (rotate) service role key** (key `sb_secret_...`). Key này bỏ qua toàn bộ RLS, ai có nó là đọc/xoá được hết dữ liệu.
2. Groq Console và Google AI Studio: **xoá key cũ, tạo key mới**.
3. Đổi mật khẩu tài khoản QA.
4. Cập nhật key mới vào `.env.local` và vào Vercel → Settings → Environment Variables, rồi redeploy.
5. Từ nay **mọi tài liệu chỉ ghi TÊN biến**, không bao giờ ghi giá trị. Thêm `gitleaks` (hoặc `secretlint`) vào pre-commit để tự chặn.

---

## 1. TÓM TẮT ĐIỀU HÀNH (đọc 2 phút)

**Chẩn đoán:** EnVi hiện tại **rộng nhưng mỏng ở đúng chỗ quan trọng nhất**. App có hơn 20 tính năng (đọc, viết, ngữ pháp, tìm kiếm, trợ lý, self-talk…), nhưng mục tiêu tối thượng là **hết "dịch trong đầu" và hết "sợ nói"**. Đối chiếu với mục tiêu đó, có 5 vấn đề gốc:

| # | Vấn đề gốc | Vì sao cản trở mục tiêu |
|---|---|---|
| 1 | **Không đo được sự trôi chảy.** App chỉ đo "đúng/sai chữ", không đo thời gian phản hồi, tốc độ nói (WPM), số lần ngập ngừng | "Dịch trong đầu" biểu hiện bằng **độ trễ trước khi mở miệng**. Không đo thì không biết có tiến bộ hay không |
| 2 | **Reflex chấm kiểu khớp chữ ≥75% với 1 câu mẫu.** | Bắt người học nhớ đúng một câu dịch → **củng cố thói quen dịch**. Người bản xứ chấp nhận nhiều cách nói; app phải chấm theo **ý nghĩa** |
| 3 | **Luôn mồi bằng tiếng Việt** (Reflex, TranslateSpeak) | Muốn bỏ dịch thì phải **giảm dần tiếng Việt**, chuyển sang mồi bằng tình huống, hình ảnh và câu hỏi tiếng Anh |
| 4 | **Thời lượng nói thật quá ít so với tổng thời gian** (mặc định 180 phút/ngày, phần lớn là đọc, ngữ pháp, flashcard) | Sự tự tin đến từ **số lần nói thành công**. Mục tiêu: ≥50% thời gian học là nói thành tiếng |
| 5 | **Vòng lặp lỗi chưa khép kín**: Error Log không lưu trạng thái, Makeup Lesson bị lỗi 404 và hardcode (vi phạm "CẤM MOCK DATA"), lỗi Reflex chưa được ghi | Lỗi không được sửa đến nơi thì lặp lại mãi, và người học càng sợ sai |

**Định hướng v2 (một câu):**
> EnVi v2 là **"phòng tập nói an toàn"**: mỗi ngày người học **nói thành tiếng ít nhất 25 phút** với AI, theo tình huống thật của IT/BA và đời sống. Tiếng Việt được giảm dần. App **đo độ trễ và độ trôi chảy** để chứng minh tiến bộ, và **mọi lỗi tự quay lại thành bài bù** cho tới khi sửa xong.

**Quyết định lớn:**
- **Giữ và nâng cấp:** AI Speaking Coach (6 bước), Reflex (chấm theo nghĩa, 3 tầng mồi), Flashcard SM-2 (thêm bước phân loại "Đã biết/Chưa biết", không giới hạn số từ), Shadowing/Dictation, Ngữ pháp 16 chủ điểm, Error Log + Bài bù, Lộ trình 90 ngày, XP/Streak.
- **Thêm mới:** Roleplay Missions (tình huống công việc), Fluency Drills (4/3/2, 1-minute talk, mô tả tranh, trả lời nhanh 3 giây), Pronunciation Lab (lỗi phát âm đặc thù người Việt), Checkpoint nói ngày 0/30/60/90 có ghi âm "Trước – Sau", Chunk SRS (cụm từ lấy ra từ buổi nói), Real-world Missions (cầu nối ra đời thật), "Courage Meter" (đo sự tự tin).
- **Gộp/đổi vai trò:** Self-talk → gộp vào Fluency Drills. TranslateSpeak → đổi thành "Phao cứu sinh" (tối đa 3 lần/buổi). Assessment + Progress Test → gộp thành Checkpoint. Writing → thu gọn thành "Work Writing" (Slack/email/Jira ngắn). Dashboard Study Plan + Roadmap ticks → gộp thành **một** màn "Hôm nay" tự động đánh dấu xong.
- **Hạ ưu tiên:** Reading dài, Assistant chat, tìm kiếm toàn cục (giữ nhưng không đầu tư thêm).
- **Mặc định thời lượng:** 60 phút/ngày (cho phép 30–180 phút). 180 phút/ngày khó duy trì 90 ngày với người đi làm, dễ gãy streak và bỏ cuộc.

---

## 2. MỤC TIÊU, CHỈ SỐ ĐO (KPI) & ĐỊNH NGHĨA "THÀNH CÔNG"

### 2.1 Mục tiêu tối thượng (không đổi)
Tự tin và trôi chảy khi giao tiếp tiếng Anh trong công việc IT/BA và đời sống, nói cho người nước ngoài hiểu được ý. **Không** cần từ ngữ cao siêu, **không** cần ngữ pháp hoàn hảo, chỉ dùng khoảng 3.000 từ thông dụng.

### 2.2 North Star Metric
**"Số phút nói thành tiếng tiếng Anh mỗi tuần"** (Speaking Minutes / week): tổng thời lượng audio người dùng thực sự nói, tính từ các file ghi âm đã gửi lên STT.

### 2.3 Bộ chỉ số trôi chảy (Fluency Metrics) — app phải đo tự động

| Chỉ số | Cách đo | Ngày 0 (A2 điển hình) | Mục tiêu ngày 90 (B2 giao tiếp) |
|---|---|---|---|
| **Response Latency** (độ trễ mở miệng) | Từ lúc AI đọc xong câu hỏi (sự kiện `onend` của TTS) đến khi phát hiện tiếng nói đầu tiên (VAD: năng lượng âm thanh vượt ngưỡng) | 4–8 giây | **≤ 2 giây** |
| **Speech Rate** | Số từ (theo Whisper) ÷ thời lượng nói (phút) | 50–80 WPM | **≥ 110 WPM** |
| **Mean Length of Run** | Số từ trung bình giữa các khoảng lặng > 400 ms (dùng timestamp từng từ của Whisper) | 2–4 từ | **≥ 7 từ** |
| **Long-pause ratio** | Số khoảng lặng > 1 giây ÷ 100 từ | > 10 | **≤ 4** |
| **Tỉ lệ hiểu được** (Comprehensibility) | AI chấm 1–5: "người nước ngoài có hiểu ý không" | 2–3 | **≥ 4** |
| **Courage Score** | Tự đánh giá trước/sau mỗi buổi nói (1–5: "Tôi thấy thoải mái khi nói") | 1–2 | **≥ 4** |
| **Câu trả lời ≥ 2 câu** | % lượt trả lời có từ 2 câu trở lên | < 30% | **≥ 80%** |

> Ghi chú: các mức "Ngày 0" chỉ là giá trị tham khảo để thiết kế; giá trị thật lấy từ Checkpoint Ngày 0 của chính người dùng.

### 2.4 Chỉ số thói quen
- Streak ≥ 80% số ngày trong 90 ngày (cho phép tối đa 2 "Streak Freeze" mỗi tháng).
- Speaking minutes ≥ 25 phút/ngày (với gói 60 phút).
- Tỉ lệ ôn đúng hạn SRS ≥ 85%.
- Error Log: ≥ 70% lỗi chuyển trạng thái `mastered` trong 14 ngày.

### 2.5 Định nghĩa "XONG 100%"
Xem mục 16 (Definition of Done) và mục 17 (Acceptance Test).

---

## 3. NGƯỜI DÙNG MỤC TIÊU (PERSONA)

**"Anh Minh — BA/Dev người Việt, 28–40 tuổi"**
- Trình độ: hiểu khi đọc ở mức B1, nói ở mức A2. Nghe tiếng Anh tốc độ thật bị "trôi".
- Nỗi đau: khi cần nói thì "đóng băng", soạn câu tiếng Việt trong đầu rồi dịch, mất 5–10 giây. Sợ đồng nghiệp/khách nước ngoài đánh giá. Họp daily bằng tiếng Anh chỉ nói "Same as yesterday".
- Bối cảnh: đi làm toàn thời gian, học sáng sớm hoặc tối. Dùng laptop (Chrome/Edge/Brave) và điện thoại (PWA).
- Tình huống cần nói nhất:
  - **Công việc:** daily standup, làm rõ yêu cầu (requirement elicitation), giải thích bug, demo tính năng, ước lượng (estimate), phản đối lịch sự, small talk đầu cuộc họp, phỏng vấn.
  - **Đời sống:** du lịch, nhà hàng, hỏi đường, khám bệnh, kết bạn, kể chuyện.
- Không cần: IELTS/TOEIC, ngữ pháp hàn lâm, từ vựng C1/C2.

---

## 4. HỘI ĐỒNG CHUYÊN GIA — Ý KIẾN TỔNG HỢP

*(tóm tắt các vai trò: PO, EdTech, người học, giáo viên, native, BA, designer, fullstack, QA, curriculum designer, SLA, planner — đã được thống nhất trong spec v2.0 mục 4. Quyết định cuối: 5 tab chính, P0 vòng nói + đo trôi chảy + lỗi khép kín, P1 nội dung IT/BA, P2 trang trí/gamification)*

---

## 5. NGHIÊN CỨU THAM KHẢO — 5 NGUYÊN TẮC
1. Nói nhiều, nói ngắn, nói lặp lại.
2. Có mục tiêu giao tiếp rõ ràng cho mỗi hội thoại (mission).
3. Gợi ý thay vì dịch hộ.
4. Cho thấy tiến bộ bằng âm thanh thật (Trước–Sau) và biểu đồ trôi chảy.
5. Cầu nối ra đời thật.

---

## 6. ĐỐI CHIẾU GAP — 11 NHÓM THIẾU SÓT (6 P0) + 13 LỖI KỸ THUẬT
*(bảng GAP chi tiết trong spec v2.0 mục 6.1, 6.2, 6.3; được đối chiếu code tại PROJECT_MANIFEST.md)*

---

## 7. BẢN ĐỒ TÍNH NĂNG v2 — 5 TAB CHÍNH
- `/today` Hôm nay (màn mặc định)
- `/speak` Nói: Coach / Missions / Drills / Call
- `/practice` Luyện: Reflex / Vocab / Listen / Dictation / Pronunciation / Reading / Grammar / Writing
- `/errors` Sổ lỗi (+ Makeup `/errors/makeup/[id]`)
- `/progress` Tiến bộ: biểu đồ trôi chảy, Checkpoint 0/30/60/90, Roadmap, Real-world
- `/settings` Cài đặt, `/assistant` Trợ lý (nút nổi)

---

## 8. ĐẶC TẢ CHI TIẾT TỪNG TÍNH NĂNG (8.1–8.20)
*(xem spec v2.0 mục 8 đầy đủ: BR-x business rules, AC-x acceptance criteria, schema dữ liệu, API, UI, edge cases)*

### 8.1 Hôm nay — Smart Daily Plan (`/today`) — P0
### 8.2 Onboarding & Checkpoint Ngày 0 (`/onboarding`) — P0
### 8.3 AI Speaking Coach 6 bước (`/speak/coach`) — P0
### 8.4 Roleplay Missions (`/speak/missions`) — P0/P1
### 8.5 Reflex Training (`/practice/reflex`) — P0
### 8.6 Fluency Drills (`/speak/drills`) — P0
### 8.7 Từ vựng & Chunk SRS (`/practice/vocab`) — P0
### 8.8 Nghe & Shadowing (`/practice/listen`) — P0
### 8.9 Dictation (`/practice/dictation`) — P1
### 8.10 Phát âm & Đọc to (`/practice/pronunciation`) — P0
### 8.11 Đọc hiểu (`/practice/reading`) — P1
### 8.12 Ngữ pháp (`/practice/grammar`) — P1
### 8.13 Sổ lỗi & Bài bù (`/errors`) — P0
### 8.14 Work Writing (`/practice/writing`) — P2
### 8.15 Lộ trình 90 ngày + vòng duy trì (`/progress/roadmap`) — P0
### 8.16 Tiến bộ & Checkpoint (`/progress`) — P0
### 8.17 Fluency Engine (dùng chung) — P0
### 8.18 Gamification, Courage Meter — P1
### 8.19 Real-world Bridge — P2
### 8.20 Module hỗ trợ (Voice Call, Trợ lý, Tìm kiếm, Cài đặt, PWA, Auth) — P0/P1/P2

---

## 9. MÔ HÌNH DỮ LIỆU v2 (Supabase Postgres)
*(bảng nội dung + bảng người dùng + hàm/trigger/RPC — xem spec v2.0 mục 9 đầy đủ)*

---

## 10. KIẾN TRÚC AI & GIỌNG NÓI
*(AI Router `lib/ai/router.ts`, STT, TTS, mục tiêu độ trễ — xem spec v2.0 mục 10)*

---

## 11. YÊU CẦU PHI CHỨC NĂNG (NFR)
*(Zero errors, hiệu năng, bảo mật, tương thích, chất lượng code — xem spec v2.0 mục 11)*

---

## 12. KẾ HOẠCH NỘI DUNG (CONTENT)
*(số lượng từ, reflex, speaking, missions, listening, dictation, reading, grammar, pronunciation, pattern, roadmap — xem spec v2.0 mục 12)*

---

## 13. MẪU MỘT NGÀY HỌC
*(gói 60 phút, Ngày 35 — xem spec v2.0 mục 13)*

---

## 14. KẾ HOẠCH TRIỂN KHAI (S0 → S11)
*(xem spec v2.0 mục 14 đầy đủ. S0–S3 là lõi: nói 6 bước + đo trôi chảy + Offline Fallback + Error Log/Bài bù + Hôm nay)*

---

## 15. KẾ HOẠCH KIỂM THỬ
*(unit Vitest, contract, integration, E2E Playwright với --use-file-for-fake-audio-capture, chaos no-white-screen, performance, content, security — xem spec v2.0 mục 15)*

---

## 16. DEFINITION OF DONE — "HOÀN THIỆN 100% CHO A2–B2"
*(10 mục — xem spec v2.0 mục 16)*

---

## 17. HÀNH TRÌNH NGHIỆM THU (E2E)
*(7 hành trình — xem spec v2.0 mục 17)*

---

## 18. RỦI RO & CÁCH GIẢM
*(bảng rủi ro — xem spec v2.0 mục 18)*

---

## 19. GHI CHÚ VỀ PHẠM VI
*(tài liệu lập từ Tài liệu 1 + Tài liệu 2, không đọc trực tiếp source code trước khi agent quét lại — xem spec v2.0 mục 19)*
