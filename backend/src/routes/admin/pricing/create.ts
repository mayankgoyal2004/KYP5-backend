import { Request, Response } from "express";
import prisma from "../../../lib/prisma.js";
import catchAsync from "../../../utils/catchAsync.js";
import ApiResponse from "../../../utils/ApiResponse.js";
import { ApiError } from "../../../utils/ApiError.js";
import { getNextPricingOrder, isPricingOrderTaken } from "./order.js";

export const createPricingPlan = catchAsync(async (req: Request, res: Response) => {
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

  const parsedOrder =
    order === undefined || order === null || order === ""
      ? await getNextPricingOrder()
      : Number(order);

  if (await isPricingOrderTaken(parsedOrder)) {
    throw ApiError.conflict(
      `Display order ${parsedOrder} is already assigned to another plan`,
    );
  }

  const plan = await prisma.pricingPlan.create({
    data: {
      badgeText: badgeText || null,
      title,
      price: Number(price),
      features,
      buttonText: buttonText || "Buy Now",
      buttonLink: buttonLink || "/login",
      isFeatured: isFeatured !== undefined ? Boolean(isFeatured) : false,
      order: parsedOrder,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    },
  });

  res.status(201).json(ApiResponse.created(plan, "Pricing plan created successfully"));
});
