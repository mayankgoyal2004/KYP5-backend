import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * POST /api/admin/roles
 * Create new role
 */
export const createRole = catchAsync(async (req: Request, res: Response) => {
  const { name, description, permissions } = req.body;

  if (!name) throw ApiError.badRequest("Role name is required");

  const existing = await prisma.role.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });
  if (existing) throw ApiError.conflict("Role name already exists");

  const role = await prisma.$transaction(async (tx) => {
    const created = await tx.role.create({
      data: { name, description },
    });

    if (permissions && Array.isArray(permissions) && permissions.length > 0) {
      await tx.rolePermission.createMany({
        data: permissions.map((p) => ({
          roleId: created.id,
          permissionId: p.permissionId,
          granted: p.granted !== false,
        })),
      });
    }

    return tx.role.findUnique({
      where: { id: created.id },
      include: { permissions: { include: { permission: true } } },
    });
  });

  res.status(201).json(ApiResponse.success(role, "Role created"));
});
