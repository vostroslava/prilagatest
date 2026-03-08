import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { schema } from "@/lib/db/schema";

let client:
  | ReturnType<typeof drizzle<typeof schema>>
  | null = null;

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return url;
}

export function getDb() {
  if (!client) {
    const sql = postgres(getDatabaseUrl(), {
      prepare: false,
      max: 5,
    });

    client = drizzle(sql, { schema });
  }

  return client;
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
