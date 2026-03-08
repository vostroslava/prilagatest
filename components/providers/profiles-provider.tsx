"use client";

import * as React from "react";

import { validateProfileExport } from "@/lib/export/profile-schema";
import { createEmptyProfile, recalculateProfile, updateProfileAnswer, updateProfileMeta } from "@/lib/scoring/profile";
import { listProfiles, saveProfile } from "@/lib/storage/db";
import type { BlockId, LikertValue, ProfileContext } from "@/types/assessment";
import type { StoredProfile } from "@/types/profile";

const ACTIVE_PROFILE_STORAGE_KEY = "self-understanding-active-profile-id";

interface ProfilesContextValue {
  profiles: StoredProfile[];
  currentProfileId: string | null;
  currentProfile: StoredProfile | null;
  hydrated: boolean;
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
  refreshProfiles: () => Promise<void>;
}

const ProfilesContext = React.createContext<ProfilesContextValue | null>(null);

export function ProfilesProvider({ children }: { children: React.ReactNode }) {
  const [profiles, setProfiles] = React.useState<StoredProfile[]>([]);
  const [currentProfileId, setCurrentProfileIdState] = React.useState<string | null>(null);
  const [hydrated, setHydrated] = React.useState(false);
  const profilesRef = React.useRef<StoredProfile[]>([]);

  const refreshProfiles = React.useCallback(async () => {
    const nextProfiles = await listProfiles();
    profilesRef.current = nextProfiles;
    setProfiles(nextProfiles);

    if (!nextProfiles.length) {
      setCurrentProfileIdState(null);
      setHydrated(true);
      return;
    }

    const fromStorage = window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY);
    const nextCurrent =
      nextProfiles.find((profile) => profile.profileMeta.id === fromStorage)?.profileMeta.id ??
      currentProfileId ??
      nextProfiles[0].profileMeta.id;

    setCurrentProfileIdState(nextCurrent);
    setHydrated(true);
  }, [currentProfileId]);

  React.useEffect(() => {
    void refreshProfiles();
  }, [refreshProfiles]);

  React.useEffect(() => {
    if (!currentProfileId) {
      window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY);
      return;
    }

    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, currentProfileId);
  }, [currentProfileId]);

  const persistProfile = React.useCallback(async (profile: StoredProfile) => {
    await saveProfile(profile);
    const filtered = profilesRef.current.filter(
      (entry) => entry.profileMeta.id !== profile.profileMeta.id,
    );
    const nextProfiles = [profile, ...filtered].sort((left, right) =>
      right.profileMeta.updatedAt.localeCompare(left.profileMeta.updatedAt),
    );
    profilesRef.current = nextProfiles;
    setProfiles(nextProfiles);

    return profile;
  }, []);

  const createProfileRecord = React.useCallback(
    async (input: {
      displayName: string;
      about: string;
      contexts: ProfileContext[];
    }) => {
      const profile = createEmptyProfile({
        id: crypto.randomUUID(),
        displayName: input.displayName.trim(),
        about: input.about.trim(),
        contexts: input.contexts,
      });

      await persistProfile(profile);
      setCurrentProfileIdState(profile.profileMeta.id);
      return profile;
    },
    [persistProfile],
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

      const next = updateProfileMeta(existing, {
        displayName: input.displayName.trim(),
        about: input.about.trim(),
        contexts: input.contexts,
      });

      await persistProfile(next);
      return next;
    },
    [persistProfile],
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

      const next = updateProfileAnswer(existing, blockId, itemId, answer, pageNumber);
      await persistProfile(next);
      return next;
    },
    [persistProfile],
  );

  const setLastVisitedPage = React.useCallback(
    async (profileId: string, blockId: BlockId, pageNumber: number) => {
      const existing = profilesRef.current.find((profile) => profile.profileMeta.id === profileId);
      if (!existing) {
        return null;
      }

      const next = recalculateProfile({
        ...existing,
        assessmentProgress: {
          ...existing.assessmentProgress,
          [blockId]: {
            ...existing.assessmentProgress[blockId],
            lastVisitedPage: pageNumber,
          },
        },
      });

      await persistProfile(next);
      return next;
    },
    [persistProfile],
  );

  const importProfileFromObject = React.useCallback(
    async (payload: unknown) => {
      const parsed = validateProfileExport(payload);
      const idExists = profilesRef.current.some(
        (profile) => profile.profileMeta.id === parsed.profileMeta.id,
      );

      const importedId = idExists ? crypto.randomUUID() : parsed.profileMeta.id;
      const nextProfile = recalculateProfile({
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

      await persistProfile(nextProfile);
      setCurrentProfileIdState(nextProfile.profileMeta.id);
      return nextProfile;
    },
    [persistProfile],
  );

  const setCurrentProfileId = React.useCallback((profileId: string | null) => {
    setCurrentProfileIdState(profileId);
  }, []);

  const currentProfile = React.useMemo(
    () =>
      profiles.find((profile) => profile.profileMeta.id === currentProfileId) ??
      null,
    [currentProfileId, profiles],
  );

  const value = React.useMemo(
    () => ({
      profiles,
      currentProfileId,
      currentProfile,
      hydrated,
      createProfile: createProfileRecord,
      updateProfileDetails,
      updateAnswer: updateAnswerValue,
      setLastVisitedPage,
      setCurrentProfileId,
      importProfileFromObject,
      refreshProfiles,
    }),
    [
      profiles,
      currentProfileId,
      currentProfile,
      hydrated,
      createProfileRecord,
      updateProfileDetails,
      updateAnswerValue,
      setLastVisitedPage,
      setCurrentProfileId,
      importProfileFromObject,
      refreshProfiles,
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
