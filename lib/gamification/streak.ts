/**
 * Logic streak (BR-1.4 / 8.18) — thuần, có test.
 * "Ngày học" bắt đầu 03:00 giờ VN (BR-G7): nếu là 00:00–02:59 thì thuộc ngày hôm trước.
 */

/** Chuyển timestamp → khoá ngày học (YYYY-MM-DD) theo múi giờ VN, lùi 3 giờ. */
export function studyDateKey(input: Date | string | number): string {
  const ms = new Date(input).getTime();
  // Chuyển sang "giờ tường VN" (UTC+7) rồi đọc các thành phần.
  const vn = new Date(ms + 7 * 60 * 60 * 1000);
  const y = vn.getUTCFullYear();
  const mo = vn.getUTCMonth();
  const da = vn.getUTCDate();
  const h = vn.getUTCHours();
  // Ngày học bắt đầu 03:00: nếu trước 03:00 thì thuộc ngày trước.
  const day = h < 3 ? da - 1 : da;
  const normalized = new Date(Date.UTC(y, mo, day));
  const yy = normalized.getUTCFullYear();
  const mm = String(normalized.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(normalized.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export type StreakResult = {
  current: number;
  freezesUsed: number;
  freezesLeft: number;
};

function prevDayKey(key: string): string {
  const d = new Date(key + "T03:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

function nextDayKey(key: string): string {
  const d = new Date(key + "T03:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Tính streak hiện tại từ tập ngày đã học.
 * - Đi lùi từ hôm nay (hoặc hôm qua nếu hôm nay chưa học) đếm chuỗi liên tiếp.
 * - Nếu gặp một ngày trống và còn lượt đóng băng (freeze), dùng 1 freeze để nhảy qua.
 * freezesPerMonth: số freeze tối đa mỗi tháng (mặc định 2).
 */
export function computeStreak(
  studyDates: string[],
  today: string,
  freezesPerMonth = 2,
): StreakResult {
  const set = new Set(studyDates);
  const maxFreezes = freezesPerMonth;

  // Điểm neo: hôm nay nếu đã học, ngược lại hôm qua nếu đã học; nếu không → 0.
  let cursor: string | null;
  if (set.has(today)) cursor = today;
  else if (set.has(prevDayKey(today))) cursor = prevDayKey(today);
  else return { current: 0, freezesUsed: 0, freezesLeft: maxFreezes };

  let current = 0;
  let freezesUsed = 0;

  for (let i = 0; i < 1000 && cursor; i++) {
    if (set.has(cursor)) {
      current += 1;
      cursor = prevDayKey(cursor);
      continue;
    }
    // Ngày trống: chỉ dùng freeze nếu phía trước (sớm hơn) có ngày đã học để nối.
    const earlier = prevDayKey(cursor);
    if (freezesUsed < maxFreezes && set.has(earlier)) {
      freezesUsed += 1;
      current += 1; // ngày đóng băng vẫn được tính vào streak
      cursor = earlier;
      continue;
    }
    break;
  }

  return { current, freezesUsed, freezesLeft: maxFreezes - freezesUsed };
}

/** Ngày kế tiếp (dùng cho lịch nhắc). */
export function tomorrowKey(today: string): string {
  return nextDayKey(today);
}