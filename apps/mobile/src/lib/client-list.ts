import type { clients } from "@/db/schema";

export const clientStatuses = [
  "prenatal",
  "postpartum",
  "out-of-care",
] as const;

export type ClientStatus = (typeof clientStatuses)[number];
type ClientRecord = typeof clients.$inferSelect;

function normalizeName(value: string): string {
  return value
    .toLocaleLowerCase()
    .trim()
    .replace(/[\s,]+/g, " ");
}

/** Matches one query against all name forms associated with a client. */
export function matchesClientName(
  client: Pick<
    ClientRecord,
    "firstName" | "middleName" | "lastName" | "preferredName" | "partnerName"
  >,
  query: string,
  relatedNames: readonly string[] = [],
): boolean {
  const normalizedQuery = normalizeName(query);
  if (!normalizedQuery) return true;

  const givenNames = [client.firstName, client.middleName]
    .filter((name): name is string => Boolean(name))
    .join(" ");
  const candidates = [
    `${givenNames} ${client.lastName}`,
    `${client.lastName} ${givenNames}`,
    client.preferredName ? `${client.preferredName} ${client.lastName}` : null,
    client.preferredName ? `${client.lastName} ${client.preferredName}` : null,
    client.partnerName,
    ...relatedNames,
  ];

  return candidates.some(
    (candidate) =>
      candidate != null && normalizeName(candidate).includes(normalizedQuery),
  );
}

/** Derives the display status, giving an inactive care relationship priority over pregnancy dates. */
export function deriveClientStatus(
  client: Pick<ClientRecord, "isActive" | "actualDeliveryDate">,
): ClientStatus {
  if (!client.isActive) return "out-of-care";
  return client.actualDeliveryDate ? "postpartum" : "prenatal";
}

/** Builds the primary date line and optional postpartum age shown in a client-list row. */
export function getClientDateSummary(
  client: Pick<
    ClientRecord,
    "isActive" | "actualDeliveryDate" | "estimatedDeliveryDate"
  >,
  today = new Date(),
): { dateLabel: string | null; postpartumLabel: string | null } {
  if (!client.actualDeliveryDate) {
    return {
      dateLabel: client.estimatedDeliveryDate
        ? `EDD: ${client.estimatedDeliveryDate}`
        : null,
      postpartumLabel: null,
    };
  }

  const status = deriveClientStatus(client);
  if (status !== "postpartum") {
    return {
      dateLabel: `DD: ${client.actualDeliveryDate}`,
      postpartumLabel: null,
    };
  }

  const [year, month, day] = client.actualDeliveryDate
    .slice(0, 10)
    .split("-")
    .map(Number);
  const deliveryDate = Date.UTC(year, month - 1, day);
  const currentDate = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const daysPostpartum = Math.max(
    0,
    Math.floor((currentDate - deliveryDate) / 86_400_000),
  );

  return {
    dateLabel: `DD: ${client.actualDeliveryDate}`,
    postpartumLabel: `${daysPostpartum} ${daysPostpartum === 1 ? "day" : "days"} postpartum`,
  };
}
