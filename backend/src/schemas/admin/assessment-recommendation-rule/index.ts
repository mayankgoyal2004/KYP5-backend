import { z } from "zod";

export const createAssessmentRecommendationRuleSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  conditions: z.any().refine((val) => val !== undefined && val !== null, "Conditions are required"),
  recommendedTestId: z.string().optional().nullable(),
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional().nullable(),
  priority: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateAssessmentRecommendationRuleSchema = z.object({
  testId: z.string().min(1).optional(),
  conditions: z.any().optional(),
  recommendedTestId: z.string().optional().nullable(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional().nullable(),
  priority: z.coerce.number().int().min(0).optional(),
  isActive: z.coerce.boolean().optional(),
});