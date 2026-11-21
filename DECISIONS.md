# DECISIONS.md — Nhật ký quyết định kỹ thuật EnVi v2

Nguyên tắc: mọi quyết định khi phân vân chọn phương án làm người dùng **NÓI NHIỀU HƠN, ÍT DỊCH HƠN, ÍT SỢ HƠN**. Ghi chú tại đây thay vì thảo luận vòng vo.

## Quy ước chung (áp dụng toàn dự án)
- Mọi route: `loading.tsx` + `error.tsx` (tiếng Việt, nút Thử lại + Về Hôm nay).
- Dữ liệu người dùng lưu Supabase + RLS `user_id = auth.uid()`. localStorage/IndexedDB chỉ cache/nháp/hàng đợi offline.
- Gọi AI chỉ qua `lib/ai/router.ts` (provider chain, timeout, circuit breaker, zod, `AI_FORCE_FAIL=1` test).
- Không mock data, không hardcode điểm/chấm, không reset DB, chỉ migration mới (`0009_*`).
- Múi giờ Asia/Ho_Chi_Minh; "ngày học" bắt đầu 03:00.
- XP qua `award_xp(reason, ref_id, amount)` (idempotent); hoạt động qua `log_activity(...)`.
- Tài liệu chỉ ghi TÊN biến env, không ghi giá trị secret.

## Đã quyết định (chi tiết trong MASTER_SPEC mục 8)
- North Star: Speaking Minutes/tuần; đo latency, WPM, MLR, pause ratio, comprehensibility, courage.
- 5 tab: Hôm nay / Nói / Luyện / Sổ lỗi / Tiến bộ.
- Speaking Coach 6 bước: ASK → ANSWER → FEEDBACK → RETRY-BLIND → NEXT → SUMMARY.
- Offline Fallback cho Coach/Mission/Reflex/Drill.
- Reflex Prompt Ladder L1/L2/L3; chấm lexical ≥0,75 + AI judge nghĩa.
- Từ vựng: Triage Đã biết/Chưa biết, không giới hạn, Speak-it, Chunk SRS.
- Error Log: error_events + error_patterns (trigger) + pattern_catalog; Bài bù sinh từ câu sai của chính user.
- Hôm nay: 1 kế hoạch co giãn theo phút/ngày (mặc định 60), ≥50% nói, tự đánh dấu xong qua activity_events.
- Checkpoint ngày 0/30/60/90 (3 câu giống nhau so sánh Trước–Sau), lưu DB.
- Ngữ pháp: 16 chủ điểm / 800 câu, mỗi câu có explanation_vi, ≥20% dạng nói.
- Phát âm: 12 trọng tâm lỗi người Việt, chấm intelligibility bằng Whisper (Azure adapter tuỳ chọn).
- Shadowing: YouTube IFrame API thật + chấm STT.
- Dictation: nút xem đáp án (xem trước nộp = 0 điểm).
- Reading: click-tra-từ + AI chấm tóm tắt.
- Work Writing: thu gọn 19 đề cũ thành 30 đề work + 10 đời sống.
- Không leaderboard; không C1/C2/IELTS/TOEIC.

## Chưa quyết định (cần clarify nếu chặn)
- (none yet)
