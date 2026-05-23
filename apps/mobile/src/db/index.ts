import { drizzle } from "drizzle-orm/expo-sqlite";
import { deleteDatabaseSync, openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const DB_NAME = "midwifes_notebook.db";

let expo = openDatabaseSync(DB_NAME, { enableChangeListener: true });
// Delete the database in development mode to ensure a clean slate on each reload. Stop using this after shipping 1 migration.
if (__DEV__) {
  expo.closeSync();
  deleteDatabaseSync(DB_NAME);
  expo = openDatabaseSync(DB_NAME, { enableChangeListener: true });
}

export const db = drizzle(expo, { schema });
