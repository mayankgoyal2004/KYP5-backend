import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const deletePricingPlan = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.subscriptionPlan.findUnique({
    where: { id },
    include: { subscriptions: true },
  });
  if (!existing) {
    throw ApiError.notFound("Subscription plan not found");
  }

  if (existing.subscriptions && existing.subscriptions.length > 0) {
    throw ApiError.badRequest("Cannot delete a plan that is currently assigned to active institution subscriptions. Deactivate it instead.");
  }

  await prisma.subscriptionPlan.delete({ where: { id } });

  res.json(ApiResponse.success(null, "Subscription plan deleted successfully"));
});
