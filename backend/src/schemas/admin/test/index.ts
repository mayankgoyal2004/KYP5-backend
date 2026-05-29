import { z } from "zod";

export const createTestSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  duration: z.coerce.number().min(1),
  totalQuestions: z.coerce
    .number()
    .min(1, "Total questions must be at least 1"),
  totalMarks: z.coerce.number().optional().default(0),
  passingScore: z.coerce.number().optional().default(50),
  instructions: z.string().optional(),
  termsConditions: z.string().optional(),
  image: z.string().min(1, "Banner image is required"),

  isActive: z.coerce.boolean().optional().default(true),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  allowedAttempts: z.coerce.number().optional().default(1),
  negativeMarking: z.coerce.boolean().optional().default(false),
  negativeMarkValue: z.coerce.number().optional().default(0),
  shuffleQuestions: z.coerce.boolean().optional().default(true),
  showResult: z.coerce.boolean().optional().default(true),
  showAnswers: z.coerce.boolean().optional().default(false),
  minAnswersRequired: z.coerce.number().optional().default(1),
  languageIds: z.array(z.string().min(1)).optional().default([]),
});

export const updateTestSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  duration: z.coerce.number().min(1).optional(),
  totalQuestions: z.coerce.number().min(1).optional(),
  totalMarks: z.coerce.number().optional(),
  passingScore: z.coerce.number().optional(),
  instructions: z.string().optional(),
  termsConditions: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
  allowedAttempts: z.coerce.number().optional(),
  image: z.string().optional().nullable(),

  negativeMarking: z.coerce.boolean().optional(),
  negativeMarkValue: z.coerce.number().optional(),
  shuffleQuestions: z.coerce.boolean().optional(),
  showResult: z.coerce.boolean().optional(),
  showAnswers: z.coerce.boolean().optional(),
  minAnswersRequired: z.coerce.number().optional(),
  languageIds: z.array(z.string().min(1)).optional(),
});
