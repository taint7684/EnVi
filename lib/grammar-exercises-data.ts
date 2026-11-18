import raw from "@/data/grammar-exercises.json";

export type GrammarMcq = {
  id: number;
  question: string;
  options: string[];
  answer: number;
};

export type GrammarFill = {
  id: number;
  question: string;
  answer: string;
};

export type GrammarTopicExercise = {
  topicId: string;
  name: string;
  nameVi: string;
  mcq: GrammarMcq[];
  fill: GrammarFill[];
};

export const GRAMMAR_EXERCISES = raw as GrammarTopicExercise[];

export function getGrammarExercises(topicId: string): GrammarTopicExercise | undefined {
  return GRAMMAR_EXERCISES.find((t) => t.topicId === topicId);
}