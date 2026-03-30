import { z } from "zod";

export const newsletterStatusSchema = z.enum([
  "SUBSCRIBED",
  "CONTACTED",
  "UNSUBSCRIBED",
  "ARCHIVED",
]);

export const updateNewsletterSubscriberSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters long")
    .max(100, "Name must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  source: z
    .string()
    .trim()
    .max(100, "Source must be less than 100 characters")
    .optional(),
  status: newsletterStatusSchema.optional(),
  notes: z
    .string()
    .trim()
    .max(5000, "Notes must be less than 5000 characters")
    .optional()
    .or(z.literal("")),
  lastContactedAt: z
    .string()
    .datetime("lastContactedAt must be a valid ISO date")
    .optional()
    .nullable(),
});
