import { openDB } from "idb";

import type { StoredProfile } from "@/types/profile";

const DB_NAME = "self-understanding-local-db";
const DB_VERSION = 1;
const PROFILE_STORE = "profiles";

let databasePromise: ReturnType<typeof openDB> | null = null;
const memoryProfiles = new Map<string, StoredProfile>();

function isIndexedDbAvailable() {
  return typeof window !== "undefined" && typeof window.indexedDB !== "undefined";
}

async function getDatabase() {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  if (!databasePromise) {
    databasePromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(database) {
        if (!database.objectStoreNames.contains(PROFILE_STORE)) {
          database.createObjectStore(PROFILE_STORE);
        }
      },
    });
  }

  try {
    return await databasePromise;
  } catch {
    databasePromise = null;
    return null;
  }
}

function listMemoryProfiles() {
  return [...memoryProfiles.values()].sort((left, right) =>
    right.profileMeta.updatedAt.localeCompare(left.profileMeta.updatedAt),
  );
}

export async function listProfiles() {
  const db = await getDatabase();
  if (!db) {
    return listMemoryProfiles();
  }

  const keys = await db.getAllKeys(PROFILE_STORE);
  const values = await Promise.all(
    keys.map((key) => db.get(PROFILE_STORE, key as IDBValidKey)),
  );

  return values
    .filter((value): value is StoredProfile => Boolean(value))
    .sort((left, right) => right.profileMeta.updatedAt.localeCompare(left.profileMeta.updatedAt));
}

export async function getProfile(id: string) {
  const db = await getDatabase();
  if (!db) {
    return memoryProfiles.get(id);
  }

  return (await db.get(PROFILE_STORE, id)) as StoredProfile | undefined;
}

export async function saveProfile(profile: StoredProfile) {
  const db = await getDatabase();
  if (!db) {
    memoryProfiles.set(profile.profileMeta.id, profile);
    return profile;
  }

  await db.put(PROFILE_STORE, profile, profile.profileMeta.id);
  return profile;
}

export async function deleteProfile(id: string) {
  const db = await getDatabase();
  if (!db) {
    memoryProfiles.delete(id);
    return;
  }

  await db.delete(PROFILE_STORE, id);
}
