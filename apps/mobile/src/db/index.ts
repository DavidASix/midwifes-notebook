import { drizzle } from "drizzle-orm/op-sqlite";
import { open } from "@op-engineering/op-sqlite";
import * as schema from "./schema";

const DB_NAME = "midwifes_notebook.db";

// Delete the database in development mode to ensure a clean slate on each reload. Stop using this after shipping 1 migration.
if (__DEV__) {
  open({ name: DB_NAME }).delete();
}

const sqlite = open({ name: DB_NAME });

export const db = drizzle(sqlite, { schema });
