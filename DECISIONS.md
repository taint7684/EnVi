# EnVi — DECISIONS.md (nhật ký quyết định kỹ thuật)

## Quy tắc quyết định
- Ưu tiên phương án làm người dùng NÓI NHIỀU HƠN, ÍT DỊCH HƠN, ÍT SỢ HƠN.
- Không commit secret; không mock dữ liệu người dùng; không màn trắng.
- Chỉ thêm migration mới (`db/migrations/0011_*` trở đi), không xoá dữ liệu cũ.

## Quyết định (điền khi thực thi S0→S11)
- [S0] `.env.example`: giữ chỉ tên biến, xoá giá trị thật (rotate key do người dùng thực hiện bên ngoài repo).
- [S0] `docs/MASTER_SPEC.md`: tạo từ spec v2.0 đã được duyệt.
- [S0] `PROJECT_MANIFEST.md`, `DECISIONS.md`, `CHANGELOG.md`: tạo khởi tạo.
- [S5] Assessment: giữ `lib/assessment.ts` (pure + localStorage legacy) làm nguồn câu hỏi/chấm; thêm `lib/assessment-db.ts` (server) lưu `assessment_results`. Form import pure từ `assessment`, save từ `assessment-db`.
- [S5] Onboarding: dùng state + onSubmit (không dùng form action FormData) để tương thích React 19 và đọc state đã chọn.
- [S5] Nav: chuyển sang IA 5 tab (spec 7.1) dùng route hiện có (`/speaking` thay `/speak/coach` tới khi refactor route); sub-item chỉ mở rộng khi tab active để gọn sidebar.
- [S5] `/progress` là server component đọc `assessment_results`, tổng hợp Trước–Sau bằng `summarizeProgress` (pure, có test). Biểu đồ fluency đầy đủ (WPM/latency) hoãn tới khi có dữ liệu `fluency_daily`.
- [S6] Mission/Drill dùng server actions (startMission/submitMissionTurn/finishMission, saveDrill) thay vì API route riêng — cùng contract, ít bề mặt hơn. Objective judge qua `aiRouter task=objective_judge`, lỗi → [] (không chặn).
- [S6] Nội dung mission/strategy/drill để ở `data/*.json` + validate zod khi load (server-only); đọc DB trước (`missions`...), trống thì fallback JSON → chạy được trước khi seed. Persona turn dùng `offline_script` (pre-written) + STT từ `/api/stt` cho câu trả lời; WPM drill đo bằng thời gian ghi thực tế + word count transcript.
- [S6] `fluency_drills`/`mission_attempts` xóa theo `delete_my_account` (migration 0016).
- [S7] Chấm điểm dùng chung `lib/speech/scoring.ts` (thuần, có test): Dictation/Shadowing/Pronunciation. Dictation BR-9.3: xem đáp án trước khi nộp → score 0, 0 XP (`revealed_before_submit`).
- [S7] Shadowing: bỏ mock `score:0`, chấm bằng STT (`/api/stt`) + `scoreShadowing` (accuracy 0.7 + timing 0.3), lưu `shadowing_attempts`. IFrame API seek bằng postMessage (đã có) — highlight getCurrentTime để lại sau.
- [S7] Pronunciation Lab: 12 trọng tâm (data/pronunciation.json) validate zod, chấm intelligibility = % từ Whisper nhận đúng (adapter `whisper`; Azure tùy chọn sau). Lưu `pronunciation_attempts` + `pronunciation_progress.mastery` (trung bình 10 lượt gần nhất).
- [S8] Reading: bỏ localStorage, lưu `reading_attempts` qua `saveReadingAttempt`; click-to-lookup dùng `lookupWord` (thử từ gốc + lemma trong bảng `words`); AI `define_in_context` fallback + cache để sau.
- [S8] Grammar: attempt lưu qua effect (theo dõi `checked`), `grammar_mastery` = % đúng 20 lượt gần nhất theo topic. Nội dung `explanation_vi` đã có inline; mở rộng 800 câu + `vn_trap` + ≥20% câu speak là công việc nội dung còn lại.
- [S8] Work Writing (P2): đã lưu DB (`writing_drafts`); thêm cột `kind`. Feedback schema khen→≤2 lỗi→natural + đọc to bản sửa để làm sau.
