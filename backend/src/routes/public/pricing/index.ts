import { Router, Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";

const router = Router();

const formatPlanForPublic = (plan: any) => ({
  ...plan,
  title: plan.name, // compatibility alias for website package components
  price: plan.priceMonthly, // compatibility alias for single-price displays
});

// GET /api/public/pricing-plans & /api/public/subscription-plans
router.get(
  "/",
  catchAsync(async (req: Request, res: Response) => {
    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    const formattedPlans = plans.map(formatPlanForPublic);
    res.json(ApiResponse.success(formattedPlans));
  })
);

// GET /api/public/pricing-plans/saas (B2B SaaS Subscription Packages)
router.get(
  "/saas",
  catchAsync(async (req: Request, res: Response) => {
    const saasPlans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    });

    const formattedPlans = saasPlans.map(formatPlanForPublic);
    res.json(ApiResponse.success(formattedPlans));
  })
);

export default router;
