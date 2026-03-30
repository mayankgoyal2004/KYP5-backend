import { z } from "zod";

export const createEventSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  eventDate: z.string().min(1, "Event date is required"),
  eventTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().url().optional().or(z.literal("")).nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateEventSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  thumbnail: z.string().optional().nullable(),
  eventDate: z.string().optional(),
  eventTime: z.string().optional().nullable(),
  venue: z.string().optional().nullable(),
  buttonText: z.string().optional().nullable(),
  buttonLink: z.string().url().optional().or(z.literal("")).nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
