/**
 * Streak logic v2 — requires ≥3 minutes speaking per day for streak.
 * "Study day" starts at 03:00 VN time.
 */

export function studyDateKey(input: Date | string | number): string {
  const ms = new Date(input).getTime();
  const vn = new Date(ms + 7 * 60 * 60 * 1000);
  const y = vn.getUTCFullYear();
  const mo = vn.getUTCMonth();
  const da = vn.getUTCDate();
  const h = vn.getUTCHours();
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

export type SpeakingDay = {
  dateKey: string;
  speakingMinutes: number;
};

function prevDayKey(key: string): string {
  const d = new Date(key + "T03:00:00Z");
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

const MIN_SPEAKING_MINUTES_FOR_STREAK = 3;

export function computeStreak(
  speakingDays: SpeakingDay[],
  today: string,
  freezesPerMonth = 2,
): StreakResult {
  const map = new Map(speakingDays.map((d) => [d.dateKey, d.speakingMinutes]));
  const maxFreezes = freezesPerMonth;

  let cursor: string | null;
  if ((map.get(today) ?? 0) >= MIN_SPEAKING_MINUTES_FOR_STREAK) {
    cursor = today;
  } else if ((map.get(prevDayKey(today)) ?? 0) >= MIN_SPEAKING_MINUTES_FOR_STREAK) {
    cursor = prevDayKey(today);
  } else {
    return { current: 0, freezesUsed: 0, freezesLeft: maxFreezes };
  }

  let current = 0;
  let freezesUsed = 0;

  for (let i = 0; i < 1000 && cursor; i++) {
    const minutes = map.get(cursor) ?? 0;
    if (minutes >= MIN_SPEAKING_MINUTES_FOR_STREAK) {
      current += 1;
      cursor = prevDayKey(cursor);
      continue;
    }
    // Day has some minutes but < 3, or day not in map (0 minutes)
    const earlier = prevDayKey(cursor);
    const earlierMinutes = map.get(earlier) ?? 0;
    const cursorHasEntry = map.has(cursor);
    const cursorHasLowMinutes = cursorHasEntry && minutes > 0 && minutes < MIN_SPEAKING_MINUTES_FOR_STREAK;
    
    // Only use freeze for completely missing days (not in map), not for days with low minutes
    if (!cursorHasEntry && freezesUsed < maxFreezes && earlierMinutes >= MIN_SPEAKING_MINUTES_FOR_STREAK) {
      freezesUsed += 1;
      current += 1;
      cursor = earlier;
      continue;
    }
    // If day has low minutes (< 3), it breaks the streak - no freeze allowed
    break;
  }

  return { current, freezesUsed, freezesLeft: maxFreezes - freezesUsed };
}

export function tomorrowKey(today: string): string {
  const d = new Date(today + "T03:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

export function getMinSpeakingMinutesForStreak(): number {
  return MIN_SPEAKING_MINUTES_FOR_STREAK;
}

export function isSpeakingDayValid(speakingMinutes: number): boolean {
  return speakingMinutes >= MIN_SPEAKING_MINUTES_FOR_STREAK;
}