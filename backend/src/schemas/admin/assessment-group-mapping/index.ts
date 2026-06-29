import { z } from "zod";

export const createAssessmentGroupMappingSchema = z.object({
  testId: z.string().min(1, "Test ID is required"),
  groupId: z.string().min(1, "Group ID is required"),
  order: z.coerce.number().int().min(0).default(0),
  weightMultiplier: z.coerce.number().min(0).default(1),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateAssessmentGroupMappingSchema = z.object({
  testId: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  order: z.coerce.number().int().min(0).optional(),
  weightMultiplier: z.coerce.number().min(0).optional(),
  isActive: z.coerce.boolean().optional(),
});