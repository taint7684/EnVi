import { dateOnlyVN, dayOfWeekVN } from "@/lib/date-vn";

export type ForecastDay = {
  date: string;
  label: string;
  due: number;
};

const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"] as const;

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

export function buildReviewForecast(
  dueAtList: string[],
  now: Date,
  days = 7,
): ForecastDay[] {
  const todayStr = dateOnlyVN(now);
  const index = new Map<string, number>();
  const buckets: ForecastDay[] = [];

  for (let i = 0; i < days; i++) {
    const d = addDays(now, i);
    const dateStr = dateOnlyVN(d);
    index.set(dateStr, i);
    const label =
      i === 0
        ? "Hôm nay"
        : i === 1
          ? "Ngày mai"
          : WEEKDAYS[dayOfWeekVN(d)];
    buckets.push({ date: dateStr, label, due: 0 });
  }

  for (const dueAt of dueAtList) {
    const dueStr = dateOnlyVN(new Date(dueAt));
    if (dueStr <= todayStr) {
      buckets[0]!.due += 1;
      continue;
    }
    const i = index.get(dueStr);
    if (i !== undefined) buckets[i]!.due += 1;
  }

  return buckets;
}