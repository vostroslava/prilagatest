import { NextResponse } from "next/server";
import { z } from "zod";

import { isDatabaseConfigured } from "@/lib/db/client";
import { createUser, findUserByUsername } from "@/lib/server/users";

const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, "Минимум 3 символа.")
    .max(32, "Максимум 32 символа.")
    .regex(/^[a-z0-9._-]+$/i, "Используйте латиницу, цифры, точку, дефис или подчёркивание."),
  password: z
    .string()
    .min(8, "Минимум 8 символов.")
    .max(128, "Максимум 128 символов."),
  displayName: z.string().trim().max(80).optional(),
});

export async function POST(request: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "DATABASE_URL is not configured." },
      { status: 503 },
    );
  }

  try {
    const parsed = registerSchema.safeParse(await request.json());

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Некорректные данные регистрации." },
        { status: 400 },
      );
    }

    const existing = await findUserByUsername(parsed.data.username);

    if (existing) {
      return NextResponse.json(
        { error: "Такой username уже занят." },
        { status: 409 },
      );
    }

    const user = await createUser(parsed.data);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось создать аккаунт.",
      },
      { status: 500 },
    );
  }
}
