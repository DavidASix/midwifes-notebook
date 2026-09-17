const revisions = new Map<number, number>();

/** Returns the current change revision for one client's baby records. */
export function getBabyRecordsRevision(clientId: number): number {
  return revisions.get(clientId) ?? 0;
}

/** Marks one client's baby records stale after a successful mutation. */
export function markBabyRecordsChanged(clientId: number): void {
  revisions.set(clientId, getBabyRecordsRevision(clientId) + 1);
}
