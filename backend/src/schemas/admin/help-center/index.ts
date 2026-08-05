import { z } from "zod";

export const createHelpCenterSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  buttonText: z.string().optional().default("View Guide"),
  pdfPath: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  icon: z.string().optional().default("fa-regular fa-file-lines"),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateHelpCenterSchema = z.object({
  title: z.string().min(1, "Title is required").max(255).optional(),
  description: z.string().min(1, "Description is required").optional(),
  buttonText: z.string().optional(),
  pdfPath: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  icon: z.string().optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
