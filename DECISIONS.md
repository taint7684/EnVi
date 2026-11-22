# EnVi — DECISIONS.md (nhật ký quyết định kỹ thuật)

## Quy tắc quyết định
- Ưu tiên phương án làm người dùng NÓI NHIỀU HƠN, ÍT DỊCH HƠN, ÍT SỢ HƠN.
- Không commit secret; không mock dữ liệu người dùng; không màn trắng.
- Chỉ thêm migration mới (`db/migrations/0011_*` trở đi), không xoá dữ liệu cũ.

## Quyết định (điền khi thực thi S0→S11)
- [S0] `.env.example`: giữ chỉ tên biến, xoá giá trị thật (rotate key do người dùng thực hiện bên ngoài repo).
- [S0] `docs/MASTER_SPEC.md`: tạo từ spec v2.0 đã được duyệt.
- [S0] `PROJECT_MANIFEST.md`, `DECISIONS.md`, `CHANGELOG.md`: tạo khởi tạo.
