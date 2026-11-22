import { z } from "zod";

export const ObjectiveSchema = z.object({
  id: z.string(),
  text_vi: z.string(),
  check: z.string(),
});

export const PersonaSchema = z.object({
  name: z.string(),
  role: z.string(),
  personality: z.string(),
  accent_hint: z.string().optional(),
  speaking_speed: z.string().optional(),
});

export const OfflineTurnSchema = z.object({
  persona: z.string(),
  sample: z.string(),
});

export const MissionSchema = z.object({
  id: z.string(),
  title_vi: z.string(),
  title_en: z.string(),
  category: z.enum(["work", "life", "travel", "social"]),
  level: z.enum(["A2", "B1", "B2"]),
  role_relevance: z.array(z.string()).default([]),
  scenario_vi: z.string(),
  ai_persona: PersonaSchema,
  objectives: z.array(ObjectiveSchema),
  prep_chunks: z.array(z.string()).default([]),
  strategy_card_id: z.string().nullable().optional(),
  max_turns: z.number().int().positive().default(10),
  success_rule: z.string().default(">= objectives-1 done"),
  offline_script: z.array(OfflineTurnSchema).default([]),
});

export type Mission = z.infer<typeof MissionSchema>;
export type Objective = z.infer<typeof ObjectiveSchema>;

export const ObjectiveJudgeSchema = z.object({
  objective_id: z.string(),
  achieved: z.boolean(),
  evidence: z.string().default(""),
});

export const ObjectiveJudgeListSchema = z.object({
  results: z.array(ObjectiveJudgeSchema),
});

export type ObjectiveJudgeResult = z.infer<typeof ObjectiveJudgeSchema>;