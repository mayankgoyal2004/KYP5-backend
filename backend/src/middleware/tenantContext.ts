import { Request, Response, NextFunction } from "express";
import prisma from "../lib/prisma.js";

export interface TenantContext {
  institutionId: string;
  role: string;
  membershipId: string;
}

export interface TenantRequest extends Request {
  tenant?: TenantContext;
  user?: any;
}

/**
 * Tenant Context Middleware (Production Standard)
 * Resolves active InstitutionMembership from authenticated user token and enforces tenant context.
 */
export const resolveTenantContext = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required to access tenant workspace" });
      return;
    }

    // 1. Check if user is Super Admin (bypass explicit membership check if needed)
    if (req.user?.role === "SUPER_ADMIN" && req.headers["x-tenant-id"]) {
      const explicitInstId = req.headers["x-tenant-id"] as string;
      req.tenant = {
        institutionId: explicitInstId,
        role: "INSTITUTION_OWNER",
        membershipId: "superadmin_override",
      };
      return next();
    }

    // 2. Query InstitutionMembership table for active tenant membership
    const membership = await prisma.institutionMembership.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
      include: {
        institution: true,
      },
    });

    if (!membership) {
      // Fallback: Check if user.institutionId exists for backward compatibility
      if (req.user?.institutionId) {
        req.tenant = {
          institutionId: req.user.institutionId,
          role: "INSTITUTION_ADMIN",
          membershipId: "legacy_user_link",
        };
        return next();
      }

      res.status(403).json({
        success: false,
        message: "Access Denied: You do not belong to an active Institution tenant workspace",
      });
      return;
    }

    // Populate req.tenant
    req.tenant = {
      institutionId: membership.institutionId,
      role: membership.role,
      membershipId: membership.id,
    };

    next();
  } catch (error: any) {
    console.error("Tenant resolution error:", error);
    res.status(500).json({ success: false, message: "Failed to resolve tenant context" });
  }
};
