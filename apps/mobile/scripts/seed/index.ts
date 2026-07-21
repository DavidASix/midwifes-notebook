import type { drizzle } from "drizzle-orm/op-sqlite";

import * as schema from "../../src/db/schema";
import { seedClients } from "./clients";

export type SeedDatabase = ReturnType<typeof drizzle<typeof schema>>;

/** Populates a development database with representative data for every entity. */
export async function seedDatabase(db: SeedDatabase): Promise<void> {
  await seedClients(db);
}
