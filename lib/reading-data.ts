import readingPassages from "@/data/reading-passages.json";

export type ReadingQuestion = {
  id: number;
  question: string;
  options: string[];
  answer: number;
};

export type ReadingPassage = {
  id: string;
  level: string;
  title: string;
  titleVi: string;
  wordCount: number;
  text: string;
  questions: ReadingQuestion[];
};

export const READING_PASSAGES = readingPassages as ReadingPassage[];

export const READING_LEVELS = ["A2", "B1", "B2"] as const;