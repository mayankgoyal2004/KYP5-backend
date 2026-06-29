import { z } from "zod";

export const createReportSectionSchema = z.object({
  templateId: z.string().min(1, "Template ID is required"),
  sectionKey: z.string().min(1, "Section key is required").max(100).regex(/^[a-z0-9_]+$/, "Section key must contain only lowercase letters, numbers, and underscores"),
  title: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0),
  config: z.any().optional().nullable(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateReportSectionSchema = z.object({
  templateId: z.string().min(1).optional(),
  sectionKey: z.string().min(1).max(100).regex(/^[a-z0-9_]+$/).optional(),
  title: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).optional(),
  config: z.any().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});