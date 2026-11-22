import "server-only";

import cardsJson from "@/data/strategy-cards.json";
import { z } from "zod";

const CardSchema = z.object({
  id: z.string(),
  title_vi: z.string(),
  explanation_vi: z.string(),
  phrases: z.array(z.string()),
  drill: z.string(),
});

export type StrategyCard = z.infer<typeof CardSchema>;

let cache: StrategyCard[] | null = null;

export function loadStrategyCards(): StrategyCard[] {
  if (cache) return cache;
  cache = cardsJson.map((c, i) => {
    try {
      return CardSchema.parse(c);
    } catch (err) {
      throw new Error(`Strategy card #${i} (${(c as { id?: string }).id ?? "?"}) không hợp lệ: ${String(err)}`);
    }
  });
  return cache;
}