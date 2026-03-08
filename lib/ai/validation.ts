import { z } from "zod";

export const profileAnalysisContentSchema = z.object({
  summary: z.string().min(1),
  keyObservations: z.array(z.string().min(1)).min(3).max(5),
  attentionAreas: z.array(z.string().min(1)).min(2).max(5),
  interpersonalReading: z.array(z.string().min(1)).min(2).max(5),
  conflictReading: z.array(z.string().min(1)).min(2).max(5),
  howToReadWithoutLabels: z.array(z.string().min(1)).min(2).max(5),
  disclaimer: z.string().min(1),
});

export const compareAnalysisContentSchema = z.object({
  summary: z.string().min(1),
  similarities: z.array(z.string().min(1)).min(2).max(5),
  differences: z.array(z.string().min(1)).min(2).max(5),
  interactionStrengths: z.array(z.string().min(1)).min(2).max(5),
  frictionPoints: z.array(z.string().min(1)).min(2).max(5),
  communicationNotes: z.array(z.string().min(1)).min(2).max(5),
  disclaimer: z.string().min(1),
});

export const analysisMetaSchema = z.object({
  generatedAt: z.string().min(1),
  model: z.string().min(1),
  source: z.literal("gemini"),
});

export const profileAnalysisResponseSchema = z.object({
  meta: analysisMetaSchema,
  analysis: profileAnalysisContentSchema,
});

export const compareAnalysisResponseSchema = z.object({
  meta: analysisMetaSchema,
  analysis: compareAnalysisContentSchema,
});

export type ProfileAnalysisResponsePayload = z.infer<
  typeof profileAnalysisResponseSchema
>;
export type CompareAnalysisResponsePayload = z.infer<
  typeof compareAnalysisResponseSchema
>;
