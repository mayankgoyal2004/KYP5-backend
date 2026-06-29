import { z } from "zod";

export const createAssessmentSubGroupSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  name: z.string().trim().min(1, "Name is required").max(255),
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .max(100)
    .regex(
      /^[A-Z0-9_]+$/,
      "Code must contain only uppercase letters, numbers, and underscores",
    ),
  description: z.string().trim().optional().nullable(),
  color: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).default(0),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateAssessmentSubGroupSchema = z.object({
  groupId: z.string().min(1).optional(),
  name: z.string().trim().min(1).max(255).optional(),
  code: z
    .string()
    .trim()
    .min(1)
    .max(100)
    .regex(/^[A-Z0-9_]+$/)
    .optional(),
  description: z.string().trim().optional().nullable(),
  color: z.string().optional().nullable(),
  order: z.coerce.number().int().min(0).optional(),
  isActive: z.coerce.boolean().optional(),
});
