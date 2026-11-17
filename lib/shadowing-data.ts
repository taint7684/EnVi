import shadowingLessons from "@/data/shadowing-lessons.json";

export type ShadowingSegment = {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
};

export type ShadowingLesson = {
  id: string;
  youtubeId: string;
  title: string;
  titleVi: string;
  level: string;
  duration: string;
  transcript: ShadowingSegment[];
};

export const SHADOWING_LESSONS = shadowingLessons as ShadowingLesson[];

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}