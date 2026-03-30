import { z } from "zod";

export const createPartnerSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }),
  logo: z.string({
    required_error: "Logo is required",
  }),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
});

export const updatePartnerSchema = z.object({
  name: z.string().optional(),
  logo: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")).nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
