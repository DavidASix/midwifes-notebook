import type { clients } from "@/db/schema";

export const clientStatuses = [
  "prenatal",
  "postpartum",
  "out-of-care",
] as const;
export const clientStatusFilters = ["all", ...clientStatuses] as const;

export type ClientStatus = (typeof clientStatuses)[number];
export type ClientStatusFilter = (typeof clientStatusFilters)[number];
type ClientRecord = typeof clients.$inferSelect;
type ClientNameFields = Pick<
  ClientRecord,
  "firstName" | "middleName" | "lastName" | "preferredName" | "partnerName"
>;
type ClientStatusFields = Pick<ClientRecord, "isActive" | "actualDeliveryDate">;

export type ClientListSection<T> = {
  title: string;
  data: T[];
};

function normalizeName(value: string): string {
  return value
    .toLocaleLowerCase()
    .trim()
    .replace(/[\s,]+/g, " ");
}

function getLastNameInitial(lastName: string): string {
  const initial = Array.from(lastName.trim())[0]?.toLocaleUpperCase();
  if (!initial || initial.toLocaleLowerCase() === initial) return "#";
  return initial;
}

/** Sorts clients by last name and groups them under alphabetic section headers. */
export function groupClientsByLastName<
  T extends Pick<ClientRecord, "firstName" | "lastName">,
>(clientsToGroup: readonly T[]): ClientListSection<T>[] {
  const grouped = new Map<string, T[]>();
  const sortedClients = [...clientsToGroup].sort(
    (left, right) =>
      left.lastName.localeCompare(right.lastName, undefined, {
        sensitivity: "base",
      }) ||
      left.firstName.localeCompare(right.firstName, undefined, {
        sensitivity: "base",
      }),
  );

  for (const client of sortedClients) {
    const title = getLastNameInitial(client.lastName);
    grouped.set(title, [...(grouped.get(title) ?? []), client]);
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => {
      if (left === "#") return 1;
      if (right === "#") return -1;
      return left.localeCompare(right, undefined, { sensitivity: "base" });
    })
    .map(([title, data]) => ({ title, data }));
}

/** Resolves a pager offset to the nearest available client-status view. */
export function getClientStatusFilterForOffset(
  horizontalOffset: number,
  pageWidth: number,
): ClientStatusFilter {
  if (pageWidth <= 0) return "all";
  const index = Math.min(
    clientStatusFilters.length - 1,
    Math.max(0, Math.round(horizontalOffset / pageWidth)),
  );
  return clientStatusFilters[index];
}

/** Matches one query against all name forms associated with a client. */
export function matchesClientName(
  client: ClientNameFields,
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

/** Applies the selected status and name constraints to one client-list record. */
export function isClientVisible(
  client: ClientNameFields & ClientStatusFields,
  query: string,
  statusFilter: ClientStatusFilter,
  relatedNames: readonly string[] = [],
): boolean {
  const matchesStatus =
    statusFilter === "all" || deriveClientStatus(client) === statusFilter;
  return matchesStatus && matchesClientName(client, query, relatedNames);
}

/** Derives the display status, giving an inactive care relationship priority over pregnancy dates. */
export function deriveClientStatus(client: ClientStatusFields): ClientStatus {
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
