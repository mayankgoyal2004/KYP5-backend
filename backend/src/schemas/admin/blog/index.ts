import { z } from "zod";

export const createBlogSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  isPublished: z.boolean().optional().default(false),
});

export const updateBlogSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  content: z.string().min(1, "Content is required").optional(),
  excerpt: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  categoryId: z.string().optional(),
  isPublished: z.boolean().optional(),
});
