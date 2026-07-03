import { z } from "zod";

export const createReportTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  coverTitle: z.string().optional().nullable(),
  brandingConfig: z.any().optional().nullable(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateReportTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  coverTitle: z.string().optional().nullable(),
  brandingConfig: z.any().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});