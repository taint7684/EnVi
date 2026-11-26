/**
 * XP Logic v2 — +1 XP per 10 seconds of speaking.
 * All speaking activities count: Reflex, Picture Talk, AI Speaking, Shadowing, Chunks, Voice Diary.
 */

export const XP_PER_10_SEC = 1;
export const XP_PER_MINUTE = 6; // 60s / 10s = 6

export type XpBreakdown = {
  activity: string;
  speakingSeconds: number;
  xp: number;
};

export function calculateXpFromSpeakingSeconds(speakingSeconds: number): number {
  return Math.floor(speakingSeconds / 10) * XP_PER_10_SEC;
}

export function calculateXpFromSpeakingMinutes(speakingMinutes: number): number {
  return Math.floor(speakingMinutes * 60 / 10) * XP_PER_10_SEC;
}

export function calculateXpBreakdown(activities: Array<{ activity: string; speakingSeconds: number }>): XpBreakdown[] {
  return activities.map((a) => ({
    activity: a.activity,
    speakingSeconds: a.speakingSeconds,
    xp: calculateXpFromSpeakingSeconds(a.speakingSeconds),
  }));
}

export function calculateTotalXp(breakdown: XpBreakdown[]): number {
  return breakdown.reduce((sum, b) => sum + b.xp, 0);
}

export function getDailyXpTarget(dayPlanSpeakingMinutes: number): number {
  return dayPlanSpeakingMinutes * XP_PER_MINUTE;
}

export function getXpPerMinute(): number {
  return XP_PER_MINUTE;
}

export function getXpPer10Seconds(): number {
  return XP_PER_10_SEC;
}