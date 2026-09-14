import { Response, NextFunction } from "express";
import { TenantRequest } from "./tenantContext.js";
import prisma from "../lib/prisma.js";

/**
 * Entitlement Guard Middleware
 * Verifies if institution's active subscription plan supports requested feature entitlement.
 */
export const requireEntitlement = (featureCode: string) => {
  return async (req: TenantRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const institutionId = req.tenant?.institutionId;

      if (!institutionId) {
        res.status(403).json({ success: false, message: "Tenant context missing" });
        return;
      }

      const subscription = await prisma.institutionSubscription.findUnique({
        where: { institutionId },
        include: { plan: true },
      });

      if (!subscription || subscription.status !== "ACTIVE") {
        res.status(402).json({
          success: false,
          message: "Payment Required: Active subscription required to access this feature",
        });
        return;
      }

      const features = (subscription.plan?.features as string[]) || [];

      // Check if feature is included or if enterprise plan
      const hasAccess =
        subscription.plan?.code === "ENTERPRISE" ||
        features.some((f) => f.toLowerCase().includes(featureCode.toLowerCase()));

      if (!hasAccess) {
        res.status(403).json({
          success: false,
          message: `Feature Unavailable: Upgrade to a higher subscription tier to unlock '${featureCode}'`,
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error("Entitlement verification error:", error);
      res.status(500).json({ success: false, message: "Entitlement verification failed" });
    }
  };
};
