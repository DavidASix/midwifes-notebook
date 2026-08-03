import { z } from "zod";

export const isoCalendarDateSchema = z.iso.date();
export const isoTimestampSchema = z.iso.datetime();
