import { and, asc, eq } from "drizzle-orm";

import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { validateProfileExport } from "@/lib/export/profile-schema";
import { toProfileExport } from "@/lib/storage/profile-document";
import type { FullProfileExport, StoredProfile } from "@/types/profile";

function toDate(input: string) {
  return new Date(input);
}

export async function listServerProfilesForUser(userId: string) {
  const db = getDb();
  const rows = await db.query.profiles.findMany({
    where: eq(profiles.userId, userId),
    orderBy: [asc(profiles.updatedAt)],
  });

  return rows.map((row) => validateProfileExport(row.profileDoc));
}

export async function upsertProfilesForUser(
  userId: string,
  incomingProfiles: unknown[],
  source = "hybrid-local-first",
) {
  const db = getDb();
  const acceptedProfiles: FullProfileExport[] = [];

  for (const incoming of incomingProfiles) {
    const profileDoc = validateProfileExport(
      typeof incoming === "object" && incoming !== null && "syncMeta" in incoming
        ? toProfileExport(incoming as StoredProfile)
        : incoming,
    );

    const existing = await db.query.profiles.findFirst({
      where: and(eq(profiles.userId, userId), eq(profiles.id, profileDoc.profileMeta.id)),
    });

    const incomingUpdatedAt = toDate(profileDoc.profileMeta.updatedAt);

    if (!existing) {
      await db.insert(profiles).values({
        id: profileDoc.profileMeta.id,
        userId,
        profileDoc,
        source,
        version: profileDoc.versionInfo.productVersion,
        createdAt: toDate(profileDoc.profileMeta.createdAt),
        updatedAt: incomingUpdatedAt,
      });
      acceptedProfiles.push(profileDoc);
      continue;
    }

    if (incomingUpdatedAt >= existing.updatedAt) {
      await db
        .update(profiles)
        .set({
          profileDoc,
          source,
          version: profileDoc.versionInfo.productVersion,
          updatedAt: incomingUpdatedAt,
        })
        .where(and(eq(profiles.userId, userId), eq(profiles.id, profileDoc.profileMeta.id)));

      acceptedProfiles.push(profileDoc);
      continue;
    }

    acceptedProfiles.push(validateProfileExport(existing.profileDoc));
  }

  return acceptedProfiles;
}
