import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";

export const deletePricingPlan = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const existing = await prisma.pricingPlan.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Pricing plan not found");
  }

  await prisma.pricingPlan.delete({ where: { id } });

  res.json(ApiResponse.success(null, "Pricing plan deleted successfully"));
});
