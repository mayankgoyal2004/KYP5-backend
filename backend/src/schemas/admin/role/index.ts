import { z } from "zod";

export const rolePermissionSchema = z.object({
  permissionId: z.string().min(1, "Permission ID is required"),
  granted: z.boolean().optional().default(true),
});

export const createRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100),
  description: z.string().optional().nullable(),
  permissions: z.array(rolePermissionSchema).optional(),
});

export const updateRoleSchema = z.object({
  name: z.string().min(1, "Role name is required").max(100).optional(),
  description: z.string().optional().nullable(),
  permissions: z.array(rolePermissionSchema).optional(),
});
