import "server-only";

import promptsJson from "@/data/fluency-prompts.json";
import { z } from "zod";

const PromptSchema = z.object({
  id: z.string(),
  kind: z.enum(["one_minute", "picture", "quick_fire", "eli5", "story_chain"]),
  prompt_en: z.string(),
  prompt_vi: z.string().nullable().optional(),
  level: z.enum(["A2", "B1", "B2"]).nullable().optional(),
  topic: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
});

export type FluencyPrompt = z.infer<typeof PromptSchema>;

let cache: FluencyPrompt[] | null = null;

export function loadFluencyPrompts(): FluencyPrompt[] {
  if (cache) return cache;
  cache = promptsJson.map((p, i) => {
    try {
      return PromptSchema.parse(p);
    } catch (err) {
      throw new Error(`Fluency prompt #${i} (${(p as { id?: string }).id ?? "?"}) không hợp lệ: ${String(err)}`);
    }
  });
  return cache;
}

export function promptsByKind(kind: string): FluencyPrompt[] {
  return loadFluencyPrompts().filter((p) => p.kind === kind);
}