import { z } from "zod";

const optionalPhoneSchema = z
  .union([
    z
      .string()
      .regex(/^\+?[0-9\s-]{7,15}$/, "Please enter a valid phone number"),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((val) => (!val || val.trim() === "" ? null : val.trim()));

export const createInstitutionSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  logoUrl: z.string().optional().nullable(),
  phone1: optionalPhoneSchema,
  phone2: optionalPhoneSchema,
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  referralCode: z.string().min(1, "Referral Code is required").max(50),
  adminEmail: z.string().optional().nullable(),
  adminPassword: z.string().optional().nullable(),
  planCode: z.string().optional().nullable(),
  billingCycle: z.string().optional().nullable(),
  seatLimit: z.coerce.number().optional().nullable(),
  isActive: z.coerce.boolean().optional().default(true),
});

export const updateInstitutionSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.string().optional().nullable(),
  phone1: optionalPhoneSchema,
  phone2: optionalPhoneSchema,
  email: z.string().email("Invalid email format").optional().nullable().or(z.literal("")),
  referralCode: z.string().min(1).max(50).optional(),
  adminEmail: z.string().optional().nullable(),
  adminPassword: z.string().optional().nullable(),
  planCode: z.string().optional().nullable(),
  billingCycle: z.string().optional().nullable(),
  seatLimit: z.coerce.number().optional().nullable(),
  isActive: z.coerce.boolean().optional(),
});

