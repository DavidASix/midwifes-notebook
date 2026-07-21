import { sql } from "drizzle-orm";
import { check, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
    photoPath: text("photo_path"),

    estimatedDeliveryDate: text("estimated_delivery_date"),
    actualDeliveryDate: text("actual_delivery_date"),
    gravida: integer("gravida"),
    parity: integer("parity"),

    bloodType: text("blood_type"),
    rhStatus: text("rh_status"),
    gbsStatus: text("gbs_status"),
    deliveryMethod: text("delivery_method"),
    tearDegree: integer("tear_degree"),
    riskFactors: text("risk_factors"),

    partnerName: text("partner_name"),
    partnerRelationship: text("partner_relationship"),
    partnerPhone: text("partner_phone"),
    partnerBloodType: text("partner_blood_type"),

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
      sql`${table.bloodType} IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`,
    ),
    check("clients_rh_status_check", sql`${table.rhStatus} IN ('+', '-')`),
    check("clients_gbs_status_check", sql`${table.gbsStatus} IN ('+', '-')`),
    check(
      "clients_delivery_method_check",
      sql`${table.deliveryMethod} IN ('SVD', 'AVD', 'C-Section')`,
    ),
    check(
      "clients_tear_degree_check",
      sql`${table.tearDegree} IN (1, 2, 3, 4)`,
    ),
    check(
      "clients_partner_blood_type_check",
      sql`${table.partnerBloodType} IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')`,
    ),
    check("clients_is_active_check", sql`${table.isActive} IN (0, 1)`),
  ],
);
