import "server-only";

import pronunciationJson from "@/data/pronunciation.json";
import { z } from "zod";

const FocusSchema = z.object({
  id: z.string(),
  num: z.number(),
  title_vi: z.string(),
  description_vi: z.string(),
  tip_vi: z.string(),
  words: z.array(z.string()),
  sentences: z.array(z.string()),
});

export type PronunciationFocus = z.infer<typeof FocusSchema>;

let cache: PronunciationFocus[] | null = null;

export function loadPronunciationFocuses(): PronunciationFocus[] {
  if (cache) return cache;
  cache = pronunciationJson.map((f, i) => {
    try {
      return FocusSchema.parse(f);
    } catch (err) {
      throw new Error(`Pronunciation focus #${i} (${(f as { id?: string }).id ?? "?"}) không hợp lệ: ${String(err)}`);
    }
  });
  return cache;
}