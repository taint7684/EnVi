import "server-only";
import fs from "node:fs";
import path from "node:path";
import type { ReflexPhrase } from "@/lib/reflex-drills-types";

export type {
  ReflexPhrase,
  SessionMode,
  ReflexGrade,
} from "@/lib/reflex-drills-types";

export {
  MODE_LABELS,
  GRADE_LABELS,
  shuffle,
  getPhrasesByDay,
  getDays,
  getSessionPhrases,
} from "@/lib/reflex-drills-types";

let _cache: ReflexPhrase[] | null = null;

function load(): ReflexPhrase[] {
  if (_cache) return _cache;
  const filePath = path.join(process.cwd(), "data", "reflex-phrases.json");
  if (!fs.existsSync(filePath)) { _cache = []; return []; }
  _cache = JSON.parse(fs.readFileSync(filePath, "utf8")) as ReflexPhrase[];
  return _cache;
}

export function getAllPhrases(): ReflexPhrase[] { return load(); }

export function getTotalCount(): number { return load().length; }

export function getDayCount(): number {
  return [...new Set(load().map((p) => p.day))].sort((a, b) => a - b).length;
}