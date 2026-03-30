import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { getPermissionsGroupedByModule } from "../../../lib/permissions.js";

/**
 * GET /api/admin/permissions
 * List all available permissions grouped by module
 */
export const getPermissions = catchAsync(
  async (_req: Request, res: Response) => {
    const grouped = await getPermissionsGroupedByModule();
    const flat = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    res.json(
      ApiResponse.success({
        grouped,
        flat,
        totalCount: flat.length,
      }),
    );
  },
);

/**
 * GET /api/admin/permissions/role/:roleId
 * Get permissions assigned to a specific role
 */
export const getRolePermissions = catchAsync(
  async (req: Request, res: Response) => {
    const roleId = req.params.roleId as string;

    const rolePermissions = await prisma.rolePermission.findMany({
      where: { roleId },
      include: {
        permission: true,
      },
    });

    res.json(ApiResponse.success(rolePermissions));
  },
);

/**
 * GET /api/admin/permissions/user/:userId
 * Get specific permission overrides for a user
 */
export const getUserPermissions = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId as string;

    const userPermissions = await prisma.userPermission.findMany({
      where: { userId },
      include: {
        permission: true,
      },
    });

    res.json(ApiResponse.success(userPermissions));
  },
);
