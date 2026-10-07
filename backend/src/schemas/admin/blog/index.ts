import { z } from "zod";

export const createBlogSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(255, "Title cannot exceed 255 characters"),
  content: z
    .string()
    .trim()
    .min(50, "Blog content must be at least 50 characters to ensure content quality"),
  excerpt: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  categoryId: z.string().min(1, "Category is required"),
  isPublished: z.boolean().optional().default(false),
});

export const updateBlogSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title must be at least 5 characters")
    .max(255)
    .optional(),
  content: z
    .string()
    .trim()
    .min(50, "Blog content must be at least 50 characters to ensure content quality")
    .optional(),
  excerpt: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  categoryId: z.string().optional(),
  isPublished: z.boolean().optional(),
});
