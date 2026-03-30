import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

/**
 * GET /api/admin/roles
 * List all roles
 */
export const getRoles = catchAsync(async (_req: Request, res: Response) => {
  const roles = await prisma.role.findMany({
    orderBy: { createdAt: "asc" },
    include: { _count: { select: { users: true } } },
  });
  res.json(ApiResponse.success(roles));
});

/**
 * GET /api/admin/roles/:id
 * Get single role with permissions
 */
export const getSingleRole = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
    },
  });
  if (!role) throw ApiError.notFound("Role not found");
  res.json(ApiResponse.success(role));
});

/**
 * GET /api/admin/roles/permissions/all
 * Lists all available permissions grouped by module
 */
export const getAllPermissions = catchAsync(
  async (_req: Request, res: Response) => {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: "asc" }, { action: "asc" }],
    });

    const grouped = permissions.reduce(
      (acc, p) => {
        if (!acc[p.module]) acc[p.module] = [];
        acc[p.module].push(p);
        return acc;
      },
      {} as Record<string, typeof permissions>,
    );

    res.json(ApiResponse.success(grouped));
  },
);
