# Hướng dẫn sao lưu Production — EnVi (ricthhogtmgxoyjstfkz)
# Project ở region: aws-0-ap-northeast-1 (Tokyo)
# Connection pooler: aws-0-ap-northeast-1.pooler.supabase.com:5432
# User: postgres.ricthhogtmgxoyjstfkz
#
# ============================================================
# BƯỚC 1: Lấy DB password từ Supabase Dashboard
# ============================================================
# 1. Mở: https://supabase.com/dashboard/project/ricthhogtmgxoyjstfkz/settings/database
# 2. Chọn đúng project: Learn English (ricthhogtmgxoyjstfkz)
# 3. Vào mục: Database (menu trái) → Connection Info
# 4. Tìm: "Connection string" → chọn tab "URI"
# 5. Copy chuỗi kết nối, dạng:
#    postgresql://postgres.ricthhogtmgxoyjstfkz:[YOUR-PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres
# 6. Thay [YOUR-PASSWORD] bằng mật khẩu thật
#
# ============================================================
# BƯỚC 2: Sao lưu bằng pg_dump (chạy trên máy, trong Docker container QA)
# ============================================================
# Mở PowerShell, chạy lệnh sau (thay [PASSWORD] và [CONNECTION_STRING]):
#
# docker exec supabase_db_envi-qa pg_dump ^
#   "postgresql://postgres.ricthhogtmgxoyjstfkz:[PASSWORD]@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres" ^
#   --schema=public --schema=auth ^
#   --no-owner --no-privileges ^
#   -f /tmp/envi_production_backup.sql
#
# Sau đó copy file backup ra ngoài container:
# docker cp supabase_db_envi-qa:/tmp/envi_production_backup.sql C:\Users\LENOVO\Desktop\EnVi\scripts\envi_production_backup.sql
#
# ============================================================
# BƯỚC 3 (hoặc thay thế): Sao lưu bằng Supabase CLI
# ============================================================
# Nếu muốn dùng Supabase CLI:
#
# npx supabase login
#   → Mở link https://supabase.com/dashboard/cli/confirm?token=... → copy token → dán vào terminal
#
# npx supabase link --project-ref ricthhogtmgxoyjstfkz
#   → Nhập DB password khi được hỏi
#
# npx supabase db dump -f scripts/envi_production_backup.sql --schema public --schema auth
#
# ============================================================
# BƯỚC 4: Xác minh backup
# ============================================================
# Kiểm tra file tồn tại và có nội dung:
# Get-Item scripts/envi_production_backup.sql | Select-Object Name, Length
#
# Xem 20 dòng đầu:
# Get-Content scripts/envi_production_backup.sql -Head 20
#
# Tìm "CREATE TABLE" để xác nhận có schema:
# Select-String -Path scripts/envi_production_backup.sql -Pattern "CREATE TABLE" | Select-Object -First 5
#
# Tìm "COPY" để xác nhận có data:
# Select-String -Path scripts/envi_production_backup.sql -Pattern "^COPY " | Select-Object -First 5
#
# ============================================================
# BƯỚC 5: Đảm bảo file backup NGOÀI Git
# ============================================================
# File backup nên ở ngoài repo hoặc trong .gitignore.
# Kiểm tra .gitignore đã có chưa:
# Select-String -Path .gitignore -Pattern "backup"
#
# Nếu chưa, thêm dòng: scripts/*backup*.sql
# Hoặc đặt file ở: C:\Users\LENOVO\AppData\Local\Temp\kilo\envi_production_backup.sql