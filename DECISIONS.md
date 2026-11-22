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
