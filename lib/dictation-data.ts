import dictationLessons from "@/data/dictation-lessons.json";

export type DictationLesson = {
  id: string;
  title: string;
  titleVi: string;
  level: string;
  duration: string;
  videoUrl: string;
  thumbnail: string;
  transcript: string;
};

export const DICTATION_LESSONS = dictationLessons as DictationLesson[];