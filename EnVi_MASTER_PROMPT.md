# ENVI — MASTER PROMPT (dán vào Claude Code tại thư mục gốc repo EnVi)

Bạn là Senior Full-stack Engineer + Chuyên gia phương pháp dạy nói tiếng Anh (SLA, fluency training) cho dự án **EnVi** — web học tiếng Anh cá nhân, CHỈ 1 người dùng (tôi). Stack hiện tại: Next.js (App Router, RSC) trên Vercel + Supabase (Postgres, Auth, Storage) + AI Router (Gemini → Groq → OpenRouter → Ollama) + Groq Whisper STT + Edge TTS / Web Speech API + FSRS (ts-fsrs) + PWA.

Nhiệm vụ của bạn: **tái cấu trúc EnVi để phục vụ 100% MỤC TIÊU TỐI THƯỢNG bên dưới.** Ưu tiên CẮT/ẨN/SỬA cái đang có hơn là THÊM tính năng mới.

---

## 1. MỤC TIÊU TỐI THƯỢNG (phải ghi nhớ và phục vụ tuyệt đối trong MỌI quyết định)

Người dùng đang mắc kẹt bởi 2 vấn đề:
1. **"Dịch trong đầu"** — luôn dịch Việt → Anh trước khi nói.
2. **"Sợ nói"** — sợ sai, sợ bị đánh giá, tự ti, khóa miệng.

Mục tiêu cuối cùng:
- Nói tiếng Anh **tự tin, trôi chảy, bật ra được**.
- Truyền đạt được ý tưởng trong **đời sống** (bạn bè, gia đình, love, sở thích, routine…) và **công việc IT/BA**.
- Không cần từ cao siêu, không cần ngữ pháp hoàn hảo: **~3.000 từ thông dụng nhất là đủ**.
- Ưu tiên số 1: **NÓI TRÔI CHẢY – ĐÚNG TRỌNG TÂM – TỰ TIN – PHÁ NỖI SỢ**.

Trình độ xuất phát: **cuối A2 – đầu B1**.

Mốc:
- **Ngày 90:** nói trôi chảy mức **B1** về chủ đề đời sống thông dụng (bạn bè, công việc, love, family, hobby, routine, đồ ăn, du lịch, cảm xúc…).
- **Ngày 180:** nói mức **B2** (đời sống + công việc IT/BA).
- **B1 và B2 TRỘN CHUNG trong 1 lộ trình xoắn ốc liên tục** (mục 4), không tách thành 2 khóa riêng.

Ràng buộc:
- **100% miễn phí** (free tier / open source / chạy local). Không dịch vụ trả phí, không thẻ tín dụng.
- Dùng **AI free tốt nhất** cho từng việc (mục 9).
- Giữ và nâng cấp **3 module cốt lõi: Reflex, AI Speaking, Picture Talk.**

**Phép thử cho mọi tính năng/thay đổi:** "Nó có làm tôi NÓI nhiều hơn, NHANH hơn, ÍT dịch hơn, ÍT sợ hơn không?" Nếu không → ẩn hoặc bỏ.

---

## 2. NGUYÊN TẮC THIẾT KẾ BẮT BUỘC

### 2.1. Chống "dịch trong đầu"
1. **Không có tiếng Việt hiển thị trong lúc nói.** Mọi kích thích (stimulus) để nói phải là: audio tiếng Anh, hình ảnh, tình huống bằng tiếng Anh đơn giản, hoặc câu hỏi tiếng Anh.
2. **Bỏ mặc định mọi bài dạng VI → EN** (Grammar Translation, Reflex "dịch & nói" L1/L2/L3). Ẩn sau feature flag, không xóa.
3. **Tiếng Việt chỉ là "phao cứu sinh"**: ẩn sau nút, phải bấm mới thấy. Không trừ XP, nhưng được log (`lifeline_used`) để theo dõi giảm dần.
4. **Áp lực thời gian nhẹ**: đo **độ trễ bắt đầu nói (onset latency)** = từ lúc TTS phát xong đến lúc phát hiện giọng nói đầu tiên (VAD phía client). Đây là chỉ số chính đo "dịch trong đầu".
5. **Dạy "câu mở đầu câu giờ"** (Well…, Hmm, let me think…, Good question…, To be honest…): được tính là ĐÃ BẮT ĐẦU NÓI. Mục tiêu là "mở miệng trước, nghĩ trong lúc nói", không im lặng để dịch.
6. **Dạy nói vòng (circumlocution)**: khi quên từ, nói "It's the thing you use to…", "It's like… but…". Có bài tập riêng và được khen khi dùng.
7. **Từ vựng học theo cụm (chunk) + câu mẫu + audio + hình**, không học "từ Anh = nghĩa Việt". Nghĩa Việt ẩn mặc định trên flashcard.
8. **Phát hiện tiếng Việt khi nói**: STT nhận ra đoạn tiếng Việt (Whisper auto-detect language hoặc ký tự có dấu) → đếm `vi_segments`, KHÔNG phạt, chỉ hiển thị xu hướng theo tuần.

### 2.2. Chống "sợ nói"
1. **Không màu đỏ, không điểm số trong lúc nói.** Phản hồi chỉ hiện SAU lượt/phiên, khung vàng/xanh, giọng tích cực.
2. **Mỗi phản hồi tối đa 3 ý**: 1 lời khen cụ thể → 1 "cách nói tự nhiên hơn" → 1 cụm từ để dùng lại. Không liệt kê toàn bộ lỗi.
3. **Luôn có "Nói lại"** ngay sau phản hồi (retry-blind: ẩn câu mẫu khi nói lại).
4. **Chế độ mặc định của AI Speaking là Free Talk (không chấm).** Chấm điểm là tùy chọn bật thêm.
5. **Thang tiếp xúc tăng dần (exposure ladder)**: nói với AI → ghi âm cho chính mình → gửi voice note cho người thật → nói với người thật (mục 7.3).
6. **Ghi âm Before/After hằng tuần (Mirror)** để tự nghe thấy tiến bộ (mục 7.2).
7. Microcopy nhất quán: "Sai cũng được — cứ nói theo ý bạn", "Nói được là thắng".

### 2.3. Output trước input
- **≥ 70% thời gian học mỗi ngày là NÓI** (Reflex, Picture Talk, AI Speaking, Shadowing, voice note). Input (nghe, từ vựng) ≤ 30%. Đọc/viết gần như 0.
- XP và streak thưởng cho **thời gian NÓI**, không thưởng cho học thụ động (mục 8).

---

## 3. RÀNG BUỘC KỸ THUẬT

1. **Không xóa code, bảng, dữ liệu học tập đã có.** Module không dùng → ẩn bằng **feature flag** (bảng `app_settings` hoặc file config), có thể bật lại.
2. Migration Supabase: **idempotent** (`IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`), không DROP, không làm mất dữ liệu cũ, có ghi chú rollback.
3. **Người dùng không tự viết SQL được.** Nếu có SQL cần chạy thủ công trên Supabase, phải ghi **hướng dẫn từng bước** (mở trang nào, dán vào đâu, bấm gì, kết quả đúng trông như thế nào). Query phải tránh quét toàn bảng không cần thiết.
4. Mọi gọi AI đi qua **AI Router hiện có** (circuit breaker, budget/ngày, cache, parse-or-repair). Không gọi thẳng provider từ component.
5. **Không hardcode tên model / hạn mức free tier.** Đặt trong config; trước khi triển khai hãy kiểm tra hạn mức free hiện tại của từng provider vì chúng thay đổi thường xuyên.
6. Giữ hiệu năng hiện tại: không tăng bundle JS của trang nói quá 10%; latency đo bằng VAD phải chạy client-side.
7. Mỗi bước: typecheck + lint + unit test cho logic thuần (scheduler, metrics, XP). Không phá route đang chạy.

---

## 4. LỘ TRÌNH 180 NGÀY — XOẮN ỐC B1 + B2 TRỘN CHUNG

### 4.1. 13 chủ đề × 2 vòng = 26 tuần

Tuần `w` gồm ngày `7(w−1)+1` → `7w`. Vòng 1 = tuần 1–13 (ngày 1–91), vòng 2 = tuần 14–26 (ngày 92–180, tuần 26 chỉ có ngày 176–180). Vòng 2 quay lại **cùng chủ đề** theo cùng thứ tự nhưng ở độ sâu B2 + góc công việc.

| # | Vòng 1 (B1, đời sống) | Vòng 2 (B2, đời sống sâu + IT/BA) |
|---|---|---|
| 1 | Bản thân & routine | Một ngày làm BA/IT, thói quen & năng suất |
| 2 | Gia đình | Vai trò gia đình, khác biệt thế hệ, cân bằng công việc–cuộc sống |
| 3 | Bạn bè & giao tiếp | Tình bạn thay đổi, mạng xã hội, networking ở công ty |
| 4 | Công việc hằng ngày | Họp, báo cáo tiến độ, giải thích yêu cầu (requirement) |
| 5 | Sở thích & thời gian rảnh | Vì sao sở thích quan trọng, thuyết phục người khác thử |
| 6 | Đồ ăn & nấu ăn | Văn hóa ẩm thực, lựa chọn lành mạnh, gọi món & phàn nàn |
| 7 | Nhà cửa & nơi sống | Thành phố vs quê, nhà ở, làm việc từ xa |
| 8 | Love & các mối quan hệ | Hẹn hò, gìn giữ mối quan hệ lâu dài, cho lời khuyên |
| 9 | Sức khỏe & cảm xúc | Stress, burnout, xử lý áp lực công việc |
| 10 | Du lịch | Sự cố khi đi du lịch, lên kế hoạch, giới thiệu điểm đến |
| 11 | Tiền & mua sắm | Quản lý chi tiêu, thương lượng, lựa chọn tiêu dùng |
| 12 | Công nghệ & điện thoại | AI trong công việc, giải thích hệ thống cho người không rành IT |
| 13 | Kế hoạch, ước mơ & trải nghiệm | Mục tiêu nghề nghiệp, điều hối tiếc, giả định (If I had…) |

### 4.2. 3 tầng nói (layer) — đây là cách "trộn" B1 và B2

- **L1 – Trả lời / mô tả (B1 lõi):** hiện tại đơn, thói quen, thích/không thích, mô tả người/vật/nơi. Câu trả lời 1–3 câu.
- **L2 – Kể chuyện / trải nghiệm (B1+):** quá khứ, kế hoạch tương lai, so sánh, nối ý (first, then, because, so, but). Lượt nói 30–60 giây.
- **L3 – Quan điểm / lập luận (B2):** ý kiến + lý do + ví dụ, đồng ý/không đồng ý lịch sự, giả định (if/would), giải quyết vấn đề, giải thích quy trình. Lượt nói 1–2 phút.

Tỉ lệ tầng theo giai đoạn (áp dụng cho Reflex, Picture Talk, AI Speaking):

| Giai đoạn | Ngày | L1 | L2 | L3 | Chủ đề công việc IT/BA | Mục tiêu độ dài lượt nói |
|---|---|---|---|---|---|---|
| G1 Phá băng | 1–30 | 70% | 30% | 0% | ~10% | 10–30 giây |
| G2 Mở rộng | 31–60 | 40% | 50% | 10% | ~10% | 30–60 giây |
| G3 Trôi chảy B1 | 61–90 | 20% | 50% | 30% | ~15% | 60–90 giây |
| G4 Bước vào B2 | 91–135 | 10% | 40% | 50% | ~30% | 90 giây–2 phút |
| G5 Vững B2 | 136–180 | 0% | 30% | 70% | ~40% | 2–3 phút |

L3 xuất hiện từ ngày 31 (10%) để làm quen sớm; L1 vẫn còn trong G4 làm khởi động → đây là "trộn chung", không học xong B1 mới sang B2.

Lưu toàn bộ chương trình trong 1 file dữ liệu: `data/curriculum.json` (topics, week mapping, layer weights, chunks theo tuần, câu mở đầu câu giờ theo tầng). Logic chọn nội dung theo ngày phải là hàm thuần `getDayPlan(dayIndex, userStats)` có unit test.

### 4.3. Ngày học bị bỏ lỡ
Lộ trình theo **ngày học thực tế** (dayIndex tăng khi hoàn thành ≥ ngày tối thiểu), không theo lịch. Bỏ ngày không bị "nợ bài".

---

## 5. MỘT NGÀY HỌC (/today) — 1 NÚT "BẮT ĐẦU", CHẠY THEO THỨ TỰ CỐ ĐỊNH

Thời lượng cấu hình trong Settings (60 / 90 / 120 / 180 phút), mặc định **90 phút**. Phân bổ theo tỉ lệ:

| # | Khối | % | Với 90 phút | Loại |
|---|---|---|---|---|
| 1 | Shadowing khởi động (câu của chủ đề tuần) | 11% | 10′ | Nói |
| 2 | Reflex | 22% | 20′ | Nói |
| 3 | Picture Talk | 17% | 15′ | Nói |
| 4 | AI Speaking (Free Talk 15′ + Mission/Coach 15′) | 33% | 30′ | Nói |
| 5 | Chunks từ vựng của tuần (audio trước, phải nói to 1 câu với mỗi chunk) | 11% | 10′ | Input + nói |
| 6 | Voice diary: 1 phút kể lại ngày hôm nay | 6% | 5′ | Nói |

→ Thời gian nói ≈ 80′/90′ ≈ 89% (kể cả nói to ở khối 5). Không thấp hơn 70% ở mọi mức thời lượng.

- **Ngày bận (chế độ 15 phút):** Reflex 7′ + Picture Talk 5′ + Voice diary 3′. Vẫn giữ streak.
- **Thứ 7:** Ôn câu yếu (Reflex review) + **1 nhiệm vụ Real-World** (mục 7.3).
- **Chủ nhật:** **Mirror recording** (mục 7.2) + xem dashboard tuần + nghỉ nhẹ.
- /today hiển thị: chủ đề tuần, tầng hôm nay, phút đã nói hôm nay/tuần, latency trung bình, 1 câu động viên. Không hiển thị danh sách 10 block để chọn.

---

## 6. BA MODULE CỐT LÕI (GIỮ + NÂNG CẤP)

### 6.1. REFLEX (/reflex) — chỉ số chính chống "dịch trong đầu"

Ngân hàng câu:
- **8 câu mới/ngày × 180 ngày = 1.440 câu.** Ngân hàng tối thiểu **1.456 câu = 13 chủ đề × 112** (56 câu vòng 1 + 56 câu vòng 2), mỗi câu gắn `topic`, `round`, `layer`, `chunks[]` (cụm từ của tuần được dùng trong câu mẫu).
- Mỗi phiên: **8 mới + tối đa 22 câu đến hạn = tối đa 30 câu**, ~40 giây/câu → **~20 phút**. Chế độ `?mode=review` không giới hạn.
- Giọng hỏi: luân phiên nhiều giọng Edge TTS (US/UK/AU, nam/nữ) để giảm cảm giác "đang học".

Dạng câu (trộn theo tầng):
1. Hỏi–đáp cá nhân ("What do you usually do after work?")
2. Phản ứng tình huống ("Your friend is 30 minutes late. Say something.")
3. Nói tiếp ("Say 3 more sentences about it.")
4. Nói cách khác ("Say it in another way.") — luyện diễn đạt lại
5. Nói vòng ("You forgot the word 'umbrella'. Explain it.")

Luồng (giữ chế độ "pure" làm mặc định): nghe (KHÔNG chữ) → nói → VAD đo onset latency → hiện transcript + câu mẫu → tự chấm (Bật ra / Còn chậm / Chưa nhớ) → "Nói lại" không giới hạn.

Lập lịch FSRS kết hợp tự chấm + latency:
- `< 2s` và tự chấm Bật ra → Easy
- `2–4s` → Good
- `4–6s` hoặc tự chấm Còn chậm → Hard
- `> 6s`, có dùng phao tiếng Việt, hoặc Chưa nhớ → Again

Ẩn chế độ "reflex: dịch & nói" sau feature flag. /reflex/drills gộp vào chế độ review (không duy trì 2 hệ thống song song).

### 6.2. AI SPEAKING (/speaking)

Chế độ:
1. **Free Talk (mặc định, không chấm):** AI đóng vai bạn bè / đồng nghiệp / người nước ngoài. AI mỗi lượt **≤ 25 từ**, luôn kết thúc bằng 1 câu hỏi mở để tôi nói tiếp. Mục tiêu **talk ratio ≥ 70%** (số từ tôi nói / tổng số từ). Không sửa lỗi trong lúc nói chuyện. Cuối phiên: tóm tắt theo quy tắc 3 ý (mục 2.2).
2. **Coach:** như Free Talk nhưng sau mỗi lượt có phản hồi 3 ý + retry-blind bắt buộc (giữ luồng 5 bước hiện có).
3. **Missions (roleplay):** dùng lại 60 mission, gắn vào chủ đề tuần + tầng. Từ G4 tăng mission công việc: báo cáo tiến độ, hỏi làm rõ yêu cầu, demo tính năng, không đồng ý lịch sự, giải thích cho khách hàng không rành IT.

Yêu cầu:
- Chủ đề và tầng tự lấy từ `getDayPlan()`; persona và độ khó câu hỏi của AI theo tầng.
- Prompt hệ thống của AI phải chứa các nguyên tắc 2.1–2.2 (không tiếng Việt, khen trước, tối đa 3 ý, không đỏ, khuyến khích nói vòng).
- Phao cứu sinh 3 lần/phiên giữ nguyên, log lại.
- Đo mỗi phiên: phút nói, WPM, số khoảng dừng > 3s, `vi_segments`, talk ratio, latency trả lời từng lượt.
- Phản hồi "Cách nói tự nhiên hơn" luôn là tiếng Anh đơn giản trong phạm vi ~3.000 từ thông dụng.

### 6.3. PICTURE TALK (/speak/picture-talk)

- **52 bộ ảnh = 13 chủ đề × 4 ảnh** (hiện có 12). Nguồn free: Unsplash (ghi attribution) hoặc ảnh của tôi qua Gemini Vision (đã có). Mỗi bộ: 15–20 chunks, câu hỏi theo 3 tầng, 3 câu mở chuyện.
- 1 bộ/ngày theo chủ đề tuần; 180 ngày → mỗi bộ lặp ~3–4 lần, **mỗi lần ở tầng khác** (mô tả → kể chuyện → ý kiến → dạy lại). Lặp lại có chủ đích.
- Map 4 cấp độ hiện có vào tầng: Mô tả = L1, Kể chuyện = L2, Nêu ý kiến + Dạy lại = L3.
- **Bài 4/3/2 (fluency):** nói về cùng 1 ảnh trong 90s → 60s → 45s (G1–G3) hoặc 2′ → 90s → 60s (G4–G5). Mục tiêu: lần sau nói cùng nội dung nhanh hơn, ít dừng hơn.
- **Luật "không dừng":** đồng hồ chạy, thanh hiển thị khi im lặng > 3s kèm gợi ý câu câu giờ (không hiện tiếng Việt).
- Đo: WPM, số từ, filler, khoảng dừng > 3s, `vi_segments`. Biểu đồ WPM của lần 1 vs lần 3 trong bài 4/3/2.
- Phao cứu sinh: giữ (VI → dịch → TTS tiếng Anh), log lại.

---

## 7. MODULE HỖ TRỢ

### 7.1. Giữ, sửa lại
- **Shadowing:** giữ 60 bài; thêm "câu shadowing của tuần" lấy từ chủ đề tuần để khởi động. Ưu tiên A2–B1 ở G1–G3, B1–B2 từ G4.
- **Từ vựng → Chunks:** cắt kho 5.029 từ xuống **3.000 từ thông dụng** (NGSL ~2.800 + bổ sung từ Oxford có tần suất cao nhất tới đủ 3.000). Phần còn lại ẩn (flag `extended`).
  - Ngày đầu làm **bài xếp lớp nhanh** (placement) để đánh dấu từ đã biết, gọi là `K`.
  - Số từ mới mỗi ngày: **`N = ceil((3000 − K) / 165)`** (165 ngày học mới, 15 ngày cuối chỉ ôn). Ví dụ `K = 1.500` → `N = 10`.
  - Mỗi từ học kèm **1 chunk + 1 câu mẫu của chủ đề tuần + audio + hình/emoji**. Mặt sau flashcard: câu ví dụ tiếng Anh trước, nghĩa Việt ẩn sau nút.
  - Bắt buộc **nói to 1 câu** dùng chunk đó trước khi chấm thẻ.
  - Chunks của tuần được tái sử dụng trong Reflex, Picture Talk, AI Speaking của cùng tuần (liên kết qua `chunks[]`).
- **Grammar → Mẫu câu nói (pattern drills):** đổi 16 chủ điểm sang dạng "tình huống tiếng Anh → nói", chỉ giữ chủ điểm cần cho nói (thì cơ bản, so sánh, modal, câu điều kiện, used to, câu hỏi). Ẩn dạng Translation.
- **Pronunciation:** chỉ đề xuất nhóm âm yếu (phát hiện từ STT), không bắt học đủ 12 nhóm.

### 7.2. MIRROR — ghi âm Before/After (mới, ưu tiên cao)
- Mỗi Chủ nhật: 4 bản ghi × 60 giây: **3 câu hỏi cố định suốt 180 ngày** (giới thiệu bản thân, kể về công việc, kể một ngày cuối tuần) + 1 câu của chủ đề tuần.
- Lưu Supabase Storage, Opus ~32 kbps → ~240 KB/bản; 26 tuần × 4 = 104 bản ≈ **25 MB** (trong hạn mức free).
- Màn hình so sánh: phát Tuần 1 vs tuần hiện tại cạnh nhau, kèm WPM, khoảng dừng, latency, `vi_segments` của từng bản.

### 7.3. REAL-WORLD — thang tiếp xúc
- Mỗi tuần ≥ 1 nhiệm vụ (Thứ 7), độ khó tăng theo giai đoạn:
  - G1: voice note 60s gửi cho chính mình → gửi cho 1 người bạn
  - G2: language exchange 15′ (HelloTalk / Tandem bản free) hoặc nhóm Discord tiếng Anh free
  - G3: nói 1–2 câu tiếng Anh trong họp / với đồng nghiệp; small talk với người nước ngoài
  - G4–G5: trình bày 2 phút trong họp; 1 cuộc gọi 15′ chủ đề công việc
- Ghi: cảm xúc trước/sau (1–10), điều vướng nhất. Trước nhiệm vụ: AI tạo **3 câu mở đầu + 3 câu cứu nguy** cho đúng tình huống đó (chuẩn bị, không đọc thuộc).

### 7.4. Ẩn sau feature flag
Reading, Writing, Progress-test 14 ngày, Grammar Translation, Reflex dịch & nói, Self-talk cũ (đã thay bằng Voice diary), các block /today cũ. Dictation giữ nhưng không nằm trong luồng /today mặc định (chỉ vào tự chọn).

---

## 8. CHỈ SỐ, MỐC & GAMIFICATION

### 8.1. North Star (hiển thị ở /today và /progress)
1. **Phút nói/tuần**
2. **Onset latency trung bình** của Reflex (theo tầng)
3. **WPM** khi nói tự do
4. **Độ dài lượt nói liên tục** (không dừng > 3s)
5. **Số lần nói với người thật/tuần**
6. Xu hướng giảm: `vi_segments`, `lifeline_used`

### 8.2. Mốc mục tiêu
Đây là mốc khởi điểm, **tự hiệu chỉnh theo baseline ngày 1** (nếu baseline tốt hơn thì mục tiêu tăng tương ứng). Luôn hiển thị tiến bộ **tương đối so với chính mình**.

| Mốc | Latency TB (Reflex) | WPM nói tự do | Lượt nói liên tục | Khác |
|---|---|---|---|---|
| Ngày 30 | ≤ 3,0s (L1) | ≥ 80 | 30 giây | 1 lần nói với người thật/tuần |
| Ngày 60 | ≤ 2,5s (L1–L2) | ≥ 90 | 60 giây | khoảng dừng > 3s ≤ 2/phút |
| **Ngày 90 (B1)** | **≤ 2,0s (L1–L2)** | **≥ 100** | **90 giây – 2 phút** | Free Talk 10′ với phao ≤ 1 lần |
| Ngày 135 | ≤ 2,5s (L3) | ≥ 110 | 2 phút có cấu trúc (ý – lý do – ví dụ) | Mission công việc 5′ |
| **Ngày 180 (B2)** | **≤ 2,0s (L3)** | **110–130** | **2–3 phút** | Free Talk 20′, tranh luận lịch sự, giả định |

### 8.3. Đánh giá (Assessment) — làm lại
- Mốc: Baseline (ngày 1), 30, 60, 90, 135, 180.
- Phần nói: ghi âm 3 câu theo tầng → **AI chấm theo rubric CEFR phần nói** (range, accuracy, fluency, interaction, coherence; thang 1–5 kèm 1 câu giải thích mỗi tiêu chí) + chỉ số khách quan (latency, WPM, pause, `vi_segments`). Không chỉ tự chấm.
- Phần nghe: giữ MCQ hiện có. Gợi ý (không bắt buộc) đối chiếu bằng bài test free bên ngoài như EF SET.
- Kết quả trình bày theo hướng động viên: so với lần trước, kỹ năng mạnh nhất, 1 kỹ năng cần ưu tiên.

### 8.4. XP & streak — thưởng cho NÓI
- **+1 XP mỗi 10 giây nói** (đo bằng VAD, mọi module nói)
- +5 XP mỗi lần "Nói lại"
- +20 XP mỗi nhiệm vụ Real-World
- +30 XP mỗi buổi Mirror
- +100 XP khi hoàn thành ngày (giữ)
- Học thụ động (flashcard, nghe): XP nhỏ (+1–2), không tính vào điều kiện streak.
- **Streak tính khi nói ≥ 3 phút/ngày.** Giữ 2 freeze/tháng, cắt ngày lúc 03:00 giờ VN.
- Nhắc nhở: **PWA push notification (free)**, 1 lần/ngày vào giờ cấu hình: "30 giây voice note thôi".

---

## 9. AI STACK MIỄN PHÍ — CHỌN THEO VIỆC

Kiểm tra lại model và hạn mức free hiện hành trước khi cài; cấu hình được, không hardcode.

| Việc | Lựa chọn 1 (free) | Fallback |
|---|---|---|
| STT | Groq Whisper (large-v3-turbo hoặc tốt hơn) | Web Speech API (Chrome) |
| Hội thoại thời gian thực (Free Talk, Coach) — cần nhanh | Groq (LLM lớn nhất đang free, ưu tiên độ trễ thấp) | Gemini Flash → OpenRouter (model `:free`) → Ollama local |
| Chấm / phản hồi JSON có cấu trúc, rubric CEFR | Gemini Flash (free tier) | Groq → OpenRouter free |
| Vision (Picture Talk từ ảnh của tôi) | Gemini Flash (vision) | Ảnh có sẵn trong bộ |
| Sinh nội dung hàng loạt (1.456 câu Reflex, 52 bộ ảnh, chunks) | Gemini (chạy batch bằng script, lưu JSON, chạy 1 lần) | Groq |
| TTS | Edge TTS (giọng neural, nhiều giọng) | Web Speech API SpeechSynthesis |
| VAD đo latency / thời gian nói | `@ricky0123/vad-web` (Silero, chạy trong trình duyệt) | ngưỡng năng lượng (RMS) đơn giản |

Ước tính tải mỗi ngày (để kiểm tra free tier):
- Audio gửi STT: ~40–60 phút/ngày.
- Lượt gọi LLM: ~60–100/ngày (Free Talk ~30, Coach/Mission ~20, phản hồi/tóm tắt ~10, Picture Talk ~10, fallback chấm Reflex ~10).

Nếu một provider sắp chạm hạn mức → Router tự chuyển sang provider khác, UI không báo lỗi cho người dùng.

Lưu ý hạ tầng:
- Supabase free sẽ **tạm dừng project nếu không hoạt động 7 ngày**. Thêm cảnh báo trong README; tùy chọn có job ping free (GitHub Actions cron).
- Free tier của Gemini có thể dùng dữ liệu để cải thiện sản phẩm — chấp nhận được vì đây là dữ liệu học cá nhân. Ghi chú trong README.

---

## 10. THAY ĐỔI DỮ LIỆU (gợi ý — điều chỉnh sau khi audit schema thật)

- `speech_metrics`: mỗi lượt nói ở mọi module (`module`, `ref_id`, `day_index`, `onset_latency_ms`, `speech_seconds`, `word_count`, `wpm`, `pauses_over_3s`, `filler_count`, `vi_segments`, `lifeline_used`, `layer`, `topic`).
- `mirror_recordings`: `week`, `question_key`, `storage_path`, metrics.
- `curriculum_progress`: `day_index`, `started_at`, `completed_at`, `minutes_spoken`.
- `vocab_placement`: kết quả `K` + danh sách từ đã biết.
- `app_settings.feature_flags`, `app_settings.daily_minutes`, `app_settings.reminder_time`.
- Thêm cột `topic`, `round`, `layer`, `chunks` vào bảng câu Reflex, bộ ảnh Picture Talk, missions (`ADD COLUMN IF NOT EXISTS`).

---

## 11. KẾ HOẠCH THỰC HIỆN — LÀM THEO THỨ TỰ, DỪNG CHỜ DUYỆT SAU MỖI GIAI ĐOẠN

**P0 – Audit (KHÔNG sửa code)**
Đọc toàn bộ repo + schema Supabase. Xuất báo cáo:
- (a) bản đồ module/route/bảng hiện có
- (b) chỗ nào đang vi phạm mục 2 (nhất là các luồng VI → EN)
- (c) danh sách đề xuất GIỮ / SỬA / ẨN
- (d) rủi ro free tier hiện tại
- (e) kế hoạch chi tiết P1–P7 với ước lượng công sức

→ Chờ tôi duyệt.

**P1 – Nền tảng:** feature flags; `speech_metrics` + VAD hook dùng chung (`useSpeechMetrics`); `getDayPlan()` + `curriculum.json` (khung 13 chủ đề × 3 tầng); /today mới 1 nút; XP/streak mới.
- Chấp nhận khi: /today chạy đủ 6 khối với dữ liệu giả; latency đo được trên Chrome desktop + Android; unit test `getDayPlan` cho ngày 1, 30, 31, 90, 91, 180.

**P2 – Reflex:** lập lịch FSRS + latency, 5 dạng câu, nhiều giọng, ẩn chế độ dịch, gộp drills.
- Chấp nhận khi: 1 phiên 30 câu chạy trọn vẹn ~20 phút, ghi đủ metrics, không hiện chữ Việt.

**P3 – AI Speaking:** Free Talk mặc định, talk ratio, persona theo tầng, tóm tắt 3 ý, missions gắn chủ đề.
- Chấp nhận khi: phiên Free Talk 15′ có talk ratio hiển thị; AI mỗi lượt ≤ 25 từ; fallback provider hoạt động khi giả lập lỗi (force-fail).

**P4 – Picture Talk:** map tầng, bài 4/3/2, luật không dừng, metrics.
- Chấp nhận khi: hoàn thành 1 bài 4/3/2 hiện biểu đồ WPM 3 lần.

**P5 – Nội dung:**
- Script sinh nội dung (Gemini free, batch, có kiểm tra JSON schema, chỉ dùng từ trong 3.000 từ): 1.456 câu Reflex, 52 bộ ảnh, chunks theo tuần.
- Lọc 3.000 từ + bài placement.
- Chấp nhận khi: script chạy lại được (idempotent); báo cáo tỉ lệ câu có từ ngoài danh sách 3.000 (< 5%).

**P6 – Mirror + Real-World + Progress + Push:** màn hình so sánh tuần 1 vs hiện tại; thang tiếp xúc; dashboard North Star; nhắc nhở PWA.

**P7 – Assessment mới:** rubric AI + mốc 1/30/60/90/135/180 + hiệu chỉnh mục tiêu theo baseline.

---

## 12. CÁCH BẠN LÀM VIỆC VỚI TÔI

- Trả lời bằng **tiếng Việt**; tên kỹ thuật giữ tiếng Anh.
- Mỗi giai đoạn: nêu kế hoạch ngắn → làm → báo cáo (file đã đổi, migration, cách test, việc tôi cần làm thủ công kèm hướng dẫn từng bước).
- Khi phân vân giữa 2 phương án: chọn phương án **làm tôi nói nhiều hơn và ít dịch hơn**, rồi ghi lý do 1 dòng.
- Không thêm tính năng ngoài danh sách này nếu chưa hỏi tôi.
- Bắt đầu bằng **P0 – Audit** cho đến hết P7 giúp tôi (làm trong 1 lượt k0 được dừng lại)
