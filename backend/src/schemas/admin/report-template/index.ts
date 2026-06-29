import { z } from "zod";

export const createReportTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  slug: z.string().min(1, "Slug is required").max(100).regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  coverTitle: z.string().optional().nullable(),
  coverSubtitle: z.string().optional().nullable(),
  disclaimerText: z.string().optional().nullable(),
  aboutUsContent: z.string().optional().nullable(),
  importanceContent: z.string().optional().nullable(),
  resultIntro: z.string().optional().nullable(),
  recommendationIntro: z.string().optional().nullable(),
  brandingConfig: z.any().optional().nullable(),
  pageConfig: z.any().optional().nullable(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateReportTemplateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/).optional(),
  coverTitle: z.string().optional().nullable(),
  coverSubtitle: z.string().optional().nullable(),
  disclaimerText: z.string().optional().nullable(),
  aboutUsContent: z.string().optional().nullable(),
  importanceContent: z.string().optional().nullable(),
  resultIntro: z.string().optional().nullable(),
  recommendationIntro: z.string().optional().nullable(),
  brandingConfig: z.any().optional().nullable(),
  pageConfig: z.any().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});