import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * PUT /api/admin/roles/:id
 * Update role
 */
export const updateRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const { name, description, permissions } = req.body;

  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Role not found");
  if (existing.isSystem) throw ApiError.badRequest("Cannot modify system role");

  const role = await prisma.$transaction(async (tx) => {
    await tx.role.update({
      where: { id },
      data: { name, description },
    });

    if (permissions && Array.isArray(permissions)) {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissions.length > 0) {
        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId: id,
            permissionId: p.permissionId,
            granted: p.granted !== false,
          })),
        });
      }
    }

    return tx.role.findUnique({
      where: { id },
      include: { permissions: { include: { permission: true } } },
    });
  });

  res.json(ApiResponse.success(role, "Role updated"));
});
