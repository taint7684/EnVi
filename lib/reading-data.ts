import readingPassages from "@/data/reading-passages.json";
import type { ReadingPassage } from "./reading/types";

export const READING_PASSAGES = readingPassages as unknown as ReadingPassage[];

export { READING_LEVELS } from "./reading/types";
export type {
  ReadingPassage,
  ReadingQuestion,
  ReadingVocabularyItem,
  ReadingExercise,
  ReadingProgress,
  DailyReadingAssignment,
} from "./reading/types";