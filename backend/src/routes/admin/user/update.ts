import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import catchAsync from "../../../utils/catchAsync.js";
import {
  createAuditLog,
  getRequestMeta,
} from "../../../middleware/auditLog.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * PUT /api/admin/users/:id
 */
export const updateUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  if (!userId) {
    throw ApiError.badRequest("User ID is required");
  }

  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  const oldUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      roleId: true,
      isActive: true,
      phone: true,
    },
  });

  if (!oldUser) throw ApiError.notFound("User not found");

  // Prevent self role change
  if (
    userId === req.user.id &&
    req.body.roleId &&
    req.body.roleId !== oldUser.roleId
  ) {
    throw ApiError.badRequest("You cannot change your own role");
  }

  // Build update object safely
  const updateData: any = {};
  if (req.body.name !== undefined) updateData.name = req.body.name;
  if (req.body.phone !== undefined) updateData.phone = req.body.phone;
  if (req.body.roleId !== undefined) {
    // Validate role exists
    const role = await prisma.role.findUnique({ where: { id: req.body.roleId } });
    if (!role) throw ApiError.badRequest("Invalid role ID");
    updateData.roleId = req.body.roleId;
  }
  if (req.body.isActive !== undefined) {
    updateData.isActive = req.body.isActive;
    // Reset lock if activating
    if (req.body.isActive) {
      updateData.failedLoginCount = 0;
      updateData.lockedUntil = null;
    }
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: { select: { id: true, name: true } },
      isActive: true,
      updatedAt: true,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: "UPDATE",
    module: "users",
    recordId: user.id,
    description: `Updated user ${user.email}`,
    oldData: { name: oldUser.name, roleId: oldUser.roleId, isActive: oldUser.isActive },
    newData: updateData,
    ...getRequestMeta(req),
  });

  res.json(ApiResponse.success(user, "User updated successfully"));
});
