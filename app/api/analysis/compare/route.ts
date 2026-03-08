import { NextResponse } from "next/server";
import { z } from "zod";

import { generateCompareAnalysis } from "@/lib/ai/gemini";
import { fullProfileExportSchema } from "@/lib/export/profile-schema";

const requestSchema = z.object({
  leftProfile: z.unknown(),
  rightProfile: z.unknown(),
});

export async function POST(request: Request) {
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not configured." },
      { status: 503 },
    );
  }

  try {
    const payload = requestSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: "Некорректный payload анализа сравнения." },
        { status: 400 },
      );
    }

    const leftProfileResult = fullProfileExportSchema.safeParse(payload.data.leftProfile);
    const rightProfileResult = fullProfileExportSchema.safeParse(payload.data.rightProfile);

    if (!leftProfileResult.success || !rightProfileResult.success) {
      return NextResponse.json(
        { error: "Некорректные данные профилей для compare-анализа." },
        { status: 400 },
      );
    }

    const leftProfile = leftProfileResult.data;
    const rightProfile = rightProfileResult.data;
    const result = await generateCompareAnalysis(leftProfile, rightProfile);

    return NextResponse.json({
      meta: {
        generatedAt: new Date().toISOString(),
        model: result.model,
        source: "gemini",
      },
      analysis: result.analysis,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось выполнить AI-анализ сравнения.",
      },
      { status: 500 },
    );
  }
}
