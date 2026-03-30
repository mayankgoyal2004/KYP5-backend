import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const studentRegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  phone: z.string().min(10).max(15).optional(),
  rollNumber: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password required"),
  newPassword: z
    .string()
    .min(6, "Min 6 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type StudentRegisterInput = z.infer<typeof studentRegisterSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
