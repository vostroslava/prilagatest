"use client";

import * as React from "react";
import { useSession } from "next-auth/react";

import { validateProfileExport } from "@/lib/export/profile-schema";
import { createDemoProfiles } from "@/lib/demo/profiles";
import {
  createEmptyProfile,
  recalculateProfile,
  updateProfileAnswer,
  updateProfileMeta,
} from "@/lib/scoring/profile";
import {
  canAutoSyncProfile,
  isGuestSyncCandidate,
  markProfileLocalOnly,
  markProfilePendingSync,
  markProfileSynced,
  markProfileSyncError,
  normalizeStoredProfile,
  toProfileExport,
  withSyncMeta,
} from "@/lib/storage/profile-document";
import { listProfiles, saveProfile } from "@/lib/storage/db";
import type { BlockId, LikertValue, ProfileContext } from "@/types/assessment";
import type { StoredProfile } from "@/types/profile";

const ACTIVE_PROFILE_STORAGE_KEY = "self-understanding-active-profile-id";

interface ProfilesContextValue {
  profiles: StoredProfile[];
  currentProfileId: string | null;
  currentProfile: StoredProfile | null;
  hydrated: boolean;
  authStatus: "loading" | "guest" | "authenticated";
  account: {
    id: string;
    username: string;
    displayName: string;
  } | null;
  syncBusy: boolean;
  syncError: string | null;
  syncCandidates: StoredProfile[];
  createProfile: (input: {
    displayName: string;
    about: string;
    contexts: ProfileContext[];
  }) => Promise<StoredProfile>;
  updateProfileDetails: (
    profileId: string,
    input: {
      displayName: string;
      about: string;
      contexts: ProfileContext[];
    },
  ) => Promise<StoredProfile | null>;
  updateAnswer: (
    profileId: string,
    blockId: BlockId,
    itemId: string,
    answer: LikertValue,
    pageNumber: number,
  ) => Promise<StoredProfile | null>;
  setLastVisitedPage: (
    profileId: string,
    blockId: BlockId,
    pageNumber: number,
  ) => Promise<StoredProfile | null>;
  setCurrentProfileId: (profileId: string | null) => void;
  importProfileFromObject: (payload: unknown) => Promise<StoredProfile>;
  loadDemoProfiles: () => Promise<StoredProfile[]>;
  refreshProfiles: () => Promise<void>;
  syncSelectedProfiles: (profileIds: string[]) => Promise<void>;
  syncAllProfiles: () => Promise<void>;
  keepProfilesLocal: (profileIds?: string[]) => Promise<void>;
}

const ProfilesContext = React.createContext<ProfilesContextValue | null>(null);

function sortProfiles(nextProfiles: StoredProfile[]) {
  return [...nextProfiles].sort((left, right) =>
    right.profileMeta.updatedAt.localeCompare(left.profileMeta.updatedAt),
  );
}

function safeLocalStorageGet(key: string) {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Ignore storage permission failures to keep the app usable.
  }
}

function safeLocalStorageRemove(key: string) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch {
    // Ignore storage permission failures to keep the app usable.
  }
}

function createClientProfileId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const [profiles, setProfiles] = React.useState<StoredProfile[]>([]);
  const [currentProfileId, setCurrentProfileIdState] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const [syncBusy, setSyncBusy] = React.useState(false);
  const [syncError, setSyncError] = React.useState<string | null>(null);
  const profilesRef = React.useRef<StoredProfile[]>([]);
  const syncTimersRef = React.useRef<Record<string, number>>({});
  const syncProfilesRef = React.useRef<(profileIds: string[], silent?: boolean) => Promise<void>>(
    async () => {},
  );
  const bootstrappedAccountRef = React.useRef<string | null>(null);

  const account = React.useMemo(() => {
    if (sessionStatus !== "authenticated" || !session?.user?.id) {
      return null;
    }

    return {
      id: session.user.id,
      username: session.user.username,
      displayName: session.user.name ?? session.user.username,
    };
  }, [session, sessionStatus]);

  const authStatus: ProfilesContextValue["authStatus"] =
    sessionStatus === "loading"
      ? "loading"
      : account
        ? "authenticated"
        : "guest";

  const commitProfiles = React.useCallback(
    (nextProfiles: StoredProfile[]) => {
      const sorted = sortProfiles(nextProfiles.map((profile) => normalizeStoredProfile(profile)));
      profilesRef.current = sorted;
      setProfiles(sorted);

      if (!sorted.length) {
        setCurrentProfileIdState(null);
        return;
      }

      const fromStorage = safeLocalStorageGet(ACTIVE_PROFILE_STORAGE_KEY);

      setCurrentProfileIdState((current) => {
        const preserved =
          sorted.find((profile) => profile.profileMeta.id === current)?.profileMeta.id ??
          sorted.find((profile) => profile.profileMeta.id === fromStorage)?.profileMeta.id ??
          sorted[0]?.profileMeta.id ??
          null;

        return preserved;
      });
    },
    [],
  );

  const refreshProfiles = React.useCallback(async () => {
    try {
      const nextProfiles = (await listProfiles()).map((profile) =>
        normalizeStoredProfile(profile),
      );
      commitProfiles(nextProfiles);
      setSyncError(null);
    } catch (error) {
      commitProfiles([]);
      setSyncError(
        error instanceof Error
          ? error.message
          : "Локальное хранилище временно недоступно в этом браузере.",
      );
    } finally {
      setHydrated(true);
    }
  }, [commitProfiles]);

  React.useEffect(() => {
    void refreshProfiles();
  }, [refreshProfiles]);

  React.useEffect(() => {
    const timers = syncTimersRef.current;
    return () => {
      Object.values(timers).forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  React.useEffect(() => {
    if (!currentProfileId) {
      safeLocalStorageRemove(ACTIVE_PROFILE_STORAGE_KEY);
      return;
    }

    safeLocalStorageSet(ACTIVE_PROFILE_STORAGE_KEY, currentProfileId);
  }, [currentProfileId]);

  const persistProfile = React.useCallback(
    async (
      profile: StoredProfile,
      options?: {
        scheduleSync?: boolean;
      },
    ) => {
      const normalized = normalizeStoredProfile(profile);
      await saveProfile(normalized);
      const filtered = profilesRef.current.filter(
        (entry) => entry.profileMeta.id !== normalized.profileMeta.id,
      );
      const nextProfiles = sortProfiles([normalized, ...filtered]);
      profilesRef.current = nextProfiles;
      setProfiles(nextProfiles);

      if (options?.scheduleSync && account && canAutoSyncProfile(normalized, account.id)) {
        const existingTimer = syncTimersRef.current[normalized.profileMeta.id];
        if (existingTimer) {
          window.clearTimeout(existingTimer);
        }

        syncTimersRef.current[normalized.profileMeta.id] = window.setTimeout(() => {
          void syncProfilesRef.current(
            normalized.profileMeta.id ? [normalized.profileMeta.id] : [],
            true,
          );
        }, 900);
      }

      return normalized;
    },
    [account],
  );

  const syncProfiles = React.useCallback(
    async (profileIds: string[], silent = false) => {
      if (!account || !profileIds.length) {
        return;
      }

      const targeted = profilesRef.current.filter((profile) =>
        profileIds.includes(profile.profileMeta.id),
      );

      if (!targeted.length) {
        return;
      }

      if (!silent) {
        setSyncBusy(true);
      }

      const pendingProfiles = targeted.map((profile) =>
        profile.syncMeta?.localDecision === "keep-local"
          ? profile
          : markProfilePendingSync(profile, account.id),
      );

      for (const profile of pendingProfiles) {
        await saveProfile(profile);
      }

      commitProfiles([
        ...profilesRef.current.filter(
          (profile) => !pendingProfiles.some((entry) => entry.profileMeta.id === profile.profileMeta.id),
        ),
        ...pendingProfiles,
      ]);

      try {
        const response = await fetch("/api/profiles", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            profiles: pendingProfiles.map((profile) => toProfileExport(profile)),
            source: silent ? "autosave-sync" : "manual-sync",
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Не удалось синхронизировать профили.");
        }

        const remoteProfiles = (data.profiles as unknown[]).map((profile) =>
          markProfileSynced(normalizeStoredProfile(validateProfileExport(profile)), account.id, validateProfileExport(profile).profileMeta.updatedAt),
        );

        for (const profile of remoteProfiles) {
          await saveProfile(profile);
        }

        const untouchedProfiles = profilesRef.current.filter(
          (profile) => !remoteProfiles.some((remote) => remote.profileMeta.id === profile.profileMeta.id),
        );
        commitProfiles([...untouchedProfiles, ...remoteProfiles]);
        setSyncError(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Не удалось синхронизировать профили.";
        const erroredProfiles = pendingProfiles.map((profile) =>
          markProfileSyncError(profile, account.id, message),
        );

        for (const profile of erroredProfiles) {
          await saveProfile(profile);
        }

        const untouchedProfiles = profilesRef.current.filter(
          (profile) => !erroredProfiles.some((entry) => entry.profileMeta.id === profile.profileMeta.id),
        );
        commitProfiles([...untouchedProfiles, ...erroredProfiles]);
        setSyncError(message);
      } finally {
        if (!silent) {
          setSyncBusy(false);
        }
      }
    },
    [account, commitProfiles],
  );

  React.useEffect(() => {
    if (authStatus !== "authenticated" || !account || !hydrated) {
      bootstrappedAccountRef.current = null;
      return;
    }

    if (bootstrappedAccountRef.current === account.id) {
      return;
    }

    void (async () => {
      try {
        const response = await fetch("/api/profiles", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Не удалось загрузить серверные профили.");
        }

        const localProfiles = [...profilesRef.current];
        const merged = new Map(localProfiles.map((profile) => [profile.profileMeta.id, profile]));
        const accountOwnedPending: string[] = [];

        for (const payload of data.profiles as unknown[]) {
          const serverProfile = normalizeStoredProfile(validateProfileExport(payload));
          const localProfile = merged.get(serverProfile.profileMeta.id);

          if (!localProfile) {
            merged.set(
              serverProfile.profileMeta.id,
              markProfileSynced(serverProfile, account.id, serverProfile.profileMeta.updatedAt),
            );
            continue;
          }

          const localUpdatedAt = Date.parse(localProfile.profileMeta.updatedAt);
          const serverUpdatedAt = Date.parse(serverProfile.profileMeta.updatedAt);

          if (Number.isNaN(localUpdatedAt) || localUpdatedAt <= serverUpdatedAt) {
            merged.set(
              serverProfile.profileMeta.id,
              markProfileSynced(serverProfile, account.id, serverProfile.profileMeta.updatedAt),
            );
            continue;
          }

          if (
            localProfile.syncMeta?.ownerUserId === account.id &&
            localProfile.syncMeta.localDecision !== "keep-local"
          ) {
            merged.set(
              localProfile.profileMeta.id,
              markProfilePendingSync(localProfile, account.id),
            );
            accountOwnedPending.push(localProfile.profileMeta.id);
          }
        }

        const mergedProfiles = [...merged.values()];

        for (const profile of mergedProfiles) {
          await saveProfile(profile);
        }

        commitProfiles(mergedProfiles);
        setSyncError(null);
        bootstrappedAccountRef.current = account.id;

        if (accountOwnedPending.length) {
          void syncProfiles(accountOwnedPending, true);
        }
      } catch (error) {
        setSyncError(
          error instanceof Error
            ? error.message
            : "Не удалось загрузить профили из аккаунта.",
        );
      }
    })();
  }, [account, authStatus, commitProfiles, hydrated, syncProfiles]);

  const createProfileRecord = React.useCallback(
    async (input: {
      displayName: string;
      about: string;
      contexts: ProfileContext[];
    }) => {
      const baseProfile = createEmptyProfile({
        id: createClientProfileId(),
        displayName: input.displayName.trim(),
        about: input.about.trim(),
        contexts: input.contexts,
      });

      const profile = account
        ? markProfilePendingSync(baseProfile, account.id)
        : markProfileLocalOnly(baseProfile);

      await persistProfile(profile, { scheduleSync: Boolean(account) });
      setCurrentProfileIdState(profile.profileMeta.id);
      return profile;
    },
    [account, persistProfile],
  );

  const updateProfileDetails = React.useCallback(
    async (
      profileId: string,
      input: {
        displayName: string;
        about: string;
        contexts: ProfileContext[];
      },
    ) => {
      const existing = profilesRef.current.find((profile) => profile.profileMeta.id === profileId);
      if (!existing) {
        return null;
      }

      let next = updateProfileMeta(existing, {
        displayName: input.displayName.trim(),
        about: input.about.trim(),
        contexts: input.contexts,
      });

      if (account && existing.syncMeta?.ownerUserId === account.id && existing.syncMeta.localDecision !== "keep-local") {
        next = markProfilePendingSync(next, account.id);
      } else if (existing.syncMeta) {
        next = withSyncMeta(next, existing.syncMeta);
      }

      await persistProfile(next, {
        scheduleSync: Boolean(account && existing.syncMeta?.ownerUserId === account.id && existing.syncMeta.localDecision !== "keep-local"),
      });
      return next;
    },
    [account, persistProfile],
  );

  const updateAnswerValue = React.useCallback(
    async (
      profileId: string,
      blockId: BlockId,
      itemId: string,
      answer: LikertValue,
      pageNumber: number,
    ) => {
      const existing = profilesRef.current.find((profile) => profile.profileMeta.id === profileId);
      if (!existing) {
        return null;
      }

      let next = updateProfileAnswer(existing, blockId, itemId, answer, pageNumber);

      if (account && existing.syncMeta?.ownerUserId === account.id && existing.syncMeta.localDecision !== "keep-local") {
        next = markProfilePendingSync(next, account.id);
      } else if (existing.syncMeta) {
        next = withSyncMeta(next, existing.syncMeta);
      }

      await persistProfile(next, {
        scheduleSync: Boolean(account && existing.syncMeta?.ownerUserId === account.id && existing.syncMeta.localDecision !== "keep-local"),
      });
      return next;
    },
    [account, persistProfile],
  );

  const setLastVisitedPage = React.useCallback(
    async (profileId: string, blockId: BlockId, pageNumber: number) => {
      const existing = profilesRef.current.find((profile) => profile.profileMeta.id === profileId);
      if (!existing) {
        return null;
      }

      let next = recalculateProfile({
        ...existing,
        assessmentProgress: {
          ...existing.assessmentProgress,
          [blockId]: {
            ...existing.assessmentProgress[blockId],
            lastVisitedPage: pageNumber,
          },
        },
      });

      if (account && existing.syncMeta?.ownerUserId === account.id && existing.syncMeta.localDecision !== "keep-local") {
        next = markProfilePendingSync(next, account.id);
      } else if (existing.syncMeta) {
        next = withSyncMeta(next, existing.syncMeta);
      }

      await persistProfile(next, {
        scheduleSync: Boolean(account && existing.syncMeta?.ownerUserId === account.id && existing.syncMeta.localDecision !== "keep-local"),
      });
      return next;
    },
    [account, persistProfile],
  );

  const importProfileFromObject = React.useCallback(
    async (payload: unknown) => {
      const parsed = validateProfileExport(payload);
      const idExists = profilesRef.current.some(
        (profile) => profile.profileMeta.id === parsed.profileMeta.id,
      );

      const importedId = idExists ? createClientProfileId() : parsed.profileMeta.id;
      let nextProfile = recalculateProfile({
        ...parsed,
        profileMeta: {
          ...parsed.profileMeta,
          id: importedId,
          updatedAt: new Date().toISOString(),
        },
        calculationMeta: {
          ...parsed.calculationMeta,
          notes: idExists
            ? [...parsed.calculationMeta.notes, `Imported copy of profile ${parsed.profileMeta.id}`]
            : parsed.calculationMeta.notes,
        },
      });

      nextProfile = account
        ? markProfilePendingSync(nextProfile, account.id)
        : markProfileLocalOnly(nextProfile);

      await persistProfile(nextProfile, { scheduleSync: Boolean(account) });
      setCurrentProfileIdState(nextProfile.profileMeta.id);
      return nextProfile;
    },
    [account, persistProfile],
  );

  const loadDemoProfiles = React.useCallback(async () => {
    const demoProfiles = createDemoProfiles();
    const persistedProfiles: StoredProfile[] = [];

    for (const demoProfile of demoProfiles) {
      const existing = profilesRef.current.find(
        (profile) => profile.profileMeta.id === demoProfile.profileMeta.id,
      );

      let nextProfile: StoredProfile = existing
        ? {
            ...demoProfile,
            syncMeta: existing.syncMeta,
          }
        : demoProfile;

      nextProfile = account
        ? markProfilePendingSync(nextProfile, account.id)
        : markProfileLocalOnly(nextProfile);

      persistedProfiles.push(
        await persistProfile(nextProfile, { scheduleSync: Boolean(account) }),
      );
    }

    if (persistedProfiles[0]) {
      setCurrentProfileIdState(persistedProfiles[0].profileMeta.id);
    }

    return persistedProfiles;
  }, [account, persistProfile]);

  const setCurrentProfileId = React.useCallback((profileId: string | null) => {
    setCurrentProfileIdState(profileId);
  }, []);

  const syncSelectedProfiles = React.useCallback(
    async (profileIds: string[]) => {
      await syncProfiles(profileIds, false);
    },
    [syncProfiles],
  );

  React.useEffect(() => {
    syncProfilesRef.current = syncProfiles;
  }, [syncProfiles]);

  const syncAllProfiles = React.useCallback(async () => {
    const pendingIds = profilesRef.current
      .filter((profile) => (account ? profile.syncMeta?.localDecision !== "keep-local" : false))
      .map((profile) => profile.profileMeta.id);

    await syncProfiles(pendingIds, false);
  }, [account, syncProfiles]);

  const keepProfilesLocal = React.useCallback(async (profileIds?: string[]) => {
    const targetIds =
      profileIds?.length
        ? profileIds
        : profilesRef.current
            .filter((profile) => isGuestSyncCandidate(profile, account?.id ?? null))
            .map((profile) => profile.profileMeta.id);

    const nextProfiles = profilesRef.current.map((profile) =>
      targetIds.includes(profile.profileMeta.id)
        ? markProfileLocalOnly(profile, "keep-local")
        : profile,
    );

    for (const profile of nextProfiles) {
      await saveProfile(profile);
    }

    commitProfiles(nextProfiles);
  }, [account, commitProfiles]);

  const currentProfile = React.useMemo(
    () => profiles.find((profile) => profile.profileMeta.id === currentProfileId) ?? null,
    [currentProfileId, profiles],
  );

  const syncCandidates = React.useMemo(
    () => profiles.filter((profile) => isGuestSyncCandidate(profile, account?.id ?? null)),
    [account, profiles],
  );

  const value = React.useMemo(
    () => ({
      profiles,
      currentProfileId,
      currentProfile,
      hydrated,
      authStatus,
      account,
      syncBusy,
      syncError,
      syncCandidates,
      createProfile: createProfileRecord,
      updateProfileDetails,
      updateAnswer: updateAnswerValue,
      setLastVisitedPage,
      setCurrentProfileId,
      importProfileFromObject,
      loadDemoProfiles,
      refreshProfiles,
      syncSelectedProfiles,
      syncAllProfiles,
      keepProfilesLocal,
    }),
    [
      profiles,
      currentProfileId,
      currentProfile,
      hydrated,
      authStatus,
      account,
      syncBusy,
      syncError,
      syncCandidates,
      createProfileRecord,
      updateProfileDetails,
      updateAnswerValue,
      setLastVisitedPage,
      setCurrentProfileId,
      importProfileFromObject,
      loadDemoProfiles,
      refreshProfiles,
      syncSelectedProfiles,
      syncAllProfiles,
      keepProfilesLocal,
    ],
  );

  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>;
}

export function useProfiles() {
  const context = React.useContext(ProfilesContext);

  if (!context) {
    throw new Error("useProfiles must be used within ProfilesProvider");
  }

  return context;
}
