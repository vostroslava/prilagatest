import { openDB } from "idb";

import type { StoredProfile } from "@/types/profile";

const DB_NAME = "self-understanding-local-db";
const DB_VERSION = 1;
const PROFILE_STORE = "profiles";

let databasePromise: ReturnType<typeof openDB> | null = null;

function getDatabase() {
  if (typeof window === "undefined") {
    throw new Error("IndexedDB is only available in the browser.");
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

  return databasePromise;
}

export async function listProfiles() {
  const db = await getDatabase();
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
  return (await db.get(PROFILE_STORE, id)) as StoredProfile | undefined;
}

export async function saveProfile(profile: StoredProfile) {
  const db = await getDatabase();
  await db.put(PROFILE_STORE, profile, profile.profileMeta.id);
  return profile;
}

export async function deleteProfile(id: string) {
  const db = await getDatabase();
  await db.delete(PROFILE_STORE, id);
}
