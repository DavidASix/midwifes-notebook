import { z } from "zod";

const positiveIntegerRouteParamSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .pipe(z.coerce.number())
  .pipe(z.int().positive());

/** Accepts only one canonical positive-integer Expo Router path parameter. */
export function parsePositiveIntegerRouteParam(
  routeParam: string | string[] | undefined,
): number | null {
  const result = positiveIntegerRouteParamSchema.safeParse(routeParam);
  return result.success ? result.data : null;
}
