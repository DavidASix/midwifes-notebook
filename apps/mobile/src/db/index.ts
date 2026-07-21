import { drizzle } from "drizzle-orm/op-sqlite";
import { migrate } from "drizzle-orm/op-sqlite/migrator";
import { open } from "@op-engineering/op-sqlite";

import * as schema from "./schema";
import migrations from "../../drizzle/migrations";

const DB_NAME = "midwifes_notebook.db";

let _db: ReturnType<typeof drizzle<typeof schema>> | undefined;

/**
 * Opens the encrypted SQLite database with the given key, runs any pending migrations, and stores the instance for retrieval via `getDb`.
 * Should be called once — inside `app/lock.tsx` after the user authenticates
 *
 * @param key - SQLCipher encryption key. Sourced from SecureStore in production;
 *   a fixed dev string is acceptable in `__DEV__` mode.
 */
export async function initDb(key: string): Promise<void> {
  if (__DEV__) open({ name: DB_NAME }).delete(); // Reset database on every reload in development for convenience. Delete this before shipping.
  const sqlite = open({ name: DB_NAME, encryptionKey: key });
  _db = drizzle(sqlite, { schema });
  await migrate(_db, migrations);
}

/**
 * Returns the initialized Drizzle database instance. Safe to call anywhere
 * inside the `(app)` route group, where `initDb` is guaranteed to have run
 * before any screen renders.
 */
export function getDb() {
  if (!_db) {
    throw new Error("Database not initialized.");
  }
  return _db!;
}

/**
 * Clears the in-memory database reference so the app returns to a locked
 * state. Call this before navigating to `/lock` when the user manually locks
 * the app. The underlying SQLite file is not affected.
 */
export function resetDb(): void {
  _db = undefined;
}
