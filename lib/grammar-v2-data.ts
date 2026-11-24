import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { GrammarV2Question, MindMap } from "@/lib/grammar-v2-types";

export type {
  TranslationQuestion,
  ErrorCorrectionQuestion,
  VerbConjugationQuestion,
  MindMapBranch,
  MindMap,
  GrammarV2Question,
} from "@/lib/grammar-v2-types";

export {
  checkTranslation,
  checkErrorCorrection,
  checkVerbConjugation,
} from "@/lib/grammar-v2-types";

function loadJsonl(filePath: string): any[] {
  if (!fs.existsSync(filePath)) return [];
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean);
  const items: any[] = [];
  for (const line of lines) {
    try { items.push(JSON.parse(line)); } catch { /* skip bad lines */ }
  }
  return items;
}

let _cache: { questions: GrammarV2Question[]; mindmaps: Map<string, MindMap> } | null = null;

function load(): { questions: GrammarV2Question[]; mindmaps: Map<string, MindMap> } {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "data", "grammar-v2.jsonl");
  const items = loadJsonl(filePath);
  const questions: GrammarV2Question[] = [];
  const mindmaps = new Map<string, MindMap>();

  for (const item of items) {
    if (item._type === "mindmap" && item.data) {
      mindmaps.set(item._topicId, { topic_id: item._topicId, data: item.data });
    } else if (item.exercise_type && item.topic_id) {
      questions.push(item as GrammarV2Question);
    }
  }

  _cache = { questions, mindmaps };
  return _cache;
}

export function getGrammarV2Questions(topicId?: string, exerciseType?: string): GrammarV2Question[] {
  const { questions } = load();
  return questions.filter((q) => {
    if (topicId && q.topic_id !== topicId) return false;
    if (exerciseType && q.exercise_type !== exerciseType) return false;
    return true;
  });
}

export function getMindMap(topicId: string): MindMap | null {
  const { mindmaps } = load();
  return mindmaps.get(topicId) ?? null;
}

export function getGrammarV2Stats(): { total: number; byTopic: Record<string, number>; byType: Record<string, number>; mindmaps: number } {
  const { questions, mindmaps } = load();
  const byTopic: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const q of questions) {
    byTopic[q.topic_id] = (byTopic[q.topic_id] ?? 0) + 1;
    byType[q.exercise_type] = (byType[q.exercise_type] ?? 0) + 1;
  }
  return { total: questions.length, byTopic, byType, mindmaps: mindmaps.size };
}

export function getAllQuestions(): GrammarV2Question[] {
  return load().questions;
}

export function getAllMindMaps(): Map<string, MindMap> {
  return load().mindmaps;
}