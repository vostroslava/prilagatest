import { GoogleGenerativeAI, type ResponseSchema } from "@google/generative-ai";
import { ZodType } from "zod";

import { compareAnalysisGeminiSchema, profileAnalysisGeminiSchema } from "@/lib/ai/gemini-schema";
import { buildCompareAnalysisPrompt, buildProfileAnalysisPrompt } from "@/lib/ai/prompts";
import { compareAnalysisContentSchema, profileAnalysisContentSchema } from "@/lib/ai/validation";
import type { CompareAnalysisContent, ProfileAnalysisContent } from "@/types/analysis";
import type { FullProfileExport } from "@/types/profile";

const DEFAULT_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  return new GoogleGenerativeAI(apiKey);
}

async function generateStructuredContent<T>({
  prompt,
  responseSchema,
  validator,
}: {
  prompt: string;
  responseSchema: ResponseSchema;
  validator: ZodType<T>;
}) {
  const client = getGeminiClient();
  const model = client.getGenerativeModel({
    model: DEFAULT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema,
      temperature: 0.65,
    },
  });

  const result = await model.generateContent(prompt);
  const payload = JSON.parse(result.response.text());

  return {
    model: DEFAULT_MODEL,
    analysis: validator.parse(payload),
  };
}

export async function generateProfileAnalysis(profile: FullProfileExport) {
  return generateStructuredContent<ProfileAnalysisContent>({
    prompt: buildProfileAnalysisPrompt(profile),
    responseSchema: profileAnalysisGeminiSchema,
    validator: profileAnalysisContentSchema,
  });
}

export async function generateCompareAnalysis(
  leftProfile: FullProfileExport,
  rightProfile: FullProfileExport,
) {
  return generateStructuredContent<CompareAnalysisContent>({
    prompt: buildCompareAnalysisPrompt(leftProfile, rightProfile),
    responseSchema: compareAnalysisGeminiSchema,
    validator: compareAnalysisContentSchema,
  });
}
