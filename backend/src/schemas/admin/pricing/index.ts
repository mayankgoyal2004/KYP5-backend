import { z } from "zod";

export const createPricingPlanSchema = z.object({
  badgeText: z.string().max(255).optional().nullable(),
  title: z.string().min(1, "Title is required").max(255),
  price: z.coerce.number().nonnegative("Price must be a positive number"),
  features: z.array(z.string().min(1, "Feature item cannot be empty")),
  buttonText: z.string().optional().default("Buy Now"),
  buttonLink: z.string().optional().default("/login"),
  isFeatured: z.boolean().optional().default(false),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional().default(true),
});

export const updatePricingPlanSchema = z.object({
  badgeText: z.string().max(255).optional().nullable(),
  title: z.string().min(1, "Title is required").max(255).optional(),
  price: z.coerce.number().nonnegative("Price must be a positive number").optional(),
  features: z.array(z.string().min(1, "Feature item cannot be empty")).optional(),
  buttonText: z.string().optional(),
  buttonLink: z.string().optional(),
  isFeatured: z.boolean().optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
