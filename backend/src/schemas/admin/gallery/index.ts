import { z } from "zod";

export const createGallerySchema = z.object({
  title: z.string().optional().nullable(),
  image: z.string().min(1, "Image is required"),
  category: z.string().optional().nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateGallerySchema = z.object({
  title: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
