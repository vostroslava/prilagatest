import { eq } from "drizzle-orm";
import { hash, compare } from "bcryptjs";

import { getDb } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export async function findUserByUsername(username: string) {
  const db = getDb();
  const normalized = username.trim().toLowerCase();

  return (
    (await db.query.users.findFirst({
      where: eq(users.username, normalized),
    })) ?? null
  );
}

export async function createUser(input: {
  username: string;
  password: string;
  displayName?: string;
}) {
  const db = getDb();
  const normalized = input.username.trim().toLowerCase();
  const passwordHash = await hash(input.password, 12);

  const [created] = await db
    .insert(users)
    .values({
      username: normalized,
      passwordHash,
      displayName: input.displayName?.trim() || normalized,
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  return created;
}

export async function verifyUserCredentials(username: string, password: string) {
  const user = await findUserByUsername(username);

  if (!user) {
    return null;
  }

  const valid = await compare(password, user.passwordHash);

  if (!valid) {
    return null;
  }

  return user;
}
