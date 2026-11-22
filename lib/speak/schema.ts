import { z } from "zod";

export const CoachFeedbackSchema = z.object({
  understood: z.boolean(),
  answered_question: z.boolean(),
  praise_vi: z.string().max(160),
  errors: z
    .array(
      z.object({
        original: z.string(),
        correction: z.string(),
        type: z.enum([
          "meaning",
          "grammar",
          "vocab",
          "pronunciation",
          "fluency",
          "pragmatics",
        ]),
        pattern_key: z.string(),
        explanation_vi: z.string().max(200),
        severity: z.number().min(1).max(3),
      }),
    )
    .max(2),
  hidden_errors: z
    .array(
      z.object({
        original: z.string(),
        correction: z.string(),
        type: z.enum([
          "meaning",
          "grammar",
          "vocab",
          "pronunciation",
          "fluency",
          "pragmatics",
        ]),
        pattern_key: z.string(),
        explanation_vi: z.string().max(200),
        severity: z.number().min(1).max(3),
      }),
    )
    .default([]),
  natural_version: z.string().max(500),
  retry_keywords: z.array(z.string()).min(2).max(4),
  comprehensibility: z.number().min(1).max(5),
  level_estimate: z.enum(["A1", "A2", "B1", "B2", "C1"]),
  follow_up_question: z.string().optional(),
});

export const RetryEvaluationSchema = z.object({
  semantic_similarity: z.number().min(0).max(1),
  keywords_hit: z.array(z.string()),
  verdict: z.enum(["pass", "partial", "fail"]),
  tip_vi: z.string(),
});

export type CoachFeedback = z.infer<typeof CoachFeedbackSchema>;
export type RetryEvaluation = z.infer<typeof RetryEvaluationSchema>;
