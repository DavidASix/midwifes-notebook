/** Joins static schema values into an escaped list suitable for a SQLite `IN` constraint. */
export function joinSqlValues(values: readonly (string | number)[]) {
  return values
    .map((value) =>
      typeof value === "string"
        ? `'${value.replace(/'/g, "''")}'`
        : String(value),
    )
    .join(", ");
}
