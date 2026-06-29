import { z } from "zod";
import { AssessmentType, ResultVisibility } from "@prisma/client";

export const createTestSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  duration: z.coerce.number().min(1),
  instructions: z.string().optional(),
  termsConditions: z.string().optional(),
  image: z.string().min(1, "Banner image is required"),

  isActive: z.coerce.boolean().optional().default(true),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  allowedAttempts: z.coerce.number().min(1).max(50).default(1),
  shuffleQuestions: z.coerce.boolean().optional().default(true),
  minAnswersRequired: z.coerce.number().min(1).default(1),
  languageIds: z.array(z.string().min(1)).optional().default([]),
  
  // Assessment fields - using Prisma enums directly (Problem 7)
  assessmentType: z.nativeEnum(AssessmentType).optional().default(AssessmentType.CUSTOM),
  resultVisibility: z.nativeEnum(ResultVisibility).optional().default(ResultVisibility.IMMEDIATE),
  reportTemplateId: z.string().optional().nullable(),
  assessmentSummary: z.string().optional().nullable(),
  assessmentMetadata: z.object({
    theme: z.string().optional(),
    showCharts: z.boolean().optional(),
    showTopGroups: z.number().optional(),
  }).passthrough().optional().nullable(),
});

export const updateTestSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  duration: z.coerce.number().min(1).optional(),

  instructions: z.string().optional(),
  termsConditions: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  allowedAttempts: z.coerce.number().min(1).max(50).optional(),
  image: z.string().optional().nullable(),

  shuffleQuestions: z.coerce.boolean().optional(),
  minAnswersRequired: z.coerce.number().min(1).optional(),
  languageIds: z.array(z.string().min(1)).optional(),
  
  // Assessment fields - using Prisma enums directly (Problem 7)
  assessmentType: z.nativeEnum(AssessmentType).optional(),
  resultVisibility: z.nativeEnum(ResultVisibility).optional(),
  reportTemplateId: z.string().optional().nullable(),
  assessmentSummary: z.string().optional().nullable(),
  assessmentMetadata: z.object({
    theme: z.string().optional(),
    showCharts: z.boolean().optional(),
    showTopGroups: z.number().optional(),
  }).passthrough().optional().nullable(),
});