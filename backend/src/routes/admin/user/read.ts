import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import { ApiError } from "../../../utils/ApiError.js";
import { buildPagination, parsePagination } from "../../../utils/helpers.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import catchAsync from "../../../utils/catchAsync.js";

/**
 * GET /api/admin/users
 */
export const listUsers = catchAsync(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const { roleId, search } = req.query as Record<string, string>;

  const where: any = { isDeleted: false };
  if (roleId) where.roleId = roleId;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: { select: { id: true, name: true } },
        isActive: true,
        avatar: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const pagination = buildPagination(total, page, limit);

  res.json(
    ApiResponse.success(
      { users, pagination },
      "Users fetched successfully",
    ),
  );
});

/**
 * GET /api/admin/users/:id
 */
export const getUser = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id as string;

  if (!userId) {
    throw ApiError.badRequest("User ID required");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: { select: { id: true, name: true } },
      isActive: true,
      isDeleted: true,
      avatar: true,
      rollNumber: true,
      dateOfBirth: true,
      gender: true,
      address: true,
      city: true,
      state: true,
      lastLoginAt: true,
      lastLoginIp: true,
      failedLoginCount: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) throw ApiError.notFound("User not found");

  res.json(ApiResponse.success(user, "User fetched successfully"));
});
