import { NextResponse } from "next/server";
import { z } from "zod";

import { generateProfileAnalysis } from "@/lib/ai/gemini";
import { fullProfileExportSchema } from "@/lib/export/profile-schema";

const requestSchema = z.object({
  profile: z.unknown(),
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
        { error: "Некорректный payload анализа профиля." },
        { status: 400 },
      );
    }

    const profileResult = fullProfileExportSchema.safeParse(payload.data.profile);

    if (!profileResult.success) {
      return NextResponse.json(
        { error: "Некорректные данные профиля для AI-анализа." },
        { status: 400 },
      );
    }

    const profile = profileResult.data;
    const result = await generateProfileAnalysis(profile);

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
            : "Не удалось выполнить AI-анализ профиля.",
      },
      { status: 500 },
    );
  }
}
