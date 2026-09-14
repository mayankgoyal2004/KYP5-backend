import { z } from "zod";

export const subscriptionTierEnum = z.enum([
  "BRONZE",
  "SILVER",
  "GOLD",
  "ENTERPRISE",
]);

export const createPricingPlanSchema = z.object({
  code: subscriptionTierEnum,
  name: z.string().min(1, "Name is required").max(255),
  badgeText: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  priceMonthly: z.coerce.number().nonnegative("Monthly price must be a positive number"),
  priceAnnual: z.coerce.number().nonnegative("Annual price must be a positive number"),
  maxStudents: z.coerce.number().int().positive("Max students must be greater than 0").default(100),
  features: z.array(z.string().min(1, "Feature item cannot be empty")),
  buttonText: z.string().optional().default("Get Started"),
  buttonLink: z.string().optional().default("/login"),
  isFeatured: z.boolean().optional().default(false),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updatePricingPlanSchema = z.object({
  code: subscriptionTierEnum.optional(),
  name: z.string().min(1, "Name is required").max(255).optional(),
  badgeText: z.string().max(255).optional().nullable(),
  description: z.string().optional().nullable(),
  priceMonthly: z.coerce.number().nonnegative("Monthly price must be a positive number").optional(),
  priceAnnual: z.coerce.number().nonnegative("Annual price must be a positive number").optional(),
  maxStudents: z.coerce.number().int().positive("Max students must be greater than 0").optional(),
  features: z.array(z.string().min(1, "Feature item cannot be empty")).optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  isFeatured: z.boolean().optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
