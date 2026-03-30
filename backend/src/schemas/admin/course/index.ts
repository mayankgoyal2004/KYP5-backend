import { z } from "zod";

export const createCourseSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  thumbnail: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateCourseSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  thumbnail: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});
