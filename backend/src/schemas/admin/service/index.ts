import { z } from "zod";

const workProcessStepSchema = z.object({
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

const benefitCardSchema = z.object({
  icon: z.string().optional().nullable(),
  iconPackage: z.string().optional().nullable(),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
});

export const createServiceSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  price: z.string().optional().nullable(),
  briefIntro: z.string().min(1, "Brief intro is required"),
  aboutTitle: z.string().min(1, "About title is required").max(255),
  aboutDescription: z.string().min(1, "About description is required"),
  aboutImage: z.string().optional().nullable(),
  aboutStatus: z.boolean().optional().default(true),
  workProcessTitle: z
    .string()
    .min(1, "Work process title is required")
    .max(255),
  workProcessSubTitle: z.string().optional().nullable(),

  workProcessStepsCount: z.coerce.number().int().nonnegative().optional(),
  workProcessSteps: z.array(workProcessStepSchema).optional(),
  benefitsMainTitle: z.string().min(1, "Benefits title is required").max(255),
  benefitsSubTitle: z.string().optional().nullable(),

  benefitsCards: z.array(benefitCardSchema).optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updateServiceSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  price: z.string().optional().nullable(),
  briefIntro: z.string().optional(),
  aboutTitle: z.string().optional(),
  aboutDescription: z.string().optional(),
  aboutImage: z.string().optional().nullable(),
  aboutStatus: z.boolean().optional(),
  workProcessTitle: z.string().optional(),
  workProcessSubTitle: z.string().optional().nullable(),

  workProcessStepsCount: z.coerce.number().int().nonnegative().optional(),
  workProcessSteps: z.array(workProcessStepSchema).optional(),
  benefitsMainTitle: z.string().optional(),
  benefitsSubTitle: z.string().optional().nullable(),

  benefitsCards: z.array(benefitCardSchema).optional(),

  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
