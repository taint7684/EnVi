import "server-only";

import pronunciationJson from "@/data/pronunciation.json";
import type { PronunciationFocus } from "./types";

let cache: PronunciationFocus[] | null = null;

export function loadPronunciationFocuses(): PronunciationFocus[] {
  if (cache) return cache;
  cache = pronunciationJson as PronunciationFocus[];
  return cache;
}