import { Router } from "express";
import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma.js";
import { generateAccessToken } from "../../../lib/jwt.js";
import {
  createAuditLog,
  getRequestMeta,
} from "../../../middleware/auditLog.js";
import { ApiError } from "../../../utils/ApiError.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import catchAsync from "../../../utils/catchAsync.js";
import { validate } from "../../../middleware/validate.js";
import { authenticate } from "../../../middleware/auth.js";
import { env } from "../../../lib/env.js";
import {
  loginSchema,
  studentRegisterSchema,
  changePasswordSchema,
} from "../../../schemas/admin/auth/index.js";

const router = Router();

// --- Student Login ---
router.post(
  "/login",
  validate(loginSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const meta = getRequestMeta(req);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: { select: { name: true } } },
    });

    if (!user) throw ApiError.unauthorized("Invalid email or password.");

    // Only students can login here
    if (user.role.name !== "STUDENT") {
      throw ApiError.forbidden("Admins must use the admin login portal.");
    }

    if (!user.isActive || user.isDeleted) {
      throw ApiError.forbidden("Account is deactivated.");
    }

    // Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw ApiError.forbidden(
        `Account locked until ${user.lockedUntil.toLocaleTimeString()}. Please try again later.`,
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      // Brute-force protection: increment failed count, lock after 5 attempts
      const maxAttempts = 5;
      const lockoutMins = 30;
      const newCount = user.failedLoginCount + 1;
      const shouldLock = newCount >= maxAttempts;
      const lockUntil = shouldLock
        ? new Date(Date.now() + lockoutMins * 60 * 1000)
        : null;

      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: newCount, lockedUntil: lockUntil },
      });

      throw ApiError.unauthorized("Invalid email or password.");
    }

    // Success — reset failed count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ipAddress || undefined,
      },
    });

    const accessToken = generateAccessToken(
      { id: user.id, email: user.email, role: user.role.name, name: user.name },
      "24h",
    );

    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      module: "auth",
      description: `Student ${user.email} logged in`,
      ...meta,
    });

    res.json(
      ApiResponse.success(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role.name,
            avatar: user.avatar,
            rollNumber: user.rollNumber,
          },
          accessToken,
        },
        "Login successful",
      ),
    );
  }),
);

// --- Student Register ---
router.post(
  "/register",
  validate(studentRegisterSchema),
  catchAsync(async (req: Request, res: Response) => {
    const {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      address,
      city,
      state,
    } = req.body;
    const meta = getRequestMeta(req);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw ApiError.conflict("Email is already registered.");

    let studentRole = await prisma.role.findUnique({
      where: { name: "STUDENT" },
    });
    // if (!studentRole) {
    //   studentRole = await prisma.role.create({
    //     data: {
    //       name: "STUDENT",
    //       description: "Default role for students",
    //       isSystem: true,
    //     },
    //   });
    // }

    const hashedPassword = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        roleId: studentRole.id,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender,
        address,
        city,
        state,
        isActive: true,
      },
    });

    const accessToken = generateAccessToken(
      { id: user.id, email: user.email, role: "STUDENT", name: user.name },
      "24h",
    );

    await createAuditLog({
      userId: user.id,
      action: "REGISTER",
      module: "auth",
      description: `Student ${user.email} registered`,
      ...meta,
    });

    res.status(201).json(
      ApiResponse.success(
        {
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: "STUDENT",
            rollNumber: user.rollNumber,
          },
          accessToken,
        },
        "Registration successful",
      ),
    );
  }),
);

// --- Change Password ---
router.post(
  "/change-password",
  authenticate,
  validate(changePasswordSchema),
  catchAsync(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user!.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw ApiError.notFound("User not found");

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) throw ApiError.unauthorized("Current password is incorrect");

    const hashedPassword = await bcrypt.hash(
      newPassword,
      env.BCRYPT_SALT_ROUNDS,
    );
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json(ApiResponse.success(null, "Password changed successfully"));
  }),
);

// --- Get Me ---
router.get(
  "/me",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: { select: { name: true } },
        isActive: true,
        avatar: true,
        rollNumber: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        city: true,
        state: true,
        lastLoginAt: true,
      },
    });

    if (!user) throw ApiError.notFound("User not found");
    res.json(ApiResponse.success(user));
  }),
);

// --- Update Profile ---
router.patch(
  "/me",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    const { name, phone, dateOfBirth, gender, address, city, state } = req.body;

    const updated = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...(name !== undefined && { name }),
        ...(phone !== undefined && { phone }),
        ...(dateOfBirth !== undefined && {
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        }),
        ...(gender !== undefined && { gender }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(state !== undefined && { state }),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        rollNumber: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        city: true,
        state: true,
      },
    });

    res.json(ApiResponse.success(updated, "Profile updated successfully"));
  }),
);

// --- Logout ---
router.post(
  "/logout",
  authenticate,
  catchAsync(async (req: Request, res: Response) => {
    await createAuditLog({
      userId: req.user!.id,
      action: "LOGOUT",
      module: "auth",
      description: `${req.user!.name} logged out`,
      ...getRequestMeta(req),
    });
    res.json(ApiResponse.success(null, "Logged out successfully"));
  }),
);

export default router;
