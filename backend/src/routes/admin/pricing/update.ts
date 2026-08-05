import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { isPricingOrderTaken } from "./order.js";

export const updatePricingPlan = catchAsync(async (req: Request, res: Response) => {
  const id = req.params.id as string;
  const {
    badgeText,
    title,
    price,
    features,
    buttonText,
    buttonLink,
    isFeatured,
    order,
    isActive,
  } = req.body;

  const existing = await prisma.pricingPlan.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound("Pricing plan not found");
  }

  if (order !== undefined) {
    const parsedOrder = Number(order);
    if (await isPricingOrderTaken(parsedOrder, id)) {
      throw ApiError.conflict(
        `Display order ${parsedOrder} is already assigned to another plan`,
      );
    }
  }

  const plan = await prisma.pricingPlan.update({
    where: { id },
    data: {
      badgeText: badgeText !== undefined ? (badgeText || null) : undefined,
      title: title !== undefined ? title : undefined,
      price: price !== undefined ? Number(price) : undefined,
      features: features !== undefined ? features : undefined,
      buttonText: buttonText !== undefined ? buttonText : undefined,
      buttonLink: buttonLink !== undefined ? buttonLink : undefined,
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : undefined,
      order: order !== undefined ? Number(order) : undefined,
      isActive: isActive !== undefined ? Boolean(isActive) : undefined,
    },
  });

  res.json(ApiResponse.success(plan, "Pricing plan updated successfully"));
});
