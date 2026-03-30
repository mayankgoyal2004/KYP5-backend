import { z } from "zod";

export const createBannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().min(1, "Banner image is required"),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().url().optional().or(z.literal("")).nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateBannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  subtitle: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  image: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().url().optional().or(z.literal("")).nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
