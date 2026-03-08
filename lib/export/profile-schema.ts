import { z } from "zod";

const blockIdSchema = z.enum(["big-five", "ipip-ipc", "conflict-profile"]);
const scoreBandSchema = z.enum(["low", "medium", "high"]).nullable();
const likertValueSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const instrumentSourceSchema = z.object({
  instrumentId: z.string(),
  instrumentTitle: z.string(),
  sourceUrl: z.string(),
  usageNotes: z.string(),
  translationStatus: z.enum(["official", "adapted", "internal"]),
});

const questionResponseSchema = z.object({
  blockId: blockIdSchema,
  itemId: z.string(),
  order: z.number().int(),
  originalText: z.string(),
  russianText: z.string(),
  scaleKey: z.string(),
  scientificScale: z.string(),
  reverseKeyed: z.boolean(),
  answer: likertValueSchema.nullable(),
  answeredAt: z.string().nullable(),
  source: instrumentSourceSchema,
});

const assessmentProgressSchema = z.object({
  blockId: blockIdSchema,
  answered: z.number().int(),
  total: z.number().int(),
  completionRatio: z.number(),
  status: z.enum(["not-started", "in-progress", "completed"]),
  lastVisitedPage: z.number().int(),
  startedAt: z.string().nullable(),
  completedAt: z.string().nullable(),
});

const scaleDefinitionSchema = z.object({
  key: z.string(),
  blockId: blockIdSchema,
  label: z.string(),
  shortLabel: z.string(),
  scientificLabel: z.string(),
  description: z.string(),
  type: z.enum(["core", "derived"]),
  sourceScale: z.string().optional(),
});

const scaleScoreSchema = z.object({
  key: z.string(),
  blockId: blockIdSchema,
  label: z.string(),
  shortLabel: z.string(),
  scientificLabel: z.string(),
  rawMean: z.number().nullable(),
  rawSum: z.number(),
  normalized: z.number().nullable(),
  answeredItems: z.number().int(),
  totalItems: z.number().int(),
  band: scoreBandSchema,
  sourceScale: z.string().optional(),
  note: z.string().optional(),
});

const derivedScoreSchema = z.object({
  key: z.string(),
  blockId: blockIdSchema,
  label: z.string(),
  description: z.string(),
  value: z.number().nullable(),
  normalized: z.number().nullable(),
  note: z.string().optional(),
});

export const fullProfileExportSchema = z.object({
  exportType: z.literal("self-understanding-profile-v1"),
  profileMeta: z.object({
    id: z.string(),
    displayName: z.string(),
    about: z.string(),
    language: z.literal("ru"),
    contexts: z.array(
      z.enum(["for-self", "relationships", "friendship", "work", "other"]),
    ),
    createdAt: z.string(),
    updatedAt: z.string(),
    privacyMode: z.literal("local-first"),
    status: z.enum(["draft", "ready"]),
  }),
  assessmentProgress: z.object({
    "big-five": assessmentProgressSchema,
    "ipip-ipc": assessmentProgressSchema,
    "conflict-profile": assessmentProgressSchema,
  }),
  rawAnswers: z.object({
    "big-five": z.array(questionResponseSchema),
    "ipip-ipc": z.array(questionResponseSchema),
    "conflict-profile": z.array(questionResponseSchema),
  }),
  scoring: z.object({
    "big-five": z.array(scaleScoreSchema),
    "ipip-ipc": z.array(scaleScoreSchema),
    "conflict-profile": z.array(scaleScoreSchema),
  }),
  derivedScores: z.array(derivedScoreSchema),
  textualInterpretation: z.object({
    shortProfile: z.string(),
    detailedProfile: z.string(),
    blockSummaries: z.object({
      "big-five": z.string(),
      "ipip-ipc": z.string(),
      "conflict-profile": z.string(),
    }),
    scaleNarratives: z.record(z.string(), z.string()),
    disclaimers: z.array(z.string()),
  }),
  scaleDefinitions: z.array(scaleDefinitionSchema),
  versionInfo: z.object({
    productVersion: z.string(),
    exportVersion: z.string(),
    methodologyVersion: z.string(),
    contentVersion: z.string(),
    conflictModuleVersion: z.string(),
  }),
  calculationMeta: z.object({
    calculatedAt: z.string(),
    completenessByBlock: z.object({
      "big-five": z.number(),
      "ipip-ipc": z.number(),
      "conflict-profile": z.number(),
    }),
    notes: z.array(z.string()),
  }),
});

export type FullProfileExportSchema = z.infer<typeof fullProfileExportSchema>;

export function validateProfileExport(input: unknown) {
  return fullProfileExportSchema.parse(input);
}
