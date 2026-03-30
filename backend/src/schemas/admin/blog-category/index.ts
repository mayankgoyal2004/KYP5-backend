import { z } from "zod";

export const createBlogCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  isActive: z.boolean().optional().default(true),
});

export const updateBlogCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  isActive: z.boolean().optional(),
});
