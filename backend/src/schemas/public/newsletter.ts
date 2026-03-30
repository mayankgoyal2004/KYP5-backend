import { z } from "zod";

export const createNewsletterSubscriberSchema = z.object({
  email: z.string().trim().email("Valid email is required"),
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
});
