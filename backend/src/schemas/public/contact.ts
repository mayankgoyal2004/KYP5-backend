import { z } from "zod";

export const createContactSchema = z.object({
  name: z.string().min(2, "Name is required (at least 2 characters)"),
  email: z.string().email("Valid email is required"),
  subject: z.string().min(2, "Subject is required"),
  message: z.string().min(5, "Message must be at least 5 characters long"),
});
