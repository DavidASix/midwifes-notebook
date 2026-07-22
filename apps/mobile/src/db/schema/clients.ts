import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import { joinSqlValues } from "../utils";

export const bloodTypes = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
] as const;
export const rhStatuses = ["+", "-"] as const;
export const gbsStatuses = ["+", "-"] as const;
export const deliveryMethods = ["SVD", "AVD", "C-Section"] as const;
export const tearDegrees = [1, 2, 3, 4] as const;
export const activeStates = [0, 1] as const;

export const clients = sqliteTable(
  "clients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    middleName: text("middle_name"),
    preferredName: text("preferred_name"),

    address: text("address"),
    primaryPhone: text("primary_phone"),

    dateOfBirth: text("date_of_birth"),
    age: integer("age"),

    estimatedDeliveryDate: text("estimated_delivery_date"),
    actualDeliveryDate: text("actual_delivery_date"),
    gravida: integer("gravida"),
    parity: integer("parity"),

    bloodType: text("blood_type", { enum: bloodTypes }),
    rhStatus: text("rh_status", { enum: rhStatuses }),
    gbsStatus: text("gbs_status", { enum: gbsStatuses }),
    deliveryMethod: text("delivery_method", { enum: deliveryMethods }),
    tearDegree: integer("tear_degree"),
    riskFactors: text("risk_factors"),

    partnerName: text("partner_name"),
    partnerRelationship: text("partner_relationship"),
    partnerPhone: text("partner_phone"),
    partnerBloodType: text("partner_blood_type", { enum: bloodTypes }),

    isActive: integer("is_active").notNull().default(1),

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
      "clients_blood_type_check",
      sql`${table.bloodType} IN (${sql.raw(joinSqlValues(bloodTypes))})`,
    ),
    check(
      "clients_rh_status_check",
      sql`${table.rhStatus} IN (${sql.raw(joinSqlValues(rhStatuses))})`,
    ),
    check(
      "clients_gbs_status_check",
      sql`${table.gbsStatus} IN (${sql.raw(joinSqlValues(gbsStatuses))})`,
    ),
    check(
      "clients_delivery_method_check",
      sql`${table.deliveryMethod} IN (${sql.raw(joinSqlValues(deliveryMethods))})`,
    ),
    check(
      "clients_tear_degree_check",
      sql`${table.tearDegree} IN (${sql.raw(joinSqlValues(tearDegrees))})`,
    ),
    check(
      "clients_partner_blood_type_check",
      sql`${table.partnerBloodType} IN (${sql.raw(joinSqlValues(bloodTypes))})`,
    ),
    check(
      "clients_is_active_check",
      sql`${table.isActive} IN (${sql.raw(joinSqlValues(activeStates))})`,
    ),
  ],
);
