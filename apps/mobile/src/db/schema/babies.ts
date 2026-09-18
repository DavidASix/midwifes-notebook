import { relations, sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { toIsoDate } from "@/lib/dates";

import { joinSqlValues } from "../utils";
import { clients, bloodTypes } from "./clients";
import { isoCalendarDateSchema, isoTimestampSchema } from "./shared";

const nonFutureCalendarDateSchema = isoCalendarDateSchema.refine(
  (value) => value <= toIsoDate(new Date()),
  "Event date cannot be in the future.",
);

export const babySexes = ["male", "female", "unknown"] as const;
export const feedingTypes = ["breast_milk", "formula", "combination"] as const;
export const babyOutcomes = [
  "live_birth",
  "miscarriage",
  "stillbirth",
] as const;

export const babies = sqliteTable(
  "babies",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    clientId: integer("client_id")
      .notNull()
      .references(() => clients.id),
    name: text("name"),
    sex: text("sex", { enum: babySexes }),
    eventDate: text("event_date"),
    birthWeightGrams: integer("birth_weight_grams"),
    gestationalAgeDays: integer("gestational_age_days"),
    bloodType: text("blood_type", { enum: bloodTypes }),
    feedingType: text("feeding_type", { enum: feedingTypes }),
    riskFactors: text("risk_factors"),
    outcome: text("outcome", { enum: babyOutcomes }),
    createdAt: text("created_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    updatedAt: text("updated_at")
      .notNull()
      .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
    deletedAt: text("deleted_at"),
  },
  (table) => [
    check(
      "babies_sex_check",
      sql`${table.sex} IN (${sql.raw(joinSqlValues(babySexes))})`,
    ),
    check(
      "babies_blood_type_check",
      sql`${table.bloodType} IN (${sql.raw(joinSqlValues(bloodTypes))})`,
    ),
    check(
      "babies_feeding_type_check",
      sql`${table.feedingType} IN (${sql.raw(joinSqlValues(feedingTypes))})`,
    ),
    check(
      "babies_outcome_check",
      sql`${table.outcome} IN (${sql.raw(joinSqlValues(babyOutcomes))})`,
    ),
    check("babies_birth_weight_check", sql`${table.birthWeightGrams} >= 0`),
    check(
      "babies_gestational_age_check",
      sql`${table.gestationalAgeDays} >= 0`,
    ),
  ],
);

/** Validates a baby row after it crosses the SQLite read boundary. */
export const babiesSchema = createSelectSchema(babies, {
  id: z.int().positive(),
  clientId: z.int().positive(),
  eventDate: nonFutureCalendarDateSchema.nullable(),
  birthWeightGrams: z.int().nonnegative().nullable(),
  gestationalAgeDays: z.int().nonnegative().nullable(),
  createdAt: isoTimestampSchema,
  updatedAt: isoTimestampSchema,
  deletedAt: isoTimestampSchema.nullable(),
});

export const babiesRelations = relations(babies, ({ one }) => ({
  client: one(clients, {
    fields: [babies.clientId],
    references: [clients.id],
  }),
}));

export type BabyRecord = z.infer<typeof babiesSchema>;
