import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import prisma from "../../lib/prisma.js";
import { generateAccessToken } from "../../lib/jwt.js";
import { authenticate } from "../../middleware/auth.js";
import { createAuditLog, getRequestMeta } from "../../middleware/auditLog.js";
import { ApiError } from "../../utils/ApiError.js";
import ApiResponse from "../../utils/ApiResponse.js";
import { validatePasswordComplexity } from "../../lib/authUtils.js";

const router = Router();

/**
 * 1. POST /api/institution/auth/login
 * Dedicated Institution Portal Login
 */
router.post("/login", async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;
    const meta = getRequestMeta(req);

    if (!email || !password) {
      throw ApiError.badRequest("Email and password are required.");
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Find user with role
    const user = await prisma.user.findUnique({
      where: { email: cleanEmail },
      include: {
        role: { select: { name: true } },
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            institution: {
              include: {
                subscription: {
                  include: { plan: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw ApiError.unauthorized("Invalid email or password.");
    }

    // 2. Check account lock
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw ApiError.forbidden(
        `Account locked until ${user.lockedUntil.toLocaleTimeString()}.`
      );
    }

    // 3. Check status
    if (!user.isActive || user.isDeleted) {
      throw ApiError.forbidden("Account is deactivated. Please contact your coordinator.");
    }

    // 4. Reject students
    if (user.role.name === "STUDENT") {
      throw ApiError.forbidden("Student accounts must sign in via the Student Portal.");
    }

    // 5. Resolve active Institution & Membership
    let activeMembership = user.memberships[0] || null;
    let activeInstitution: any = activeMembership?.institution || null;

    if (!activeInstitution && user.institutionId) {
      activeInstitution = await prisma.institution.findUnique({
        where: { id: user.institutionId },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      });
    }

    // If Super Admin logs in, allow if tenant exists or fallback
    if (!activeInstitution && user.role.name !== "SUPER_ADMIN") {
      throw ApiError.forbidden(
        "Access denied: No active Institution workspace found for this account. Please register or contact support."
      );
    }

    if (activeInstitution && !activeInstitution.isActive) {
      throw ApiError.forbidden(
        "Your institution workspace has been deactivated. Please contact the platform administrator."
      );
    }

    // 6. Verify password
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

    // 7. Reset failed login counter
    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: meta.ipAddress || undefined,
      },
    });

    const tenantRole = activeMembership?.role || user.role.name || "INSTITUTION_ADMIN";

    // 8. Generate JWT access token
    const accessToken = generateAccessToken(
      {
        id: user.id,
        email: user.email,
        role: tenantRole,
        name: user.name,
      },
      "24h"
    );

    // 9. Audit log
    await createAuditLog({
      userId: user.id,
      action: "LOGIN",
      module: "tenant_auth",
      description: `Institution user ${user.name} (${tenantRole}) logged into ${activeInstitution?.name || "Workspace"}`,
      ...meta,
    });

    // 10. Return user + institution details
    res.json(
      ApiResponse.success(
        {
          accessToken,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: tenantRole,
            phone: user.phone,
            avatar: user.avatar || null,
            lastLoginAt: user.lastLoginAt,
          },
          institution: activeInstitution
            ? {
                id: activeInstitution.id,
                name: activeInstitution.name,
                logoUrl: activeInstitution.logoUrl,
                email: activeInstitution.email,
                phone1: activeInstitution.phone1,
                phone2: activeInstitution.phone2,
                referralCode: activeInstitution.referralCode,
                isActive: activeInstitution.isActive,
                subscription: activeInstitution.subscription || null,
              }
            : null,
        },
        "Signed in to Institution workspace successfully."
      )
    );
  } catch (error) {
    next(error);
  }
});

/**
 * 2. GET /api/institution/auth/me
 * Refresh and validate current institution session
 */
router.get("/me", authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw ApiError.unauthorized("Authentication required");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        isActive: true,
        isDeleted: true,
        role: { select: { name: true } },
        institutionId: true,
        memberships: {
          where: { status: "ACTIVE" },
          include: {
            institution: {
              include: {
                subscription: {
                  include: { plan: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive || user.isDeleted) {
      throw ApiError.forbidden("Account is inactive or deleted.");
    }

    let activeMembership = user.memberships[0] || null;
    let activeInstitution: any = activeMembership?.institution || null;

    if (!activeInstitution && user.institutionId) {
      activeInstitution = await prisma.institution.findUnique({
        where: { id: user.institutionId },
        include: {
          subscription: {
            include: { plan: true },
          },
        },
      });
    }

    const tenantRole = activeMembership?.role || user.role.name || "INSTITUTION_ADMIN";

    res.json(
      ApiResponse.success({
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: tenantRole,
          phone: user.phone,
          avatar: user.avatar || null,
        },
        institution: activeInstitution
          ? {
              id: activeInstitution.id,
              name: activeInstitution.name,
              logoUrl: activeInstitution.logoUrl,
              email: activeInstitution.email,
              phone1: activeInstitution.phone1,
              phone2: activeInstitution.phone2,
              referralCode: activeInstitution.referralCode,
              isActive: activeInstitution.isActive,
              subscription: activeInstitution.subscription || null,
            }
          : null,
      })
    );
  } catch (error) {
    next(error);
  }
});

/**
 * 3. POST /api/institution/auth/change-password
 * Change password for logged in institution user
 */
router.post(
  "/change-password",
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        throw ApiError.badRequest("Current password and new password are required.");
      }

      validatePasswordComplexity(newPassword);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        throw ApiError.notFound("User not found.");
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        throw ApiError.badRequest("Current password does not match.");
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      res.json(ApiResponse.success(null, "Password changed successfully."));
    } catch (error) {
      next(error);
    }
  }
);

/**
 * 4. POST /api/institution/auth/logout
 */
router.post("/logout", authenticate, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (req.user?.id) {
      await createAuditLog({
        userId: req.user.id,
        action: "LOGOUT",
        module: "tenant_auth",
        description: `Institution user ${req.user.name} logged out`,
        ...getRequestMeta(req),
      });
    }
    res.json(ApiResponse.success(null, "Logged out successfully."));
  } catch (error) {
    next(error);
  }
});

export default router;
