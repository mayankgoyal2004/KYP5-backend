import { z } from "zod";

const optionalPhoneSchema = z
  .union([
    z
      .string()
      .min(10, "Phone number must be at least 10 digits")
      .max(15, "Phone number cannot exceed 15 digits"),
    z.literal(""),
    z.null(),
  ])
  .optional()
  .transform((val) => (!val || val.trim() === "" ? null : val.trim()));

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Min 6 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  phone: optionalPhoneSchema,
  roleId: z.string().min(1, "Role ID is required"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: optionalPhoneSchema,
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
