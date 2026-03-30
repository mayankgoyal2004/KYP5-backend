import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * DELETE /api/admin/roles/:id
 */
export const deleteRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!existing) throw ApiError.notFound("Role not found");
  if (existing.isSystem) throw ApiError.badRequest("Cannot delete system role");
  if (existing._count.users > 0)
    throw ApiError.badRequest("Role is in use by users");

  await prisma.role.delete({ where: { id } });
  res.json(ApiResponse.success(null, "Role deleted"));
});
