import { z } from "zod";

export const createGroupContentSchema = z.object({
  groupId: z.string().min(1, "Group ID is required"),
  title: z.string().min(1, "Title is required").max(255),
  shortSummary: z.string().optional().nullable(),
  longDescription: z.string().optional().nullable(),
  strengths: z.any().optional().nullable(),
  weaknesses: z.any().optional().nullable(),
  recommendedStreams: z.any().optional().nullable(),
  recommendedCourses: z.any().optional().nullable(),
  recommendedCareers: z.any().optional().nullable(),
  developmentTips: z.any().optional().nullable(),
  learningStyle: z.string().optional().nullable(),
  workingStyle: z.string().optional().nullable(),
  warningAreas: z.any().optional().nullable(),
  recommendedTests: z.any().optional().nullable(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateGroupContentSchema = z.object({
  groupId: z.string().min(1).optional(),
  title: z.string().min(1).max(255).optional(),
  shortSummary: z.string().optional().nullable(),
  longDescription: z.string().optional().nullable(),
  strengths: z.any().optional().nullable(),
  weaknesses: z.any().optional().nullable(),
  recommendedStreams: z.any().optional().nullable(),
  recommendedCourses: z.any().optional().nullable(),
  recommendedCareers: z.any().optional().nullable(),
  developmentTips: z.any().optional().nullable(),
  learningStyle: z.string().optional().nullable(),
  workingStyle: z.string().optional().nullable(),
  warningAreas: z.any().optional().nullable(),
  recommendedTests: z.any().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});