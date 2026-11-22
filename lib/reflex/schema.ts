import { z } from "zod";

export const ReflexMeaningSchema = z.object({
  meaningCorrect: z.boolean(),
  explanationVi: z.string().optional(),
  level: z.enum(["L1", "L2", "L3"]),
});

export type ReflexMeaning = z.infer<typeof ReflexMeaningSchema>;
