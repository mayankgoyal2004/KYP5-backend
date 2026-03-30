import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * PUT /api/admin/permissions/role
 * Bulk update role permissions
 */
export const updateRolePermissions = catchAsync(async (req: Request, res: Response) => {
  const { roleId, permissions } = req.body;

  if (!roleId || !Array.isArray(permissions)) {
    throw ApiError.badRequest("Role ID and permissions array are required");
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw ApiError.notFound("Role not found");

  await prisma.$transaction(async (tx) => {
    // Replace all permissions for this role
    await tx.rolePermission.deleteMany({ where: { roleId } });
    
    if (permissions.length > 0) {
      await tx.rolePermission.createMany({
        data: permissions.map((p: any) => ({
          roleId,
          permissionId: p.permissionId,
          granted: p.granted !== false,
        })),
      });
    }
  });

  res.json(ApiResponse.success(null, "Role permissions updated successfully"));
});

/**
 * PUT /api/admin/permissions/user
 * Update specific permission overrides for a user
 */
export const updateUserPermissions = catchAsync(async (req: Request, res: Response) => {
  const { userId, permissions } = req.body;

  if (!userId || !Array.isArray(permissions)) {
    throw ApiError.badRequest("User ID and permissions array are required");
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  await prisma.$transaction(async (tx) => {
    // Replace/Apply overrides
    await tx.userPermission.deleteMany({ where: { userId } });
    
    if (permissions.length > 0) {
      await tx.userPermission.createMany({
        data: permissions.map((p: any) => ({
          userId,
          permissionId: p.permissionId,
          granted: p.granted !== false,
        })),
      });
    }
  });

  res.json(ApiResponse.success(null, "User permissions updated successfully"));
});
