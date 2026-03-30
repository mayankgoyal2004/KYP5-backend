import { z } from "zod";

export const createTestimonialSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  content: z.string().min(1, "Content is required"),
  avatar: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional().default(5),
  isActive: z.boolean().optional().default(true),
});

export const updateTestimonialSchema = z.object({
  name: z.string().min(1, "Name is required").max(100).optional(),
  content: z.string().min(1, "Content is required").optional(),
  avatar: z.string().optional().nullable(),
  rating: z.number().min(1).max(5).optional(),
  isActive: z.boolean().optional(),
});
