import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../../lib/prisma.js";
import { generateAccessToken } from "../../../lib/jwt.js";
import {
  createAuditLog,
  getRequestMeta,
} from "../../../middleware/auditLog.js";
import { ApiError } from "../../../utils/ApiError.js";

export async function login(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { email, password } = req.body;
    const meta = getRequestMeta(req);

    // 1. Find user with role
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: { select: { name: true } } },
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password.");
    }

    // 2. Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw ApiError.forbidden(
        `Account locked until ${user.lockedUntil.toLocaleTimeString()}.`,
      );
    }

    // 3. Check status
    if (!user.isActive || user.isDeleted) {
      throw ApiError.forbidden(
        "Account is deactivated. Contact administrator.",
      );
    }

    // 4. Only admin/super_admin can login here
    if (user.role.name === "STUDENT") {
      throw ApiError.forbidden(
        "Students must use the student login endpoint.",
      );
    }

    // 5. Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
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

    // 6. Success — reset failed count
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ipAddress || undefined,
      },
    });

    // 7. Generate access token
    const accessToken = generateAccessToken(
      {
        id: user.id,
        email: user.email,
        role: user.role.name,
        name: user.name,
      },
      "24h",
    );

    // 8. Audit log
    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      module: "auth",
      description: `${user.name} (${user.role.name}) logged in`,
      ...meta,
    });

    // 9. Respond
    res.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role.name,
          phone: user.phone,
          avatar: user.avatar || null,
          lastLoginAt: user.lastLoginAt,
        },
        accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
}
