# EnVi MASTER_SPEC — Đặc tả chuẩn dự án EnVi

Phiên bản: v2  
Ngày hiệu lực: 21/11/2026  
Múi giờ: Asia/Ho_Chi_Minh (ngày học bắt đầu 03:00)

---

## 1. Mục tiêu & North Star

Người dùng: dân IT/BA người Việt, A2–B1, "dịch trong đầu" và "sợ nói".  
Mục tiêu: NÓI TIẾNG ANH TỰ TIN, TRÔI CHẢY, ĐÚNG TRỌNG TÂM; khoảng 3.000 từ thông dụng; A2 → B2 trong 90 ngày + vòng duy trì.  
North Star: số phút nói thành tiếng mỗi tuần.  
App phải ĐO: độ trễ mở miệng (latency), WPM, độ dài chuỗi nói (MLR), số khoảng lặng dài, chứng minh tiến bộ bằng ghi âm Trước–Sau.  
Quyết định phân vân: chọn phương án làm người dùng NÓI NHIÊN HƠN, ÍT DỊCH HƠN, ÍT SỢ HƠN.

---

## 2. Thứ tự ưu tiên nguồn sự thật

1. Mục tiêu tối thượng (North Star)
2. Yêu cầu gốc (7 tính năng bắt buộc)
3. MASTER_SPEC (file này)
4. PROJECT_MANIFEST.md
5. Code hiện tại

---

## 3. Kiến trúc 5 tab

| Tab | Route | Mô tả |
|-----|-------|-------|
| Hôm nay | `/today` | Kế hoạch duy nhất co giãn theo phút/ngày, Session Runner chạy liền mạch |
| Đánh giá | `/assessment` | Checkpoint Ngày 0/30/60/90 (Trước–Sau) |
| Luyện nói | `/speaking` | Speaking Coach 6 bước + Fluency Engine + Offline Fallback |
| Từ vựng | `/vocab` | Triage, Chunk SRS, YouGlish, Speak-it |
| Ngữ pháp | `/grammar` | 16 chủ điểm / 800 câu, explanation_vi, câu nói ≥ 20% |

Tab bổ assist: `/reflex`, `/reading`, `/shadowing`, `/dictation`, `/writing`, `/progress-test`, `/error-log`, `/settings`, `/roadmap`, `/dashboard`, `/self-talk`, `/makeup-lesson`, `/search`, `/assistant`.

---

## 4. Mô hình dữ liệu (mục 9 spec)

### Bảng người dùng (RLS `user_id = auth.uid()`)
- `profiles` (id, goal, minutes_per_day, voice, tts_rate, locale, consent_at, deleted_at, ...)
- `speaking_sessions` (id, user_id, topic_id, started_at, ended_at, created_at)
- `speaking_turns` (id, session_id, user_id, step, question, user_answer_text, audio_url, feedback_json, improved_answer, created_at)
- `recordings` (id, user_id, type, ref_id, audio_url, duration_seconds, created_at)
- `activity_events` (id, user_id, type, block_type, ref_id, duration_sec, speech_sec, meta, study_date, created_at)
- `xp_ledger` (id, user_id, amount, reason, ref_id, created_at)
- `streaks` (user_id, current, longest, last_study_date, freezes_used_month, updated_at)
- `daily_plans` (user_id, study_date, budget, blocks, completed_at)
- `daily_summary` (user_id, study_date, minutes, speech_minutes, xp)
- `error_events` (id, user_id, error_text, correction, context, severity, created_at)
- `error_patterns` (id, user_id, pattern_id, occurrence_count, last_occurred, created_at)
- `pattern_catalog` (id, pattern_name, error_example, correction, explanation_vi, category)
- `daily_progress` (legacy, giữ để không xóa dữ liệu cũ)

### RPC (idempotent)
- `award_xp(p_reason, p_ref_id, p_amount)` — XP, idempotent theo (reason, ref_id)
- `log_activity(p_type, p_block_type, p_ref_id, p_duration_sec, p_speech_sec, p_meta)`

### RLS
Mọi bảng dữ liệu người dùng: `USING (user_id = auth.uid())` + `WITH CHECK (user_id = auth.uid())`.  
Bảng nội dung chia sẻ (`words`, `topics`, `dictation_items`, `grammar_*`): select cho anon/authenticated.

---

## 5. AI Router (mục 10 spec)

- Chỉ gọi qua `lib/ai/router.ts` (provider chain, model, timeout, ngân sách từ env)
- Provider chain: `GROQ → GEMINI → OLLAMA` (tùy `AI_PROVIDER_CHAIN`)
- Circuit breaker (ngưỡng thất bại, cooldown)
- Zod schema + repair 1 lần
- `AiUnavailableError` → Offline Fallback
- `AI_FORCE_FAIL=1` để test
- Ngân sách/ngày từ `AI_DAILY_LIMITS`
- Cache TTL 10 phút cho task cacheable

---

## 6. Bảng GAP (đối chiếu MASTER_SPEC vs code)

| # | BR/AC | Nội dung | Đạt / Một phần / Chưa đạt | File liên quan |
|---|-------|----------|---------------------------|----------------|
| S2-1 | BR-S2.1 | Speaking Coach đúng 6 bước (ASK→ANSWER→FEEDBACK→RETRY-BLIND→NEXT→SUMMARY) | Một phần | `components/speaking/speaking-session.tsx`, `lib/speaking-prompt.ts`, `app/api/ai/speaking/route.ts` |
| S2-2 | BR-S2.2 | ASK: TTS + ghi thời điểm đọc xong câu hỏi | Chưa đạt | `components/speaking/speaking-session.tsx` |
| S2-3 | BR-S2.3 | ANSWER: Whisper verbose_json + timestamp từng từ, sửa transcript tối đa 1 lần | Chưa đạt | `hooks/use-recorder.ts`, `app/api/stt/route.ts` |
| S2-4 | BR-S2.4 | Gợi ý từ khoá sau 5s; "phao cứu sinh" tiếng Việt tối đa 3 lần/phiên | Chưa đạt | `components/speaking/speaking-session.tsx` |
| S2-5 | BR-S2.5 | FEEDBACK: khen cụ thể, tối đa 2 lỗi do server ép, lỗi dư vào Error Log, natural_version | Một phần | `app/api/ai/speaking/route.ts`, `lib/speaking-prompt.ts` |
| S2-6 | BR-S2.6 | RETRY-BLIND: ẩn mẫu khỏi DOM, chỉ 2–4 từ khoá, "Xem lại mẫu" 3 giây trừ XP, chấm 0.6 ngữ nghĩa + 0.4 từ khoá, pass ≥ 0.75, tối đa 3 lần | Chưa đạt | `components/speaking/speaking-session.tsx` |
| S2-7 | BR-S2.7 | SUMMARY: 3 lỗi, 5 cụm tự vào Chunk SRS, chỉ số trôi chảy so với 7 ngày trước, Courage trước/sau | Chưa đạt | `components/speaking/speaking-session.tsx` |
| S2-8 | BR-S2.8 | Fluency Engine: latency (VAD), WPM/MLR/pause (Whisper word timestamps), có unit test | Chưa đạt | `lib/fluency.ts` (chưa có) |
| S2-9 | BR-S2.9 | Offline Fallback: câu hỏi cache IndexedDB, TTS mẫu, ghi âm, sample_answer + key_phrases, nghe lại A/B, chấm từ khoá, hàng đợi đồng bộ, streak/XP ×0.8 | Chưa đạt | `lib/offline.ts` (chưa có) |
| S2-10 | BR-S2.10 | AI chỉ gọi qua `lib/ai/router.ts` (không gọi trực tiếp provider) | Chưa đạt | `app/api/ai/speaking/route.ts` (gọi trực tiếp Ollama/Groq/Gemini) |
| S3-1 | BR-S3.1 | Error Log: `error_events`, `error_patterns` (trigger), `pattern_catalog`; trạng thái lưu DB | Chưa đạt | migration mới cần tạo |
| S3-2 | BR-S3.2 | Bài bù sinh từ câu sai của user (5 bước), idempotent, mastery 1–3–7 ngày, cron 03:00 | Chưa đạt | migration + action mới |
| S3-3 | BR-S3.3 | Hôm nay: kế hoạch duy nhất, ≥ 50% thời gian nói, tự đánh dấu xong từ activity_events, Session Runner, Ngày bận 15', Streak Freeze | Một phần | `app/(main)/today/`, `components/today/today-plan.tsx` |
| S4-1 | BR-S4.1 | Từ vựng: Triage "Đã biết/Chưa biết" không giới hạn (spot-check 1/5) | Một phần | `app/(main)/vocab/page.tsx` |
| S4-2 | BR-S4.2 | Từ mới/ngày 0–500 hoặc Không giới hạn (bỏ hằng số 100) | Một phần | `app/(main)/vocab/page.tsx` |
| S4-3 | BR-S4.3 | 4 mức Again/Hard/Good/Easy lưu DB; Chunk SRS; dự báo ôn 7 ngày | Một phần | `lib/srs.ts`, `app/actions/srs.ts` |
| S5-1 | BR-S5.1 | Ngữ pháp: 16 chủ điểm / 800 câu, mỗi câu explanation_vi, ≥ 20% câu nói | Một phần | `data/grammar-exercises.json`, `app/(main)/grammar/` |
| S6-1 | BR-S6.1 | Checkpoint Ngày 0/30/60/90 (cùng 3 câu hỏi), lưu DB, bỏ localStorage assessment | Một phần | `app/(main)/assessment/page.tsx`, `lib/assessment.ts` |
| S7-1 | BR-S7.1 | Mọi route có `loading.tsx` + `error.tsx` (tiếng Việt, nút Thử lại); `global-error.tsx` | Đạt | `app/(main)/*/loading.tsx`, `error.tsx`, `app/global-error.tsx` |
| S7-2 | BR-S7.2 | zod cho mọi dữ liệu ngoài; Server Action trả `Result<T>` | Một phần | `lib/result.ts`, `lib/ai/router.ts` |
| S7-3 | BR-S7.3 | `strict` + `noUncheckedIndexedAccess` | Đạt | `tsconfig.json` |
| S8-1 | BR-S8.1 | Nội dung học tĩnh ở `content/**` có schema zod, validate khi build, seed DB | Một phần | `data/*.ts`, `*.json` (chưa có `content/`) |
| S9-1 | BR-S9.1 | Kiểm thử: unit + integration + E2E; E2E dùng fake media stream + wav fixture | Một phần | `tests/*.spec.ts`, `vitest.config.ts`, `playwright.config.ts` |
| S10-1 | BR-S10.1 | `docs/MASTER_SPEC.md` tồn tại và đầy đủ | Chưa đạt | `docs/MASTER_SPEC.md` (vừa tạo) |

---

## 7. Kế hoạch S0 → S11 (mục 14 spec)

| Giai đoạn | Module | Mục tiêu chính |
|-----------|--------|---------------|
| S0 | Foundation | AI Router, Result pattern, error/loading routes, client-error logging |
| S1 | Hôm nay | Activity events, XP ledger, streaks, daily plans, today page |
| S2 | Speaking Coach | 6 bước, Fluency Engine, Offline Fallback, AI qua router |
| S3 | Error Log + Bài bù | error_events, error_patterns, pattern_catalog, makeup lessons, cron 03:00 |
| S4 | Từ vựng + Chunk SRS | Triage, 4 mức review, YouGlish, Speak-it, 7-day forecast |
| S5 | Ngữ pháp | 16 chủ điểm / 800 câu, explanation_vi, câu nói ≥ 20% |
| S6 | Checkpoint 0/30/60/90 | Trước–Sau, lưu DB |
| S7 | Reflex | Prompt Ladder L1/L2/L3, lexical ≥ 0.75, SM-2 |
| S8 | Reading + Shadowing | Click-tra-từ, YouTube IFrame, STT chấm |
| S9 | Dictation + Writing | Xem đáp án = 0 điểm, AI chấm tóm tắt |
| S10 | Phát âm | 12 trọng tâm lỗi người Việt, Whisper intelligibility |
| S11 | Hoàn thiện + deploy | E2E full suite, DoD, handover |

Ưu tiên nếu thiếu thời gian: S0 → S1 → S2 → S3 là lõi.

---

## 8. Business Rules & Acceptance Criteria (tóm tắt các module cốt lõi)

### S2 — Speaking Coach (6 bước)

**BR-S2.1 — 6 bước:** ASK → ANSWER → FEEDBACK → RETRY-BLIND → NEXT → SUMMARY.  
**AC:** Mỗi bước hiển thị rõ, chuyển tiếp có nút/auto, không bỏ bước.

**BR-S2.2 — ASK:** AI đọc câu hỏi qua TTS; ghi thời điểm AI finishes speaking (ask_complete_at).  
**AC:** Có nhãn "AI đang đọc..." hoặc tương đương; ghi nhận timestamp.

**BR-S2.3 — ANSWER:** Mic ghi âm; STT trả về verbose_json với timestamp từng từ; người học sửa transcript tối đa 1 lần; gợi ý từ khoá xuất hiện sau 5s im lặng; phao cứu sinh tiếng Việt tối đa 3 lần/phiên.  
**AC:** Có nút ghi âm/dừng; hiển thị bản chép; nút sửa xuất hiện ≤ 1 lần; gợi ý từ khoá sau 5s; nút phao cứu sinh hiển thị tối đa 3 lần.

**BR-S2.4 — FEEDBACK:** Khen cụ thể trước; tối đa 2 lỗi do server chọn (ép); lỗi còn lại vào Error Log; natural_version giữ ý user, dùng từ thông dụng.  
**AC:** Hiển thị khen ngợi; ≤ 2 lỗi trên UI; lỗi dư có trong Error Log; câu cải thiện giữ nguyên ý nghĩa user.

**BR-S2.5 — RETRY-BLIND:** Ẩn hoàn toàn mẫu câu khỏi DOM; chỉ hiện 2–4 từ khoá; nút "Xem lại mẫu" hiển thị 3 giây thì trừ XP, chấm 0.6; tính điểm = 0.6 × ngữ nghĩa + 0.4 × từ khoá; pass ≥ 0.75; tối đa 3 lần rồi cho qua.  
**AC:** Mẫu câu không.render trong DOM khi retry-blind; chỉ 2–4 từ khoá hiển thị; nút Xem lại mẫu có hiệu ứng 3 giây + trừ XP; điểm tính theo công thức; pass ≥ 0.75 cho qua; sau 3 lần thất bại tự chuyển câu tiếp.

**BR-S2.6 — NEXT:** Tự động chuyển câu hỏi tiếp theo sau khi hoàn thành bước hiện tại.  
**AC:** Nút "Sang câu tiếp theo"; sau câu 5 vào Phản xạ 3 câu mới.

**BR-S2.7 — SUMMARY:** Tối đa 3 lỗi, 5 cụm tự vào Chunk SRS, chỉ số trôi chảy so với 7 ngày trước, Chỉ số Can Antes/Courage trước và sau phiên.  
**AC:** Màn hình tổng kết hiển thị 3 lỗi, 5 cụm tự, so sánh fluency 7 ngày, hiển thị Courage trước/sau.

### S3 — Error Log + Bài bù

**BR-S3.1:** Bảng `error_events`, `error_patterns` (trigger), `pattern_catalog`; trạng thái lưu DB.  
**AC:** Lỗi từ Speaking/Reflex/Dictation/Grammar lưu vào error_events; pattern trigger tạo/cập nhật error_patterns; pattern_catalog có thể quản lý.

**BR-S3.2:** Bài bù sinh từ câu sai của chính user (5 bước), hoàn thành idempotent, mastery theo mốc 1–3–7 ngày, cron chạy 03:00.  
**AC:** Có màn hình Bài bù; mỗi bài bù liên kết với câu sai cụ thể; 5 bước hoàn thành; idempotent (không tạo trống); mastery tracking 1/3/7 ngày.

### S6 — Hôm nay

**BR-S6.1:** Một kế hoạch duy nhất co giãn theo phút/ngày (mặc định 60).  
**AC:** Màn hình `/today` hiển thị kế hoạch duy nhất, co giãn theo minutes_per_day.

**BR-S6.2:** ≥ 50% thời gian là nói thành tiếng.  
**AC:** speech_minutes ≥ 0.5 × minutes trong daily_summary.

**BR-S6.3:** Tự đánh dấu xong từ activity_events (không tick tay).  
**AC:** Hoàn thành task dựa trên activity_events, không có checkbox tay.

**BR-S6.4:** Session Runner chạy liền mạch.  
**AC:** Chuyển từ task này sang task khác mà không cần reload trang.

**BR-S6.5:** Ngày bận 15' + Streak Freeze.  
**AC:** Có tùy chọn ngày bận (15 phút); có Streak Freeze (lưu streak khi nghỉ).

---

## 9. Nội dung (mục 12 spec)

- Câu văn nói tự nhiên, ngắn: A2 ≤ 25 từ, B1 ≤ 35, B2 ≤ 45
- Ngữ cảnh IT/BA và đời sống Việt Nam
- Nội dung do AI sinh đánh dấu `reviewed: false`
- Không sao chép nội dung bản quyền; YouTube chỉ nhúng; ghi `license_note`
- Script sinh nháp vào `content/**` (JSON có schema zod), chạy `scripts/audit-content.ts` để kiểm tra

---

## 10. Kiểm thử (mục 15 spec)

- Unit test (vitest): SRS, Fluency Engine, AI router logic
- Integration test: API routes, Server Actions, DB RPC
- E2E (Playwright): `--use-fake-ui-for-media-stream --use-file-for-fake-audio-capture` với file wav fixture
- Không skip/xoá test để cho xanh

---

## 11. Definition of Done (mục 16 spec)

| Mục | Tiêu chí | Trạng thái |
|-----|----------|------------|
| tsc --noEmit | 0 lỗi | Đạt |
| eslint | 0 lỗi | Đạt (42 warning) |
| vitest | Tất cả xanh | Đạt (11/11) |
| next build | PASS | Đạt |
| playwright | Spec liên quan + smoke route xanh | Chưa chạy đầy đủ |
| Không secret trong repo | Quét sạch | Một phần (PROJECT_MANIFEST đã redact) |
| Không mock dữ liệu user | Tất cả lưu Supabase + RLS | Một phần |
| Mọi route có loading + error | loading.tsx + error.tsx | Đạt cho (main) |
| AI chỉ qua router | lib/ai/router.ts | Chưa (speaking route gọi trực tiếp) |
| Offline Fallback | IndexedDB + đồng bộ | Chưa |
| Error Log | error_events, error_patterns, pattern_catalog | Chưa |
| Chunk SRS | 4 mức lưu DB | Một phần (srs.ts có) |
| Checkpoint 0/30/60/90 | Lưu DB | Một phần |

---

## 12. Hành trình nghiệm thu (mục 17 spec)

1. Đăng nhập (email/password hoặc Google OAuth)
2. Vào `/today`, xem kế hoạch hôm nay
3. Vào `/speaking`, chọn chủ đề + cấp độ, bắt đầu phiên 6 bước
4. Hoàn thành 5 câu hỏi + 3 câu phản xạ + tổng kết
5. Xem màn hình SUMMARY (3 lỗi, 5 cụm tự, fluency so với 7 ngày, Courage trước/sau)
6. Vào `/error-log`, xem lỗi đã ghi
7. Vào `/vocab`, xem Chunk SRS và từ mới
8. Kiểm tra streak/XP tăng đúng
9. Kiểm tra Offline Fallback (mất mạng, vẫn luyện được)
10. Kiểm tra Bài bù sinh từ câu sai

---

## 13. Quy tắc cấm (Hard Rules)

- Không in/log/commit/ghi secret vào file. Tài liệu chỉ ghi TÊN biến env.
- Không mock dữ liệu người dùng. localStorage/IndexedDB chỉ cache/nháp/hàng đợi offline.
- Không màn trắng: mọi route có loading.tsx + error.tsx; global-error.tsx; asArray/safeJson; zod; Server Action trả Result<T>; strict + noUncheckedIndexedAccess.
- AI chỉ qua lib/ai/router.ts; hỗ trợ AI_FORCE_FAIL=1.
- Không xoá dữ liệu học hiện có; không reset DB; chỉ thêm migration mới (0009 trở đi).
- Không push/deploy; không bật billing/mua dịch vụ trả phí chưa được đồng ý. Có thể commit cục bộ (feat(S<n>): ...).
- Múi giờ Asia/Ho_Chi_Minh; ngày học bắt đầu 03:00.
- UI tiếng Việt; nội dung tiếng Anh; mobile-first.
- XP qua award_xp(reason, ref_id, amount) (idempotent); hoạt động qua log_activity(...).
