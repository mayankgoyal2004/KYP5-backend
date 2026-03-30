import { z } from "zod";

export const permissionUpdateSchema = z.object({
  roleId: z.string().min(1, "Role ID is required"),
  permissions: z.array(z.object({
    permissionId: z.string().min(1),
    granted: z.boolean().default(true)
  })).min(1, "At least one permission required")
});

export const userPermissionUpdateSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  permissions: z.array(z.object({
    permissionId: z.string().min(1),
    granted: z.boolean().default(true)
  })).min(1, "At least one permission required")
});
