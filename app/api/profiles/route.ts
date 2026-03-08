import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";

import { authOptions } from "@/auth";
import { isDatabaseConfigured } from "@/lib/db/client";
import { listServerProfilesForUser, upsertProfilesForUser } from "@/lib/server/profile-store";

const syncSchema = z.object({
  profiles: z.array(z.unknown()).min(1).max(100),
  source: z.string().trim().min(1).max(64).optional(),
});

export async function GET() {
  if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "AUTH_SECRET is not configured." }, { status: 503 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const profiles = await listServerProfilesForUser(session.user.id);
    return NextResponse.json({ profiles });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось загрузить серверные профили.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  if (!process.env.AUTH_SECRET && !process.env.NEXTAUTH_SECRET) {
    return NextResponse.json({ error: "AUTH_SECRET is not configured." }, { status: 503 });
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL is not configured." }, { status: 503 });
  }

  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const payload = syncSchema.safeParse(await request.json());

    if (!payload.success) {
      return NextResponse.json(
        { error: "Некорректный payload синхронизации." },
        { status: 400 },
      );
    }

    const profiles = await upsertProfilesForUser(
      session.user.id,
      payload.data.profiles,
      payload.data.source ?? "hybrid-local-first",
    );

    return NextResponse.json({ profiles });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Не удалось синхронизировать профили.",
      },
      { status: 500 },
    );
  }
}
