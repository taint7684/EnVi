import { z } from "zod";

export const DrillKindSchema = z.enum([
  "four_three_two",
  "one_minute",
  "picture",
  "quick_fire",
  "eli5",
  "story_chain",
]);

export type DrillKind = z.infer<typeof DrillKindSchema>;

export const DrillRoundSchema = z.object({
  audio_path: z.string().nullable().optional(),
  duration_ms: z.number(),
  words: z.number(),
  wpm: z.number().nullable().optional(),
  mlr: z.number().nullable().optional(),
  pauses: z.number().nullable().optional(),
});

export type DrillRound = z.infer<typeof DrillRoundSchema>;

export const DrillSummarySchema = z.object({
  kind: DrillKindSchema,
  rounds: z.number(),
  avgWpm: z.number().nullable(),
  bestWpm: z.number().nullable(),
  worstWpm: z.number().nullable(),
  trend: z.enum(["up", "down", "flat", "na"]),
});

export type DrillSummary = z.infer<typeof DrillSummarySchema>;

export const DRILL_LABEL: Record<DrillKind, string> = {
  four_three_two: "4/3/2",
  one_minute: "1-Phút",
  picture: "Mô tả tranh",
  quick_fire: "Nhanh 3 giây",
  eli5: "ELI5",
  story_chain: "Kể chuyện",
};