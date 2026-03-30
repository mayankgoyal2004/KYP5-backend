import { z } from "zod";

export const createTeamSchema = z.object({
  name: z.string({
    required_error: "Name is required",
  }),
  role: z.string({
    required_error: "Role is required",
  }),
  bio: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  linkedin: z.string().url().optional().or(z.literal("")).nullable(),
  twitter: z.string().url().optional().or(z.literal("")).nullable(),
  facebook: z.string().url().optional().or(z.literal("")).nullable(),
  instagram: z.string().url().optional().or(z.literal("")).nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().default(true),
});

export const updateTeamSchema = z.object({
  name: z.string().optional(),
  role: z.string().optional(),
  bio: z.string().optional().nullable(),
  avatar: z.string().optional().nullable(),
  linkedin: z.string().url().optional().or(z.literal("")).nullable(),
  twitter: z.string().url().optional().or(z.literal("")).nullable(),
  facebook: z.string().url().optional().or(z.literal("")).nullable(),
  instagram: z.string().url().optional().or(z.literal("")).nullable(),
  email: z.string().email().optional().or(z.literal("")).nullable(),
  order: z.coerce.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});
