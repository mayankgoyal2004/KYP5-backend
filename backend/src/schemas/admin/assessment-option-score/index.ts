import { z } from "zod";

export const createAssessmentOptionScoreSchema = z.object({
  optionId: z.string().min(1, "Option ID is required"),
  groupId: z.string().min(1, "Group ID is required"),
  subGroupId: z.string().optional().nullable(),
  score: z.coerce.number().min(0, "Score must be non-negative"),
});

export const updateAssessmentOptionScoreSchema = z.object({
  optionId: z.string().min(1).optional(),
  groupId: z.string().min(1).optional(),
  subGroupId: z.string().optional().nullable(),
  score: z.coerce.number().min(0).optional(),
});