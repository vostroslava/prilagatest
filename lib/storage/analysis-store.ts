import { openDB } from "idb";

import type {
  SavedCompareAnalysis,
  SavedProfileAnalysis,
} from "@/types/analysis";

const DB_NAME = "self-understanding-analysis-db";
const DB_VERSION = 1;
const PROFILE_ANALYSIS_STORE = "profile-analyses";
const COMPARE_ANALYSIS_STORE = "compare-analyses";

let databasePromise: ReturnType<typeof openDB> | null = null;
const memoryProfileAnalyses = new Map<string, SavedProfileAnalysis>();
const memoryCompareAnalyses = new Map<string, SavedCompareAnalysis>();

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
        if (!database.objectStoreNames.contains(PROFILE_ANALYSIS_STORE)) {
          database.createObjectStore(PROFILE_ANALYSIS_STORE);
        }

        if (!database.objectStoreNames.contains(COMPARE_ANALYSIS_STORE)) {
          database.createObjectStore(COMPARE_ANALYSIS_STORE);
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

export async function getSavedProfileAnalysis(profileId: string) {
  const db = await getDatabase();
  if (!db) {
    return memoryProfileAnalyses.get(profileId) ?? null;
  }

  return (
    ((await db.get(
      PROFILE_ANALYSIS_STORE,
      profileId,
    )) as SavedProfileAnalysis | undefined) ?? null
  );
}

export async function saveProfileAnalysis(analysis: SavedProfileAnalysis) {
  const db = await getDatabase();
  if (!db) {
    memoryProfileAnalyses.set(analysis.profileId, analysis);
    return analysis;
  }

  await db.put(PROFILE_ANALYSIS_STORE, analysis, analysis.profileId);
  return analysis;
}

export async function getSavedCompareAnalysis(pairKey: string) {
  const db = await getDatabase();
  if (!db) {
    return memoryCompareAnalyses.get(pairKey) ?? null;
  }

  return (
    ((await db.get(
      COMPARE_ANALYSIS_STORE,
      pairKey,
    )) as SavedCompareAnalysis | undefined) ?? null
  );
}

export async function saveCompareAnalysis(analysis: SavedCompareAnalysis) {
  const db = await getDatabase();
  if (!db) {
    memoryCompareAnalyses.set(analysis.pairKey, analysis);
    return analysis;
  }

  await db.put(COMPARE_ANALYSIS_STORE, analysis, analysis.pairKey);
  return analysis;
}
