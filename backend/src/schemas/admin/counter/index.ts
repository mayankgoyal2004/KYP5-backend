import { z } from "zod";

export const createCounterSchema = z.object({
  label: z.string().min(1, "Label is required"),
  value: z.coerce.number().int().nonnegative(),
  icon: z.string().optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
});

export const updateCounterSchema = z.object({
  label: z.string().min(1).optional(),
  value: z.coerce.number().int().nonnegative().optional(),
  icon: z.string().optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
