/// <reference types="node" />

import { readdirSync } from "node:fs";
import { join } from "node:path";
import { isTable } from "drizzle-orm";
import { z } from "zod";

describe("database schema exports", () => {
  it("exports a matching Zod schema for every Drizzle table", () => {
    const schemaDirectory = join(__dirname, "..");
    const schemaFiles = readdirSync(schemaDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => entry.name)
      .sort();
    const missingSchemas: string[] = [];
    let tableCount = 0;

    for (const schemaFile of schemaFiles) {
      const moduleExports = jest.requireActual<Record<string, unknown>>(
        join(schemaDirectory, schemaFile),
      );

      for (const [exportName, exportedValue] of Object.entries(moduleExports)) {
        if (!isTable(exportedValue)) continue;

        tableCount += 1;
        const schemaExportName = `${exportName}Schema`;
        if (!(moduleExports[schemaExportName] instanceof z.ZodObject)) {
          missingSchemas.push(`${schemaFile}: ${schemaExportName}`);
        }
      }
    }

    expect(tableCount).toBeGreaterThan(0);
    expect(missingSchemas).toEqual([]);
  });
});
