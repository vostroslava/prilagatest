import { SchemaType, type ResponseSchema } from "@google/generative-ai";

const stringArraySchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.STRING,
  },
} as ResponseSchema;

export const profileAnalysisGeminiSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    keyObservations: stringArraySchema,
    attentionAreas: stringArraySchema,
    interpersonalReading: stringArraySchema,
    conflictReading: stringArraySchema,
    howToReadWithoutLabels: stringArraySchema,
    disclaimer: { type: SchemaType.STRING },
  },
  required: [
    "summary",
    "keyObservations",
    "attentionAreas",
    "interpersonalReading",
    "conflictReading",
    "howToReadWithoutLabels",
    "disclaimer",
  ],
};

export const compareAnalysisGeminiSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    summary: { type: SchemaType.STRING },
    similarities: stringArraySchema,
    differences: stringArraySchema,
    interactionStrengths: stringArraySchema,
    frictionPoints: stringArraySchema,
    communicationNotes: stringArraySchema,
    disclaimer: { type: SchemaType.STRING },
  },
  required: [
    "summary",
    "similarities",
    "differences",
    "interactionStrengths",
    "frictionPoints",
    "communicationNotes",
    "disclaimer",
  ],
};
