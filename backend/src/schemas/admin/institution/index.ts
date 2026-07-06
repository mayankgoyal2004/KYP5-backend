import { z } from "zod";

export const createInstitutionSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  logoUrl: z.string().optional().nullable(),
  phone1: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  referralCode: z.string().min(1, "Referral Code is required").max(50),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateInstitutionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.string().optional().nullable(),
  phone1: z.string().optional().nullable(),
  phone2: z.string().optional().nullable(),
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  referralCode: z.string().min(1).max(50).optional(),
  isActive: z.coerce.boolean().optional(),
});
