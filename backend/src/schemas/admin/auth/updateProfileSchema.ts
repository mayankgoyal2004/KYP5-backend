import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  phone: z.string().optional().nullable(),
  designation: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  avatarUrl: z
    .string()
    .url("Invalid avatar URL")
    .or(z.string().regex(/^data:image\//))
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
