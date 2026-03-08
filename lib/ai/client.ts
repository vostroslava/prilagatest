"use client";

import { compareAnalysisResponseSchema, profileAnalysisResponseSchema } from "@/lib/ai/validation";
import type { FullProfileExport } from "@/types/profile";

async function postJson<T>(
  url: string,
  body: Record<string, unknown>,
  parser: { parse: (value: unknown) => T },
) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(
      typeof payload?.error === "string"
        ? payload.error
        : "Не удалось получить AI-анализ.",
    );
  }

  return parser.parse(payload);
}

export function requestProfileAnalysis(profile: FullProfileExport) {
  return postJson(
    "/api/analysis/profile",
    { profile },
    profileAnalysisResponseSchema,
  );
}

export function requestCompareAnalysis(
  leftProfile: FullProfileExport,
  rightProfile: FullProfileExport,
) {
  return postJson(
    "/api/analysis/compare",
    { leftProfile, rightProfile },
    compareAnalysisResponseSchema,
  );
}
