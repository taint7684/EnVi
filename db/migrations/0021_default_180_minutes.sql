-- S11d: mac dinh minutes_per_day = 180 phut cho tai khoan moi.
-- User cu giu nguyen config da chon (khong ghi de). User moi se nhan 180.
-- Spec 8.1 goc la 60, nhung quyet dinh cuoi: tai khoan moi mac dinh 180 phut.

alter table public.profiles alter column minutes_per_day set default 180;