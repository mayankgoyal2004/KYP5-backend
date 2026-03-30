import { z } from "zod";

export const createCourseCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateCourseCategorySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
