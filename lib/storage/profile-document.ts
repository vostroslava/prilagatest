import type { FullProfileExport, LocalDecision, ProfileSyncMeta, StoredProfile } from "@/types/profile";

function buildSyncMeta(profile: StoredProfile, overrides?: Partial<ProfileSyncMeta>): ProfileSyncMeta {
  return {
    status: profile.syncMeta?.status ?? "local-only",
    ownerUserId: profile.syncMeta?.ownerUserId ?? null,
    serverUpdatedAt: profile.syncMeta?.serverUpdatedAt ?? null,
    lastSyncedAt: profile.syncMeta?.lastSyncedAt ?? null,
    lastSyncError: profile.syncMeta?.lastSyncError ?? null,
    localDecision: profile.syncMeta?.localDecision ?? "undecided",
    ...overrides,
  };
}

export function toProfileExport(profile: StoredProfile): FullProfileExport {
  const profileExport = { ...profile };
  delete profileExport.syncMeta;
  return profileExport;
}

export function withSyncMeta(
  profile: StoredProfile,
  overrides?: Partial<ProfileSyncMeta>,
): StoredProfile {
  return {
    ...profile,
    syncMeta: buildSyncMeta(profile, overrides),
  };
}

export function markProfilePendingSync(
  profile: StoredProfile,
  userId: string,
  decision: LocalDecision = "sync",
): StoredProfile {
  return withSyncMeta(profile, {
    status: "pending-sync",
    ownerUserId: userId,
    lastSyncError: null,
    localDecision: decision,
  });
}

export function markProfileSynced(
  profile: StoredProfile,
  userId: string,
  serverUpdatedAt: string,
): StoredProfile {
  const now = new Date().toISOString();

  return withSyncMeta(profile, {
    status: "synced",
    ownerUserId: userId,
    serverUpdatedAt,
    lastSyncedAt: now,
    lastSyncError: null,
    localDecision: "sync",
  });
}

export function markProfileSyncError(
  profile: StoredProfile,
  userId: string,
  message: string,
): StoredProfile {
  return withSyncMeta(profile, {
    status: "sync-error",
    ownerUserId: userId,
    lastSyncError: message,
    localDecision: "sync",
  });
}

export function markProfileLocalOnly(
  profile: StoredProfile,
  decision: LocalDecision = "undecided",
): StoredProfile {
  return withSyncMeta(profile, {
    status: "local-only",
    ownerUserId: profile.syncMeta?.ownerUserId ?? null,
    lastSyncError: null,
    localDecision: decision,
  });
}

export function normalizeStoredProfile(profile: FullProfileExport | StoredProfile): StoredProfile {
  if ("syncMeta" in profile && profile.syncMeta) {
    return withSyncMeta(profile);
  }

  return withSyncMeta(profile as StoredProfile);
}

export function canAutoSyncProfile(profile: StoredProfile, userId: string | null) {
  if (!userId) {
    return false;
  }

  if (profile.syncMeta?.localDecision === "keep-local") {
    return false;
  }

  return (profile.syncMeta?.ownerUserId ?? userId) === userId;
}

export function isGuestSyncCandidate(profile: StoredProfile, userId: string | null) {
  if (!userId) {
    return false;
  }

  if (profile.syncMeta?.localDecision === "keep-local") {
    return false;
  }

  return profile.syncMeta?.ownerUserId !== userId;
}
