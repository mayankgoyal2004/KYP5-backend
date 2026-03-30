import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma.js";
import {
  createAuditLog,
  getRequestMeta,
} from "../../../middleware/auditLog.js";
import { ApiError } from "../../../utils/ApiError.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { env } from "../../../lib/env.js";
import { validatePasswordComplexity } from "../../../lib/authUtils.js";

/**
 * POST /api/admin/users
 * Admin creates a new user (Admin or Student)
 */
export const createUser = catchAsync(async (req: Request, res: Response) => {
  const { name, email, password, phone, roleId } = req.body;

  // Check duplicate email
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw ApiError.conflict("User with this email already exists.");
  }

  if (!req.user) {
    throw ApiError.unauthorized("Authentication required");
  }

  // Validate role exists
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) {
    throw ApiError.badRequest("Invalid role ID");
  }

  // Validate complexity
  validatePasswordComplexity(password);

  const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      roleId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: { select: { id: true, name: true } },
      isActive: true,
      createdAt: true,
    },
  });

  await createAuditLog({
    userId: req.user!.id,
    action: "CREATE",
    module: "users",
    recordId: user.id,
    description: `Admin ${req.user!.name} created user ${email} with role ${role.name}`,
    newData: { name, email, roleId, phone },
    ...getRequestMeta(req),
  });

  res
    .status(201)
    .json(ApiResponse.created(user, `User ${email} created successfully`));
});
