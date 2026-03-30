import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Min 6 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  phone: z.string().min(10).max(15).optional(),
  roleId: z.string().min(1, "Role ID is required"),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  phone: z.string().min(10).max(15).optional().nullable(),
  roleId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
